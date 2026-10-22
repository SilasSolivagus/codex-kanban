import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../plugin/src/store.mjs'
import {
  KanbanError,
  addAttachment,
  archiveProject,
  createTask,
  decorateTask,
  readAttachment,
  removeAttachment,
} from '../plugin/src/domain.mjs'

const LIMIT = 10 * 1024 * 1024

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-attachments-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const project = path.join(root, 'ck')
  fs.mkdirSync(project)
  return { store: createStore({ root: project }) }
}

async function newTask(store) {
  const { task } = await createTask(store, { title: 'Attach things' })
  return task
}

async function rejectsCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof KanbanError, `expected a KanbanError, got ${error}`)
    assert.equal(error.name, 'KanbanError')
    assert.equal(error.code, code)
    return true
  })
}

function attachmentFiles(store) {
  try {
    return fs.readdirSync(store.attachmentsDir).sort()
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

function base64(bytes) {
  return Buffer.from(bytes).toString('base64')
}

test('adding an attachment stores metadata and bytes, bumps version, and records activity', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const payload = Buffer.from([0x00, 0x01, 0x02, 0x7f, 0x80, 0xfe, 0xff])

  const result = await addAttachment(store, {
    id: task.identifier,
    version: task.version,
    filename: '  diagram.png  ',
    contentType: 'image/png',
    data: payload.toString('base64'),
  })

  assert.equal(result.ok, true)
  const { attachment, task: updated } = result
  assert.match(attachment.id, /^att_[0-9a-f-]{36}$/)
  assert.deepEqual(
    Object.keys(attachment).sort(),
    ['contentType', 'createdAt', 'filename', 'id', 'size'],
  )
  assert.equal(attachment.filename, 'diagram.png')
  assert.equal(attachment.contentType, 'image/png')
  assert.equal(attachment.size, payload.length)
  assert.equal(typeof attachment.createdAt, 'string')
  assert.equal(updated.version, task.version + 1)
  assert.deepEqual(updated.attachments, [attachment])
  assert.equal(updated.id, task.id)

  const activity = updated.activity.at(-1)
  assert.equal(activity.kind, 'attached')
  assert.equal(activity.summary, 'attached diagram.png')
  assert.equal(activity.actor.name, 'codex')

  const stored = path.join(store.attachmentsDir, attachment.id)
  assert.deepEqual(fs.readFileSync(stored), payload)

  const persisted = store.read().tasks[0]
  assert.equal(persisted.version, task.version + 1)
  assert.deepEqual(persisted.attachments, [attachment])
})

test('an empty contentType falls back to application/octet-stream', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  const { attachment } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: ' notes.txt ',
    contentType: '   ',
    data: base64('hello'),
  })

  assert.equal(attachment.filename, 'notes.txt')
  assert.equal(attachment.contentType, 'application/octet-stream')
  assert.equal(attachment.size, 5)
})

test('readAttachment returns the same bytes with the owning task and project', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const payload = Buffer.from('hello attachment', 'utf8')

  const { attachment } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'hello.txt',
    contentType: 'text/plain',
    data: payload.toString('base64'),
  })

  const found = readAttachment(store, attachment.id)
  assert.ok(found)
  assert.deepEqual(found.attachment, attachment)
  assert.deepEqual(found.buffer, payload)
  assert.equal(found.task.id, task.id)
  assert.equal(found.task.version, task.version + 1)
  assert.equal(found.project.id, task.projectId)
  assert.equal(found.project.name, 'ck')
})

test('removing an attachment deletes metadata and file and bumps version', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const { attachment, task: added } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'report.pdf',
    contentType: 'application/pdf',
    data: base64('pdf bytes'),
  })
  const stored = path.join(store.attachmentsDir, attachment.id)
  assert.equal(fs.existsSync(stored), true)

  const removed = await removeAttachment(store, {
    id: task.id,
    version: added.version,
    attachmentId: attachment.id,
  })

  assert.equal(removed.ok, true)
  assert.equal(removed.task.version, added.version + 1)
  assert.deepEqual(removed.task.attachments, [])
  assert.equal(fs.existsSync(stored), false)
  assert.deepEqual(attachmentFiles(store), [])

  const activity = removed.task.activity.at(-1)
  assert.equal(activity.kind, 'detached')
  assert.equal(activity.summary, 'removed attachment report.pdf')
  assert.deepEqual(store.read().tasks[0].attachments, [])
})

test('removing an attachment tolerates a file that is already gone', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const { attachment, task: added } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'gone.txt',
    data: base64('gone'),
  })
  fs.unlinkSync(path.join(store.attachmentsDir, attachment.id))

  const removed = await removeAttachment(store, {
    id: task.id,
    version: added.version,
    attachmentId: attachment.id,
  })
  assert.equal(removed.ok, true)
  assert.deepEqual(removed.task.attachments, [])
  assert.deepEqual(attachmentFiles(store), [])
})

