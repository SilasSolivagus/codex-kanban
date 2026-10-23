import http from 'node:http'
import { createHash } from 'node:crypto'
import { URL } from 'node:url'
import {
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
  findTask,
  listProjects,
  moveTask,
  readAttachment,
  rejectTask,
  removeAttachment,
  reorderTask,
  restoreProject,
  restoreTask,
  summarizeBoard,
  unblockTask,
  updateProject,
  updateTask,
} from '../src/domain.mjs'
import { PRIORITIES, isOpen } from '../src/rules.mjs'
import { renderLiveHtml } from '../src/livehtml.mjs'
import { applySessionImport } from '../src/import.mjs'
import { isSessionId, parseSinceDays, scanSessions } from '../src/sessions.mjs'

// A 10 MB attachment is ~14 MB of base64 plus JSON overhead.
const MAX_BODY = 16 * 1024 * 1024
const ATTACHMENT_PREFIX = '/api/attachments/'
const HUMAN = { as: 'user', actor: 'you' }

function sendJson(res, status, payload) {
  // Every JSON response carries the server clock so the UI can correct skew.
  const stamped = { ...payload, serverNow: payload.serverNow || new Date().toISOString() }
  const body = JSON.stringify(stamped)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(html),
  })
  res.end(html)
}

function sendBytes(res, buffer, contentType, filename) {
  // RFC 5987 attribute value: percent-encoded UTF-8, no raw header characters.
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  res.writeHead(200, {
    'content-type': contentType,
    'content-disposition': `inline; filename*=UTF-8''${encoded}`,
    'cache-control': 'no-store',
    'content-length': buffer.length,
    'x-content-type-options': 'nosniff',
  })
  res.end(buffer)
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) {
      const error = new Error(`request body must be at most ${MAX_BODY / (1024 * 1024)} MB`)
      error.code = 'BODY_TOO_LARGE'
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(raw)
  } catch {
    const error = new Error('request body must be JSON')
    error.code = 'INVALID_JSON'
    error.status = 400
    throw error
  }
}

function projectFilter(url) {
  const raw = url.searchParams.get('project')
  if (raw === null) return undefined
  const value = raw.trim()
  if (!value || value === 'all') return undefined
  return value
}

function includeArchived(url) {
  const raw = url.searchParams.get('include_archived')
  if (raw === null) return false
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())
}

function projectSummaries(board) {
  const tasks = Array.isArray(board.tasks) ? board.tasks : []
  return listProjects(board).map((project) => {
    const own = tasks.filter((task) => task?.projectId === project.id)
    return {
      id: project.id,
      name: project.name,
      prefix: project.prefix,
      workspacePath: project.workspacePath ?? null,
      archivedAt: project.archivedAt ?? null,
      taskCount: own.filter((task) => !task.archivedAt).length,
      archivedCount: own.filter((task) => task.archivedAt).length,
      openCount: own.filter((task) => isOpen(task) && !task.archivedAt).length,
    }
  })
}

function collectFilters(tasks) {
  const labels = new Set()
  const priorities = new Set()
  const assignees = new Set()
  for (const task of tasks) {
    if (Array.isArray(task.labels)) {
      for (const label of task.labels) {
        if (typeof label === 'string' && label) labels.add(label)
      }
    }
    if (typeof task.priority === 'string' && task.priority) priorities.add(task.priority)
    const name = task.assignee?.name
    if (typeof name === 'string' && name) assignees.add(name)
  }
  return {
    labels: [...labels].sort(),
    priorities: PRIORITIES.filter((priority) => priorities.has(priority)),
    assignees: [...assignees].sort(),
  }
}

function boardPayload(store, projectId, withArchived = false) {
  const board = store.read()
  const boardId = createHash('sha256').update(store.root).digest('hex').slice(0, 12)
  const view = boardView(board, { projectId, includeArchived: withArchived })
  return {
    ok: true,
    boardId,
    serverNow: new Date().toISOString(),
    projects: projectSummaries(board),
    board: { project: view.project, columns: view.columns, tasks: view.tasks },
    summary: summarizeBoard(board, { projectId, includeArchived: withArchived }),
    filters: collectFilters(view.tasks),
  }
}

