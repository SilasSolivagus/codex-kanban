import http from 'node:http'
import { URL } from 'node:url'
import {
  addComment,
  answerTask,
  approveTask,
  askTask,
  blockTask,
  boardView,
  createTask,
  moveTask,
  rejectTask,
  summarizeBoard,
  unblockTask,
  updateTask,
} from '../src/domain.mjs'
import { renderLiveHtml } from '../src/livehtml.mjs'

const MAX_BODY = 1_000_000

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
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

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) {
      const error = new Error('request body is too large')
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
    error.status = 400
    throw error
  }
}

function view(store) {
  const board = store.read()
  return { board: boardView(board), summary: summarizeBoard(board) }
}

const ACTIONS = {
  async create(store, input) {
    const result = await createTask(store, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      labels: input.labels,
      status: input.status,
      as: 'user',
      actor: 'you',
    })
    return result.task
  },
  async move(store, input) {
    await moveTask(store, {
      id: input.id,
      version: input.version,
      to: input.to,
      as: 'user',
      actor: 'you',
    })
  },
  async block(store, input) {
    await blockTask(store, {
      id: input.id,
      version: input.version,
      reason: input.reason,
      as: 'user',
      actor: 'you',
    })
  },
  async unblock(store, input) {
    await unblockTask(store, { id: input.id, version: input.version, as: 'user', actor: 'you' })
  },
  async ask(store, input) {
    await askTask(store, {
      id: input.id,
      version: input.version,
      prompt: input.prompt,
      note: input.note,
      options: (input.options || []).map((label) => ({ label })),
      as: 'user',
      actor: 'you',
    })
  },
  async answer(store, input) {
    await answerTask(store, {
      id: input.id,
      version: input.version,
      option: input.option,
      note: input.note,
      as: 'user',
      actor: 'you',
    })
  },
  async approve(store, input) {
    await approveTask(store, {
      id: input.id,
      version: input.version,
      note: input.note,
      as: 'user',
      actor: 'you',
    })
  },
  async reject(store, input) {
    await rejectTask(store, {
      id: input.id,
      version: input.version,
      note: input.note,
      as: 'user',
      actor: 'you',
    })
  },
  async comment(store, input) {
    await addComment(store, {
      id: input.id,
      version: input.version,
      body: input.body,
      as: 'user',
      actor: 'you',
    })
  },
  async update(store, input) {
    await updateTask(store, {
      id: input.id,
      version: input.version,
      title: input.title,
      description: input.description,
      priority: input.priority,
      labels: input.labels,
      status: input.status,
      as: 'user',
      actor: 'you',
    })
  },
}

export function createWebServer({ store, host = '127.0.0.1', port = 4317 }) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    try {
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        sendHtml(res, renderLiveHtml({ project: store.read().project }))
        return
      }

      if (req.method === 'GET' && url.pathname === '/api/board') {
        sendJson(res, 200, { ok: true, ...view(store) })
        return
      }

      if (req.method === 'POST' && url.pathname === '/api/action') {
        const type = String(req.headers['content-type'] || '')
        if (!type.toLowerCase().includes('application/json')) {
          sendJson(res, 415, { ok: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'send application/json' } })
          return
        }
        const input = await readBody(req)
        const handler = ACTIONS[input.action]
        if (!handler) {
          sendJson(res, 400, { ok: false, error: { code: 'UNKNOWN_ACTION', message: `unknown action: ${input.action}` } })
          return
        }
        await handler(store, input)
        sendJson(res, 200, { ok: true, ...view(store) })
        return
      }

      sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: `${req.method} ${url.pathname}` } })
    } catch (error) {
      const status = error.status || (error.code === 'TASK_VERSION_CONFLICT' ? 409 : 400)
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
