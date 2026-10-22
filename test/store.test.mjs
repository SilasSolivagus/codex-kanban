import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore, emptyBoard, resolveRoot } from '../plugin/src/store.mjs'

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-store-'))
}

function lockPath(store) {
  return path.join(store.dir, 'board.lock')
}

function withEnv(value, fn) {
  const previous = process.env.CODEX_KANBAN_ROOT
  if (value === undefined) delete process.env.CODEX_KANBAN_ROOT
  else process.env.CODEX_KANBAN_ROOT = value
  try {
    return fn()
  } finally {
    if (previous === undefined) delete process.env.CODEX_KANBAN_ROOT
    else process.env.CODEX_KANBAN_ROOT = previous
  }
}

test('a fresh store returns an empty board without touching disk', () => {
  const root = tempRoot()
  const store = createStore({ root })
  const board = store.read()
  assert.equal(board.tasks.length, 0)
  assert.equal(board.schema, 2)
  assert.equal(board.projects.length, 1)
  assert.equal(board.projects[0].name, path.basename(root))
  assert.match(board.projects[0].prefix, /^[A-Z0-9]{2,6}$/)
  assert.equal(board.projects[0].workspacePath, null)
  assert.equal(board.projects[0].nextTaskNumber, 1)
  assert.equal(board.nextTaskNumber, undefined)
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.existsSync(store.dir), false)
  assert.equal(store.root, path.resolve(root))
  assert.equal(store.dir, path.join(path.resolve(root), '.kanban'))
  assert.equal(store.path, path.join(path.resolve(root), '.kanban', 'board.json'))
  assert.equal(store.attachmentsDir, path.join(path.resolve(root), '.kanban', 'attachments'))
  assert.equal(fs.existsSync(store.attachmentsDir), false)
})

test('mutate writes atomically and removes the lock', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  const result = await store.mutate((board) => {
    board.tasks.push({ identifier: 'CK-1' })
    return 'done'
  })
  assert.equal(result, 'done')
  const onDisk = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(onDisk.tasks.length, 1)
  assert.equal(onDisk.tasks[0].identifier, 'CK-1')
  assert.equal(fs.existsSync(`${store.path}.tmp`), false)
  assert.equal(fs.existsSync(lockPath(store)), false)
})

test('a successful mutation leaves no lock file behind', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  let token
  await store.mutate((board) => {
    token = fs.readFileSync(lockPath(store), 'utf8')
    board.tasks.push({ identifier: 'CK-1' })
  })
  assert.match(token, /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  assert.equal(fs.existsSync(lockPath(store)), false)
  assert.deepEqual(fs.readdirSync(store.dir), ['board.json'])
})

test('write persists a board directly and stays atomic', () => {
  const root = tempRoot()
  const store = createStore({ root })
  const board = emptyBoard(root)
  board.tasks.push({ identifier: 'CK-1', title: 'first' })
  store.write(board)
  const onDisk = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(onDisk.tasks[0].title, 'first')
  assert.equal(fs.existsSync(`${store.path}.tmp`), false)
  assert.equal(fs.existsSync(lockPath(store)), false)
})

test('mutate reads fresh state before applying the change', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  const first = emptyBoard(root)
  first.tasks.push({ identifier: 'CK-1' })
  store.write(first)
  await store.mutate((board) => {
    board.tasks.push({ identifier: 'CK-2' })
  })
  const onDisk = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.deepEqual(onDisk.tasks.map((task) => task.identifier), ['CK-1', 'CK-2'])
})

test('concurrent mutations serialize instead of losing writes', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      store.mutate((board) => {
        board.tasks.push({ identifier: `CK-${index + 1}`, title: `task ${index}` })
      }),
    ),
  )
  const board = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(board.tasks.length, 10)
  assert.equal(new Set(board.tasks.map((task) => task.identifier)).size, 10)
  assert.equal(fs.existsSync(lockPath(store)), false)
})

test('corrupt json fails loudly with a stable code', () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(store.path, '{ nope', 'utf8')
  assert.throws(() => store.read(), (error) => error.code === 'CORRUPT_BOARD')
})

