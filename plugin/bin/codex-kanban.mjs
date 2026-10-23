#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import {
  KanbanError,
  addComment,
  answerTask,
  approveTask,
  askTask,
  blockTask,
  boardView,
  createTask,
  findTask,
  moveTask,
  rejectTask,
  unblockTask,
  updateTask,
} from '../src/domain.mjs'
import { renderMarkdown, renderTaskDetail } from '../src/render.mjs'
import { renderHtml } from '../src/html.mjs'
import { createStore, resolveRoot } from '../src/store.mjs'

const REPEATABLE_FLAGS = new Set(['option', 'label', 'link'])
const COLUMN_ORDER = ['needs', 'running', 'backlog', 'done']

const usage = `codex-kanban — a Codex-native task board

Usage:
  codex-kanban board [--column needs|running|backlog|done] [--no-done] [--root PATH]
  codex-kanban list [--json]
  codex-kanban get <id>
  codex-kanban add <title> [--description TEXT] [--priority LEVEL] [--label NAME]... [--status STATUS]
  codex-kanban update <id> [--title TEXT] [--description TEXT] [--priority LEVEL] [--label NAME]...
  codex-kanban move <id> --to COLUMN|STATUS [--version N] [--as agent|user]
  codex-kanban block <id> --reason TEXT
  codex-kanban unblock <id>
  codex-kanban ask <id> --prompt TEXT --option LABEL [--option LABEL]... [--note TEXT]
  codex-kanban answer <id> --option opt_1 [--note TEXT]
  codex-kanban approve <id> --confirmed-by TEXT [--note TEXT]
  codex-kanban reject <id> --confirmed-by TEXT [--note TEXT]
  codex-kanban comment <id> --body TEXT
  codex-kanban render [--open]
  codex-kanban open
  codex-kanban serve [--port 4317] [--host 127.0.0.1] [--no-open]
  codex-kanban help

Every command accepts --root PATH, --as agent|user (default user), and
--version N for commands that update an existing task. When --version is
omitted the CLI reads the current task version first. Approve and reject always
run as the human (--as user) and require --confirmed-by.
A numeric reference such as 1 resolves to <prefix>-1.
`

function parseArgv(argv) {
  const positional = []
  const flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }
    const key = arg.slice(2)
    const equals = key.indexOf('=')
    if (equals >= 0) {
      pushFlag(flags, key.slice(0, equals), key.slice(equals + 1))
      continue
    }
    const next = argv[index + 1]
    if (next !== undefined && !next.startsWith('--')) {
      pushFlag(flags, key, next)
      index += 1
    } else {
      pushFlag(flags, key, true)
    }
  }
  return { positional, flags }
}

function pushFlag(flags, key, value) {
  if (REPEATABLE_FLAGS.has(key)) {
    flags[key] = flags[key] ? [...flags[key], value] : [value]
  } else {
    flags[key] = value
  }
}

function stringFlag(flags, key) {
  return typeof flags[key] === 'string' ? flags[key] : undefined
}

