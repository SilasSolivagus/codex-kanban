#!/usr/bin/env node
import readline from 'node:readline'
import { createProtocol } from './protocol.mjs'
import { TOOLS, callTool } from './tools.mjs'

const protocol = createProtocol({ tools: TOOLS, callTool })

let pending = 0
let closing = false

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function maybeFinish() {
  if (!closing || pending > 0) return
  // Let stdout drain naturally; process.exit() could truncate a pipe write.
  process.exitCode = 0
  process.stdin.pause()
}

function dispatch(message) {
  pending += 1
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
    .finally(() => {
      pending -= 1
      maybeFinish()
    })
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
  dispatch(message)
})

rl.on('close', () => {
  closing = true
  maybeFinish()
})

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

// stdout is the protocol channel; every log goes to stderr.
process.stderr.write('codex-kanban mcp server ready\n')
