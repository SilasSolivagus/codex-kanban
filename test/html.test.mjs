import test from 'node:test'
import assert from 'node:assert/strict'
import { boardPayload, renderHtml } from '../plugin/src/html.mjs'

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
      { id: 'opt_2', label: 'Production', detail: 'Needs approval' },
    ],
    selected: null,
    createdAt: '2026-10-22T11:48:00.000Z',
    ...extra,
  }
}

function dataBlock(html) {
  const match = html.match(/<script type="application\/json" id="board-data">([\s\S]*?)<\/script>/)
  assert.ok(match, 'the document embeds a board-data json script')
  return match[1]
}

// --- document shell --------------------------------------------------------

test('the document is a complete page with doctype, head metadata and four columns', () => {
  const html = renderHtml(board([task({ identifier: 'CK-1' })]), { now })

  assert.ok(html.startsWith('<!doctype html>'), 'the document starts with the doctype')
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<meta charset="utf-8"\s*\/?>/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"\s*\/?>/)
  assert.match(html, /<title>Codex Kanban · demo-board<\/title>/)

  for (const id of ['backlog', 'running', 'needs', 'done']) {
    assert.match(html, new RegExp(`data-column="${id}"`), `the ${id} column is marked up`)
  }
})

test('the document keeps the product column order Backlog, Running, Needs you, Done', () => {
  const html = renderHtml(board([task()]), { now })
  const order = [...html.matchAll(/<section class="column" data-column="([^"]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(order, ['backlog', 'running', 'needs', 'done'])
})

// --- zero network ----------------------------------------------------------

test('no http or https substring appears anywhere, including task data and links', () => {
  const html = renderHtml(
    board([
      task({
        identifier: 'CK-1',
        title: 'Read https://example.com/docs',
        description: 'Mirror: http://mirror.example/x',
      }),
      task({
        identifier: 'CK-2',
        links: [{ id: 'lnk_1', label: 'Spec', url: 'https://example.com/spec' }],
      }),
      task({
        identifier: 'CK-3',
        version: 'https://example.com/version',
        pendingQuestion: question({
          prompt: 'Which mirror: https://example.com?',
          selected: 'https://example.com/selected',
        }),
      }),
    ]),
    { now },
  )

  assert.doesNotMatch(html, /https?:\/\//)
  assert.doesNotMatch(html, /\bfetch\s*\(/)
  assert.doesNotMatch(html, /\bXMLHttpRequest\b/)
  assert.doesNotMatch(html, /\blocalStorage\b/)
  assert.match(html, /example\.com\/spec/, 'link urls survive without their scheme')
})

// --- identifiers and payload ----------------------------------------------

test('every task identifier appears in the document', () => {
  const html = renderHtml(
    board([
      task({ identifier: 'CK-1' }),
      task({ identifier: 'CK-2', status: 'in_progress' }),
      task({ identifier: 'CK-3', status: 'done' }),
    ]),
    { now },
  )
  for (const identifier of ['CK-1', 'CK-2', 'CK-3']) {
    assert.ok(html.includes(identifier), `${identifier} is present`)
  }
})

test('the embedded payload parses into four ordered columns', () => {
  const html = renderHtml(
    board([
      task({ identifier: 'CK-1', title: 'backlog work' }),
      task({ identifier: 'CK-2', title: 'running work', status: 'in_progress' }),
      task({ identifier: 'CK-3', title: 'blocked work', blockedReason: 'missing token', blockedSince: '2026-10-22T11:00:00.000Z' }),
      task({ identifier: 'CK-4', title: 'finished work', status: 'done' }),
    ]),
    { now },
  )
  const payload = JSON.parse(dataBlock(html))

  assert.equal(payload.project.name, 'demo-board')
  assert.equal(payload.generatedAt, '2026-10-22T12:00:00.000Z')
  assert.deepEqual(payload.columns.map((column) => column.id), ['backlog', 'running', 'needs', 'done'])
  assert.deepEqual(payload.columns.map((column) => column.label), ['Backlog', 'Running', 'Needs you', 'Done'])
  assert.deepEqual(
    payload.columns.map((column) => column.tasks.map((entry) => entry.identifier)),
    [['CK-1'], ['CK-2'], ['CK-3'], ['CK-4']],
  )
  assert.deepEqual(payload.columns[1].tasks[0].status, 'in_progress')
})

test('boardPayload is deterministic with an injected clock and sorts with sortTasks', () => {
  const value = board([
    task({ identifier: 'CK-1', priority: 'none', sortOrder: 1 }),
    task({ identifier: 'CK-2', priority: 'urgent', sortOrder: 2 }),
    task({ identifier: 'CK-3', priority: 'high', sortOrder: 3 }),
  ])
  const payload = boardPayload(value, { now })

  assert.equal(payload.generatedAt, '2026-10-22T12:00:00.000Z')
  assert.deepEqual(payload.columns.map((column) => column.id), ['backlog', 'running', 'needs', 'done'])
  assert.deepEqual(payload.columns[0].tasks.map((entry) => entry.identifier), ['CK-1', 'CK-2', 'CK-3'])
})

test('attention tasks land in Needs you with their reason', () => {
  const payload = boardPayload(
    board([
      task({ identifier: 'CK-1', pendingQuestion: question() }),
      task({ identifier: 'CK-2', blockedReason: 'missing token', blockedSince: '2026-10-22T11:00:00.000Z' }),
      task({ identifier: 'CK-3', status: 'in_review' }),
    ]),
    { now },
  )

  assert.deepEqual(payload.columns[2].tasks.map((entry) => entry.identifier), ['CK-1', 'CK-2', 'CK-3'])
  assert.deepEqual(payload.columns[2].tasks.map((entry) => entry.attention), ['question', 'blocked', 'review'])
  assert.equal(payload.columns[2].tasks[0].question.prompt, 'Which deploy target?')
  assert.equal(payload.columns[2].tasks[1].blockedAge, '1h')
})

test('canceled tasks stay hidden from columns but their identifier is still in the document', () => {
  const html = renderHtml(
    board([
      task({ identifier: 'CK-1' }),
      task({ identifier: 'CK-2', status: 'canceled' }),
    ]),
    { now },
  )
  const payload = JSON.parse(dataBlock(html))

  assert.deepEqual(payload.columns.map((column) => column.tasks.length), [1, 0, 0, 0])
  assert.deepEqual(payload.canceled.map((entry) => entry.identifier), ['CK-2'])
  assert.ok(html.includes('CK-2'))
})

// --- escaping --------------------------------------------------------------

test('a title containing a closing script tag cannot break out of the data block', () => {
  const evil = '</script><img src=x onerror=alert(1)>'
  const html = renderHtml(board([task({ identifier: 'CK-1', title: evil })]), { now })
  const block = dataBlock(html)

  assert.ok(block.includes('\\u003c/script\\u003e'), 'the closing tag is escaped')
  assert.doesNotMatch(block, /<\/script><img/)
  assert.doesNotMatch(html, /<img/i)
  assert.equal(JSON.parse(block).columns[0].tasks[0].title, evil)
})

test('user text is html-escaped in the static header', () => {
  const html = renderHtml(
    board([task()], { project: { name: '<b>demo & co</b>', prefix: 'CK' } }),
    { now },
  )
  assert.match(html, /<title>Codex Kanban · &lt;b&gt;demo &amp; co&lt;\/b&gt;<\/title>/)
  assert.doesNotMatch(html, /<b>demo/)
})

// --- host actions ----------------------------------------------------------

test('sendFollowUpMessage is guarded and falls back to a neutral toast', () => {
  const html = renderHtml(board([task()]), { now })

  assert.match(html, /typeof window\.openai\?\.sendFollowUpMessage === 'function'/)
  assert.match(html, /window\.openai\.sendFollowUpMessage\(\{ prompt: prompt, title: title \}\)/)
  assert.match(html, /Open this board inside Codex to send actions/)
})

// --- accessibility, theming, responsiveness -------------------------------

test('cards are keyboard accessible and the drawer closes with Escape', () => {
  const html = renderHtml(board([task()]), { now })

  assert.match(html, /setAttribute\('role', 'button'\)/)
  assert.match(html, /setAttribute\('tabindex', '0'\)/)
  assert.match(html, /event\.key === 'Enter'/)
  assert.match(html, /event\.key === ' /)
  assert.match(html, /event\.key === 'Escape'/)
  assert.match(html, /aria-modal="true"/)
})

test('the document follows the system color scheme and the system font stack', () => {
  const html = renderHtml(board([task()]), { now })

  assert.match(html, /color-scheme: light dark/)
  assert.match(html, /light-dark\(/)
  assert.match(html, /font-family:[^;]*system-ui/)
  assert.match(html, /:focus-visible/)
  assert.match(html, /@media \(max-width: 900px\)/)
  assert.match(html, /@media \(max-width: 560px\)/)
})

// --- size ------------------------------------------------------------------

test('a 50-task board stays under 60KB', () => {
  const tasks = Array.from({ length: 50 }, (_, index) => task({
    identifier: `CK-${index + 1}`,
    title: `Task ${index + 1} with a representative title`,
    description: `A short description for task ${index + 1}.`,
    status: index % 5 === 0 ? 'in_progress' : 'backlog',
    priority: index % 3 === 0 ? 'high' : 'medium',
    labels: [`phase-${index % 4}`, 'ui'],
    sortOrder: index,
  }))
  const html = renderHtml(board(tasks), { now })

  assert.ok(html.length < 60 * 1024, `document is ${html.length} bytes`)
})

test('canceled tasks stay out of every column', () => {
  const payload = boardPayload(
    board([
      task({
        identifier: 'CK-9',
        status: 'canceled',
        pendingQuestion: {
          prompt: 'Gone?',
          note: '',
          options: [{ id: 'opt_1', label: 'A', detail: '' }],
          selected: null,
          createdAt: '2026-10-22T11:00:00.000Z',
        },
      }),
    ]),
    { now },
  )
  assert.equal(payload.columns.flatMap((column) => column.tasks).length, 0)
  assert.deepEqual(payload.canceled.map((card) => card.identifier), ['CK-9'])
})

test('a resolved question is not shown as open', () => {
  const resolved = board([
    task({
      identifier: 'CK-8',
      status: 'in_review',
      pendingQuestion: {
        prompt: 'Ship?',
        note: '',
        options: [{ id: 'opt_1', label: 'Yes', detail: '' }],
        selected: 'opt_1',
        createdAt: '2026-10-22T11:00:00.000Z',
      },
      questionResolution: { decision: 'approve', optionId: 'opt_1', optionLabel: 'Yes', note: '', at: '2026-10-22T11:30:00.000Z' },
    }),
  ])
  const payload = boardPayload(resolved, { now })
  const card = payload.columns.find((column) => column.id === 'needs').tasks[0]
  assert.equal(card.question, null)
  const html = renderHtml(resolved, { now })
  assert.equal(html.includes('Ship?'), false)
  // The action label stays in the script, but the render condition must exclude attention tasks.
  assert.match(html, /task\.status !== 'done' && !task\.attention/)
})