function toArray(value) {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

function fail(code, message) {
  throw new KanbanError(code, message)
}

function actorOf(flags) {
  const raw = flags.as
  if (raw === undefined) return 'user'
  const actor = stringFlag(flags, 'as')
  if (actor !== 'user' && actor !== 'agent') {
    fail('INVALID_INPUT', '--as must be user or agent')
  }
  return actor
}

function requireConfirmation(flags, action) {
  const confirmedBy = stringFlag(flags, 'confirmed-by')
  if (!confirmedBy || !confirmedBy.trim()) {
    fail(
      'HUMAN_DECISION_REQUIRED',
      `${action} requires --confirmed-by "..." from the human decision`,
    )
  }
  return confirmedBy.trim()
}

function versionOf(flags, task) {
  if (flags.version === undefined) return task.version
  const version = Number(stringFlag(flags, 'version'))
  if (!Number.isInteger(version)) {
    fail('INVALID_INPUT', '--version must be an integer')
  }
  return version
}

function requireTask(store, id) {
  if (!id) fail('INVALID_INPUT', 'this command needs a task id')
  const board = store.read()
  const reference = /^\d+$/.test(id) ? `${board.project.prefix}-${id}` : id
  const task = findTask(board, reference)
  if (!task) fail('TASK_NOT_FOUND', `no task matches ${id}`)
  return task
}

function printTask(result) {
  const task = result.task
  process.stdout.write(`${task.identifier} · ${task.title} · ${task.status} · v${task.version}\n`)
}

function boardHtmlPath(store) {
  return path.join(store.dir, 'board.html')
}

function writeBoardHtml(store, board = store.read()) {
  const target = boardHtmlPath(store)
  fs.mkdirSync(store.dir, { recursive: true })
  fs.writeFileSync(target, renderHtml(board), 'utf8')
  return target
}

function openInBrowser(target) {
  const platform = process.platform
  const opener = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = platform === 'win32' ? ['/c', 'start', '', target] : [target]
  let child
  try {
    child = spawn(opener, args, { detached: true, stdio: 'ignore' })
  } catch {
    process.stderr.write(`open this file manually: ${target}\n`)
    return
  }
  child.on('error', () => {
    process.stderr.write(`could not open a browser; open this file manually: ${target}\n`)
  })
  child.unref()
}

async function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2))
  const command = positional[0]
  if (!command || command === 'help' || flags.help) {
    process.stdout.write(usage)
    return
  }

  const root = resolveRoot(stringFlag(flags, 'root'))
  const store = createStore({ root })
  const actor = actorOf(flags)

  switch (command) {
    case 'board': {
      const column = stringFlag(flags, 'column')
      if (column !== undefined && !COLUMN_ORDER.includes(column)) {
        fail('INVALID_INPUT', `column must be one of ${COLUMN_ORDER.join(', ')}`)
      }
      const markup = renderMarkdown(store.read(), {
        column,
        includeDone: flags['no-done'] !== true,
      })
      process.stdout.write(`${markup}\n`)
      return
    }
    case 'list': {
      const view = boardView(store.read())
      if (flags.json) {
        process.stdout.write(`${JSON.stringify(view, null, 2)}\n`)
        return
      }
      for (const column of COLUMN_ORDER) {
        for (const task of view.columns[column]) {
          process.stdout.write(`${column.padEnd(8)} ${task.identifier.padEnd(10)} ${task.title}\n`)
        }
      }
      return
    }
    case 'get': {
      const task = requireTask(store, positional[1])
      process.stdout.write(`${renderTaskDetail(task)}\n`)
      return
    }
    case 'add': {
      const title = positional.slice(1).join(' ')
      if (!title.trim()) fail('INVALID_INPUT', 'add needs a title')
      const result = await createTask(store, {
        title,
        description: stringFlag(flags, 'description'),
        priority: stringFlag(flags, 'priority'),
        status: stringFlag(flags, 'status'),
        labels: toArray(flags.label),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'update': {
      const task = requireTask(store, positional[1])
      const result = await updateTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        title: stringFlag(flags, 'title'),
        description: stringFlag(flags, 'description'),
        priority: stringFlag(flags, 'priority'),
        labels: flags.label === undefined ? undefined : toArray(flags.label),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'move': {
      const task = requireTask(store, positional[1])
      const result = await moveTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        to: stringFlag(flags, 'to'),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'block': {
      const task = requireTask(store, positional[1])
      const result = await blockTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        reason: stringFlag(flags, 'reason'),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'unblock': {
      const task = requireTask(store, positional[1])
      const result = await unblockTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'ask': {
      const task = requireTask(store, positional[1])
      const options = (toArray(flags.option) ?? []).map((label) => ({ label }))
      const result = await askTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        prompt: stringFlag(flags, 'prompt'),
        note: stringFlag(flags, 'note'),
        options,
        as: actor,
      })
      printTask(result)
      return
    }
    case 'answer': {
      const task = requireTask(store, positional[1])
      const option = toArray(flags.option)?.[0]
      const result = await answerTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        option,
        note: stringFlag(flags, 'note'),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'approve': {
      const confirmedBy = requireConfirmation(flags, 'approve')
      if (actor !== 'user') {
        fail('HUMAN_DECISION_REQUIRED', 'approve only runs as the human (--as user)')
      }
      const task = requireTask(store, positional[1])
      const result = await approveTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        note: stringFlag(flags, 'note') ?? confirmedBy,
        as: 'user',
      })
      printTask(result)
      return
    }
    case 'reject': {
      const confirmedBy = requireConfirmation(flags, 'reject')
      if (actor !== 'user') {
        fail('HUMAN_DECISION_REQUIRED', 'reject only runs as the human (--as user)')
      }
      const task = requireTask(store, positional[1])
      const result = await rejectTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        note: stringFlag(flags, 'note') ?? confirmedBy,
        as: 'user',
      })
      printTask(result)
      return
    }
    case 'comment': {
      const task = requireTask(store, positional[1])
      const result = await addComment(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        body: stringFlag(flags, 'body'),
        as: actor,
      })
      printTask(result)
      return
    }
    case 'render': {
      const target = writeBoardHtml(store)
      process.stdout.write(`${target}\n`)
      if (flags.open) openInBrowser(target)
      return
    }
    case 'serve': {
      const { createWebServer } = await import('../server/web.mjs')
      const port = flags.port === undefined ? 4317 : Number(flags.port)
      if (!Number.isInteger(port) || port < 0 || port > 65535) {
        return fail('--port must be an integer between 0 and 65535')
      }
      const host = typeof flags.host === 'string' ? flags.host : '127.0.0.1'
      const web = createWebServer({ store, host, port })
      const url = await web.listen()
      process.stdout.write(`Codex Kanban · ${url}\n`)
      if (flags['no-open'] !== true) openInBrowser(url)
      const shutdown = () => {
        web.close().then(() => process.exit(0))
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
      return
    }
    case 'open': {
      const target = writeBoardHtml(store)
      process.stdout.write(`${target}\n`)
      openInBrowser(target)
      return
    }
    default:
      fail('UNKNOWN_COMMAND', `unknown command: ${command}; run codex-kanban help`)
  }
}

main().catch((error) => {
  const code = typeof error?.code === 'string' ? error.code : 'KANBAN_ERROR'
  process.stderr.write(`[${code}] ${error?.message ?? 'unknown error'}\n`)
  process.exitCode = 1
})
