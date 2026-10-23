import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { normalizeTitle, parseSinceDays, scanSessions } from '../plugin/src/sessions.mjs'

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function sessionFile(home, date, id) {
  const dir = path.join(home, 'sessions', date.replace(/-/g, '/'))
  fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `rollout-${date}T10-00-00-${id}.jsonl`)
}

function eventMessage(text) {
  return { type: 'event_msg', payload: { type: 'user_message', message: text } }
}

function responseMessage(text) {
  return {
    type: 'response_item',
    payload: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  }
}

function writeSession(home, { date, id, cwd, messages, shapes = 'event', extraLines = [] }) {
  const file = sessionFile(home, date, id)
  const lines = [
    JSON.stringify({ type: 'session_meta', payload: { id, timestamp: `${date}T10:00:00Z`, cwd } }),
    ...extraLines,
    ...messages.map((text) => JSON.stringify(
      shapes === 'response' ? responseMessage(text) : eventMessage(text),
    )),
  ]
  fs.writeFileSync(file, `${lines.join('\n')}\n`)
  return file
}

function writeIndex(home, entries) {
  fs.writeFileSync(
    path.join(home, 'session_index.jsonl'),
    entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n',
  )
}

function fixture() {
  const base = tempDir('codex-kanban-sessions-')
  const root = path.join(base, 'repo')
  const home = path.join(base, 'codex')
  fs.mkdirSync(path.join(root, '.git'), { recursive: true })
  fs.mkdirSync(home, { recursive: true })
  return { base, root, home }
}

test('keeps only sessions inside the root with at least two user turns', async () => {
  const { root, home } = fixture()
  writeSession(home, {
    date: '2026-10-20',
    id: 'inside',
    cwd: root,
    messages: ['Fix login', 'Add a regression test', 'Ship it'],
  })
  writeSession(home, {
    date: '2026-10-20',
    id: 'sibling',
    cwd: `${root}-other`,
    messages: ['Outside one', 'Outside two'],
  })
  writeSession(home, {
    date: '2026-10-20',
    id: 'single-turn',
    cwd: root,
    messages: ['Only one turn'],
  })
  writeIndex(home, [
    { id: 'inside', thread_name: 'Fix the login bug', updated_at: '2026-10-20T12:00:00Z' },
    { id: 'sibling', thread_name: 'Sibling repo', updated_at: '2026-10-20T12:00:00Z' },
  ])

  const candidates = await scanSessions({ root, codexHome: home })
  assert.equal(candidates.length, 1)
  const [candidate] = candidates
  assert.equal(candidate.id, 'inside')
  assert.equal(candidate.title, 'Fix the login bug')
  assert.equal(candidate.summary, 'Ship it')
  assert.equal(candidate.userTurns, 3)
  assert.equal(candidate.cwd, path.resolve(root))
  assert.ok(candidate.path.endsWith('.jsonl'))
  assert.equal(candidate.updatedAt, '2026-10-20T12:00:00Z')
  // Only the capped title and summary are exposed, never the raw turns.
  assert.deepEqual(
    Object.keys(candidate).sort(),
    ['cwd', 'id', 'path', 'summary', 'title', 'updatedAt', 'userTurns'],
  )
  assert.ok(candidate.title.length <= 80)
  assert.ok(candidate.summary.length <= 200)
})

test('deduplicates by normalized title, keeps the newest and applies the limit', async () => {
  const { root, home } = fixture()
  writeSession(home, {
    date: '2026-10-19',
    id: 'older-duplicate',
    cwd: root,
    messages: ['Fix LOGIN!!', 'again'],
  })
  writeSession(home, {
    date: '2026-10-21',
    id: 'newer-duplicate',
    cwd: root,
    messages: ['fix login', 'newest turn'],
  })
  writeSession(home, {
    date: '2026-10-18',
    id: 'other',
    cwd: root,
    messages: ['Write docs', 'more docs'],
  })
  writeIndex(home, [
    { id: 'older-duplicate', thread_name: 'Fix login!', updated_at: '2026-10-19T12:00:00Z' },
    { id: 'newer-duplicate', thread_name: 'fix login', updated_at: '2026-10-21T12:00:00Z' },
    { id: 'other', thread_name: 'Write docs', updated_at: '2026-10-18T12:00:00Z' },
  ])

  const candidates = await scanSessions({ root, codexHome: home, limit: 5 })
  assert.deepEqual(candidates.map((entry) => entry.id), ['newer-duplicate', 'other'])
  assert.equal(normalizeTitle(candidates[0].title), 'fix login')
  assert.equal(normalizeTitle(candidates[1].title), 'write docs')

  const capped = await scanSessions({ root, codexHome: home, limit: 1 })
  assert.deepEqual(capped.map((entry) => entry.id), ['newer-duplicate'])
})

