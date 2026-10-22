import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../plugin/src/store.mjs'
import {
  KanbanError,
  addComment,
  answerTask,
  approveTask,
  askTask,
  blockTask,
  boardView,
  createTask,
  decorateTask,
  findTask,
  getTaskView,
  moveTask,
  rejectTask,
  summarizeBoard,
  unblockTask,
  updateTask,
} from '../plugin/src/domain.mjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-domain-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  // A project directory named "ck" gives the fixture a stable "CK" prefix.
  const project = path.join(root, 'ck')
  fs.mkdirSync(project)
  return { root, project, store: createStore({ root: project }) }
}

async function newTask(store, extra = {}) {
  const result = await createTask(store, { title: 'Ship the board', ...extra })
  assert.equal(result.ok, true)
  return result.task
}

async function rejectsCode(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof KanbanError, `expected a KanbanError, got ${error}`)
    assert.equal(error.name, 'KanbanError')
    assert.equal(error.code, code)
    return true
  })
}

test('creating a task assigns CK-1, a version and a created activity entry', async (t) => {
  const { store } = fixture(t)
  const { ok, task } = await createTask(store, { title: '  Ship the board  ' })

  assert.equal(ok, true)
  assert.equal(task.identifier, 'CK-1')
  assert.equal(task.version, 1)
  assert.equal(task.status, 'backlog')
  assert.equal(task.priority, 'none')
  assert.equal(task.title, 'Ship the board')
  assert.equal(task.description, '')
  assert.deepEqual(task.labels, [])
  assert.deepEqual(task.assignee, { type: 'agent', name: 'codex' })
  assert.equal(task.sortOrder, 1024)
  assert.equal(task.statusSince, task.createdAt)
  assert.equal(task.pendingQuestion, null)
  assert.equal(task.questionResolution, null)
  assert.equal(task.activity.length, 1)
  assert.deepEqual(Object.keys(task.activity[0]).sort(), ['actor', 'at', 'changes', 'kind', 'summary'])
  assert.equal(task.activity[0].kind, 'created')
  assert.equal(store.read().nextTaskNumber, 2)
})
test('identifiers keep counting up and a created task can start in another status', async (t) => {
  const { store } = fixture(t)
  await newTask(store)
  const second = await newTask(store, { title: 'Second', status: 'in_progress', priority: 'high' })
  assert.equal(second.identifier, 'CK-2')
  assert.equal(second.status, 'in_progress')
  assert.equal(second.sortOrder, 2048)
  assert.equal(store.read().nextTaskNumber, 3)
})

test('every write requires the current version', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  await rejectsCode(updateTask(store, { id: task.identifier, title: 'renamed' }), 'VERSION_REQUIRED')
  await rejectsCode(
    updateTask(store, { id: task.identifier, title: 'renamed', version: 99 }),
    'TASK_VERSION_CONFLICT',
  )

  const updated = await updateTask(store, { id: task.identifier, title: 'renamed', version: 1 })
  assert.equal(updated.ok, true)
  assert.equal(updated.task.title, 'renamed')
  assert.equal(updated.task.version, 2)
  assert.ok(updated.task.updatedAt >= task.updatedAt)
})

test('a stale write loses under concurrency', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)

  const results = await Promise.allSettled([
    updateTask(store, { id: task.identifier, title: 'first', version: 1 }),
    updateTask(store, { id: task.identifier, title: 'second', version: 1 }),
  ])
  const fulfilled = results.filter((result) => result.status === 'fulfilled')
  const rejected = results.filter((result) => result.status === 'rejected')
  assert.equal(fulfilled.length, 1)
  assert.equal(rejected.length, 1)
  assert.equal(rejected[0].reason.code, 'TASK_VERSION_CONFLICT')
  assert.equal(store.read().tasks[0].version, 2)
})

test('unknown tasks raise TASK_NOT_FOUND', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  await rejectsCode(updateTask(store, { id: 'CK-404', version: 1, title: 'x' }), 'TASK_NOT_FOUND')
  await rejectsCode(moveTask(store, { id: 'nope', version: 1, to: 'running' }), 'TASK_NOT_FOUND')
  await rejectsCode(addComment(store, { id: 'nope', version: 1, body: 'x' }), 'TASK_NOT_FOUND')
})

