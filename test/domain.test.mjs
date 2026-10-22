import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../src/store.mjs'
import {
  addComment,
  answerTask,
  approveTask,
  askTask,
  blockTask,
  boardView,
  createTask,
  getTaskView,
  moveTask,
  rejectTask,
  unblockTask,
  updateTask,
} from '../src/domain.mjs'

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-domain-'))
  return { root, store: createStore({ root }) }
}

async function newTask(store, extra = {}) {
  const result = await createTask(store, { title: 'Ship the board', root: store.root, ...extra })
  assert.equal(result.ok, true)
  return result.task
}

test('creating a task assigns an identifier, version and activity', async () => {
  const { store } = fixture()
  const task = await newTask(store, { priority: 'high', labels: ['mcp', 'mcp'] })
  assert.equal(task.identifier, `${store.read().project.prefix}-1`)
  assert.equal(task.version, 1)
  assert.equal(task.status, 'backlog')
  assert.deepEqual(task.labels, ['mcp'])
  assert.equal(task.activity.length, 1)
  assert.equal(task.activity[0].kind, 'created')
})

test('writes require the current version', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  await assert.rejects(
    updateTask(store, { id: task.identifier, title: 'renamed' }),
    (error) => error.code === 'VERSION_REQUIRED',
  )
  await assert.rejects(
    updateTask(store, { id: task.identifier, title: 'renamed', version: 99 }),
    (error) => error.code === 'TASK_VERSION_CONFLICT',
  )
  const updated = await updateTask(store, { id: task.identifier, title: 'renamed', version: 1 })
  assert.equal(updated.task.title, 'renamed')
  assert.equal(updated.task.version, 2)
})

test('update records field changes in activity', async () => {
  const { store } = fixture()
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
})

test('needs you rejects direct moves', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  await assert.rejects(
    moveTask(store, { id: task.identifier, to: 'needs', version: 1 }),
    (error) => error.code === 'CANNOT_MOVE_TO_NEEDS',
  )
})

test('moving to done is blocked while attention is open', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'missing key' })
  await assert.rejects(
    moveTask(store, { id: task.identifier, to: 'done', version: blocked.task.version }),
    (error) => error.code === 'CANNOT_MOVE',
  )
})

test('blocking and unblocking round-trips', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'need token' })
  assert.equal(blocked.task.blockedReason, 'need token')
  const view = getTaskView(store, { id: task.identifier })
  assert.equal(view.task.attention, 'blocked')
  const cleared = await unblockTask(store, { id: task.identifier, version: blocked.task.version })
  assert.equal(cleared.task.blockedReason, null)
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
})

test('question, answer, approve clears attention and lands in done', async () => {
  const { store } = fixture()
  const task = await newTask(store, { status: 'in_progress' })
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Which deploy target?',
    options: [{ label: 'Staging' }, { label: 'Production', detail: 'needs approval' }],
  })
  assert.equal(asked.task.pendingQuestion.options[1].id, 'opt_2')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, 'question')

  const answered = await answerTask(store, {
    id: task.identifier,
    version: asked.task.version,
    option: 'opt_2',
    note: 'ship it',
  })
  assert.equal(answered.task.pendingQuestion.selected, 'opt_2')

  await assert.rejects(
    approveTask(store, { id: task.identifier, version: answered.task.version }),
    (error) => error.code === 'HUMAN_DECISION_REQUIRED',
  )

  const approved = await approveTask(store, {
    id: task.identifier,
    version: answered.task.version,
    as: 'user',
    note: 'approved',
  })
  assert.equal(approved.task.status, 'done')
  assert.equal(approved.task.questionResolution.decision, 'approve')
  assert.equal(approved.task.questionResolution.optionLabel, 'Production')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
})

test('approving without picking an option is rejected', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  const asked = await askTask(store, {
    id: task.identifier,
    version: 1,
    prompt: 'Pick one',
    options: [{ label: 'A' }, { label: 'B' }],
  })
  await assert.rejects(
    approveTask(store, { id: task.identifier, version: asked.task.version, as: 'user' }),
    (error) => error.code === 'ANSWER_REQUIRED',
  )
})

test('rejecting returns the task to backlog and clears the blocker', async () => {
  const { store } = fixture()
  const task = await newTask(store, { status: 'in_review' })
  const blocked = await blockTask(store, { id: task.identifier, version: 1, reason: 'unclear' })
  const rejected = await rejectTask(store, {
    id: task.identifier,
    version: blocked.task.version,
    as: 'user',
    note: 'not now',
  })
  assert.equal(rejected.task.status, 'backlog')
  assert.equal(rejected.task.blockedReason, null)
  assert.equal(rejected.task.questionResolution.decision, 'reject')
  assert.equal(getTaskView(store, { id: task.identifier }).task.attention, null)
})

test('comments append with the author', async () => {
  const { store } = fixture()
  const task = await newTask(store)
  const commented = await addComment(store, {
    id: task.identifier,
    version: 1,
    body: 'looks good',
    as: 'user',
  })
  assert.equal(commented.task.comments.length, 1)
  assert.equal(commented.task.comments[0].author.type, 'user')
})

test('invalid links fail before anything is written', async () => {
  const { store } = fixture()
  await assert.rejects(
    createTask(store, { title: 'x', root: store.root, links: [{ label: 'bad', url: 'ftp://x' }] }),
    (error) => error.code === 'INVALID_INPUT',
  )
  assert.equal(store.read().tasks.length, 0)
})

test('board view groups by column and puts attention first', async () => {
  const { store } = fixture()
  const running = await newTask(store, { title: 'running', status: 'in_progress' })
  const waiting = await newTask(store, { title: 'waiting' })
  await blockTask(store, { id: waiting.identifier, version: 1, reason: 'stuck' })
  await newTask(store, { title: 'someday' })

  const view = boardView(store.read())
  assert.equal(view.columns.needs.length, 1)
  assert.equal(view.columns.needs[0].identifier, waiting.identifier)
  assert.equal(view.columns.running[0].identifier, running.identifier)
  assert.equal(view.columns.backlog.length, 1)
  assert.equal(view.summary.counts.needs, 1)
})