// Read-only lookup across every task, archived or not, so the UI can tell a
// hidden archived task apart from a filtered-out one and a bad link from both.
function lookupTask(store, ref) {
  const board = store.read()
  const task = findTask(board, ref)
  if (!task) return null
  const project = listProjects(board).find((entry) => entry.id === task.projectId)
  return {
    id: task.id,
    identifier: task.identifier,
    archived: Boolean(task.archivedAt),
    projectId: task.projectId ?? null,
    projectName: project ? project.name : null,
  }
}

function askOptions(value) {
  if (!Array.isArray(value)) return value
  return value.map((entry) => (typeof entry === 'string' ? { label: entry } : entry))
}

function importLimit(value, fallback = 10) {
  if (value === undefined || value === null || value === '') return fallback
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    const error = new Error('limit must be a positive integer')
    error.code = 'INVALID_INPUT'
    throw error
  }
  return Math.min(Number(value), 100)
}

async function importCandidates(store, codexHome, since, limit) {
  const sinceDays = parseSinceDays(since === null || since === '' ? undefined : since)
  const candidates = await scanSessions({
    root: store.root,
    sinceDays,
    limit: importLimit(limit),
    codexHome,
  })
  return candidates
}

const ACTIONS = {
  'project.create': (store, input) => createProject(store, {
    name: input.name,
    prefix: input.prefix,
    workspacePath: input.workspacePath,
  }),
  'project.update': (store, input) => updateProject(store, {
    id: input.id,
    name: input.name,
    prefix: input.prefix,
    workspacePath: input.workspacePath,
  }),
  'project.archive': (store, input) => archiveProject(store, { id: input.id }),
  'project.restore': (store, input) => restoreProject(store, { id: input.id }),

  'task.create': (store, input) => createTask(store, {
    ...HUMAN,
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    labels: input.labels,
    links: input.links,
    status: input.status,
  }),
  'task.update': (store, input) => updateTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    title: input.title,
    description: input.description,
    priority: input.priority,
    labels: input.labels,
    links: input.links,
    status: input.status,
  }),
  'task.move': (store, input) => moveTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    to: input.to,
  }),
  'task.block': (store, input) => blockTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    reason: input.reason,
  }),
  'task.unblock': (store, input) => unblockTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
  }),
  'task.ask': (store, input) => askTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    prompt: input.prompt,
    note: input.note,
    options: askOptions(input.options),
  }),
  'task.answer': (store, input) => answerTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    option: input.option,
    note: input.note,
  }),
  'task.approve': (store, input) => approveTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    note: input.note,
  }),
  'task.reject': (store, input) => rejectTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    note: input.note,
  }),
  'task.comment': (store, input) => addComment(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    body: input.body,
  }),
  'task.reorder': (store, input) => reorderTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    beforeId: input.beforeId,
    afterId: input.afterId,
    position: input.position,
  }),
  'task.archive': (store, input) => archiveTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
  }),
  'task.restore': (store, input) => restoreTask(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
  }),

  'attachment.add': (store, input) => addAttachment(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    filename: input.filename,
    contentType: input.contentType,
    data: input.data,
  }),
  'attachment.remove': (store, input) => removeAttachment(store, {
    ...HUMAN,
    id: input.id,
    version: input.version,
    attachmentId: input.attachmentId,
  }),

  'import.apply': async (store, input, context = {}) => {
    const ids = Array.isArray(input.sessionIds)
      ? [...new Set(input.sessionIds.filter(isSessionId).map((id) => id.trim()))]
      : []
    if (!ids.length) {
      const error = new Error('sessionIds must contain at least one session id')
      error.code = 'INVALID_INPUT'
      throw error
    }
    const sinceDays = parseSinceDays(input.since === undefined ? '30d' : input.since)
    const candidates = await scanSessions({
      root: store.root,
      sinceDays,
      limit: Math.max(ids.length, importLimit(input.limit, 10)),
      codexHome: context.codexHome,
    })
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
    const picked = ids.map((id) => byId.get(id)).filter(Boolean)
    const missing = ids
      .filter((id) => !byId.has(id))
      .map((id) => ({ id, title: '', reason: 'not_found' }))
    const result = await applySessionImport(store, {
      candidates: picked,
      projectId: input.projectId,
      as: 'user',
    })
    return { created: result.created, skipped: [...result.skipped, ...missing] }
  },
}