test('getTaskView decorates a task without writing to the store', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const before = fs.readFileSync(store.path, 'utf8')
  const stat = fs.statSync(store.path)

  const view = getTaskView(store, { id: task.identifier })
  assert.equal(view.ok, true)
  assert.equal(view.task.identifier, 'CK-1')
  assert.equal(view.task.column, 'backlog')
  assert.equal(view.task.attention, null)
  assert.equal(view.task.attentionSince, null)
  assert.equal(fs.readFileSync(store.path, 'utf8'), before)
  assert.equal(fs.statSync(store.path).mtimeMs, stat.mtimeMs)
  assert.equal(fs.existsSync(path.join(store.dir, 'board.lock')), false)

  const byId = getTaskView(store, { id: task.id })
  assert.equal(byId.task.identifier, 'CK-1')
  assert.throws(() => getTaskView(store, { id: 'CK-999' }), (error) => error.code === 'TASK_NOT_FOUND')
})

test('input validation rejects bad tasks before touching the board', async (t) => {
  const { store } = fixture(t)
  await rejectsCode(createTask(store, { title: '   ' }), 'INVALID_INPUT')
  await rejectsCode(createTask(store, { title: 'x', priority: 'urgentish' }), 'INVALID_INPUT')
  await rejectsCode(createTask(store, { title: 'x', status: 'needs' }), 'INVALID_INPUT')
  await rejectsCode(createTask(store, { title: 'x', links: [{ label: 'bad', url: 'ftp://x' }] }), 'INVALID_INPUT')
  await rejectsCode(createTask(store, { title: 'x', labels: ['ok', 7] }), 'INVALID_INPUT')
  await rejectsCode(
    createTask(store, { title: 'x', links: [{ label: 'missing url' }] }),
    'INVALID_INPUT',
  )
  assert.equal(store.read().tasks.length, 0)
  assert.equal(fs.existsSync(store.path), false)
})

test('links are normalised and duplicate labels are removed', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, {
    labels: ['mcp', 'mcp', ' ui '],
    links: [{ label: 'Spec', url: 'https://example.com/spec' }],
  })
  assert.deepEqual(task.labels, ['mcp', 'ui'])
  assert.equal(task.links.length, 1)
  assert.match(task.links[0].id, /^lnk_/)
  assert.equal(task.links[0].url, 'https://example.com/spec')
})

test('update records field changes in one activity entry and skips no-op writes', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const result = await updateTask(store, {
    id: task.identifier,
    version: 1,
    priority: 'urgent',
    description: 'details',
  })
  const last = result.task.activity.at(-1)
  assert.equal(last.kind, 'updated')
  assert.deepEqual(last.changes.map((change) => change.field), ['description', 'priority'])
  assert.equal(result.task.activity.length, 2)
  assert.equal(result.task.version, 2)

  const noop = await updateTask(store, {
    id: task.identifier,
    version: 2,
    title: task.title,
    priority: 'urgent',
    description: 'details',
  })
  assert.equal(noop.ok, true)
  assert.equal(noop.unchanged, true)
  assert.equal(noop.task.version, 2)
  assert.equal(noop.task.activity.length, 2)
})

test('valid links replace old ones and identical links leave the task unchanged', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { links: [{ label: 'Spec', url: 'https://example.com/a' }] })
  const updated = await updateTask(store, {
    id: task.identifier,
    version: 1,
    links: [{ label: 'Docs', url: 'https://example.com/b' }],
  })
  assert.equal(updated.task.links[0].label, 'Docs')
  const noop = await updateTask(store, {
    id: task.identifier,
    version: updated.task.version,
    links: [{ label: 'Docs', url: 'https://example.com/b' }],
  })
  assert.equal(noop.unchanged, true)
  assert.equal(noop.task.version, 2)
})

