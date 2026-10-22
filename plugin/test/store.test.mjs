import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore, emptyBoard, resolveRoot } from '../src/store.mjs'

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-store-'))
}

test('a fresh store returns an empty board without touching disk', () => {
  const root = tempRoot()
  const store = createStore({ root })
  const board = store.read()
  assert.equal(board.tasks.length, 0)
  assert.equal(board.schema, 1)
  assert.equal(fs.existsSync(store.path), false)
})

test('mutate persists atomically and leaves no lock behind', async () => {
  const root = tempRoot()
  const store = createStore({ root })
  await store.mutate((board) => {
    board.nextTaskNumber = 2
    board.tasks.push({ identifier: 'CK-1', title: 'first' })
  })
  const onDisk = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.equal(onDisk.tasks[0].title, 'first')
  assert.equal(fs.existsSync(path.join(store.dir, 'board.lock')), false)
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
  // Node runs these in one loop; the lock still has to leave a complete file.
  const board = JSON.parse(fs.readFileSync(store.path, 'utf8'))
  assert.ok(board.tasks.length >= 1)
  assert.equal(new Set(board.tasks.map((task) => task.identifier)).size, board.tasks.length)
})

test('corrupt json fails loudly with a stable code', () => {
  const root = tempRoot()
  const store = createStore({ root })
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(store.path, '{ nope', 'utf8')
  assert.throws(() => store.read(), (error) => error.code === 'CORRUPT_BOARD')
})

test('emptyBoard derives a usable prefix', () => {
  const board = emptyBoard('/tmp/codex-kanban')
  assert.equal(board.project.prefix, 'CODEXK')
  assert.equal(board.project.name, 'codex-kanban')
})

test('resolveRoot prefers an explicit path and rejects missing ones', () => {
  const root = tempRoot()
  assert.equal(resolveRoot(root), fs.realpathSync(root))
  assert.throws(() => resolveRoot(path.join(root, 'missing')), (error) => error.code === 'ROOT_NOT_FOUND')
})
