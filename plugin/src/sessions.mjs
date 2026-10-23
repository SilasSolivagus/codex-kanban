import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'

// Importing existing Codex conversations is a read-only scan followed by an
// explicit write. This module owns the read: it never mutates a session file
// and only surfaces a capped title and summary, never raw conversation data.

const MAX_TITLE = 80
const MAX_SUMMARY = 200
const MAX_SOURCE_ID = 200
const MAX_FIRST_LINE_BYTES = 4 * 1024 * 1024
const DAY_MS = 24 * 60 * 60 * 1000
const ROLLOUT_FILE = /^rollout-.*\.jsonl$/

export function resolveCodexHome(codexHome) {
  const explicit = typeof codexHome === 'string' && codexHome.trim()
    ? codexHome.trim()
    : typeof process.env.CODEX_HOME === 'string' && process.env.CODEX_HOME.trim()
      ? process.env.CODEX_HOME.trim()
      : ''
  return explicit ? path.resolve(explicit) : path.join(os.homedir(), '.codex')
}

function invalid(message) {
  const error = new Error(message)
  error.code = 'INVALID_INPUT'
  return error
}

// `30d`, `7d`, `90d` or an ISO date. Returns a day count the scanner can
// compare against file mtimes.
export function parseSinceDays(value, now = Date.now()) {
  const raw = value === undefined || value === null || value === '' ? '30d' : String(value).trim()
  const relative = /^(\d+)d$/i.exec(raw)
  if (relative) {
    const days = Number(relative[1])
    if (Number.isInteger(days) && days > 0) return days
    throw invalid('--since must be a positive day count such as 30d, or an ISO date')
  }
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(raw)) {
    throw invalid('--since must look like 30d, 7d, 90d, or an ISO date such as 2026-09-01')
  }
  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) {
    throw invalid(`--since is not a valid date: ${raw}`)
  }
  return Math.max(0, (now - parsed) / DAY_MS)
}

export function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function oneLine(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max) : text
}

function injectedMessage(text) {
  return /^#\s*AGENTS\.md instructions\b/i.test(text)
    || /^<environment_context>/i.test(text)
    || /^<INSTRUCTIONS>/i.test(text)
    || /^<user_instructions>/i.test(text)
}

function contentText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const entry of content) {
    if (typeof entry === 'string') {
      parts.push(entry)
      continue
    }
    if (entry && typeof entry.text === 'string') parts.push(entry.text)
  }
  return parts.join('\n')
}

function readIndex(codexHome) {
  const index = new Map()
  const file = path.join(codexHome, 'session_index.jsonl')
  let raw
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return index
    return index
  }
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (!entry || typeof entry.id !== 'string' || !entry.id) continue
    index.set(entry.id, {
      threadName: typeof entry.thread_name === 'string' ? entry.thread_name : '',
      updatedAt: typeof entry.updated_at === 'string' ? entry.updated_at : '',
    })
  }
  return index
}

function readFirstLine(file) {
  let handle
  try {
    handle = fs.openSync(file, 'r')
  } catch {
    return ''
  }
  try {
    const chunks = []
    let total = 0
    const buffer = Buffer.alloc(64 * 1024)
    for (;;) {
      const read = fs.readSync(handle, buffer, 0, buffer.length, null)
      if (read <= 0) break
      const slice = buffer.subarray(0, read)
      const newline = slice.indexOf(0x0A)
      if (newline >= 0) {
        chunks.push(Buffer.from(slice.subarray(0, newline)))
        return Buffer.concat(chunks).toString('utf8')
      }
      chunks.push(Buffer.from(slice))
      total += read
      if (total >= MAX_FIRST_LINE_BYTES) break
    }
    return Buffer.concat(chunks).toString('utf8')
  } catch {
    return ''
  } finally {
    try {
      fs.closeSync(handle)
    } catch {
      // the descriptor is already gone; nothing to close
    }
  }
}

function sessionMeta(line) {
  if (!line) return null
  let record
  try {
    record = JSON.parse(line)
  } catch {
    return null
  }
  if (record?.type !== 'session_meta' || !record.payload || typeof record.payload !== 'object') {
    return null
  }
  const payload = record.payload
  return {
    id: typeof payload.id === 'string' && payload.id ? payload.id : null,
    cwd: typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : null,
    timestamp: typeof payload.timestamp === 'string' ? payload.timestamp : null,
  }
}

