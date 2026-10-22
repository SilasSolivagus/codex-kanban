import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createStore } from '../plugin/src/store.mjs'
import { createWebServer } from '../plugin/server/web.mjs'

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-web-'))
  fs.mkdirSync(path.join(root, '.git'))
  const store = createStore({ root })
  const web = createWebServer({ store, port: 0 })
  const url = await web.listen()
  t.after(async () => {
    await web.close()
    fs.rmSync(root, { recursive: true, force: true })
  })
  return { root, store, url }
}

async function board(url) {
  const response = await fetch(`${url}/api/board`)
  return response.json()
}

async function act(url, payload) {
  const response = await fetch(`${url}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { status: response.status, body: await response.json() }
}

function column(json, id) {
  return json.board.columns[id]
}

test('serves the live board page and empty api', async (t) => {
  const { url } = await fixture(t)
  const page = await fetch(url)
  const html = await page.text()
  assert.equal(page.status, 200)
  assert.match(html, /Codex Kanban/)
  assert.match(html, /api\/action/)
  assert.match(html, /New task/)

  const json = await board(url)
  assert.equal(json.ok, true)
  assert.deepEqual(Object.keys(json.board.columns), ['backlog', 'running', 'needs', 'done'])
  assert.equal(json.summary.total, 0)
})

test('create, move and version conflicts round-trip through the api', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'create', title: 'Ship the web board', priority: 'high' })
  assert.equal(created.status, 200)
  const task = column(created.body, 'backlog')[0]
  assert.match(task.identifier, /^[A-Z0-9]+-1$/)
  assert.equal(task.version, 1)
  assert.equal(task.priority, 'high')

  const moved = await act(url, { action: 'move', id: task.identifier, version: 1, to: 'running' })
  assert.equal(moved.status, 200)
  assert.equal(column(moved.body, 'running')[0].status, 'in_progress')
  assert.equal(column(moved.body, 'running')[0].version, 2)

  const stale = await act(url, { action: 'move', id: task.identifier, version: 1, to: 'done' })
  assert.equal(stale.status, 409)
  assert.equal(stale.body.ok, false)
  assert.equal(stale.body.error.code, 'TASK_VERSION_CONFLICT')
})

test('ask, answer and approve work from the web ui', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'create', title: 'Decide the target' })
  const id = column(created.body, 'backlog')[0].identifier

  const asked = await act(url, {
    action: 'ask',
    id,
    version: 1,
    prompt: 'Which target?',
    options: ['Staging', 'Production'],
  })
  assert.equal(asked.status, 200)
  const waiting = column(asked.body, 'needs')[0]
  assert.equal(waiting.attention, 'question')
  assert.equal(waiting.version, 2)

  const answered = await act(url, { action: 'answer', id, version: 2, option: 'opt_2' })
  assert.equal(answered.status, 200)
  assert.equal(column(answered.body, 'needs')[0].pendingQuestion.selected, 'opt_2')

  const approved = await act(url, { action: 'approve', id, version: 3, note: 'ship it' })
  assert.equal(approved.status, 200)
  assert.equal(column(approved.body, 'done')[0].status, 'done')
  assert.equal(column(approved.body, 'needs').length, 0)
  assert.equal(column(approved.body, 'done')[0].questionResolution.decision, 'approve')
})

test('block and unblock move a task in and out of needs you', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'create', title: 'Blocked work' })
  const id = column(created.body, 'backlog')[0].identifier
  const blocked = await act(url, { action: 'block', id, version: 1, reason: 'need access' })
  assert.equal(blocked.status, 200)
  assert.equal(column(blocked.body, 'needs')[0].blockedReason, 'need access')
  const cleared = await act(url, { action: 'unblock', id, version: 2 })
  assert.equal(cleared.status, 200)
  assert.equal(column(cleared.body, 'backlog')[0].blockedReason, null)
})

test('the api rejects non-json posts and unknown actions', async (t) => {
  const { url } = await fixture(t)
  const plain = await fetch(`${url}/api/action`, { method: 'POST', body: 'action=create' })
  assert.equal(plain.status, 415)

  const unknown = await act(url, { action: 'nope' })
  assert.equal(unknown.status, 400)
  assert.equal(unknown.body.error.code, 'UNKNOWN_ACTION')

  const malformed = await fetch(`${url}/api/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ nope',
  })
  assert.equal(malformed.status, 400)
})

test('the server binds to loopback and reports a usable port', async (t) => {
  const { url } = await fixture(t)
  const parsed = new URL(url)
  assert.equal(parsed.hostname, '127.0.0.1')
  assert.ok(Number(parsed.port) > 0)
  assert.equal((await fetch(`${url}/api/board`)).status, 200)
})

test('approving a reviewed task from the web ui uses the human actor', async (t) => {
  const { url } = await fixture(t)
  const created = await act(url, { action: 'create', title: 'Review me', status: 'in_review' })
  const task = column(created.body, 'needs')[0]
  assert.equal(task.attention, 'review')
  const approved = await act(url, { action: 'approve', id: task.identifier, version: 1 })
  assert.equal(approved.status, 200)
  const done = column(approved.body, 'done')[0]
  assert.equal(done.assignee.type, 'user')
  assert.equal(done.activity.at(-1).actor.type, 'user')
})