test('a structurally invalid board is corrupt, not silently repaired', () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  for (const payload of ['null', '[]', '{"tasks":{}}', '{"schema":1}']) {
    fs.writeFileSync(store.path, payload, 'utf8')
    assert.throws(
      () => store.read(),
      (error) => error.code === 'CORRUPT_BOARD',
      `expected CORRUPT_BOARD for ${payload}`,
    )
  }
})

test('a minimal but well-shaped board is normalized on read', () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(store.path, '{"tasks":[]}', 'utf8')
  const board = store.read()
  assert.equal(board.schema, 2)
  assert.equal(board.projects.length, 1)
  assert.equal(board.projects[0].name, path.basename(root))
  assert.equal(board.projects[0].nextTaskNumber, 1)
  assert.deepEqual(board.tasks, [])
})

test('mutate validates the result before writing', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  await assert.rejects(
    store.mutate((board) => {
      board.tasks = 'not an array'
    }),
    (error) => error.code === 'CORRUPT_BOARD',
  )
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.existsSync(lockPath(store)), false)
})

test('a throwing mutation releases the lock and writes nothing', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  await assert.rejects(
    store.mutate(() => {
      throw new Error('boom')
    }),
    /boom/,
  )
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.existsSync(lockPath(store)), false)
})

test('a fresh foreign lock makes mutate time out and is left intact', async () => {
  const root = tempRoot()
  const store = createStore({ root, lockTimeoutMs: 50 })
  const foreign = 'foreign-holder'
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(lockPath(store), foreign, 'utf8')
  await assert.rejects(
    store.mutate(() => {}),
    (error) => error.code === 'BOARD_LOCKED' && error.message.includes(store.dir),
  )
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.readFileSync(lockPath(store), 'utf8'), foreign)
  assert.deepEqual(fs.readdirSync(store.dir), ['board.lock'])
})

test('a stale lock is reclaimed and the mutation succeeds', async () => {
  const root = tempRoot()
  const store = createStore({ root, lockTimeoutMs: 50 })
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(lockPath(store), 'stale-holder', 'utf8')
  const old = new Date(Date.now() - 60_000)
  fs.utimesSync(lockPath(store), old, old)

  await store.mutate((board) => {
    board.tasks.push({ identifier: 'CK-1' })
  })

  const board = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(board.tasks.length, 1)
  assert.equal(fs.existsSync(lockPath(store)), false)
  assert.deepEqual(fs.readdirSync(store.dir), ['board.json'])
})

test('a mutation that loses lock ownership neither writes nor removes the foreign lock', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  const foreign = 'someone-else'
  await assert.rejects(
    store.mutate((board) => {
      fs.writeFileSync(lockPath(store), foreign, 'utf8')
      board.tasks.push({ identifier: 'CK-1' })
    }),
    (error) => error.code === 'BOARD_LOCKED' && /ownership was lost/.test(error.message),
  )
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.readFileSync(lockPath(store), 'utf8'), foreign)
  fs.unlinkSync(lockPath(store))
})