test('needs you is not a move target and unknown targets are invalid', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  await rejectsCode(moveTask(store, { id: task.identifier, version: 1, to: 'needs' }), 'CANNOT_MOVE_TO_NEEDS')
  await rejectsCode(moveTask(store, { id: task.identifier, version: 1, to: 'nowhere' }), 'INVALID_INPUT')
  await rejectsCode(moveTask(store, { id: task.identifier, version: 1 }), 'INVALID_INPUT')
})

test('moving between stored statuses updates statusSince and activity', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const moved = await moveTask(store, { id: task.identifier, version: 1, to: 'running' })
  assert.equal(moved.task.status, 'in_progress')
  assert.notEqual(moved.task.statusSince, task.statusSince)
  assert.equal(moved.task.activity.at(-1).kind, 'moved')
  assert.deepEqual(moved.task.activity.at(-1).changes, [
    { field: 'status', before: 'backlog', after: 'in_progress' },
  ])
  assert.equal(getTaskView(store, { id: task.identifier }).task.column, 'running')

  const noop = await moveTask(store, { id: task.identifier, version: 2, to: 'running' })
  assert.equal(noop.unchanged, true)
  assert.equal(noop.task.version, 2)
})

test('in_review may move back to running', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_review' })
  const running = await moveTask(store, { id: task.identifier, version: 1, to: 'running' })
  assert.equal(running.task.status, 'in_progress')
  const review = await moveTask(store, { id: task.identifier, version: 2, to: 'in_review' })
  assert.equal(review.task.status, 'in_review')
})

test('an agent cannot close a task that is in review', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_review' })
  const before = fs.readFileSync(store.path, 'utf8')

  await assert.rejects(
    moveTask(store, { id: task.identifier, version: 1, to: 'done', as: 'agent' }),
    (error) => {
      assert.equal(error.code, 'HUMAN_DECISION_REQUIRED')
      assert.match(error.message, /ask the human to approve/i)
      return true
    },
  )
  // The rejected move left no trace: no version bump, no activity, no rewrite.
  assert.equal(fs.readFileSync(store.path, 'utf8'), before)
  assert.equal(store.read().tasks[0].version, 1)
  assert.equal(store.read().tasks[0].status, 'in_review')
})

test('a human may close a task that is in review', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_review' })
  const done = await moveTask(store, {
    id: task.identifier,
    version: 1,
    to: 'done',
    as: 'user',
  })
  assert.equal(done.task.status, 'done')
  assert.equal(done.task.activity.at(-1).kind, 'moved')
  assert.deepEqual(done.task.activity.at(-1).actor, { type: 'user', name: 'you' })
})

test('an agent may close its own in_progress work', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_progress' })
  const done = await moveTask(store, { id: task.identifier, version: 1, to: 'done' })
  assert.equal(done.task.status, 'done')
})

test('moves respect blockers and open questions', async (t) => {
  const { store } = fixture(t)
  const blocked = await newTask(store)
  const blockedTask = await blockTask(store, { id: blocked.identifier, version: 1, reason: 'missing key' })
  await rejectsCode(
    moveTask(store, { id: blocked.identifier, version: blockedTask.task.version, to: 'running' }),
    'CANNOT_MOVE',
  )
  await rejectsCode(
    moveTask(store, { id: blocked.identifier, version: blockedTask.task.version, to: 'done' }),
    'BLOCKER_ACTIVE',
  )
  // Falling back to Backlog is always allowed; the blocker still demands attention.
  const fallback = await moveTask(store, {
    id: blocked.identifier,
    version: blockedTask.task.version,
    to: 'backlog',
  })
  assert.equal(fallback.task.status, 'backlog')
  assert.equal(getTaskView(store, { id: blocked.identifier }).task.column, 'needs')

  const asked = await newTask(store, { title: 'question task' })
  const askedResult = await askTask(store, {
    id: asked.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'A' }, { label: 'B' }],
  })
  await rejectsCode(
    moveTask(store, { id: asked.identifier, version: askedResult.task.version, to: 'done' }),
    'QUESTION_OPEN',
  )
})

test('canceled is hidden from the board but reachable', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const canceled = await moveTask(store, { id: task.identifier, version: 1, to: 'canceled' })
  assert.equal(canceled.task.status, 'canceled')
  assert.equal(getTaskView(store, { id: task.identifier }).task.column, null)
  assert.equal(summarizeBoard(store.read()).counts.canceled, 1)
})