function realpathOrSelf(candidate) {
  try {
    return fs.realpathSync(candidate)
  } catch {
    return candidate
  }
}

function isInsideRoot(root, cwd) {
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) return false
  const base = realpathOrSelf(path.resolve(root))
  const target = realpathOrSelf(path.resolve(cwd))
  const relative = path.relative(base, target)
  return relative === ''
    || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
}

function walkRollouts(dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkRollouts(full, out)
    } else if (entry.isFile() && ROLLOUT_FILE.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

async function readUserMessages(file) {
  const eventMessages = []
  const responseMessages = []
  let stream
  try {
    stream = fs.createReadStream(file, { encoding: 'utf8' })
  } catch {
    return []
  }
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity })
  try {
    for await (const line of lines) {
      if (!line.trim()) continue
      let record
      try {
        record = JSON.parse(line)
      } catch {
        continue
      }
      const payload = record?.payload
      if (!payload || typeof payload !== 'object') continue
      if (payload.type === 'user_message' && typeof payload.message === 'string') {
        const text = oneLine(payload.message, 2000)
        if (text && !injectedMessage(text)) eventMessages.push(text)
        continue
      }
      if (payload.role === 'user') {
        const text = oneLine(contentText(payload.content), 2000)
        if (text && !injectedMessage(text)) responseMessages.push(text)
      }
    }
  } catch {
    // a truncated or unreadable tail only costs the messages seen so far
  } finally {
    lines.close()
    stream.destroy()
  }
  // Current rollouts carry both an event_msg and a response_item copy of every
  // user turn. Prefer event_msg so a turn is counted once; older files only
  // have response_item messages.
  return eventMessages.length ? eventMessages : responseMessages
}

export async function scanSessions({
  root,
  sinceDays = 30,
  limit = 10,
  codexHome,
} = {}) {
  if (typeof root !== 'string' || !root.trim()) {
    throw invalid('scanSessions needs a repository root')
  }
  const base = path.resolve(root.trim())
  const home = resolveCodexHome(codexHome)
  const days = Number.isFinite(sinceDays) && sinceDays >= 0 ? sinceDays : 30
  const cap = Number.isInteger(limit) && limit > 0 ? limit : 10
  const cutoff = Date.now() - days * DAY_MS
  const index = readIndex(home)
  const files = walkRollouts(path.join(home, 'sessions'))
  const candidates = []

  for (const file of files) {
    let stats
    try {
      stats = fs.statSync(file)
    } catch {
      continue
    }
    // Old sessions are skipped before any read, so a stale file cannot cost
    // the scan a full parse.
    if (stats.mtimeMs < cutoff) continue

    const meta = sessionMeta(readFirstLine(file))
    if (!meta || !meta.cwd || !isInsideRoot(base, meta.cwd)) continue

    const indexed = meta.id ? index.get(meta.id) : undefined
    const messages = await readUserMessages(file)
    if (messages.length < 2) continue

    const id = meta.id || path.basename(file).replace(/^rollout-/, '').replace(/\.jsonl$/, '')
    const title = oneLine(
      indexed && indexed.threadName ? indexed.threadName : messages[0],
      MAX_TITLE,
    )
    if (!title) continue
    const indexedAt = indexed && indexed.updatedAt && !Number.isNaN(Date.parse(indexed.updatedAt))
      ? indexed.updatedAt
      : null
    candidates.push({
      id,
      title,
      summary: oneLine(messages[messages.length - 1], MAX_SUMMARY),
      cwd: path.resolve(meta.cwd),
      updatedAt: indexedAt || stats.mtime.toISOString(),
      userTurns: messages.length,
      path: file,
    })
  }

  const sorted = candidates.sort((a, b) => timestampOf(b.updatedAt) - timestampOf(a.updatedAt))
  const seen = new Set()
  const deduped = []
  for (const candidate of sorted) {
    const key = normalizeTitle(candidate.title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    deduped.push(candidate)
    if (deduped.length >= cap) break
  }
  return deduped
}

function timestampOf(value) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function isSessionId(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= MAX_SOURCE_ID
}