test('tolerates malformed jsonl lines and falls back to response_item messages', async () => {
  const { root, home } = fixture()
  writeSession(home, {
    date: '2026-10-20',
    id: 'response-shape',
    cwd: root,
    shapes: 'response',
    extraLines: ['{not json', JSON.stringify({ type: 'event_msg', payload: { type: 'agent_message' } })],
    messages: ['Describe the bug', 'And the fix'],
  })
  writeSession(home, {
    date: '2026-10-20',
    id: 'broken-meta',
    cwd: root,
    messages: ['one', 'two'],
  })
  const broken = sessionFile(home, '2026-10-20', 'broken-meta')
  fs.writeFileSync(broken, 'not a session meta\n{"type":"event_msg"}\n')
  writeIndex(home, [])

  const candidates = await scanSessions({ root, codexHome: home })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].id, 'response-shape')
  assert.equal(candidates[0].title, 'Describe the bug')
  assert.equal(candidates[0].summary, 'And the fix')
  assert.equal(candidates[0].userTurns, 2)
})

test('event_msg and response_item copies of one turn count once', async () => {
  const { root, home } = fixture()
  const file = sessionFile(home, '2026-10-20', 'both-shapes')
  fs.writeFileSync(file, [
    JSON.stringify({ type: 'session_meta', payload: { id: 'both-shapes', cwd: root } }),
    JSON.stringify(eventMessage('First turn')),
    JSON.stringify(responseMessage('First turn')),
    JSON.stringify(eventMessage('Second turn')),
    JSON.stringify(responseMessage('Second turn')),
  ].join('\n') + '\n')

  const candidates = await scanSessions({ root, codexHome: home })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].userTurns, 2)
  assert.equal(candidates[0].summary, 'Second turn')
})

test('missing index uses the first message as title and the file mtime as date', async () => {
  const { root, home } = fixture()
  const long = 'A'.repeat(140)
  const file = writeSession(home, {
    date: '2026-10-20',
    id: 'no-index',
    cwd: root,
    messages: [long, 'Last summary'],
  })
  const stamp = new Date('2026-10-20T08:30:00Z')
  fs.utimesSync(file, stamp, stamp)

  const candidates = await scanSessions({ root, codexHome: home })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].title.length, 80)
  assert.equal(candidates[0].title, 'A'.repeat(80))
  assert.equal(candidates[0].updatedAt, stamp.toISOString())
})

test('skips files older than the cutoff without needing their index entry', async () => {
  const { root, home } = fixture()
  const file = writeSession(home, {
    date: '2026-06-01',
    id: 'old-session',
    cwd: root,
    messages: ['Old one', 'Old two'],
  })
  const stamp = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  fs.utimesSync(file, stamp, stamp)

  const recent = await scanSessions({ root, codexHome: home, sinceDays: 30 })
  assert.deepEqual(recent, [])
  const wide = await scanSessions({ root, codexHome: home, sinceDays: 120 })
  assert.deepEqual(wide.map((entry) => entry.id), ['old-session'])
})

test('a missing codex home is empty rather than an error', async () => {
  const { root } = fixture()
  const candidates = await scanSessions({ root, codexHome: path.join(root, 'does-not-exist') })
  assert.deepEqual(candidates, [])
})

test('parseSinceDays accepts day counts and ISO dates and rejects junk', () => {
  assert.equal(parseSinceDays('30d'), 30)
  assert.equal(parseSinceDays('7d'), 7)
  assert.equal(parseSinceDays('2026-10-01', Date.parse('2026-10-11T00:00:00Z')), 10)
  assert.throws(() => parseSinceDays('soon'), /--since/)
  assert.throws(() => parseSinceDays('0d'), /--since/)
  assert.throws(() => parseSinceDays('2026-13-40'), /--since/)
  assert.equal(parseSinceDays(undefined), 30)
})

test('normalizeTitle lowercases and strips punctuation', () => {
  assert.equal(normalizeTitle('  Fix   the LOGIN bug!! '), 'fix the login bug')
  assert.equal(normalizeTitle('修复：登录问题'), '修复登录问题')
  assert.equal(normalizeTitle(''), '')
})
