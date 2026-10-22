#!/usr/bin/env node
import readline from 'node:readline'
import { createProtocol } from './protocol.mjs'
import { TOOLS, callTool } from './tools.mjs'

const protocol = createProtocol({ tools: TOOLS, callTool })

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

rl.on('line', (line) => {
  const trimmed = line.trim()
  if (!trimmed) return
  let message
  try {
    message = JSON.parse(trimmed)
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } })
    return
  }
  protocol
    .handle(message)
    .then((response) => {
      if (response) send(response)
    })
    .catch((error) => {
      send({
        jsonrpc: '2.0',
        id: message?.id ?? null,
        error: { code: -32603, message: error?.message || 'internal error' },
      })
    })
})

rl.on('close', () => {
  process.exit(0)
})

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

process.stderr.write('codex-kanban mcp server ready\n')