test('readAttachment returns null for an unknown id or a missing file', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const { attachment } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'missing.txt',
    data: base64('missing'),
  })

  assert.equal(readAttachment(store, 'att_unknown'), null)
  assert.equal(readAttachment(store, ''), null)
  assert.equal(readAttachment(store, '../board.json'), null)

  fs.unlinkSync(path.join(store.attachmentsDir, attachment.id))
  assert.equal(readAttachment(store, attachment.id), null)
})

test('a payload over 10 MB is rejected without changing the board or disk', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const before = store.read().tasks[0]

  await rejectsCode(
    addAttachment(store, {
      id: task.id,
      version: task.version,
      filename: 'big.bin',
      data: Buffer.alloc(LIMIT + 1, 0x61).toString('base64'),
    }),
    'ATTACHMENT_TOO_LARGE',
  )

  const after = store.read().tasks[0]
  assert.equal(after.version, before.version)
  assert.deepEqual(after.attachments, [])
  assert.deepEqual(attachmentFiles(store), [])
})

test('a payload of exactly 10 MB is accepted', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const payload = Buffer.alloc(LIMIT, 0x62)

  const { attachment } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'limit.bin',
    data: payload.toString('base64'),
  })

  assert.equal(attachment.size, LIMIT)
  const stored = path.join(store.attachmentsDir, attachment.id)
  assert.equal(fs.statSync(stored).size, LIMIT)
  assert.deepEqual(fs.readFileSync(stored), payload)
})

test('archived projects reject attachment adds and removes', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const { attachment, task: added } = await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'keep.txt',
    data: base64('keep'),
  })
  const stored = path.join(store.attachmentsDir, attachment.id)
  const project = store.read().projects[0]

  await archiveProject(store, { id: project.id })

  await rejectsCode(
    addAttachment(store, {
      id: task.id,
      version: added.version,
      filename: 'later.txt',
      data: base64('later'),
    }),
    'PROJECT_ARCHIVED',
  )
  await rejectsCode(
    removeAttachment(store, {
      id: task.id,
      version: added.version,
      attachmentId: attachment.id,
    }),
    'PROJECT_ARCHIVED',
  )

  assert.equal(fs.existsSync(stored), true)
  const after = store.read().tasks[0]
  assert.equal(after.version, added.version)
  assert.deepEqual(after.attachments, [attachment])
  assert.deepEqual(attachmentFiles(store), [attachment.id])
})

test('empty, whitespace, or oversized filenames are rejected', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  for (const filename of ['', '   ', 'x'.repeat(256)]) {
    await rejectsCode(
      addAttachment(store, {
        id: task.id,
        version: task.version,
        filename,
        data: base64('nope'),
      }),
      'INVALID_INPUT',
    )
  }

  assert.equal(store.read().tasks[0].version, task.version)
  assert.deepEqual(store.read().tasks[0].attachments, [])
  assert.deepEqual(attachmentFiles(store), [])
})

test('invalid data or an oversized content type is rejected without a file', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  for (const input of [
    { data: undefined },
    { data: 'not base64!' },
    { data: base64('ok'), contentType: 'x'.repeat(201) },
    { data: base64('ok'), contentType: 'text/plain\r\nx-injected: yes' },
  ]) {
    await rejectsCode(
      addAttachment(store, {
        id: task.id,
        version: task.version,
        filename: 'bad.txt',
        ...input,
      }),
      'INVALID_INPUT',
    )
  }

  assert.equal(store.read().tasks[0].version, task.version)
  assert.deepEqual(attachmentFiles(store), [])
})

test('a stale or missing version is rejected before any file is written', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  await rejectsCode(
    addAttachment(store, {
      id: task.id,
      version: task.version + 1,
      filename: 'stale.txt',
      data: base64('stale'),
    }),
    'TASK_VERSION_CONFLICT',
  )
  await rejectsCode(
    addAttachment(store, {
      id: task.id,
      filename: 'noversion.txt',
      data: base64('noversion'),
    }),
    'VERSION_REQUIRED',
  )

  assert.equal(store.read().tasks[0].version, task.version)
  assert.deepEqual(store.read().tasks[0].attachments, [])
  assert.deepEqual(attachmentFiles(store), [])
})

test('decorateTask keeps attachments as an empty array when absent', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const stripped = { ...task }
  delete stripped.attachments

  assert.deepEqual(decorateTask(stripped).attachments, [])
  assert.equal(stripped.attachments, undefined)
})
