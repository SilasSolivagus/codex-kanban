import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from '../plugin/src/store.mjs'
import { createProject } from '../plugin/src/domain.mjs'

const CLI = fileURLToPath(new URL('../plugin/bin/codex-kanban.mjs', import.meta.url))

function run(root, args, { expectFailure = false, extraEnv = {} } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args, '--root', root], {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
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

function codexHome(root) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-cli-codex-'))
  const dir = path.join(home, 'sessions', '2026', '10', '20')
  fs.mkdirSync(dir, { recursive: true })
  const rollout = (id, cwd, messages) => {
    const file = path.join(dir, `rollout-2026-10-20T10-00-00-${id}.jsonl`)
    const lines = [JSON.stringify({ type: 'session_meta', payload: { id, cwd } })]
    for (const message of messages) {
      lines.push(JSON.stringify({ type: 'event_msg', payload: { type: 'user_message', message } }))
    }
    fs.writeFileSync(file, `${lines.join('\n')}\n`)
  }
  rollout('session-inside', root, ['Fix the importer', 'Add CLI coverage'])
  rollout('session-outside', path.join(root, '..', 'elsewhere'), ['Other repo', 'Other second turn'])
  fs.writeFileSync(
    path.join(home, 'session_index.jsonl'),
    `${JSON.stringify({
      id: 'session-inside',
      thread_name: 'Fix the importer',
      updated_at: '2026-10-20T12:00:00Z',
    })}\n`,
  )
  return home
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

test('import is a dry run by default and writes nothing', () => {
  const root = tempRoot()
  const home = codexHome(root)
  const preview = run(root, ['import'], { extraEnv: { CODEX_HOME: home } })

  assert.match(preview.stdout, /^# \| date \| turns \| title \| summary$/m)
  assert.match(preview.stdout, /Fix the importer/)
  assert.doesNotMatch(preview.stdout, /Other repo/)
  assert.match(preview.stdout, /1 candidates; re-run with --apply to create them/)
  assert.equal(fs.existsSync(path.join(root, '.kanban', 'board.json')), false)

  const json = run(root, ['import', '--json'], { extraEnv: { CODEX_HOME: home } })
  const payload = JSON.parse(json.stdout)
  assert.equal(payload.ok, true)
  assert.deepEqual(payload.candidates.map((entry) => entry.title), ['Fix the importer'])
  assert.equal(fs.existsSync(path.join(root, '.kanban', 'board.json')), false)
})

test('import --apply creates Backlog tasks with the imported label and source', () => {
  const root = tempRoot()
  const home = codexHome(root)
  const applied = run(root, ['import', '--apply'], { extraEnv: { CODEX_HOME: home } })

  assert.match(applied.stdout, /-1 · Fix the importer/)
  assert.match(applied.stdout, /created 1 tasks; skipped 0 duplicates/)

  const board = jsonBoard(root)
  assert.equal(board.columns.backlog.length, 1)
  const [task] = board.columns.backlog
  assert.equal(task.title, 'Fix the importer')
  assert.equal(task.status, 'backlog')
  assert.equal(task.description, 'Add CLI coverage')
  assert.deepEqual(task.labels, ['imported'])
  assert.deepEqual(task.source, {
    kind: 'session',
    id: 'session-inside',
    title: 'Fix the importer',
  })

  const again = run(root, ['import', '--apply', '--json'], { extraEnv: { CODEX_HOME: home } })
  const second = JSON.parse(again.stdout)
  assert.equal(second.ok, true)
  assert.deepEqual(second.created, [])
  assert.equal(second.skipped[0].reason, 'duplicate')
  assert.equal(jsonBoard(root).columns.backlog.length, 1)
})

test('import --project creates in the named project and validates --since', async () => {
  const root = tempRoot()
  const home = codexHome(root)
  const store = createStore({ root })
  const { project } = await createProject(store, { name: 'Website', prefix: 'WEB' })

  const applied = run(root, ['import', '--apply', '--project', 'Website'], {
    extraEnv: { CODEX_HOME: home },
  })
  assert.match(applied.stdout, /WEB-1 · Fix the importer/)

  const board = jsonBoard(root)
  assert.equal(board.columns.backlog.length, 1)
  assert.equal(board.columns.backlog[0].projectId, project.id)

  const failed = run(root, ['import', '--since', 'soon'], {
    expectFailure: true,
    extraEnv: { CODEX_HOME: home },
  })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /^\[INVALID_INPUT\] --since /m)
  assert.equal(jsonBoard(root).columns.backlog.length, 1)
})
