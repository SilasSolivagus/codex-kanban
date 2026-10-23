import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../plugin/src/store.mjs'
import { createWebServer } from '../plugin/server/web.mjs'

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-web-'))
  fs.mkdirSync(path.join(root, '.git'))
  const store = createStore({ root })
  const web = createWebServer({ store, port: 0 })
  const url = await web.listen()
  t.after(async () => {
    await web.close()
    fs.rmSync(root, { recursive: true, force: true })
  })
  return { root, store, url }
}

async function getBoard(url, project) {
  const target = project === undefined
    ? `${url}/api/board`
    : `${url}/api/board?project=${encodeURIComponent(project)}`
  const response = await fetch(target)
  return { status: response.status, body: await response.json() }
}

async function board(url, project) {
  const { body } = await getBoard(url, project)
  return body
}

async function act(url, payload) {
  const response = await fetch(`${url}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { status: response.status, body: await response.json() }
}

function column(json, id) {
  return json.board.columns[id]
}

test('serves the live board page and the v2 board payload', async (t) => {
  const { url } = await fixture(t)
  const page = await fetch(url)
  const html = await page.text()
  assert.equal(page.status, 200)
  assert.match(html, /Codex Kanban/)
  assert.match(html, /api\/action/)
  assert.match(html, /New task/)

  const json = await board(url)
  assert.equal(json.ok, true)
  assert.equal(typeof json.serverNow, 'string')
  assert.ok(Number.isFinite(Date.parse(json.serverNow)), 'serverNow is an ISO timestamp')
  assert.equal(json.projects.length, 1)
  assert.deepEqual(
    Object.keys(json.projects[0]).sort(),
    ['archivedAt', 'archivedCount', 'id', 'name', 'openCount', 'prefix', 'taskCount', 'workspacePath'].sort(),
  )
  assert.equal(json.projects[0].taskCount, 0)
  assert.equal(json.projects[0].openCount, 0)
  assert.equal(json.projects[0].archivedAt, null)
  assert.deepEqual(Object.keys(json.board.columns), ['backlog', 'running', 'needs', 'done'])
  assert.equal(json.board.project, null)
  assert.deepEqual(json.board.tasks, [])
  assert.equal(json.summary.total, 0)
  assert.deepEqual(json.filters, { labels: [], priorities: [], assignees: [] })

  const all = await board(url, 'all')
  assert.equal(all.ok, true)
  assert.equal(typeof all.serverNow, 'string')
  assert.equal(all.board.project, null)
  assert.equal(all.summary.total, 0)
})

test('create, move and version conflicts round-trip through the api', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'Ship the web board', priority: 'high' })
  assert.equal(created.status, 200)
  assert.equal(typeof created.body.serverNow, 'string')
  const task = column(created.body, 'backlog')[0]
  assert.match(task.identifier, /^[A-Z0-9]+-1$/)
  assert.deepEqual(task.activity.at(-1).data, { status: 'backlog' })
  assert.equal(task.version, 1)
  assert.equal(task.priority, 'high')
  assert.equal(task.projectId, created.body.projects[0].id)
  assert.equal(created.body.projects[0].taskCount, 1)
  assert.equal(created.body.projects[0].openCount, 1)

  const moved = await act(url, { action: 'task.move', id: task.identifier, version: 1, to: 'running' })
  assert.equal(moved.status, 200)
  assert.equal(column(moved.body, 'running')[0].status, 'in_progress')
  assert.equal(column(moved.body, 'running')[0].version, 2)
  assert.equal(moved.body.projects[0].openCount, 1)

  const stale = await act(url, { action: 'task.move', id: task.identifier, version: 1, to: 'done' })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.ok, false)
  assert.equal(stale.body.error.code, 'TASK_VERSION_CONFLICT')
})

test('ask, answer and approve work from the web ui', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'Decide the target' })
  const id = column(created.body, 'backlog')[0].identifier

  const asked = await act(url, {
    action: 'task.ask',
    id,
    version: 1,
    prompt: 'Which target?',
    options: [
      { label: 'Staging', detail: 'lower environment' },
      { label: 'Production', detail: 'live traffic' },
    ],
  })
  assert.equal(asked.status, 200)
  const waiting = column(asked.body, 'needs')[0]
  assert.equal(waiting.attention, 'question')
  assert.equal(waiting.version, 2)
  assert.equal(waiting.pendingQuestion.options[1].detail, 'live traffic')
  assert.deepEqual(waiting.activity.at(-1).data, { prompt: 'Which target?' })

  const answered = await act(url, { action: 'task.answer', id, version: 2, option: 'opt_2' })
  assert.equal(answered.status, 200)
  assert.equal(column(answered.body, 'needs')[0].pendingQuestion.selected, 'opt_2')
  assert.deepEqual(column(answered.body, 'needs')[0].activity.at(-1).data, {
    optionLabel: 'Production',
  })

  const approved = await act(url, { action: 'task.approve', id, version: 3, note: 'ship it' })
  assert.equal(approved.status, 200)
  assert.equal(column(approved.body, 'done')[0].status, 'done')
  assert.equal(column(approved.body, 'needs').length, 0)
  assert.equal(column(approved.body, 'done')[0].questionResolution.decision, 'approve')
  assert.deepEqual(column(approved.body, 'done')[0].activity.at(-1).data, {
    optionLabel: 'Production',
  })
  assert.equal(approved.body.projects[0].openCount, 0)

  const second = await act(url, { action: 'task.create', title: 'Pick a format' })
  const secondId = column(second.body, 'backlog')[0].identifier
  const stringAsked = await act(url, {
    action: 'task.ask',
    id: secondId,
    version: 1,
    prompt: 'Which format?',
    options: ['JSON', 'Markdown'],
  })
  assert.equal(stringAsked.status, 200)
  const stringWaiting = column(stringAsked.body, 'needs')
    .find((entry) => entry.identifier === secondId)
  assert.deepEqual(stringWaiting.pendingQuestion.options.map((entry) => entry.label), ['JSON', 'Markdown'])
})

test('block and unblock move a task in and out of needs you', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'Blocked work' })
  const id = column(created.body, 'backlog')[0].identifier
  const blocked = await act(url, { action: 'task.block', id, version: 1, reason: 'need access' })
  assert.equal(blocked.status, 200)
  assert.equal(column(blocked.body, 'needs')[0].blockedReason, 'need access')
  assert.deepEqual(column(blocked.body, 'needs')[0].activity.at(-1).data, {
    reason: 'need access',
  })
  const cleared = await act(url, { action: 'task.unblock', id, version: 2 })
  assert.equal(cleared.status, 200)
  assert.equal(column(cleared.body, 'backlog')[0].blockedReason, null)
  assert.deepEqual(column(cleared.body, 'backlog')[0].activity.at(-1).data, {})
})

test('project create, filter, archive and restore round-trip through the api', async (t) => {
  const { url, root } = await fixture(t)
  const created = await act(url, {
    action: 'project.create',
    name: 'Website',
    prefix: 'WEB',
    workspacePath: root,
  })
  assert.equal(created.status, 200)
  assert.deepEqual(Object.keys(created.body.board.columns), ['backlog', 'running', 'needs', 'done'])
  const project = created.body.projects.find((entry) => entry.name === 'Website')
  assert.ok(project)
  assert.equal(project.prefix, 'WEB')
  assert.equal(project.workspacePath, root)
  assert.equal(project.archivedAt, null)
  assert.equal(project.taskCount, 0)

  const filtered = await board(url, project.id)
  assert.equal(filtered.board.project.id, project.id)
  assert.deepEqual(filtered.board.tasks, [])
  assert.equal(filtered.projects.length, 2)
  assert.equal(filtered.summary.total, 0)

  const made = await act(url, { action: 'task.create', title: 'Landing page', projectId: project.id })
  assert.equal(made.status, 200)
  const task = column(made.body, 'backlog').find((entry) => entry.projectId === project.id)
  assert.equal(task.identifier, 'WEB-1')

  const defaultProject = made.body.projects.find((entry) => entry.id !== project.id)
  const other = await board(url, defaultProject.id)
  assert.equal(other.board.tasks.length, 0)
  const all = await board(url, 'all')
  assert.equal(all.board.tasks.length, 1)

  const renamed = await act(url, {
    action: 'project.update',
    id: project.id,
    name: 'Marketing site',
    prefix: 'MKT',
  })
  assert.equal(renamed.status, 200)
  const renamedProject = renamed.body.projects.find((entry) => entry.id === project.id)
  assert.equal(renamedProject.name, 'Marketing site')
  assert.equal(renamedProject.prefix, 'MKT')

  const archived = await act(url, { action: 'project.archive', id: project.id })
  assert.equal(archived.status, 200)
  assert.ok(archived.body.projects.find((entry) => entry.id === project.id).archivedAt)

  const blockedCreate = await act(url, {
    action: 'task.create',
    title: 'nope',
    projectId: project.id,
  })
  assert.equal(blockedCreate.status, 409)
  assert.equal(blockedCreate.body.error.code, 'PROJECT_ARCHIVED')

  const blockedMove = await act(url, {
    action: 'task.move',
    id: task.identifier,
    version: 1,
    to: 'running',
  })
  assert.equal(blockedMove.status, 409)
  assert.equal(blockedMove.body.error.code, 'PROJECT_ARCHIVED')

  const blockedUpload = await act(url, {
    action: 'attachment.add',
    id: task.identifier,
    version: 1,
    filename: 'note.txt',
    data: Buffer.from('hi').toString('base64'),
  })
  assert.equal(blockedUpload.status, 409)
  assert.equal(blockedUpload.body.error.code, 'PROJECT_ARCHIVED')

  const restored = await act(url, { action: 'project.restore', id: project.id })
  assert.equal(restored.status, 200)
  assert.equal(restored.body.projects.find((entry) => entry.id === project.id).archivedAt, null)

  const recreated = await act(url, {
    action: 'task.create',
    title: 'Second page',
    projectId: project.id,
  })
  assert.equal(recreated.status, 200)
  const second = column(recreated.body, 'backlog')
    .find((entry) => entry.projectId === project.id && entry.identifier === 'MKT-2')
  assert.ok(second)
})

test('board filters by project and reports the visible labels, priorities and assignees', async (t) => {
  const { url } = await fixture(t)
  const first = await act(url, {
    action: 'task.create',
    title: 'Alpha task',
    labels: ['zeta', 'alpha'],
    priority: 'high',
  })
  const defaultProject = first.body.projects[0]

  const second = await act(url, {
    action: 'task.create',
    title: 'Beta task',
    labels: ['beta'],
    priority: 'urgent',
    projectId: defaultProject.id,
  })
  assert.equal(second.status, 200)

  const project = await act(url, { action: 'project.create', name: 'Web', prefix: 'WEB' })
  const web = project.body.projects.find((entry) => entry.prefix === 'WEB')
  const third = await act(url, {
    action: 'task.create',
    title: 'Gamma task',
    projectId: web.id,
    labels: ['gamma'],
    priority: 'urgent',
  })
  assert.equal(third.status, 200)

  const filtered = await board(url, defaultProject.id)
  assert.deepEqual(filtered.board.tasks.map((task) => task.title).sort(), ['Alpha task', 'Beta task'])
  assert.equal(filtered.summary.total, 2)
  assert.deepEqual(filtered.filters.labels, ['alpha', 'beta', 'zeta'])
  assert.deepEqual(filtered.filters.priorities, ['high', 'urgent'])
  assert.deepEqual(filtered.filters.assignees, ['you'])

  const all = await board(url, 'all')
  assert.deepEqual(
    all.board.tasks.map((task) => task.title).sort(),
    ['Alpha task', 'Beta task', 'Gamma task'],
  )
  assert.deepEqual(all.filters.labels, ['alpha', 'beta', 'gamma', 'zeta'])
  assert.deepEqual(all.filters.priorities, ['high', 'urgent'])
  assert.deepEqual(all.filters.assignees, ['you'])
})

test('attachments upload, download and delete through the api', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'With a file' })
  const task = column(created.body, 'backlog')[0]
  const bytes = Buffer.from([0, 1, 2, 3, 255, 254, 65, 66, 67, 10])
  const filename = '报告 v1.txt'
  const contentType = 'text/plain; charset=utf-8'

  const added = await act(url, {
    action: 'attachment.add',
    id: task.identifier,
    version: task.version,
    filename,
    contentType,
    data: bytes.toString('base64'),
  })
  assert.equal(added.status, 200)
  const updated = column(added.body, 'backlog')[0]
  assert.equal(updated.version, task.version + 1)
  assert.equal(updated.attachments.length, 1)
  const [attachment] = updated.attachments
  assert.match(attachment.id, /^att_/)
  assert.equal(attachment.filename, filename)
  assert.equal(attachment.contentType, contentType)
  assert.equal(attachment.size, bytes.length)
  assert.ok(attachment.createdAt)

  const download = await fetch(`${url}/api/attachments/${attachment.id}`)
  assert.equal(download.status, 200)
  assert.equal(download.headers.get('content-type'), contentType)
  assert.equal(
    download.headers.get('content-disposition'),
    "inline; filename*=UTF-8''%E6%8A%A5%E5%91%8A%20v1.txt",
  )
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes)

  const missing = await fetch(`${url}/api/attachments/att_missing`)
  assert.equal(missing.status, 404)
  const missingBody = await missing.json()
  assert.equal(missingBody.ok, false)
  assert.equal(missingBody.error.code, 'ATTACHMENT_NOT_FOUND')

  const removed = await act(url, {
    action: 'attachment.remove',
    id: task.identifier,
    version: updated.version,
    attachmentId: attachment.id,
  })
  assert.equal(removed.status, 200)
  assert.deepEqual(column(removed.body, 'backlog')[0].attachments, [])

  const gone = await fetch(`${url}/api/attachments/${attachment.id}`)
  assert.equal(gone.status, 404)
  assert.equal((await gone.json()).ok, false)
})

test('oversized attachment payloads are rejected without touching the board', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'Too big' })
  const task = column(created.body, 'backlog')[0]

  const payload = Buffer.alloc(10 * 1024 * 1024 + 1).toString('base64')
  const response = await act(url, {
    action: 'attachment.add',
    id: task.identifier,
    version: task.version,
    filename: 'big.bin',
    contentType: 'application/octet-stream',
    data: payload,
  })
  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'ATTACHMENT_TOO_LARGE')

  const fresh = await board(url)
  assert.deepEqual(column(fresh, 'backlog')[0].attachments, [])
  assert.equal(column(fresh, 'backlog')[0].version, task.version)
})

test('the api rejects non-json posts, unknown actions and invalid input', async (t) => {
  const { url } = await fixture(t)
  const plain = await fetch(`${url}/api/action`, { method: 'POST', body: 'action=create' })
  assert.equal(plain.status, 415)

  const unknown = await act(url, { action: 'nope' })
  assert.equal(unknown.status, 400)
  assert.equal(unknown.body.error.code, 'UNKNOWN_ACTION')

  const legacy = await act(url, { action: 'create', title: 'old shape' })
  assert.equal(legacy.status, 400)
  assert.equal(legacy.body.error.code, 'UNKNOWN_ACTION')

  const malformed = await fetch(`${url}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ nope',
  })
  assert.equal(malformed.status, 400)

  const array = await fetch(`${url}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '[]',
  })
  assert.equal(array.status, 400)

  const invalidTask = await act(url, { action: 'task.create', title: '   ' })
  assert.equal(invalidTask.status, 400)
  assert.equal(invalidTask.body.error.code, 'INVALID_INPUT')

  const invalidPrefix = await act(url, { action: 'project.create', name: 'Lower', prefix: 'web' })
  assert.equal(invalidPrefix.status, 400)
  assert.equal(invalidPrefix.body.error.code, 'INVALID_INPUT')

  const missingProject = await act(url, { action: 'project.archive', id: 'prj_missing' })
  assert.equal(missingProject.status, 400)
  assert.equal(missingProject.body.error.code, 'PROJECT_NOT_FOUND')

  const unknownRoute = await fetch(`${url}/api/nope`)
  assert.equal(unknownRoute.status, 404)
  assert.equal((await unknownRoute.json()).error.code, 'NOT_FOUND')
})

test('the server binds to loopback and reports a usable port', async (t) => {
  const { url } = await fixture(t)
  const parsed = new URL(url)
  assert.equal(parsed.hostname, '127.0.0.1')
  assert.ok(Number(parsed.port) > 0)
  assert.equal((await fetch(`${url}/api/board`)).status, 200)
})

test('approving a reviewed task from the web ui uses the human actor', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, {
    action: 'task.create',
    title: 'Review me',
    status: 'in_review',
  })
  const task = column(created.body, 'needs')[0]
  assert.equal(task.attention, 'review')
  const approved = await act(url, { action: 'task.approve', id: task.identifier, version: 1 })
  assert.equal(approved.status, 200)
  const done = column(approved.body, 'done')[0]
  assert.equal(done.assignee.type, 'user')
  assert.equal(done.activity.at(-1).actor.type, 'user')
})

test('task reorder round-trips through the api and drives the column order', async (t) => {
  const { url } = await fixture(t)
  const first = column((await act(url, { action: 'task.create', title: 'first' })).body, 'backlog')[0]
  const second = column((await act(url, { action: 'task.create', title: 'second' })).body, 'backlog')
    .find((task) => task.id !== first.id)
  const third = column((await act(url, { action: 'task.create', title: 'third' })).body, 'backlog')
    .find((task) => task.id !== first.id && task.id !== second.id)

  const before = await act(url, {
    action: 'task.reorder',
    id: third.identifier,
    version: 1,
    beforeId: first.identifier,
  })
  assert.equal(before.status, 200)
  assert.deepEqual(
    column(before.body, 'backlog').map((task) => task.identifier),
    [third.identifier, first.identifier, second.identifier],
  )
  const reordered = column(before.body, 'backlog')[0]
  assert.equal(reordered.version, 2)
  assert.equal(reordered.sortOrder, 0)

  const middle = await act(url, {
    action: 'task.reorder',
    id: third.identifier,
    version: 2,
    beforeId: second.identifier,
  })
  assert.equal(middle.status, 200)
  assert.deepEqual(
    column(middle.body, 'backlog').map((task) => task.identifier),
    [first.identifier, third.identifier, second.identifier],
  )
  assert.equal(column(middle.body, 'backlog')[1].sortOrder, (1024 + 2048) / 2)

  const stale = await act(url, {
    action: 'task.reorder',
    id: third.identifier,
    version: 1,
    beforeId: second.identifier,
  })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.error.code, 'TASK_VERSION_CONFLICT')
})

test('task archive and restore round-trip through the api and include_archived', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'Archive me' })
  const task = column(created.body, 'backlog')[0]

  const archived = await act(url, {
    action: 'task.archive',
    id: task.identifier,
    version: 1,
  })
  assert.equal(archived.status, 200)
  assert.deepEqual(column(archived.body, 'backlog'), [])
  assert.equal(archived.body.summary.total, 0)
  assert.ok(archived.body.board.tasks.every((entry) => entry.id !== task.id))

  const hidden = await board(url)
  assert.equal(hidden.summary.total, 0)
  const response = await fetch(`${url}/api/board?include_archived=1`)
  const included = await response.json()
  assert.equal(included.summary.total, 1)
  const shown = column(included, 'backlog')[0]
  assert.equal(shown.id, task.id)
  assert.ok(shown.archivedAt)
  assert.equal(shown.attention, null)

  const blocked = await act(url, {
    action: 'task.update',
    id: task.identifier,
    version: 2,
    title: 'nope',
  })
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.error.code, 'TASK_ARCHIVED')

  const restored = await act(url, {
    action: 'task.restore',
    id: task.identifier,
    version: 2,
  })
  assert.equal(restored.status, 200)
  const back = column(restored.body, 'backlog')[0]
  assert.equal(back.id, task.id)
  assert.equal(back.archivedAt, null)
  assert.equal(restored.body.summary.total, 1)
})

test('project counts exclude archived tasks', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'task.create', title: 'active one' })
  const id = column(created.body, 'backlog')[0].identifier
  await act(url, { action: 'task.archive', id, version: 1 })
  const json = await board(url)
  assert.equal(json.projects[0].taskCount, 0)
  assert.equal(json.projects[0].archivedCount, 1)
})
