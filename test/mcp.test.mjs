import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const entry = path.join(here, '..', 'server', 'index.mjs')

class Client {
  constructor(child) {
    this.child = child
    this.nextId = 1
    this.pending = new Map()
    this.lines = readline.createInterface({ input: child.stdout })
    this.lines.on('line', (line) => {
      if (!line.trim()) return
      const message = JSON.parse(line)
      const waiter = this.pending.get(message.id)
      if (waiter) {
        this.pending.delete(message.id)
        waiter(message)
      }
    })
  }

  request(method, params) {
    const id = this.nextId++
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`timeout waiting for ${method}`))
      }, 3000)
      this.pending.set(id, (message) => {
        clearTimeout(timer)
        resolve(message)
      })
    })
  }

  notify(method, params) {
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`)
  }

  close() {
    this.child.kill()
  }
}

function startServer(root) {
  const child = spawn(process.execPath, [entry], {
    env: { ...process.env, CODEX_KANBAN_ROOT: root },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return new Client(child)
}

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-mcp-'))
  fs.mkdirSync(path.join(root, '.git'))
  return root
}

test('handshake, tool list and a create round-trip over stdio', async () => {
  const root = tempRoot()
  const client = startServer(root)
  try {
    const init = await client.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' },
    })
    assert.equal(init.result.protocolVersion, '2025-06-18')
    assert.equal(init.result.capabilities.tools.listChanged, false)
    assert.match(init.result.instructions, /kanban_board/)
    client.notify('notifications/initialized', {})

    const listed = await client.request('tools/list', {})
    const names = listed.result.tools.map((tool) => tool.name)
    assert.equal(names.length, 13)
    for (const expected of [
      'kanban_board',
      'kanban_task_create',
      'kanban_task_ask',
      'kanban_task_approve',
      'kanban_render',
    ]) {
      assert.ok(names.includes(expected), expected)
    }
    const create = listed.result.tools.find((tool) => tool.name === 'kanban_task_create')
    assert.equal(create.inputSchema.required[0], 'title')

    const created = await client.request('tools/call', {
      name: 'kanban_task_create',
      arguments: { title: 'Ship it', priority: 'high' },
    })
    assert.match(created.result.content[0].text, /Created [A-Z0-9]+-1/)
    const board = await client.request('tools/call', { name: 'kanban_board', arguments: {} })
    assert.match(board.result.content[0].text, /Ship it/)
    assert.ok(fs.existsSync(path.join(root, '.kanban', 'board.json')))
  } finally {
    client.close()
  }
})

test('tool failures come back as error text, not protocol errors', async () => {
  const root = tempRoot()
  const client = startServer(root)
  try {
    await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
    client.notify('notifications/initialized', {})
    const missing = await client.request('tools/call', {
      name: 'kanban_task_get',
      arguments: { id: 'KAN-404' },
    })
    assert.equal(missing.result.isError, true)
    assert.match(missing.result.content[0].text, /TASK_NOT_FOUND/)
  } finally {
    client.close()
  }
})

test('unknown methods and tools are protocol errors', async () => {
  const root = tempRoot()
  const client = startServer(root)
  try {
    await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
    const method = await client.request('does/not/exist', {})
    assert.equal(method.error.code, -32601)
    const tool = await client.request('tools/call', { name: 'nope', arguments: {} })
    assert.equal(tool.error.code, -32602)
  } finally {
    client.close()
  }
})

test('render writes a self-contained html board', async () => {
  const root = tempRoot()
  const client = startServer(root)
  try {
    await client.request('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
    await client.request('tools/call', {
      name: 'kanban_task_create',
      arguments: { title: 'Visible card' },
    })
    const rendered = await client.request('tools/call', { name: 'kanban_render', arguments: {} })
    const text = rendered.result.content[0].text
    const match = /Wrote (\/\S+board\.html)/.exec(text)
    assert.ok(match, text)
    const html = fs.readFileSync(match[1], 'utf8')
    assert.match(html, /<!doctype html>/)
    assert.match(html, /Visible card/)
    assert.doesNotMatch(html, /http:\/\//)
  } finally {
    client.close()
  }
})
