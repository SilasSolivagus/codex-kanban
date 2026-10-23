import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../plugin/src/store.mjs'
import {
  KanbanError,
  addAttachment,
  addComment,
  answerTask,
  approveTask,
  archiveProject,
  archiveTask,
  askTask,
  blockTask,
  boardView,
  createProject,
  createTask,
  decorateTask,
  findTask,
  getTaskView,
  listProjects,
  moveTask,
  rejectTask,
  removeAttachment,
  reorderTask,
  restoreProject,
  restoreTask,
  summarizeBoard,
  unblockTask,
  updateProject,
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
  assert.deepEqual(
    Object.keys(task.activity[0]).sort(),
    ['actor', 'at', 'changes', 'data', 'kind', 'summary'],
  )
  assert.equal(task.activity[0].kind, 'created')
  assert.deepEqual(task.activity[0].data, { status: 'backlog' })
  assert.equal(store.read().projects[0].nextTaskNumber, 2)
})
test('identifiers keep counting up and a created task can start in another status', async (t) => {
  const { store } = fixture(t)
  await newTask(store)
  const second = await newTask(store, { title: 'Second', status: 'in_progress', priority: 'high' })
  assert.equal(second.identifier, 'CK-2')
  assert.equal(second.status, 'in_progress')
  assert.equal(second.sortOrder, 2048)
  assert.equal(store.read().projects[0].nextTaskNumber, 3)
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

test('an agent cannot move a task out of review', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store, { status: 'in_review' })
  const before = fs.readFileSync(store.path, 'utf8')

  for (const to of ['running', 'canceled', 'backlog', 'done']) {
    await assert.rejects(
      moveTask(store, { id: task.identifier, version: 1, to, as: 'agent' }),
      (error) => {
        assert.equal(error.code, 'HUMAN_DECISION_REQUIRED')
        assert.match(error.message, /ask the human to approve, reject, or move it/i)
        return true
      },
    )
  }
  // Every rejected move left no trace: no version bump, no activity, no rewrite.
  assert.equal(fs.readFileSync(store.path, 'utf8'), before)
  assert.equal(store.read().tasks[0].version, 1)
  assert.equal(store.read().tasks[0].status, 'in_review')
})

