import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SERVER = fileURLToPath(new URL('../plugin/server/index.mjs', import.meta.url))

const TOOL_NAMES = [
  'kanban_board',
  'kanban_task_get',
  'kanban_task_create',
  'kanban_task_update',
  'kanban_task_move',
  'kanban_task_block',
  'kanban_task_unblock',
  'kanban_task_ask',
  'kanban_task_answer',
  'kanban_task_approve',
  'kanban_task_reject',
  'kanban_task_comment',
  'kanban_render',
]

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await delay(10)
  }
  return predicate()
}

/**
 * Spawn the real MCP server over pipes and speak newline-delimited JSON-RPC.
 * The child uses the temp directory as both cwd and CODEX_KANBAN_ROOT.
 */
function startServer(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-mcp-'))
  const child = spawn(process.execPath, [SERVER], {
    cwd: root,
    env: { ...process.env, CODEX_KANBAN_ROOT: root },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const messages = []
  const waiters = new Map()
  let nextId = 0
  let stderr = ''

  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })

  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  lines.on('line', (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let message
    try {
      message = JSON.parse(trimmed)
    } catch {
      messages.push({ malformed: trimmed })
      return
    }
    messages.push(message)
    if (message.id !== undefined && message.id !== null) {
      const waiter = waiters.get(message.id)
      if (waiter) {
        waiters.delete(message.id)
        waiter(message)
      }
    }
  })

  function write(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  function request(method, params) {
    const id = ++nextId
    const payload = { jsonrpc: '2.0', id, method }
    if (params !== undefined) payload.params = params
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(id)
        reject(new Error(`timed out waiting for ${method}\nstderr:\n${stderr}`))
      }, 10_000)
      waiters.set(id, (message) => {
        clearTimeout(timer)
        resolve(message)
      })
      write(payload)
    })
  }

  function notify(method, params) {
    const payload = { jsonrpc: '2.0', method }
    if (params !== undefined) payload.params = params
    write(payload)
  }

  function raw(line) {
    child.stdin.write(`${line}\n`)
  }

  async function call(name, args = {}) {
    const message = await request('tools/call', { name, arguments: args })
    assert.equal(
      message.error,
      undefined,
      `unexpected protocol error: ${JSON.stringify(message.error)}`,
    )
    return message.result
  }

  t.after(async () => {
    if (child.exitCode === null) {
      child.stdin.end()
      const exited = await Promise.race([
        new Promise((resolve) => child.once('exit', () => resolve(true))),
        delay(3000).then(() => false),
      ])
      if (!exited) child.kill('SIGKILL')
    }
    fs.rmSync(root, { recursive: true, force: true })
  })

  return { root, child, messages, request, notify, raw, call, stderr: () => stderr }
}

function expectError(result, code) {
  assert.equal(result.isError, true)
  assert.equal(typeof result.content?.[0]?.text, 'string')
  assert.match(result.content[0].text, new RegExp(`^ERROR ${code}: `))
  return result.content[0].text
}

function identifierFrom(result) {
  const match = result.content[0].text.match(/Created ([A-Z0-9]+-\d+)/)
  assert.ok(match, `create did not return an identifier: ${result.content[0].text}`)
  return match[1]
}

test('initialize negotiates the protocol version and advertises the kanban server', async (t) => {
  const client = startServer(t)

  const response = await client.request('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'mcp-test', version: '0.0.0' },
  })
  assert.equal(response.jsonrpc, '2.0')
  assert.equal(response.result.protocolVersion, '2025-03-26')
  assert.deepEqual(response.result.capabilities, { tools: { listChanged: false } })
  assert.deepEqual(response.result.serverInfo, { name: 'codex-kanban', version: '0.1.0' })
  assert.match(response.result.instructions, /kanban_board/)
  assert.match(response.result.instructions, /never approve/i)

  const fallback = await client.request('initialize', { protocolVersion: '1999-01-01' })
  assert.equal(fallback.result.protocolVersion, '2025-06-18')
})

test('tools/list exposes exactly the 13 kanban tools', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })
  client.notify('notifications/initialized')

  const response = await client.request('tools/list')
  const tools = response.result.tools
  assert.equal(tools.length, 13)
  assert.deepEqual(tools.map((tool) => tool.name).sort(), [...TOOL_NAMES].sort())

  for (const tool of tools) {
    assert.equal(typeof tool.title, 'string', `${tool.name} needs a title`)
    assert.ok(tool.title.length > 0, `${tool.name} needs a title`)
    assert.equal(typeof tool.description, 'string', `${tool.name} needs a description`)
    assert.equal(tool.inputSchema.type, 'object')
  }

  const create = tools.find((tool) => tool.name === 'kanban_task_create')
  assert.ok(create.inputSchema.required.includes('title'))

  const resources = await client.request('resources/list')
  assert.deepEqual(resources.result.resources, [])
  const prompts = await client.request('prompts/list')
  assert.deepEqual(prompts.result.prompts, [])
})

test('creating a task returns its identifier, shows on the board and persists board.json', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })

  const created = await client.call('kanban_task_create', { title: 'Ship the MCP server' })
  assert.equal(created.isError, undefined)
  assert.match(created.content[0].text, /Created [A-Z0-9]+-\d+/)
  assert.match(created.content[0].text, /Ship the MCP server/)

  const board = await client.call('kanban_board', {})
  assert.match(board.content[0].text, /Ship the MCP server/)

  assert.ok(fs.existsSync(path.join(client.root, '.kanban', 'board.json')))
})

