import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attentionReason,
  canDrop,
  columnForTask,
  nextIdentifier,
  sortTasks,
  statusForColumn,
  taskPrefixFor,
} from '../src/rules.mjs'

const base = {
  identifier: 'CK-1',
  status: 'todo',
  priority: 'none',
  sortOrder: 1024,
  statusSince: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
}

test('attention priority is question, then blocked, then review', () => {
  assert.equal(attentionReason({ ...base, status: 'in_review' }), 'review')
  assert.equal(attentionReason({ ...base, status: 'in_review', blockedReason: 'waiting' }), 'blocked')
  assert.equal(
    attentionReason({ ...base, status: 'in_review', blockedReason: 'waiting', pendingQuestion: {} }),
    'question',
  )
  assert.equal(attentionReason({ ...base }), null)
})

test('any attention pulls the task into needs you while keeping its status', () => {
  const task = { ...base, status: 'in_progress', blockedReason: 'missing token' }
  assert.equal(columnForTask(task), 'needs')
  assert.equal(task.status, 'in_progress')
})

test('columns map stored statuses', () => {
  assert.equal(columnForTask({ ...base, status: 'backlog' }), 'backlog')
  assert.equal(columnForTask({ ...base, status: 'in_progress' }), 'running')
  assert.equal(columnForTask({ ...base, status: 'done' }), 'done')
  assert.equal(columnForTask({ ...base, status: 'canceled' }), null)
})

test('needs you is never a drop target', () => {
  const result = canDrop({ ...base }, 'needs')
  assert.equal(result.ok, false)
  assert.match(result.reason, /automatic/)
})

test('a task with attention cannot jump to running', () => {
  const task = { ...base, blockedReason: 'no key' }
  assert.equal(canDrop(task, 'running').ok, false)
  assert.equal(canDrop(task, 'backlog').ok, true)
})

test('status for column picks the canonical status', () => {
  assert.equal(statusForColumn('backlog'), 'backlog')
  assert.equal(statusForColumn('running'), 'in_progress')
  assert.equal(statusForColumn('done'), 'done')
  assert.equal(statusForColumn('needs'), null)
})

test('sorting prefers priority then order', () => {
  const tasks = [
    { ...base, identifier: 'CK-2', priority: 'low', sortOrder: 1 },
    { ...base, identifier: 'CK-3', priority: 'urgent', sortOrder: 9 },
    { ...base, identifier: 'CK-4', priority: 'low', sortOrder: 0 },
  ]
  assert.deepEqual(tasks.sort(sortTasks).map((task) => task.identifier), ['CK-3', 'CK-4', 'CK-2'])
})

test('identifiers continue after the largest existing number', () => {
  const project = { prefix: 'CK', nextTaskNumber: 2 }
  const tasks = [{ identifier: 'CK-1' }, { identifier: 'CK-7' }]
  assert.equal(nextIdentifier(project, tasks), 'CK-8')
})

test('prefixes are derived from directory names', () => {
  assert.equal(taskPrefixFor('codex-kanban'), 'CODEXK')
  assert.equal(taskPrefixFor('app'), 'APP')
  assert.equal(taskPrefixFor('9'), 'KANBAN')
})