test('ask requires 2-5 options and only one question may be open', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  await rejectsCode(
    askTask(store, { id: task.identifier, version: 1, prompt: 'Pick', options: [{ label: 'only' }] }),
    'INVALID_INPUT',
  )
  await rejectsCode(
    askTask(store, {
      id: task.identifier,
      version: 1,
      prompt: 'Pick',
      options: Array.from({ length: 6 }, (_, index) => ({ label: `option ${index}` })),
    }),
    'INVALID_INPUT',
  )

  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which deploy target?',
    note: 'context',
    options: [{ label: 'Staging' }, { label: 'Production', detail: 'needs approval' }],
  })
  assert.equal(asked.task.pendingQuestion.prompt, 'Which deploy target?')
  assert.equal(asked.task.pendingQuestion.note, 'context')
  assert.deepEqual(asked.task.pendingQuestion.options, [
    { id: 'opt_1', label: 'Staging', detail: '' },
    { id: 'opt_2', label: 'Production', detail: 'needs approval' },
  ])
  assert.equal(asked.task.pendingQuestion.selected, null)
  assert.equal(asked.task.pendingQuestion.answerNote, '')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, 'question')

  await rejectsCode(
    askTask(store, {
      id: task.identifier,
      version: asked.task.version,
      prompt: 'Another?',
      options: [{ label: 'A' }, { label: 'B' }],
    }),
    'QUESTION_OPEN',
  )
})

test('answering records a choice without closing the question', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  await rejectsCode(
    answerTask(store, { id: task.identifier, version: 1, option: 'opt_1' }),
    'NO_QUESTION',
  )
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'Staging' }, { label: 'Production' }],
  })
  await rejectsCode(
    answerTask(store, { id: task.identifier, version: asked.task.version, option: 'opt_9' }),
    'INVALID_INPUT',
  )
  const answered = await answerTask(store, {
    id: task.identifier,
    version: asked.task.version,
    option: 'opt_2',
    note: 'ship it',
  })
  assert.equal(answered.task.pendingQuestion.selected, 'opt_2')
  assert.equal(answered.task.pendingQuestion.answerNote, 'ship it')
  assert.equal(answered.task.questionResolution, null)
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, 'question')
  assert.equal(answered.task.activity.at(-1).kind, 'answered')
})

test('answers accept an option label too', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'Staging' }, { label: 'Production' }],
  })
  const answered = await answerTask(store, {
    id: task.identifier,
    version: asked.task.version,
    option: 'Production',
  })
  assert.equal(answered.task.pendingQuestion.selected, 'opt_2')
})

test('approve is a human decision that needs a selected option', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which deploy target?',
    options: [{ label: 'Staging' }, { label: 'Production', detail: 'needs approval' }],
  })

  await rejectsCode(
    approveTask(store, { id: task.identifier, version: asked.task.version, as: 'agent' }),
    'HUMAN_DECISION_REQUIRED',
  )
  await rejectsCode(
    approveTask(store, { id: task.identifier, version: asked.task.version, as: 'user' }),
    'ANSWER_REQUIRED',
  )

  const answered = await answerTask(store, {
    id: task.identifier,
    version: asked.task.version,
    option: 'opt_2',
    note: 'ship it',
  })
  const approved = await approveTask(store, {
    id: task.identifier,
    version: answered.task.version,
    as: 'user',
    note: 'go ahead',
  })
  assert.equal(approved.task.status, 'done')
  assert.equal(approved.task.questionResolution.decision, 'approve')
  assert.equal(approved.task.questionResolution.optionId, 'opt_2')
  assert.equal(approved.task.questionResolution.optionLabel, 'Production')
  assert.equal(approved.task.questionResolution.note, 'go ahead')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
  assert.equal(approved.task.activity.at(-1).kind, 'approved')

  await rejectsCode(
    answerTask(store, { id: task.identifier, version: approved.task.version, option: 'opt_1' }),
    'QUESTION_CLOSED',
  )
})