test('a human may move a task out of review to any target', async (t) => {
  const { store } = fixture(t)
  const targets = [
    ['backlog', 'backlog'],
    ['running', 'in_progress'],
    ['done', 'done'],
    ['canceled', 'canceled'],
  ]
  for (const [to, expected] of targets) {
    const task = await newTask(store, { title: `review to ${to}`, status: 'in_review' })
    const moved = await moveTask(store, { id: task.identifier, version: 1, to, as: 'user' })
    assert.equal(moved.task.status, expected)
    assert.equal(moved.task.activity.at(-1).kind, 'moved')
    assert.deepEqual(moved.task.activity.at(-1).actor, { type: 'user', name: 'you' })
  }
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

test('activity entries carry structured data for every kind', async (t) => {
  const { store } = fixture(t)
  let task = (await createTask(store, { title: 'structured activity' })).task
  const expectLast = (kind, data) => {
    const last = task.activity.at(-1)
    assert.equal(last.kind, kind)
    assert.deepEqual(last.data, data)
    assert.equal(typeof last.summary, 'string')
    assert.ok(last.summary.length > 0, `${kind} keeps a human summary`)
  }
  expectLast('created', { status: 'backlog' })

  task = (await updateTask(store, {
    id: task.id,
    version: task.version,
    priority: 'high',
  })).task
  expectLast('updated', { fields: ['priority'] })

  task = (await moveTask(store, { id: task.id, version: task.version, to: 'running' })).task
  expectLast('moved', { from: 'backlog', to: 'in_progress' })

  task = (await reorderTask(store, { id: task.id, version: task.version, position: 0 })).task
  expectLast('reordered', { column: 'running' })

  task = (await blockTask(store, {
    id: task.id,
    version: task.version,
    reason: 'need token',
  })).task
  expectLast('blocked', { reason: 'need token' })

  task = (await unblockTask(store, { id: task.id, version: task.version })).task
  expectLast('unblocked', {})

  task = (await askTask(store, {
    id: task.id,
    version: task.version,
    prompt: 'Which target?',
    options: [{ label: 'Staging' }, { label: 'Production' }],
  })).task
  expectLast('question', { prompt: 'Which target?' })

  task = (await answerTask(store, {
    id: task.id,
    version: task.version,
    option: 'opt_2',
  })).task
  expectLast('answered', { optionLabel: 'Production' })

  task = (await approveTask(store, {
    id: task.id,
    version: task.version,
    as: 'user',
    note: 'go ahead',
  })).task
  expectLast('approved', { optionLabel: 'Production' })

  task = (await addComment(store, {
    id: task.id,
    version: task.version,
    body: 'looks good',
  })).task
  expectLast('commented', { preview: 'looks good' })

  task = (await addAttachment(store, {
    id: task.id,
    version: task.version,
    filename: 'spec.txt',
    contentType: 'text/plain',
    data: Buffer.from('hello').toString('base64'),
  })).task
  expectLast('attached', { filename: 'spec.txt' })

  const attachment = task.attachments[0]
  task = (await removeAttachment(store, {
    id: task.id,
    version: task.version,
    attachmentId: attachment.id,
  })).task
  expectLast('detached', { filename: 'spec.txt' })

  task = (await archiveTask(store, { id: task.id, version: task.version })).task
  expectLast('archived', {})

  task = (await restoreTask(store, { id: task.id, version: task.version })).task
  expectLast('restored', {})

  const review = await newTask(store, { status: 'in_review', title: 'reject me' })
  const rejected = await rejectTask(store, {
    id: review.identifier,
    version: 1,
    as: 'user',
    note: 'not now',
  })
  const rejection = rejected.task.activity.at(-1)
  assert.equal(rejection.kind, 'rejected')
  assert.deepEqual(rejection.data, { note: 'not now' })
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
  assert.equal(summary.project, null)
  assert.equal(summary.projects[0].prefix, 'CK')
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
    [backlogLow.identifier, backlogUrgent.identifier],
  )
  assert.equal(view.columns.running[0].identifier, running.identifier)
  assert.deepEqual(view.columns.needs.map((task) => task.identifier), [waiting.identifier])
  assert.equal(view.columns.done.length, 1)
  assert.equal(view.columns.needs[0].attention, 'review')

  assert.equal(view.tasks[0].identifier, waiting.identifier)
  assert.deepEqual(
    view.tasks.map((task) => task.identifier),
    [waiting.identifier, running.identifier, backlogLow.identifier, backlogUrgent.identifier, 'CK-5'],
  )

  assert.equal(view.summary.counts.needs, 1)
  assert.equal(view.summary.total, 6)
  assert.equal(view.project, null)
  assert.equal(view.projects[0].prefix, 'CK')
  assert.equal(view.tasks[0].projectName, view.projects[0].name)
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

test('canceling a task with an open question hides it from Needs you', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'Staging' }, { label: 'Production' }],
  })
  const canceled = await moveTask(store, {
    id: task.identifier,
    version: asked.task.version,
    to: 'canceled',
  })
  assert.equal(canceled.task.status, 'canceled')

  const board = store.read()
  const summary = summarizeBoard(board)
  assert.equal(summary.counts.needs, 0)
  assert.equal(summary.counts.canceled, 1)
  const view = boardView(board)
  assert.equal(Object.values(view.columns).flat().length, 0)
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
})

test('canceling a blocked task also leaves Needs you', async (t) => {
  const { store } = fixture(t)
  const task = await newTask(store)
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'no access' })
  await moveTask(store, { id: task.identifier, version: blocked.task.version, to: 'canceled' })
  const summary = summarizeBoard(store.read())
  assert.equal(summary.counts.needs, 0)
  assert.equal(summary.counts.canceled, 1)
})

// --- projects --------------------------------------------------------------

