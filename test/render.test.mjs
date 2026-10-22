import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildView,
  formatAge,
  renderMarkdown,
  renderTaskDetail,
  renderTaskLine,
  summarizeView,
} from '../plugin/src/render.mjs'

const now = Date.parse('2026-10-22T12:00:00.000Z')

function task(extra = {}) {
  return {
    id: `tsk_${extra.identifier ?? 'CK-1'}`,
    identifier: 'CK-1',
    title: 'task',
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

function board(tasks, extra = {}) {
  return {
    schema: 1,
    project: { name: 'demo-board', prefix: 'CK', createdAt: '2026-10-22T10:00:00.000Z' },
    nextTaskNumber: tasks.length + 1,
    tasks,
    ...extra,
  }
}

function question(extra = {}) {
  return {
    prompt: 'Which deploy target?',
    note: '',
    options: [
      { id: 'opt_1', label: 'Staging', detail: '' },
      { id: 'opt_2', label: 'Production', detail: 'slow' },
    ],
    selected: null,
    answerNote: '',
    createdAt: '2026-10-22T11:48:00.000Z',
    ...extra,
  }
}

// --- formatAge -------------------------------------------------------------

test('formatAge renders compact ages', () => {
  assert.equal(formatAge('2026-10-22T11:59:30.000Z', now), '30s')
  assert.equal(formatAge('2026-10-22T11:48:00.000Z', now), '12m')
  assert.equal(formatAge('2026-10-22T08:00:00.000Z', now), '4h')
  assert.equal(formatAge('2026-10-19T12:00:00.000Z', now), '3d')
})

test('formatAge returns an empty string for missing or invalid input', () => {
  assert.equal(formatAge(null, now), '')
  assert.equal(formatAge(undefined, now), '')
  assert.equal(formatAge('', now), '')
  assert.equal(formatAge('not-a-date', now), '')
})

test('formatAge clamps future timestamps to 0s', () => {
  assert.equal(formatAge('2026-10-22T12:00:30.000Z', now), '0s')
})

// --- board rendering -------------------------------------------------------

test('the title names the project and the summary counts task, needs and running', () => {
  const markdown = renderMarkdown(
    board([
      task({ identifier: 'CK-1', status: 'in_progress' }),
      task({ identifier: 'CK-2', blockedReason: 'missing token', blockedSince: '2026-10-22T11:00:00.000Z' }),
      task({ identifier: 'CK-3', status: 'done' }),
    ]),
    { now },
  )
  assert.match(markdown, /^# Codex Kanban · demo-board$/m)
  assert.match(markdown, /^3 tasks · 1 needs you · 1 running$/m)
})

test('the summary uses the singular "task" for exactly one task', () => {
  const markdown = renderMarkdown(board([task()]), { now })
  assert.match(markdown, /^1 task · 0 needs you · 0 running$/m)
})

test('sections render Needs you, Running, Backlog, Done regardless of COLUMNS order', () => {
  const markdown = renderMarkdown(
    board([
      task({ identifier: 'CK-1', title: 'backlog work' }),
      task({ identifier: 'CK-2', title: 'running work', status: 'in_progress' }),
      task({
        identifier: 'CK-3',
        title: 'blocked work',
        blockedReason: 'missing token',
        blockedSince: '2026-10-22T11:00:00.000Z',
      }),
      task({ identifier: 'CK-4', title: 'finished work', status: 'done' }),
    ]),
    { now },
  )
  const headings = markdown.match(/^## .+$/gm)
  assert.deepEqual(headings, ['## Needs you', '## Running', '## Backlog', '## Done'])
  assert.ok(markdown.indexOf('## Needs you') < markdown.indexOf('blocked work'))
})

test('Needs you always renders and explains an empty column', () => {
  const markdown = renderMarkdown(board([task({ identifier: 'CK-1' })]), { now })
  assert.match(markdown, /## Needs you\n\n_Nothing needs you right now\._/)
})

test('empty non-needs columns are omitted', () => {
  const markdown = renderMarkdown(board([task({ identifier: 'CK-1' })]), { now })
  assert.doesNotMatch(markdown, /## Running/)
  assert.doesNotMatch(markdown, /## Done/)
})

test('Done is hidden when includeDone is false', () => {
  const value = board([
    task({ identifier: 'CK-1', title: 'shipped', status: 'done' }),
    task({ identifier: 'CK-2', title: 'open' }),
  ])
  const shown = renderMarkdown(value, { now })
  const hidden = renderMarkdown(value, { includeDone: false, now })
  assert.match(shown, /## Done/)
  assert.match(shown, /shipped/)
  assert.doesNotMatch(hidden, /## Done/)
  assert.doesNotMatch(hidden, /shipped/)
  // Hiding a column does not change the board totals.
  assert.match(hidden, /^2 tasks · 0 needs you · 0 running$/m)
})

test('the column option renders only that column', () => {
  const value = board([
    task({ identifier: 'CK-1', title: 'backlog work' }),
    task({ identifier: 'CK-2', title: 'running work', status: 'in_progress' }),
  ])
  const backlog = renderMarkdown(value, { column: 'backlog', now })
  assert.match(backlog, /## Backlog/)
  assert.doesNotMatch(backlog, /## Needs you/)
  assert.doesNotMatch(backlog, /## Running/)

  const needs = renderMarkdown(value, { column: 'needs', now })
  assert.match(needs, /## Needs you\n\n_Nothing needs you right now\._/)
  assert.doesNotMatch(needs, /## Backlog/)
})

test('an empty board shows only the create hint, with no headings', () => {
  const markdown = renderMarkdown(board([]), { now })
  assert.equal(
    markdown,
    'The board is empty. Create the first task with `kanban_task_create`.',
  )
  assert.doesNotMatch(markdown, /^#/m)
})

// --- task lines ------------------------------------------------------------

test('a question task line matches the contract format', () => {
  const line = renderTaskLine(
    task({
      identifier: 'CK-3',
      title: 'Which target?',
      priority: 'medium',
      pendingQuestion: question(),
    }),
    now,
  )
  assert.equal(
    line,
    '- **CK-3** Which target? · medium · question: Which deploy target? · 12m',
  )
})

test('priority is omitted when it is none and shown otherwise', () => {
  assert.equal(renderTaskLine(task({ identifier: 'CK-1', title: 'plain' }), now), '- **CK-1** plain')
  assert.match(
    renderTaskLine(task({ identifier: 'CK-2', title: 'urgent', priority: 'urgent' }), now),
    /^\- \*\*CK-2\*\* urgent · urgent$/,
  )
})

test('an in-progress task gets the in progress marker only without attention', () => {
  assert.match(
    renderTaskLine(task({ identifier: 'CK-1', status: 'in_progress' }), now),
    /· in progress$/,
  )
  assert.doesNotMatch(
    renderTaskLine(
      task({
        identifier: 'CK-2',
        status: 'in_progress',
        blockedReason: 'missing token',
        blockedSince: '2026-10-22T11:00:00.000Z',
      }),
      now,
    ),
    /in progress/,
  )
})

test('review attention renders waiting for review and its age', () => {
  const line = renderTaskLine(
    task({
      identifier: 'CK-6',
      status: 'in_review',
      statusSince: '2026-10-22T11:00:00.000Z',
    }),
    now,
  )
  assert.match(line, /waiting for review · 1h$/)
})

test('an answered but unresolved question also shows the selected label', () => {
  const line = renderTaskLine(
    task({
      identifier: 'CK-4',
      pendingQuestion: question({ selected: 'opt_2' }),
    }),
    now,
  )
  assert.match(line, /question: Which deploy target\?/)
  assert.match(line, /answered: Production/)
})

test('a resolved question stops showing the question and answer badges', () => {
  const line = renderTaskLine(
    task({
      identifier: 'CK-5',
      status: 'done',
      pendingQuestion: question({ selected: 'opt_2' }),
      questionResolution: { decision: 'approve', optionId: 'opt_2', optionLabel: 'Production', note: '', at: '2026-10-22T11:55:00.000Z' },
    }),
    now,
  )
  assert.doesNotMatch(line, /question:/)
  assert.doesNotMatch(line, /answered:/)
})

test('a blocked task shows the reason and the blocked age', () => {
  const line = renderTaskLine(
    task({
      identifier: 'CK-3',
      title: 'blocked thing',
      priority: 'high',
      blockedReason: 'missing token',
      blockedSince: '2026-10-22T11:00:00.000Z',
    }),
    now,
  )
  assert.equal(line, '- **CK-3** blocked thing · high · blocked: missing token · 1h blocked')
})

test('long titles shorten to 120 characters with an ellipsis and identifiers stay intact', () => {
  const title = 'x'.repeat(200)
  const line = renderTaskLine(task({ identifier: 'CK-1234', title }), now)
  assert.match(line, /^- \*\*CK-1234\*\* /)
  assert.ok(line.includes(`${'x'.repeat(119)}…`))
  assert.ok(!line.includes('x'.repeat(120)))
  assert.equal(line.length, '- **CK-1234** '.length + 120)
})

test('long question prompts shorten to 160 characters with an ellipsis', () => {
  const prompt = 'p'.repeat(300)
  const line = renderTaskLine(
    task({ identifier: 'CK-7', pendingQuestion: question({ prompt }) }),
    now,
  )
  assert.ok(line.includes(`${'p'.repeat(159)}…`))
  assert.ok(!line.includes('p'.repeat(160)))
})

test('line text collapses newlines and extra whitespace', () => {
  const line = renderTaskLine(
    task({ identifier: 'CK-8', title: 'first line\nsecond   line' }),
    now,
  )
  assert.equal(line, '- **CK-8** first line second line')
})

// --- task detail -----------------------------------------------------------

function detailTask(extra = {}) {
  return task({
    identifier: 'CK-4',
    title: 'Detail task',
    description: 'Ship it carefully.',
    status: 'in_progress',
    priority: 'high',
    labels: ['backend', 'mcp'],
    assignee: { type: 'user', name: 'silas' },
    version: 7,
    blockedReason: 'missing token',
    blockedSince: '2026-10-22T11:00:00.000Z',
    pendingQuestion: question({ selected: 'opt_2' }),
    links: [{ id: 'lnk_1', label: 'Design doc', url: 'https://example.com/design' }],
    ...extra,
  })
}

test('task detail includes status, column, priority, labels, version, assignee and timestamps', () => {
  const detail = renderTaskDetail(detailTask(), { now })
  assert.match(detail, /^# CK-4 · Detail task$/m)
  assert.match(detail, /^- Status: `in_progress` \(needs\)$/m)
  assert.match(detail, /^- Priority: high$/m)
  assert.match(detail, /^- Labels: backend, mcp$/m)
  assert.match(detail, /^- Version: 7$/m)
  assert.match(detail, /^- Assignee: user\/silas$/m)
  assert.match(detail, /^- Created: 2026-10-22T11:00:00\.000Z · Updated: 2026-10-22T11:00:00\.000Z$/m)
})

test('task detail shows the attention age for a question', () => {
  const detail = renderTaskDetail(detailTask(), { now })
  assert.match(detail, /^- Attention: question \(12m\)$/m)
})

test('task detail includes the description and question options with the selection', () => {
  const detail = renderTaskDetail(detailTask(), { now })
  assert.match(detail, /Ship it carefully\./)
  assert.match(detail, /## Question/)
  assert.match(detail, /Which deploy target\?/)
  assert.match(detail, /^- \[ \] opt_1 Staging$/m)
  assert.match(detail, /^- \[x\] opt_2 Production — slow$/m)
})

test('task detail includes a resolved question', () => {
  const detail = renderTaskDetail(
    detailTask({
      blockedReason: null,
      blockedSince: null,
      questionResolution: {
        decision: 'approve',
        optionId: 'opt_2',
        optionLabel: 'Production',
        note: 'ship it',
        at: '2026-10-22T11:55:00.000Z',
      },
    }),
    { now },
  )
  assert.match(detail, /Resolution: approve/)
  assert.match(detail, /Production/)
  assert.match(detail, /ship it/)
})

test('task detail includes links', () => {
  const detail = renderTaskDetail(detailTask(), { now })
  assert.match(detail, /## Links/)
  assert.match(detail, /- \[Design doc\]\(https:\/\/example\.com\/design\)/)
})

test('task detail includes only the last comments', () => {
  const comments = Array.from({ length: 7 }, (_, index) => ({
    id: `cmt_${index}`,
    body: `comment ${index}`,
    author: { type: 'agent', name: 'codex' },
    createdAt: '2026-10-22T11:00:00.000Z',
  }))
  const detail = renderTaskDetail(detailTask({ comments }), { now })
  assert.match(detail, /## Comments/)
  assert.match(detail, /comment 6/)
  assert.match(detail, /comment 2/)
  assert.doesNotMatch(detail, /comment 1/)
  assert.doesNotMatch(detail, /comment 0/)
})

test('task detail includes only the last 12 activity entries', () => {
  const activity = Array.from({ length: 15 }, (_, index) => ({
    at: '2026-10-22T11:00:00.000Z',
    actor: { type: 'agent', name: 'codex' },
    kind: 'updated',
    summary: `activity ${index}`,
    changes: [],
  }))
  const detail = renderTaskDetail(detailTask({ activity, pendingQuestion: null, blockedReason: null }), { now })
  assert.match(detail, /## Activity/)
  assert.match(detail, /activity 14/)
  assert.match(detail, /activity 3/)
  assert.doesNotMatch(detail, /activity 2/)
  assert.doesNotMatch(detail, /activity 0/)
})

test('task detail hides the attention line for a quiet task', () => {
  const detail = renderTaskDetail(task({ identifier: 'CK-9' }), { now })
  assert.doesNotMatch(detail, /Attention:/)
})

// --- view ------------------------------------------------------------------

test('buildView counts attention separately from running', () => {
  const view = buildView(
    board([
      task({ identifier: 'CK-1', status: 'in_progress' }),
      task({ identifier: 'CK-2', blockedReason: 'x', blockedSince: '2026-10-22T11:00:00.000Z' }),
      task({ identifier: 'CK-3', status: 'done' }),
    ]),
  )
  assert.equal(view.summary.counts.needs, 1)
  assert.equal(view.summary.counts.running, 1)
  assert.equal(view.summary.counts.backlog, 0)
  assert.equal(view.summary.counts.done, 1)
  assert.equal(view.summary.total, 3)
  assert.equal(view.summary.needsYou, 1)
  assert.deepEqual(view.columns.needs.map((entry) => entry.identifier), ['CK-2'])
  assert.deepEqual(view.columns.running.map((entry) => entry.identifier), ['CK-1'])
})

test('buildView sorts each column with sortTasks', () => {
  const view = buildView(
    board([
      task({ identifier: 'CK-1', priority: 'none', sortOrder: 1 }),
      task({ identifier: 'CK-2', priority: 'urgent', sortOrder: 2 }),
      task({ identifier: 'CK-3', priority: 'high', sortOrder: 3 }),
    ]),
  )
  assert.deepEqual(view.columns.backlog.map((entry) => entry.identifier), ['CK-1', 'CK-2', 'CK-3'])
})

test('summarizeView renders the exact summary line', () => {
  const view = buildView(
    board([
      task({ identifier: 'CK-1', status: 'in_progress' }),
      task({ identifier: 'CK-2', blockedReason: 'x', blockedSince: '2026-10-22T11:00:00.000Z' }),
    ]),
  )
  assert.equal(summarizeView(view), '2 tasks · 1 needs you · 1 running')
})

test('canceled tasks with an open question stay hidden', () => {
  const pinned = board([
    task({
      identifier: 'DM-9',
      title: 'canceled question',
      status: 'canceled',
      pendingQuestion: {
        prompt: 'Never mind?',
        note: '',
        options: [{ id: 'opt_1', label: 'A', detail: '' }],
        selected: null,
        createdAt: '2026-10-22T11:00:00.000Z',
      },
    }),
  ])
  const markdown = renderMarkdown(pinned, { now })
  assert.doesNotMatch(markdown, /DM-9/)
  assert.doesNotMatch(markdown, /Never mind/)
  assert.match(markdown, /1 task/)
  assert.match(markdown, /0 needs you/)
})

test('archived tasks stay out of buildView and markdown unless included', () => {
  const value = board([
    task({ identifier: 'CK-1', title: 'active' }),
    task({ identifier: 'CK-2', title: 'archived work', archivedAt: '2026-10-22T11:30:00.000Z' }),
  ])
  const view = buildView(value)
  assert.deepEqual(view.columns.backlog.map((entry) => entry.identifier), ['CK-1'])
  assert.equal(view.summary.total, 1)
  const markdown = renderMarkdown(value, { now })
  assert.doesNotMatch(markdown, /archived work/)

  const included = buildView(value, { includeArchived: true })
  assert.deepEqual(included.columns.backlog.map((entry) => entry.identifier), ['CK-1', 'CK-2'])
  assert.equal(included.summary.total, 2)
})
