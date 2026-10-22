import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(here, '..', 'bin', 'codex-kanban.mjs')

function run(root, args, { expectFailure = false } = {}) {
  const result = spawnSync(process.execPath, [cli, ...args, '--root', root], {
    encoding: 'utf8',
    env: { ...process.env, CODEX_KANBAN_ROOT: root },
  })
  if (!expectFailure && result.status !== 0) {
    throw new Error(`cli failed: ${result.stderr}\n${result.stdout}`)
  }
  return result
}

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-cli-'))
  fs.mkdirSync(path.join(root, '.git'))
  return root
}

test('add, board, move and approve through the cli', () => {
  const root = tempRoot()

  const added = run(root, ['add', 'Write the release notes', '--priority', 'high'])
  assert.match(added.stdout, /-1 · Write the release notes · backlog · v1/)

  const board = run(root, ['board'])
  assert.match(board.stdout, /Write the release notes/)
  assert.match(board.stdout, /## Backlog/)

  const moved = run(root, ['move', '1', '--to', 'running'])
  assert.match(moved.stdout, /in_progress/)

  const asked = run(root, ['ask', '1', '--prompt', 'Ship today?', '--option', 'Yes', '--option', 'No'])
  assert.match(asked.stdout, /Question posted/)

  const boardAfterAsk = run(root, ['board'])
  assert.match(boardAfterAsk.stdout, /## Needs you/)
  assert.match(boardAfterAsk.stdout, /question: Ship today\?/)

  run(root, ['answer', '1', '--option', 'opt_1', '--note', 'go'])
  const approved = run(root, ['approve', '1', '--confirmed-by', 'user said ship it'])
  assert.match(approved.stdout, /done/)

  const finalBoard = run(root, ['board'])
  assert.match(finalBoard.stdout, /## Done/)
  assert.match(finalBoard.stdout, /Nothing needs you right now/)
  const doneIndex = finalBoard.stdout.indexOf('## Done')
  assert.ok(finalBoard.stdout.indexOf('Write the release notes') > doneIndex)
})

test('list --json returns the grouped view', () => {
  const root = tempRoot()
  run(root, ['add', 'One'])
  run(root, ['add', 'Two', '--status', 'in_progress'])
  const listed = JSON.parse(run(root, ['list', '--json']).stdout)
  assert.equal(listed.columns.backlog.length, 1)
  assert.equal(listed.columns.running.length, 1)
  assert.equal(listed.summary.total, 2)
})

test('render writes an html file', () => {
  const root = tempRoot()
  run(root, ['add', 'Card'])
  const rendered = run(root, ['render']).stdout.trim()
  assert.ok(rendered.endsWith('board.html'))
  const html = fs.readFileSync(rendered, 'utf8')
  assert.match(html, /Card/)
  assert.match(html, /"id":"backlog"/)
})

test('errors surface the domain code and exit non-zero', () => {
  const root = tempRoot()
  run(root, ['add', 'Broken'])
  const blocked = run(root, ['block', '1', '--reason', 'no key'])
  assert.equal(blocked.status, 0)
  const failed = run(root, ['move', '1', '--to', 'done'], { expectFailure: true })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /BLOCKER_ACTIVE|CANNOT_MOVE/)
})

test('help is printable', () => {
  const output = execFileSync(process.execPath, [cli, 'help'], { encoding: 'utf8' })
  assert.match(output, /codex-kanban board/)
})
