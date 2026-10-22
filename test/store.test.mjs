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
  assert.equal(board.schema, 1)
  assert.equal(board.nextTaskNumber, 1)
  assert.equal(board.project.name, path.basename(root))
  assert.match(board.project.prefix, /^[A-Z0-9]{2,6}$/)
  assert.equal(fs.existsSync(store.path), false)
  assert.equal(fs.existsSync(store.dir), false)
  assert.equal(store.root, path.resolve(root))
  assert.equal(store.dir, path.join(path.resolve(root), '.kanban'))
  assert.equal(store.path, path.join(path.resolve(root), '.kanban', 'board.json'))
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
  assert.equal(board.schema, 1)
  assert.equal(board.nextTaskNumber, 1)
  assert.equal(board.project.name, path.basename(root))
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
  assert.equal(board.schema, 1)
  assert.equal(board.project.name, 'codex-kanban')
  assert.equal(board.project.prefix, 'CODEXK')
  assert.match(board.project.createdAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(board.nextTaskNumber, 1)
  assert.deepEqual(board.tasks, [])
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