test('approve refuses an active blocker and works without a question', async (t) => {
  const { store } = fixture(t)
  const blocked = await newTask(store)
  const blockedResult = await blockTask(store, {
    id: blocked.identifier,
    version: 1,
    reason: 'missing token',
  })
  await rejectsCode(
    approveTask(store, { id: blocked.identifier, version: blockedResult.task.version, as: 'user' }),
    'BLOCKER_ACTIVE',
  )

  const plain = await newTask(store, { title: 'plain' })
  const approved = await approveTask(store, { id: plain.identifier, version: 1, as: 'user' })
  assert.equal(approved.task.status, 'done')
  assert.equal(approved.task.questionResolution, null)
})

test('reject is human-only and clears the blocker back to backlog', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_review' })
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'unclear' })

  await rejectsCode(
    rejectTask(store, { id: task.identifier, version: blocked.task.version, as: 'agent' }),
    'HUMAN_DECISION_REQUIRED',
  )

  const rejected = await rejectTask(store, {
    id: task.identifier,
    version: blocked.task.version,
    as: 'user',
    note: 'not now',
  })
  assert.equal(rejected.task.status, 'backlog')
  assert.equal(rejected.task.blockedReason, null)
  assert.equal(rejected.task.blockedSince, null)
  assert.equal(rejected.task.questionResolution.decision, 'reject')
  assert.equal(rejected.task.questionResolution.note, 'not now')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
  assert.equal(rejected.task.activity.at(-1).kind, 'rejected')
})

test('block and unblock round-trip and skip no-op writes', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'need token' })
  assert.equal(blocked.task.blockedReason, 'need token')
  assert.equal(typeof blocked.task.blockedSince, 'string')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, 'blocked')

  const same = await blockTask(store, {
    id: task.identifier,
    version: blocked.task.version,
    reason: 'need token',
  })
  assert.equal(same.unchanged, true)
  assert.equal(same.task.version, 2)

  const cleared = await unblockTask(store, { id: task.identifier, version: 2 })
  assert.equal(cleared.task.blockedReason, null)
  assert.equal(cleared.task.blockedSince, null)
  assert.equal(cleared.task.activity.at(-1).kind, 'unblocked')

  const noop = await unblockTask(store, { id: task.identifier, version: cleared.task.version })
  assert.equal(noop.unchanged, true)
})

test('comments record their author and one activity entry', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const agentComment = await addComment(store, {
    id: task.identifier,
    version: 1,
    body: 'looks good',
  })
  assert.equal(agentComment.task.comments.length, 1)
  assert.deepEqual(agentComment.task.comments[0].author, { type: 'agent', name: 'codex' })
  assert.equal(agentComment.task.activity.at(-1).kind, 'commented')

  const userComment = await addComment(store, {
    id: task.identifier,
    version: 2,
    body: 'ship it',
    as: 'user',
  })
  assert.deepEqual(userComment.task.comments[1].author, { type: 'user', name: 'you' })

  const named = await addComment(store, {
    id: task.identifier,
    version: 3,
    body: 'noted',
    as: 'user',
    actor: '  silas  ',
  })
  assert.deepEqual(named.task.comments[2].author, { type: 'user', name: 'silas' })
  assert.equal(named.task.version, 4)
})

test('activity is capped at 200 entries', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const board = store.read()
  board.tasks[0].activity = Array.from({ length: 200 }, (_, index) => ({
    at: task.createdAt,
    actor: task.assignee,
    kind: 'seeded',
    summary: `seed ${index}`,
    changes: [],
  }))
  store.write(board)

  const commented = await addComment(store, { id: task.identifier, version: 1, body: 'last' })
  assert.equal(commented.task.activity.length, 200)
  assert.equal(commented.task.activity.at(-1).kind, 'commented')
  assert.equal(commented.task.activity[0].summary, 'seed 1')
})

test('findTask resolves ids and identifiers case-insensitively', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const board = store.read()
  assert.equal(findTask(board, task.id), board.tasks[0])
  assert.equal(findTask(board, 'ck-1'), board.tasks[0])
  assert.equal(findTask(board, 'CK-1'), board.tasks[0])
  assert.equal(findTask(board, 'CK-9'), undefined)
  assert.equal(findTask(board, ''), undefined)
})

