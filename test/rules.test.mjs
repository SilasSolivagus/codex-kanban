import test from 'node:test'
import assert from 'node:assert/strict'
import {
  COLUMNS,
  COLUMN_IDS,
  PRIORITIES,
  STATUSES,
  attentionReason,
  canDrop,
  columnForTask,
  elapsedStart,
  nextIdentifier,
  sortTasks,
  statusForColumn,
  taskPrefixFor,
} from '../plugin/src/rules.mjs'

const base = {
  identifier: 'CK-1',
  status: 'todo',
  priority: 'none',
  sortOrder: 1024,
  statusSince: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
}

test('status and priority vocabularies are stable', () => {
  assert.deepEqual(STATUSES, ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'])
  assert.deepEqual(PRIORITIES, ['none', 'low', 'medium', 'high', 'urgent'])
  assert.deepEqual(COLUMN_IDS, ['backlog', 'running', 'needs', 'done'])
  assert.deepEqual(COLUMNS.map((column) => column.label), ['Backlog', 'Running', 'Needs you', 'Done'])
})

test('attention priority is question, then blocked, then review', () => {
  const review = { ...base, status: 'in_review' }
  assert.equal(attentionReason(review), 'review')
  assert.equal(attentionReason({ ...review, blockedReason: 'waiting' }), 'blocked')
  assert.equal(
    attentionReason({ ...review, blockedReason: 'waiting', pendingQuestion: { createdAt: base.statusSince } }),
    'question',
  )
  assert.equal(attentionReason({ ...base }), null)
})

test('a resolved question no longer demands attention', () => {
  const task = {
    ...base,
    status: 'in_review',
    pendingQuestion: { createdAt: base.statusSince },
    questionResolution: { decision: 'approve' },
  }
  assert.equal(attentionReason(task), 'review')
})

test('any attention pulls the task into needs you while keeping its stored status', () => {
  const task = { ...base, status: 'in_progress', blockedReason: 'missing token' }
  assert.equal(columnForTask(task), 'needs')
  assert.equal(task.status, 'in_progress')
})

test('columns map stored statuses', () => {
  assert.equal(columnForTask({ ...base, status: 'backlog' }), 'backlog')
  assert.equal(columnForTask({ ...base, status: 'todo' }), 'backlog')
  assert.equal(columnForTask({ ...base, status: 'in_progress' }), 'running')
  assert.equal(columnForTask({ ...base, status: 'done' }), 'done')
  assert.equal(columnForTask({ ...base, status: 'canceled' }), null)
  assert.equal(columnForTask({ ...base, status: 'unknown' }), null)
})

test('needs you is never a drop target', () => {
  const result = canDrop({ ...base }, 'needs')
  assert.equal(result.ok, false)
  assert.match(result.reason, /automatic/i)
})

test('unknown columns are not drop targets', () => {
  const result = canDrop({ ...base }, 'nope')
  assert.equal(result.ok, false)
  assert.match(result.reason, /unknown column/i)
})

test('an open question or blocker can only fall back to backlog', () => {
  const blocked = { ...base, status: 'in_progress', blockedReason: 'no key' }
  const question = { ...base, status: 'in_progress', pendingQuestion: { createdAt: base.statusSince } }
  for (const task of [blocked, question]) {
    assert.equal(canDrop(task, 'running').ok, false)
    assert.equal(canDrop(task, 'done').ok, false)
    assert.equal(canDrop(task, 'backlog').ok, true)
  }
})

test('review attention does not block running or done', () => {
  const task = { ...base, status: 'in_review' }
  assert.equal(canDrop(task, 'running').ok, true)
  assert.equal(canDrop(task, 'done').ok, true)
  assert.equal(canDrop(task, 'backlog').ok, true)
  assert.equal(canDrop(task, 'needs').ok, false)
})

test('a task without attention can move to any stored column', () => {
  assert.equal(canDrop({ ...base }, 'backlog').ok, true)
  assert.equal(canDrop({ ...base }, 'running').ok, true)
  assert.equal(canDrop({ ...base }, 'done').ok, true)
})

test('status for column picks the canonical status', () => {
  assert.equal(statusForColumn('backlog'), 'backlog')
  assert.equal(statusForColumn('running'), 'in_progress')
  assert.equal(statusForColumn('done'), 'done')
  assert.equal(statusForColumn('needs'), null)
  assert.equal(statusForColumn('nope'), null)
})

test('sorting prefers manual order, then priority, then newest update', () => {
  const tasks = [
    { ...base, identifier: 'CK-2', priority: 'low', sortOrder: 1 },
    { ...base, identifier: 'CK-3', priority: 'urgent', sortOrder: 9 },
    { ...base, identifier: 'CK-4', priority: 'low', sortOrder: 0 },
    { ...base, identifier: 'CK-5', priority: 'urgent', sortOrder: 9, updatedAt: '2026-10-22T01:00:00.000Z' },
    { ...base, identifier: 'CK-6', priority: 'medium', sortOrder: 5 },
  ]
  assert.deepEqual(tasks.sort(sortTasks).map((task) => task.identifier), ['CK-4', 'CK-2', 'CK-6', 'CK-5', 'CK-3'])
})

test('sorting treats missing priority as none and equal tasks as tied', () => {
  const one = { ...base, identifier: 'CK-1' }
  const two = { ...base, identifier: 'CK-2' }
  assert.equal(sortTasks(one, two), 0)
  const urgent = { ...base, priority: 'urgent' }
  assert.ok(sortTasks(urgent, one) < 0)
  assert.ok(sortTasks(one, urgent) > 0)
})

test('identifiers continue after the largest existing number', () => {
  const project = { prefix: 'CK', nextTaskNumber: 2 }
  const tasks = [{ identifier: 'CK-1' }, { identifier: 'CK-7' }]
  assert.equal(nextIdentifier(project, tasks), 'CK-8')
})

test('identifiers never reuse a number, even after deletions', () => {
  assert.equal(nextIdentifier({ prefix: 'CK', nextTaskNumber: 9 }, [{ identifier: 'CK-2' }]), 'CK-9')
  assert.equal(nextIdentifier({ prefix: 'CK', nextTaskNumber: 1 }, []), 'CK-1')
})

test('identifiers ignore other prefixes and malformed suffixes', () => {
  const tasks = [{ identifier: 'CK-3' }, { identifier: 'XX-99' }, { identifier: 'CK-x' }]
  assert.equal(nextIdentifier({ prefix: 'CK', nextTaskNumber: 1 }, tasks), 'CK-4')
})

test('prefixes are derived from directory names', () => {
  assert.equal(taskPrefixFor('codex-kanban'), 'CODEXK')
  assert.equal(taskPrefixFor('app'), 'APP')
  assert.equal(taskPrefixFor('9'), 'KANBAN')
  assert.equal(taskPrefixFor(''), 'KANBAN')
  assert.equal(taskPrefixFor('a-very-long-project-name'), 'AVERYL')
})

test('elapsed start follows the active attention signal', () => {
  const question = {
    ...base,
    pendingQuestion: { createdAt: '2026-10-22T02:00:00.000Z' },
  }
  assert.equal(elapsedStart(question), '2026-10-22T02:00:00.000Z')
  assert.equal(
    elapsedStart({ ...base, blockedReason: 'x', blockedSince: '2026-10-22T03:00:00.000Z' }),
    '2026-10-22T03:00:00.000Z',
  )
  assert.equal(elapsedStart({ ...base, blockedReason: 'x' }), base.statusSince)
  assert.equal(elapsedStart({ ...base }), base.statusSince)
})

test('canceled tasks never surface attention or a column', () => {
  const canceled = { ...base, status: 'canceled', pendingQuestion: {}, blockedReason: 'still blocked' }
  assert.equal(attentionReason(canceled), null)
  assert.equal(columnForTask(canceled), null)
})

test('archived tasks never surface attention or a column', () => {
  const archived = { ...base, archivedAt: '2026-10-22T05:00:00.000Z', blockedReason: 'still blocked' }
  assert.equal(attentionReason(archived), null)
  assert.equal(columnForTask(archived), 'backlog')
})