test('kanban_task_get returns the full history without truncating comments', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })
  await client.call('kanban_task_create', { title: 'Full history task' })

  const file = path.join(client.root, '.kanban', 'board.json')
  const board = JSON.parse(fs.readFileSync(file, 'utf8'))
  const task = board.tasks[0]
  task.comments = Array.from({ length: 7 }, (_, index) => ({
    id: `cmt_${index}`,
    body: `comment ${index}`,
    author: { type: 'agent', name: 'codex' },
    createdAt: '2026-10-22T11:00:00.000Z',
  }))
  task.activity = Array.from({ length: 22 }, (_, index) => ({
    at: '2026-10-22T11:00:00.000Z',
    actor: { type: 'agent', name: 'codex' },
    kind: 'updated',
    summary: `activity ${index}`,
    changes: [],
  }))
  fs.writeFileSync(file, `${JSON.stringify(board, null, 2)}\n`, 'utf8')

  const detail = await client.call('kanban_task_get', { id: task.identifier })
  const text = detail.content[0].text
  assert.match(text, /comment 0/)
  assert.match(text, /comment 6/)
  assert.match(text, /activity 21/)
  assert.match(text, /activity 2\b/)
  assert.doesNotMatch(text, /activity 1\b/)
  assert.match(text, /… 2 older entries omitted/)
})

test('a missing task is a tool error, not a protocol error', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })

  const result = await client.call('kanban_task_get', { id: 'CK-404' })
  const message = expectError(result, 'TASK_NOT_FOUND')
  assert.match(message, /CK-404/)
})

test('unknown methods and unknown tools produce JSON-RPC errors', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })

  const method = await client.request('kanban/nope')
  assert.equal(method.error.code, -32601)

  const tool = await client.request('tools/call', { name: 'kanban_nope', arguments: {} })
  assert.equal(tool.error.code, -32602)
})

test('kanban_render writes board.html and returns the inline reference', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })
  await client.call('kanban_task_create', { title: 'Render the board visually' })

  const result = await client.call('kanban_render', {})
  assert.equal(result.isError, undefined)
  const text = result.content[0].text

  const firstLine = text.split('\n')[0]
  assert.match(firstLine, /^Wrote /)
  const written = firstLine.slice('Wrote '.length)
  assert.ok(path.isAbsolute(written))
  assert.equal(path.basename(written), 'board.html')
  assert.ok(fs.existsSync(written))
  assert.match(fs.readFileSync(written, 'utf8'), /Render the board visually/)

  assert.match(text, /Inline reference \(emit verbatim only in the Codex app\):/)
  assert.match(text, /\uE200visualize\uE202/)
  const marker = text.split('\uE200visualize\uE202')[1].split('\uE201')[0]
  const payload = JSON.parse(marker)
  assert.equal(payload.path, written)
  assert.match(payload.title, /Codex Kanban/)
})

test('approve and reject enforce a user actor with confirmed_by', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })
  const created = await client.call('kanban_task_create', { title: 'Human decision task' })
  const identifier = identifierFrom(created)

  const asAgent = await client.call('kanban_task_approve', {
    id: identifier,
    version: 1,
    confirmed_by: 'the human said yes',
    as: 'agent',
  })
  expectError(asAgent, 'HUMAN_DECISION_REQUIRED')

  const noConfirmation = await client.call('kanban_task_approve', {
    id: identifier,
    version: 1,
    as: 'user',
  })
  expectError(noConfirmation, 'HUMAN_DECISION_REQUIRED')

  const asked = await client.call('kanban_task_ask', {
    id: identifier,
    version: 1,
    prompt: 'Which deploy target?',
    options: [{ label: 'Staging' }, { label: 'Production' }],
  })
  assert.match(asked.content[0].text, /Question posted/)

  const answered = await client.call('kanban_task_answer', {
    id: identifier,
    version: 2,
    option: 'Staging',
  })
  assert.match(answered.content[0].text, /Answer recorded/)

  const approved = await client.call('kanban_task_approve', {
    id: identifier,
    version: 3,
    confirmed_by: 'the human approved staging',
    as: 'user',
  })
  assert.equal(approved.isError, undefined)
  assert.match(approved.content[0].text, /Approved/)

  const detail = await client.call('kanban_task_get', { id: identifier })
  assert.match(detail.content[0].text, /- Status: `done` \(done\)/)
  assert.match(detail.content[0].text, /Resolution: approve/)
})

test('kanban_board rejects an unknown column instead of rendering an empty board', async (t) => {
  const client = startServer(t)
  await client.request('initialize', { protocolVersion: '2025-06-18' })
  await client.call('kanban_task_create', { title: 'Validate the column' })

  const result = await client.call('kanban_board', { column: 'bogus' })
  expectError(result, 'INVALID_INPUT')
})

test('notifications produce no response and malformed JSON is a parse error', async (t) => {
  const client = startServer(t)

  client.notify('notifications/initialized')
  await delay(100)
  assert.equal(client.messages.length, 0)

  client.raw('{ this is not json')
  assert.ok(await waitFor(() => client.messages.length === 1))
  assert.equal(client.messages[0].error.code, -32700)

  const ping = await client.request('ping')
  assert.deepEqual(ping.result, {})
})