const CONFLICT_CODES = new Set(['TASK_VERSION_CONFLICT', 'PROJECT_ARCHIVED', 'TASK_ARCHIVED'])

export function createWebServer({ store, host = '127.0.0.1', port = 4317, codexHome } = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        sendHtml(res, renderLiveHtml({ project: store.read().project }))
        return
      }

      if (req.method === 'GET' && url.pathname === '/api/board') {
        sendJson(res, 200, boardPayload(store, projectFilter(url), includeArchived(url)))
        return
      }

      if (req.method === 'GET' && url.pathname === '/api/task') {
        const ref = url.searchParams.get('ref') ?? ''
        const task = ref.trim() ? lookupTask(store, ref) : null
        if (!task) {
          sendJson(res, 404, {
            ok: false,
            error: { code: 'TASK_NOT_FOUND', message: `no task matches ${ref}` },
          })
          return
        }
        sendJson(res, 200, { ok: true, task })
        return
      }

      if (req.method === 'GET' && url.pathname === '/api/import/candidates') {
        const candidates = await importCandidates(
          store,
          codexHome,
          url.searchParams.get('since'),
          url.searchParams.get('limit'),
        )
        sendJson(res, 200, { ok: true, candidates })
        return
      }

      if (req.method === 'GET' && url.pathname.startsWith(ATTACHMENT_PREFIX)) {
        const id = decodeURIComponent(url.pathname.slice(ATTACHMENT_PREFIX.length))
        const found = id ? readAttachment(store, id) : null
        if (!found) {
          sendJson(res, 404, {
            ok: false,
            error: { code: 'ATTACHMENT_NOT_FOUND', message: `no attachment matches ${id || '(empty)'}` },
          })
          return
        }
        sendBytes(
          res,
          found.buffer,
          found.attachment.contentType || 'application/octet-stream',
          found.attachment.filename,
        )
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/action') {
        const type = String(req.headers['content-type'] || '')
        if (!type.toLowerCase().includes('application/json')) {
          sendJson(res, 415, {
            ok: false,
            error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'send application/json' },
          })
          return
        }
        const input = await readBody(req)
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
          sendJson(res, 400, {
            ok: false,
            error: { code: 'INVALID_INPUT', message: 'action payload must be a JSON object' },
          })
          return
        }
        const handler = ACTIONS[input.action]
        if (!handler) {
          sendJson(res, 400, {
            ok: false,
            error: { code: 'UNKNOWN_ACTION', message: `unknown action: ${input.action}` },
          })
          return
        }
        const result = await handler(store, input, { codexHome })
        const payload = boardPayload(store, projectFilter(url), includeArchived(url))
        if (result && Array.isArray(result.created)) {
          payload.created = result.created
          payload.skipped = Array.isArray(result.skipped) ? result.skipped : []
        }
        sendJson(res, 200, payload)
        return
      }

      sendJson(res, 404, {
        ok: false,
        error: { code: 'NOT_FOUND', message: `${req.method} ${url.pathname}` },
      })
    } catch (error) {
      const status = error.status || (CONFLICT_CODES.has(error.code) ? 409 : 400)
      sendJson(res, status, {
        ok: false,
        error: { code: error.code || 'WEB_ERROR', message: error.message || 'request failed' },
      })
    }
  })

  return {
    server,
    listen() {
      return new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
          server.removeListener('error', reject)
          const address = server.address()
          resolve(`http://${host}:${address.port}`)
        })
      })
    },
    close() {
      return new Promise((resolve) => server.close(() => resolve()))
    },
  }
}
