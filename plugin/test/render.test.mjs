import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyBoard } from '../src/store.mjs'
import { buildView, formatAge, renderMarkdown, renderTaskDetail, renderTaskLine } from '../src/render.mjs'

const now = Date.parse('2026-10-22T12:00:00.000Z')

function task(extra) {
  return {
    id: `tsk_${extra.identifier}`,
    identifier: extra.identifier,
    title: extra.title ?? 'task',
    description: '',
    status: 'backlog',
    priority: 'none',
    labels: [],
    assignee: { type: 'agent', name: 'codex' },
    sortOrder: 1,
    statusSince: '2026-10-22T11:00:00.000Z',
    blockedReason: null,
    blockedSince: null,
    pendingQuestion: null,
    questionResolution: null,
    links: [],
    comments: [],
    activity: [],
    version: 1,
    createdAt: '2026-10-22T11:00:00.000Z',
    updatedAt: '2026-10-22T11:00:00.000Z',
    ...extra,
  }
}

function boardWith(tasks) {
  const board = emptyBoard('/tmp/demo-board')
  board.tasks = tasks
  return board
}

test('ages are compact', () => {
  assert.equal(formatAge('2026-10-22T11:59:30.000Z', now), '30s')
  assert.equal(formatAge('2026-10-22T11:48:00.000Z', now), '12m')
  assert.equal(formatAge('2026-10-22T08:00:00.000Z', now), '4h')
  assert.equal(formatAge('2026-10-19T12:00:00.000Z', now), '3d')
})

test('needs you renders first', () => {
  const board = boardWith([
    task({ identifier: 'DM-1', title: 'backlog item' }),
    task({ identifier: 'DM-5', title: 'in flight', status: 'in_progress' }),
    task({
      identifier: 'DM-2',
      title: 'deploy target',
      status: 'in_progress',
      pendingQuestion: {
        prompt: 'Which deploy target?',
        note: '',
        options: [{ id: 'opt_1', label: 'Staging', detail: '' }],
        selected: null,
        createdAt: '2026-10-22T11:00:00.000Z',
      },
    }),
  ])
  const markdown = renderMarkdown(board, { now })
  assert.ok(markdown.startsWith('# Codex Kanban · demo-board'))
  const needsIndex = markdown.indexOf('## Needs you')
  const runningIndex = markdown.indexOf('## Running')
  assert.ok(needsIndex >= 0 && runningIndex > needsIndex)
  assert.match(markdown, /DM-2/)
  assert.match(markdown, /question: Which deploy target\?/)
})

test('done can be hidden', () => {
  const board = boardWith([
    task({ identifier: 'DM-1', title: 'shipped', status: 'done' }),
    task({ identifier: 'DM-2', title: 'open' }),
  ])
  assert.match(renderMarkdown(board, { includeDone: true, now }), /shipped/)
  assert.doesNotMatch(renderMarkdown(board, { includeDone: false, now }), /shipped/)
})

test('empty board points at the create tool', () => {
  const markdown = renderMarkdown(boardWith([]))
  assert.match(markdown, /kanban_task_create/)
  assert.match(markdown, /0 tasks/)
})

test('task lines carry priority and blocked age', () => {
  const line = renderTaskLine(
    task({
      identifier: 'DM-3',
      title: 'blocked thing',
      priority: 'high',
      blockedReason: 'missing token',
      blockedSince: '2026-10-22T11:00:00.000Z',
    }),
    now,
  )
  assert.match(line, /DM-3/)
  assert.match(line, /high/)
  assert.match(line, /blocked: missing token/)
  assert.match(line, /1h blocked/)
})

test('task detail lists question options and activity', () => {
  const detail = renderTaskDetail(
    task({
      identifier: 'DM-4',
      title: 'detail',
      pendingQuestion: {
        prompt: 'Pick',
        note: '',
        options: [{ id: 'opt_1', label: 'A', detail: '' }, { id: 'opt_2', label: 'B', detail: 'slow' }],
        selected: 'opt_2',
        createdAt: '2026-10-22T11:00:00.000Z',
      },
      activity: [
        { at: '2026-10-22T11:00:00.000Z', actor: { type: 'agent', name: 'codex' }, kind: 'created', summary: 'created' },
      ],
    }),
    { now },
  )
  assert.match(detail, /\[ \] `opt_1` A/)
  assert.match(detail, /\[x\] `opt_2` B — slow/)
  assert.match(detail, /## Activity/)
})

test('view summary counts attention separately from running', () => {
  const view = buildView(
    boardWith([
      task({ identifier: 'DM-1', status: 'in_progress' }),
      task({ identifier: 'DM-2', blockedReason: 'x' }),
    ]),
  )
  assert.equal(view.summary.counts.needs, 1)
  assert.equal(view.summary.counts.running, 1)
  assert.equal(view.summary.total, 2)
})