test('project lifecycle: create, update, archive and restore', async (t) => {
  const { store } = fixture(t)
  const created = await createProject(store, {
    name: '  Web app  ',
    prefix: 'WEB',
    workspacePath: '/tmp/web',
  })
  assert.equal(created.ok, true)
  const project = created.project
  assert.match(project.id, /^prj_[0-9a-f]{8}$/)
  assert.equal(project.name, 'Web app')
  assert.equal(project.prefix, 'WEB')
  assert.equal(project.workspacePath, '/tmp/web')
  assert.equal(project.nextTaskNumber, 1)
  assert.equal(project.archivedAt, null)
  assert.match(project.createdAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(project.createdAt, project.updatedAt)

  assert.deepEqual(
    listProjects(store.read()).map((entry) => entry.name),
    ['ck', 'Web app'],
  )

  const renamed = await updateProject(store, {
    id: project.id,
    name: 'Web client',
    prefix: 'WEBX',
    workspacePath: null,
  })
  assert.equal(renamed.ok, true)
  assert.equal(renamed.project.name, 'Web client')
  assert.equal(renamed.project.prefix, 'WEBX')
  assert.equal(renamed.project.workspacePath, null)
  assert.ok(renamed.project.updatedAt >= project.updatedAt)

  const noop = await updateProject(store, { id: project.id, name: 'Web client' })
  assert.equal(noop.unchanged, true)

  const archived = await archiveProject(store, { id: project.id })
  assert.equal(archived.ok, true)
  assert.match(archived.project.archivedAt, /^\d{4}-\d{2}-\d{2}T/)
  const archivedAgain = await archiveProject(store, { id: project.id })
  assert.equal(archivedAgain.unchanged, true)

  await rejectsCode(
    updateProject(store, { id: project.id, name: 'Nope' }),
    'PROJECT_ARCHIVED',
  )

  const restored = await restoreProject(store, { id: project.id })
  assert.equal(restored.ok, true)
  assert.equal(restored.project.archivedAt, null)
  const restoredAgain = await restoreProject(store, { id: project.id })
  assert.equal(restoredAgain.unchanged, true)

  await rejectsCode(archiveProject(store, { id: 'prj_missing' }), 'PROJECT_NOT_FOUND')
  await rejectsCode(archiveProject(store, { id: '' }), 'PROJECT_NOT_FOUND')
})

test('project input validation rejects bad names, prefixes and paths', async (t) => {
  const { store } = fixture(t)
  for (const prefix of ['a', 'abc', 'TOOLONG', 'bad!', 'WE B']) {
    await rejectsCode(createProject(store, { name: 'App', prefix }), 'INVALID_INPUT')
  }
  await rejectsCode(createProject(store, { name: '   ' }), 'INVALID_INPUT')
  await rejectsCode(createProject(store, { name: 'x'.repeat(121) }), 'INVALID_INPUT')
  await rejectsCode(
    createProject(store, { name: 'App', workspacePath: 'relative/path' }),
    'INVALID_INPUT',
  )
  await rejectsCode(
    createProject(store, { name: 'App', workspacePath: 42 }),
    'INVALID_INPUT',
  )
  assert.equal(listProjects(store.read()).length, 1)

  const project = (await createProject(store, { name: 'App' })).project
  assert.equal(project.prefix, 'APP')
  await rejectsCode(
    updateProject(store, { id: project.id, prefix: 'nope' }),
    'INVALID_INPUT',
  )
  await rejectsCode(
    updateProject(store, { id: project.id, workspacePath: 'still/relative' }),
    'INVALID_INPUT',
  )
  assert.equal(listProjects(store.read())[1].prefix, 'APP')
})

test('two projects keep independent identifier counters and prefixes', async (t) => {
  const { store } = fixture(t)
  const app = (await createProject(store, { name: 'App', prefix: 'APP' })).project
  const web = (await createProject(store, { name: 'Web', prefix: 'WEB' })).project

  const appFirst = await createTask(store, { projectId: app.id, title: 'app first' })
  const webFirst = await createTask(store, { projectId: web.id, title: 'web first' })
  const appSecond = await createTask(store, { projectId: app.id, title: 'app second' })
  const webSecond = await createTask(store, { projectId: web.id, title: 'web second' })

  assert.equal(appFirst.task.identifier, 'APP-1')
  assert.equal(appSecond.task.identifier, 'APP-2')
  assert.equal(webFirst.task.identifier, 'WEB-1')
  assert.equal(webSecond.task.identifier, 'WEB-2')
  assert.equal(appFirst.task.projectId, app.id)
  assert.equal(webFirst.task.projectId, web.id)

  const projects = listProjects(store.read())
  assert.equal(projects.find((entry) => entry.id === app.id).nextTaskNumber, 3)
  assert.equal(projects.find((entry) => entry.id === web.id).nextTaskNumber, 3)

  await updateProject(store, { id: app.id, prefix: 'APPX' })
  const appThird = await createTask(store, { projectId: app.id, title: 'app third' })
  assert.equal(appThird.task.identifier, 'APPX-3')
  const webThird = await createTask(store, { projectId: web.id, title: 'web third' })
  assert.equal(webThird.task.identifier, 'WEB-3')
})

test('createTask defaults to the first active project and rejects unknown projects', async (t) => {
  const { store } = fixture(t)
  const first = store.read().projects[0]
  const defaultTask = await newTask(store)
  assert.equal(defaultTask.projectId, first.id)
  assert.equal(defaultTask.identifier, 'CK-1')

  await rejectsCode(
    createTask(store, { title: 'x', projectId: 'prj_missing' }),
    'PROJECT_NOT_FOUND',
  )

  await archiveProject(store, { id: first.id })
  await rejectsCode(createTask(store, { title: 'x' }), 'NO_ACTIVE_PROJECT')

  const app = (await createProject(store, { name: 'App', prefix: 'APP' })).project
  const task = await createTask(store, { title: 'after archive' })
  assert.equal(task.task.projectId, app.id)
  assert.equal(task.task.identifier, 'APP-1')
})

test('archive blocks every task write with PROJECT_ARCHIVED and restore re-enables them', async (t) => {
  const { store } = fixture(t)
  const project = (await createProject(store, { name: 'Frozen', prefix: 'FRZ' })).project
  const plain = await newTask(store, { projectId: project.id, title: 'plain' })
  const waiting = await newTask(store, { projectId: project.id, title: 'waiting' })
  const asked = await askTask(store, {
    id: waiting.identifier,
    version: 1,
    prompt: 'Which target?',
    options: [{ label: 'A' }, { label: 'B' }],
  })
  await archiveProject(store, { id: project.id })

  const attempts = [
    () => updateTask(store, { id: plain.identifier, version: 1, title: 'renamed' }),
    () => moveTask(store, { id: plain.identifier, version: 1, to: 'running' }),
    () => blockTask(store, { id: plain.identifier, version: 1, reason: 'stuck' }),
    () => unblockTask(store, { id: plain.identifier, version: 1 }),
    () => askTask(store, {
      id: plain.identifier,
      version: 1,
      prompt: 'Pick',
      options: [{ label: 'A' }, { label: 'B' }],
    }),
    () => answerTask(store, { id: waiting.identifier, version: asked.task.version, option: 'opt_1' }),
    () => approveTask(store, { id: waiting.identifier, version: asked.task.version, as: 'user' }),
    () => rejectTask(store, { id: waiting.identifier, version: asked.task.version, as: 'user' }),
    () => addComment(store, { id: plain.identifier, version: 1, body: 'hello' }),
    () => createTask(store, { projectId: project.id, title: 'new' }),
  ]
  for (const attempt of attempts) {
    await rejectsCode(attempt(), 'PROJECT_ARCHIVED')
  }

  const board = store.read()
  const stored = findTask(board, plain.identifier)
  assert.equal(stored.version, 1)
  assert.equal(stored.title, 'plain')
  assert.equal(stored.comments.length, 0)
  assert.equal(findTask(board, waiting.identifier).version, asked.task.version)
  assert.equal(board.tasks.length, 2)

  await restoreProject(store, { id: project.id })
  const updated = await updateTask(store, { id: plain.identifier, version: 1, title: 'renamed' })
  assert.equal(updated.task.title, 'renamed')
  const created = await createTask(store, { projectId: project.id, title: 'after restore' })
  assert.equal(created.task.identifier, 'FRZ-3')
})

test('boardView and summarizeBoard filter by project and include everything by default', async (t) => {
  const { store } = fixture(t)
  const app = (await createProject(store, { name: 'App', prefix: 'APP' })).project
  const web = (await createProject(store, { name: 'Web', prefix: 'WEB' })).project
  const appTask = await newTask(store, { projectId: app.id, title: 'app task' })
  const webTask = await newTask(store, { projectId: web.id, title: 'web task', priority: 'high' })
  const doneAppTask = await newTask(store, {
    projectId: app.id,
    title: 'app done',
    status: 'done',
  })

  const all = boardView(store.read())
  assert.deepEqual(
    all.tasks.map((task) => task.identifier).sort(),
    [appTask.identifier, webTask.identifier, doneAppTask.identifier].sort(),
  )
  assert.equal(all.summary.total, 3)
  assert.equal(all.project, null)

  const appView = boardView(store.read(), { projectId: app.id })
  assert.equal(appView.project.id, app.id)
  assert.equal(appView.summary.project.id, app.id)
  assert.equal(appView.summary.projects.length, 3)
  assert.deepEqual(
    appView.columns.backlog.map((task) => task.identifier),
    [appTask.identifier],
  )
  assert.deepEqual(appView.columns.done.map((task) => task.identifier), [doneAppTask.identifier])
  assert.ok(appView.tasks.every((task) => task.projectId === app.id))
  assert.equal(appView.tasks[0].projectName, 'App')
  assert.equal(appView.summary.total, 2)

  const webView = boardView(store.read(), { projectId: web.id })
  assert.deepEqual(webView.tasks.map((task) => task.identifier), [webTask.identifier])
  assert.equal(webView.tasks[0].projectName, 'Web')
  assert.equal(webView.summary.counts.backlog, 1)

  const summary = summarizeBoard(store.read(), { projectId: app.id })
  assert.equal(summary.total, 2)
  assert.equal(summary.counts.done, 1)
  assert.equal(summary.project.id, app.id)
  assert.equal(getTaskView(store, { id: appTask.identifier }).task.projectName, 'App')
})

test('decorateTask adds projectId and projectName when a project is available', async (t) => {
  const { store } = fixture(t)
  const project = (await createProject(store, { name: 'Docs', prefix: 'DOC' })).project
  const task = await newTask(store, { projectId: project.id, title: 'write docs' })

  const decorated = decorateTask(task, project)
  assert.equal(decorated.projectId, project.id)
  assert.equal(decorated.projectName, 'Docs')
  assert.equal(decorated.column, 'backlog')
  assert.equal(task.projectName, undefined)

  const withoutProject = decorateTask(task)
  assert.equal(withoutProject.projectId, project.id)
  assert.equal(withoutProject.projectName, undefined)
})

test('reorderTask moves a task before and after another with 1024 steps', async (t) => {
  const { store } = fixture(t)
  const first = await newTask(store, { title: 'first' })
  const second = await newTask(store, { title: 'second' })
  const third = await newTask(store, { title: 'third' })

  const beforeFirst = await reorderTask(store, {
    id: third.identifier,
    version: 1,
    beforeId: first.identifier,
  })
  assert.equal(beforeFirst.ok, true)
  assert.equal(beforeFirst.task.version, 2)
  assert.equal(beforeFirst.task.activity.at(-1).kind, 'reordered')
  assert.deepEqual(
    boardView(store.read()).columns.backlog.map((task) => task.identifier),
    [third.identifier, first.identifier, second.identifier],
  )

  const middle = await reorderTask(store, {
    id: third.identifier,
    version: 2,
    beforeId: second.identifier,
  })
  assert.equal(middle.task.sortOrder, (1024 + 2048) / 2)
  assert.deepEqual(
    boardView(store.read()).columns.backlog.map((task) => task.identifier),
    [first.identifier, third.identifier, second.identifier],
  )

  const append = await reorderTask(store, {
    id: first.identifier,
    version: 1,
  })
  assert.equal(append.task.sortOrder, 2048 + 1024)
  assert.deepEqual(
    boardView(store.read()).columns.backlog.map((task) => task.identifier),
    [third.identifier, second.identifier, first.identifier],
  )

  await rejectsCode(
    reorderTask(store, { id: first.identifier, version: 1, beforeId: second.identifier }),
    'TASK_VERSION_CONFLICT',
  )
})

test('reorderTask only accepts anchors in the task column and demands a version', async (t) => {
  const { store } = fixture(t)
  const backlog = await newTask(store, { title: 'backlog' })
  const running = await newTask(store, { title: 'running', status: 'in_progress' })

  await rejectsCode(
    reorderTask(store, { id: backlog.identifier, version: 1, beforeId: running.identifier }),
    'TASK_NOT_FOUND',
  )
  await rejectsCode(reorderTask(store, { id: backlog.identifier }), 'VERSION_REQUIRED')
})

test('archiveTask hides a task, removes attention and rejects every write', async (t) => {
  const { store } = fixture(t)
  const quiet = await newTask(store, { title: 'quiet' })
  const blocked = await newTask(store, { title: 'blocked', status: 'in_progress' })
  const blockedResult = await blockTask(store, {
    id: blocked.identifier,
    version: 1,
    reason: 'need access',
  })

  const archivedQuiet = await archiveTask(store, {
    id: quiet.identifier,
    version: 1,
    as: 'user',
  })
  assert.ok(archivedQuiet.task.archivedAt)
  assert.equal(archivedQuiet.task.version, 2)
  assert.equal(archivedQuiet.task.activity.at(-1).kind, 'archived')

  await archiveTask(store, {
    id: blocked.identifier,
    version: blockedResult.task.version,
  })

  const view = boardView(store.read())
  assert.deepEqual(view.tasks, [])
  assert.equal(view.summary.total, 0)
  assert.equal(summarizeBoard(store.read()).total, 0)

  const included = boardView(store.read(), { includeArchived: true })
  assert.equal(included.summary.total, 2)
  assert.equal(included.columns.backlog.length, 1)
  assert.equal(included.columns.running.length, 1)
  assert.equal(included.columns.needs.length, 0)
  assert.equal(included.columns.backlog[0].attention, null)
  assert.equal(included.columns.running[0].attention, null)
  assert.ok(findTask(store.read(), blocked.identifier).archivedAt)

  await rejectsCode(
    updateTask(store, { id: quiet.identifier, version: 2, title: 'nope' }),
    'TASK_ARCHIVED',
  )
  await rejectsCode(
    moveTask(store, { id: quiet.identifier, version: 2, to: 'running' }),
    'TASK_ARCHIVED',
  )
  await rejectsCode(
    reorderTask(store, { id: quiet.identifier, version: 2 }),
    'TASK_ARCHIVED',
  )
  await rejectsCode(
    addComment(store, { id: quiet.identifier, version: 2, body: 'hello' }),
    'TASK_ARCHIVED',
  )
  await rejectsCode(
    blockTask(store, { id: quiet.identifier, version: 2, reason: 'nope' }),
    'TASK_ARCHIVED',
  )

  const restored = await restoreTask(store, { id: quiet.identifier, version: 2, as: 'user' })
  assert.equal(restored.task.archivedAt, null)
  assert.equal(restored.task.version, 3)
  assert.equal(restored.task.activity.at(-1).kind, 'restored')
  assert.equal(summarizeBoard(store.read()).total, 1)
  await rejectsCode(
    restoreTask(store, { id: quiet.identifier, version: 3 }),
    'TASK_NOT_ARCHIVED',
  )
})