test('emptyBoard derives a usable name and prefix', () => {
  const board = emptyBoard('/tmp/codex-kanban')
  assert.equal(board.schema, 2)
  assert.equal(board.projects.length, 1)
  assert.equal(board.projects[0].id, 'prj_default')
  assert.equal(board.projects[0].name, 'codex-kanban')
  assert.equal(board.projects[0].prefix, 'CODEXK')
  assert.match(board.projects[0].createdAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(board.projects[0].nextTaskNumber, 1)
  assert.equal(board.projects[0].workspacePath, null)
  assert.equal(board.projects[0].archivedAt, null)
  assert.equal(board.nextTaskNumber, undefined)
  assert.deepEqual(board.tasks, [])
})

test('a v1 board migrates to schema 2 with one project and keeps identifiers', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  const v1 = {
    schema: 1,
    project: {
      name: 'legacy-board',
      prefix: 'LEG',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    nextTaskNumber: 3,
    tasks: [
      { id: 'tsk_a', identifier: 'LEG-1', title: 'first', status: 'backlog' },
      { id: 'tsk_b', identifier: 'LEG-2', title: 'second', status: 'done' },
    ],
  }
  fs.writeFileSync(store.path, JSON.stringify(v1), 'utf8')

  const board = store.read()
  assert.equal(board.schema, 2)
  assert.equal(board.projects.length, 1)
  const [project] = board.projects
  assert.equal(project.id, 'prj_default')
  assert.equal(project.name, 'legacy-board')
  assert.equal(project.prefix, 'LEG')
  assert.equal(project.createdAt, '2026-01-01T00:00:00.000Z')
  assert.equal(project.nextTaskNumber, 3)
  assert.equal(project.workspacePath, null)
  assert.equal(project.archivedAt, null)
  assert.deepEqual(
    board.tasks.map((task) => [task.identifier, task.projectId, task.attachments]),
    [['LEG-1', 'prj_default', []], ['LEG-2', 'prj_default', []]],
  )

  // Reading migrates in memory; the file is upgraded on the first write.
  assert.equal(JSON.parse(fs.readFileSync(store.path, 'utf8')).schema, 1)
  await store.mutate(() => {})
  const onDisk = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(onDisk.schema, 2)
  assert.equal(onDisk.project, undefined)
  assert.equal(onDisk.nextTaskNumber, undefined)
  assert.equal(onDisk.projects[0].id, 'prj_default')
  assert.equal(onDisk.projects[0].nextTaskNumber, 3)
  assert.deepEqual(onDisk.tasks.map((task) => task.identifier), ['LEG-1', 'LEG-2'])
  assert.ok(onDisk.tasks.every((task) => task.projectId === 'prj_default'))
})

test('normalize repairs missing project fields and task attachment arrays', () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(
    store.path,
    JSON.stringify({ schema: 2, projects: [{ name: 'app' }], tasks: [{ identifier: 'APP-1' }] }),
    'utf8',
  )
  const board = store.read()
  const [project] = board.projects
  assert.equal(project.id, 'prj_default')
  assert.equal(project.prefix, 'APP')
  assert.equal(project.workspacePath, null)
  assert.equal(project.nextTaskNumber, 1)
  assert.equal(project.archivedAt, null)
  assert.match(project.createdAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.match(project.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(board.tasks[0].projectId, 'prj_default')
  assert.deepEqual(board.tasks[0].attachments, [])
})

test('resolveRoot prefers an explicit path, realpath included', () => {
  const root = tempRoot()
  assert.equal(resolveRoot(root), fs.realpathSync(root))
  const link = path.join(tempRoot(), 'link')
  fs.symlinkSync(root, link, 'dir')
  assert.equal(resolveRoot(link), fs.realpathSync(root))
})

test('resolveRoot rejects a missing explicit path', () => {
  const root = tempRoot()
  assert.throws(
    () => resolveRoot(path.join(root, 'missing')),
    (error) => error.code === 'ROOT_NOT_FOUND',
  )
  const envRoot = tempRoot()
  withEnv(envRoot, () => {
    assert.throws(
      () => resolveRoot(path.join(root, 'missing')),
      (error) => error.code === 'ROOT_NOT_FOUND',
    )
  })
})

test('resolveRoot honors CODEX_KANBAN_ROOT', () => {
  const root = tempRoot()
  withEnv(root, () => {
    assert.equal(resolveRoot(), fs.realpathSync(root))
  })
})

test('resolveRoot walks up to a repository marker', () => {
  const root = tempRoot()
  fs.mkdirSync(path.join(root, '.git'))
  const nested = path.join(root, 'src', 'deep')
  fs.mkdirSync(nested, { recursive: true })
  const previousCwd = process.cwd()
  try {
    withEnv(undefined, () => {
      process.chdir(nested)
      assert.equal(resolveRoot(), fs.realpathSync(root))
    })
  } finally {
    process.chdir(previousCwd)
  }
})

test('resolveRoot falls back to the current directory', () => {
  const root = tempRoot()
  const previousCwd = process.cwd()
  try {
    withEnv(undefined, () => {
      process.chdir(root)
      assert.equal(resolveRoot(), fs.realpathSync(root))
    })
  } finally {
    process.chdir(previousCwd)
  }
})