test('decorateTask adds the computed column and attention without mutating the task', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'A' }, { label: 'B' }],
  })
  const decorated = decorateTask(asked.task)
  assert.equal(decorated.column, 'needs')
  assert.equal(decorated.attention, 'question')
  assert.equal(decorated.attentionSince, asked.task.pendingQuestion.createdAt)
  assert.equal(decorated.status, 'backlog')
  assert.equal(asked.task.column, undefined)
})

test('summarizeBoard counts every column and needs-you', async (t) => {
  const { store } = fixture(t)
  await newTask(store, { title: 'backlog' })
  await newTask(store, { title: 'running', status: 'in_progress' })
  const waiting = await newTask(store, { title: 'waiting' })
  await askTask(store, {
    id: waiting.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'A' }, { label: 'B' }],
  })
  const blocked = await newTask(store, { title: 'blocked', status: 'todo' })
  await blockTask(store, { id: blocked.identifier, version: 1, reason: 'stuck' })
  await newTask(store, { title: 'done', status: 'done' })
  await newTask(store, { title: 'canceled', status: 'canceled' })

  const summary = summarizeBoard(store.read())
  assert.deepEqual(summary.counts, { backlog: 1, running: 1, needs: 2, done: 1, canceled: 1 })
  assert.equal(summary.total, 6)
  assert.equal(summary.needsYou, 2)
  assert.equal(summary.project.prefix, 'CK')
})

test('boardView groups by column, sorts each group and puts needs first in the flat list', async (t) => {
  const { store } = fixture(t)
  const backlogLow = await newTask(store, { title: 'backlog low', priority: 'low' })
  const backlogUrgent = await newTask(store, { title: 'backlog urgent', priority: 'urgent' })
  const running = await newTask(store, { title: 'running', status: 'in_progress' })
  const waiting = await newTask(store, { title: 'waiting', status: 'in_review' })
  await newTask(store, { title: 'done', status: 'done' })
  await newTask(store, { title: 'canceled', status: 'canceled' })

  const view = boardView(store.read())
  assert.deepEqual(Object.keys(view.columns), ['backlog', 'running', 'needs', 'done'])
  assert.deepEqual(
    view.columns.backlog.map((task) => task.identifier),
    [backlogUrgent.identifier, backlogLow.identifier],
  )
  assert.equal(view.columns.running[0].identifier, running.identifier)
  assert.deepEqual(view.columns.needs.map((task) => task.identifier), [waiting.identifier])
  assert.equal(view.columns.done.length, 1)
  assert.equal(view.columns.needs[0].attention, 'review')

  assert.equal(view.tasks[0].identifier, waiting.identifier)
  assert.deepEqual(
    view.tasks.map((task) => task.identifier),
    [waiting.identifier, running.identifier, backlogUrgent.identifier, backlogLow.identifier, 'CK-5'],
  )

  assert.equal(view.summary.counts.needs, 1)
  assert.equal(view.summary.total, 6)
  assert.equal(view.project.prefix, 'CK')
})

test('boardView honours the column, includeDone and includeCanceled options', async (t) => {
  const { store } = fixture(t)
  await newTask(store, { title: 'backlog' })
  const running = await newTask(store, { title: 'running', status: 'in_progress' })
  await newTask(store, { title: 'done', status: 'done' })
  await newTask(store, { title: 'canceled', status: 'canceled' })

  const onlyRunning = boardView(store.read(), { column: 'running' })
  assert.deepEqual(onlyRunning.tasks.map((task) => task.identifier), [running.identifier])

  const withoutDone = boardView(store.read(), { includeDone: false })
  assert.equal(withoutDone.columns.done.length, 0)
  assert.ok(!withoutDone.tasks.some((task) => task.status === 'done'))

  const withCanceled = boardView(store.read(), { includeCanceled: true })
  assert.equal(withCanceled.columns.done.length, 2)
  assert.ok(withCanceled.tasks.some((task) => task.status === 'canceled'))
})
