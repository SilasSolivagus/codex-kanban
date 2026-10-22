import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CLI = fileURLToPath(new URL('../plugin/bin/codex-kanban.mjs', import.meta.url))

function run(root, args, { expectFailure = false } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args, '--root', root], {
    encoding: 'utf8',
    env: { ...process.env },
  })
  if (!expectFailure && result.status !== 0) {
    throw new Error(`cli failed (${result.status}): ${result.stderr}\n${result.stdout}`)
  }
  return result
}

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-cli-'))
  fs.mkdirSync(path.join(root, '.git'))
  return root
}

function jsonBoard(root) {
  return JSON.parse(run(root, ['list', '--json']).stdout)
}

test('add then board reports the task under Backlog', () => {
  const root = tempRoot()

  const added = run(root, ['add', 'Write the release notes', '--priority', 'high'])
  assert.match(added.stdout, /-1 · Write the release notes · backlog · v1/)

  const board = run(root, ['board'])
  assert.match(board.stdout, /## Backlog/)
  assert.ok(board.stdout.indexOf('Write the release notes') > board.stdout.indexOf('## Backlog'))
})

test('move to running and ask surfaces the task under Needs you', () => {
  const root = tempRoot()
  run(root, ['add', 'Write the release notes'])

  const moved = run(root, ['move', '1', '--to', 'running'])
  assert.match(moved.stdout, /· in_progress · v2/)

  const asked = run(root, [
    'ask', '1',
    '--prompt', 'Ship today?',
    '--option', 'Yes',
    '--option', 'No',
  ])
  assert.equal(asked.status, 0)

  const board = run(root, ['board'])
  assert.match(board.stdout, /## Needs you/)
  assert.match(board.stdout, /question: Ship today\?/)
})

test('answer then approve moves the task to Done and clears Needs you', () => {
  const root = tempRoot()
  run(root, ['add', 'Write the release notes'])
  run(root, ['move', '1', '--to', 'running'])
  run(root, ['ask', '1', '--prompt', 'Ship today?', '--option', 'Yes', '--option', 'No'])

  const answered = run(root, ['answer', '1', '--option', 'opt_1', '--note', 'go'])
  assert.equal(answered.status, 0)
  assert.match(answered.stdout, /· v4\n$/)

  const approved = run(root, ['approve', '1', '--confirmed-by', 'user said ship it'])
  assert.match(approved.stdout, /· done · v5\n$/)

  const board = run(root, ['board'])
  assert.match(board.stdout, /## Done/)
  assert.match(board.stdout, /Nothing needs you right now/)
  assert.ok(board.stdout.indexOf('Write the release notes') > board.stdout.indexOf('## Done'))
})

test('list --json prints the grouped view with summary counts', () => {
  const root = tempRoot()
  run(root, ['add', 'One'])
  run(root, ['add', 'Two', '--status', 'in_progress'])

  const view = jsonBoard(root)
  assert.equal(view.columns.backlog.length, 1)
  assert.equal(view.columns.running.length, 1)
  assert.equal(view.columns.needs.length, 0)
  assert.equal(view.columns.done.length, 0)
  assert.equal(view.summary.total, 2)
  assert.equal(view.summary.needsYou, 0)
  assert.equal(view.summary.counts.backlog, 1)
  assert.equal(view.summary.counts.running, 1)
})

test('render writes .kanban/board.html with the embedded board', () => {
  const root = tempRoot()
  run(root, ['add', 'Card'])

  const rendered = run(root, ['render'])
  const target = rendered.stdout.trim()
  assert.ok(target.endsWith(`${path.sep}board.html`), target)
  assert.ok(fs.existsSync(target), target)

  const html = fs.readFileSync(target, 'utf8')
  assert.match(html, /Card/)
  assert.match(html, /"id":"backlog"/)
})

test('domain errors print the code and exit non-zero', () => {
  const root = tempRoot()
  run(root, ['add', 'Broken'])
  run(root, ['block', '1', '--reason', 'no API key'])

  const failed = run(root, ['move', '1', '--to', 'done'], { expectFailure: true })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /^\[(BLOCKER_ACTIVE|CANNOT_MOVE)\] /m)
  assert.match(failed.stderr, /unblock/)
  assert.equal(failed.stdout, '')
})

test('help prints the command list', () => {
  const root = tempRoot()
  const output = run(root, ['help']).stdout
  assert.match(output, /Usage:/)
  assert.match(output, /codex-kanban board/)
  assert.match(output, /codex-kanban approve/)
  assert.match(output, /--root PATH/)
})

test('approve without --confirmed-by fails without changing the task', () => {
  const root = tempRoot()
  run(root, ['add', 'Needs approval'])
  const before = jsonBoard(root).columns.backlog[0]

  const failed = run(root, ['approve', '1'], { expectFailure: true })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /^\[HUMAN_DECISION_REQUIRED\] /m)
  assert.match(failed.stderr, /confirmed-by/)

  const after = jsonBoard(root).columns.backlog[0]
  assert.equal(after.status, 'backlog')
  assert.equal(after.version, before.version)
})

test('update, comment and get go through the cli', () => {
  const root = tempRoot()
  run(root, ['add', 'Draft the plan'])

  const updated = run(root, [
    'update', '1',
    '--title', 'Draft the release plan',
    '--priority', 'urgent',
    '--label', 'docs',
    '--label', 'release',
  ])
  assert.match(updated.stdout, /Draft the release plan · backlog · v2/)

  const commented = run(root, ['comment', '1', '--body', 'Looks good'])
  assert.match(commented.stdout, /· v3/)

  const detail = run(root, ['get', '1'])
  assert.match(detail.stdout, /Draft the release plan/)
  assert.match(detail.stdout, /## Comments/)
  assert.match(detail.stdout, /Looks good/)

  const task = jsonBoard(root).columns.backlog[0]
  assert.equal(task.priority, 'urgent')
  assert.deepEqual(task.labels, ['docs', 'release'])
})

test('an explicit stale --version fails with a version conflict', () => {
  const root = tempRoot()
  run(root, ['add', 'Versioned'])
  run(root, ['update', '1', '--title', 'First', '--version', '1'])

  const stale = run(root, ['update', '1', '--title', 'Second', '--version', '1'], {
    expectFailure: true,
  })
  assert.match(stale.stderr, /^\[TASK_VERSION_CONFLICT\] /m)

  assert.equal(jsonBoard(root).columns.backlog[0].title, 'First')
})

test('reject requires a confirmation and sends the task back to Backlog', () => {
  const root = tempRoot()
  run(root, ['add', 'Risky change'])
  run(root, ['ask', '1', '--prompt', 'Proceed?', '--option', 'Yes', '--option', 'No'])

  const failed = run(root, ['reject', '1'], { expectFailure: true })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /confirmed-by/)

  const rejected = run(root, ['reject', '1', '--confirmed-by', 'human said no'])
  assert.match(rejected.stdout, /· backlog · v3\n$/)
  assert.equal(jsonBoard(root).columns.backlog[0].status, 'backlog')
})

test('board filters by column and can hide Done', () => {
  const root = tempRoot()
  run(root, ['add', 'Still open'])
  run(root, ['add', 'Already done', '--status', 'done'])

  const noDone = run(root, ['board', '--no-done'])
  assert.doesNotMatch(noDone.stdout, /## Done/)
  assert.doesNotMatch(noDone.stdout, /Already done/)

  const backlogOnly = run(root, ['board', '--column', 'backlog'])
  assert.match(backlogOnly.stdout, /## Backlog/)
  assert.doesNotMatch(backlogOnly.stdout, /## Done/)
})

test('without --root the nearest git root is used', () => {
  const root = tempRoot()
  const env = { ...process.env }
  delete env.CODEX_KANBAN_ROOT
  const result = spawnSync(process.execPath, [CLI, 'add', 'From the working tree'], {
    cwd: root,
    encoding: 'utf8',
    env,
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /-1 · From the working tree · backlog · v1/)
  assert.ok(fs.existsSync(path.join(root, '.kanban', 'board.json')))
})

test('open writes the board and still succeeds when no opener exists', () => {
  const root = tempRoot()
  run(root, ['add', 'Offline board'])

  const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-path-'))
  const opened = spawnSync(process.execPath, [CLI, 'open', '--root', root], {
    encoding: 'utf8',
    env: { ...process.env, PATH: emptyPath },
  })

  assert.equal(opened.status, 0, opened.stderr)
  assert.match(opened.stdout, /board\.html/)
  assert.ok(fs.existsSync(path.join(fs.realpathSync(root), '.kanban', 'board.html')))
})
