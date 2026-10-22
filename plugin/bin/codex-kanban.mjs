#!/usr/bin/env node
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import {
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
  if (key === 'option' || key === 'label' || key === 'link') {
    flags[key] = flags[key] ? [...flags[key], value] : [value]
  } else {
    flags[key] = value
  }
}

const usage = `codex-kanban — a Codex-native task board

Usage:
  codex-kanban board [--column needs|running|backlog|done] [--no-done] [--root PATH]
  codex-kanban list [--json]
  codex-kanban get <id>
  codex-kanban add <title> [--description TEXT] [--priority LEVEL] [--label NAME]... [--status STATUS]
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

Every command accepts --root PATH and --json.
`

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

function printTask(result) {
  const task = result.task
  process.stdout.write(`${task.identifier} · ${task.title} · ${task.status} · v${task.version}\n`)
}

async function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2))
  const command = positional[0]
  if (!command || command === 'help' || flags.help) {
    process.stdout.write(usage)
    return
  }
  const root = resolveRoot(flags.root)
  const store = createStore({ root })
  const actor = typeof flags.as === 'string' ? flags.as : 'user'
  const as = { as: actor }

  switch (command) {
    case 'board': {
      const board = store.read()
      process.stdout.write(`${renderMarkdown(board, {
        column: flags.column,
        includeDone: !flags['no-done'],
      })}\n`)
      return
    }
    case 'list': {
      const view = boardView(store.read())
      if (flags.json) {
        process.stdout.write(`${JSON.stringify(view, null, 2)}\n`)
        return
      }
      for (const column of ['needs', 'running', 'backlog', 'done']) {
        for (const task of view.columns[column]) {
          process.stdout.write(`${column.padEnd(8)} ${task.identifier.padEnd(10)} ${task.title}\n`)
        }
      }
      return
    }
    case 'get': {
      const result = requireTask(store, positional[1])
      process.stdout.write(`${renderTaskDetail(result)}\n`)
      return
    }
    case 'add': {
      const title = positional[1]
      if (!title) return fail('add needs a title')
      const result = await createTask(store, {
        title,
        description: flags.description,
        priority: flags.priority,
        status: flags.status,
        labels: toArray(flags.label),
        as: actor,
        root,
      })
      printTask(result)
      return
    }
    case 'move': {
      const task = requireTask(store, positional[1])
      const result = await moveTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        to: flags.to,
        ...as,
      })
      printTask(result)
      return
    }
    case 'block': {
      const task = requireTask(store, positional[1])
      const result = await blockTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        reason: flags.reason,
        ...as,
      })
      printTask(result)
      return
    }
    case 'unblock': {
      const task = requireTask(store, positional[1])
      const result = await unblockTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        ...as,
      })
      printTask(result)
      return
    }
    case 'ask': {
      const task = requireTask(store, positional[1])
      const options = toArray(flags.option).map((label) => ({ label }))
      const result = await askTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        prompt: flags.prompt,
        note: flags.note,
        options,
        ...as,
      })
      process.stdout.write(`Question posted on ${result.task.identifier}\n`)
      return
    }
    case 'answer': {
      const task = requireTask(store, positional[1])
      const result = await answerTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        option: Array.isArray(flags.option) ? flags.option[0] : flags.option,
        note: flags.note,
        ...as,
      })
      process.stdout.write(`Answer recorded on ${result.task.identifier}\n`)
      return
    }
    case 'approve': {
      const task = requireTask(store, positional[1])
      const result = await approveTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        note: flags.note,
        as: 'user',
      })
      printTask(result)
      return
    }
    case 'reject': {
      const task = requireTask(store, positional[1])
      const result = await rejectTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        note: flags.note,
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
        body: flags.body,
        ...as,
      })
      process.stdout.write(`Comment added to ${result.task.identifier}\n`)
      return
    }
    case 'render': {
      const board = store.read()
      const target = `${store.path.replace(/board\.json$/, '')}board.html`
      fs.writeFileSync(target, renderHtml(board), 'utf8')
      process.stdout.write(`${target}\n`)
      if (flags.open) openInBrowser(target)
      return
    }
    case 'open': {
      const target = `${store.path.replace(/board\.json$/, '')}board.html`
      fs.mkdirSync(store.dir, { recursive: true })
      fs.writeFileSync(target, renderHtml(store.read()), 'utf8')
      openInBrowser(target)
      return
    }
    case 'update': {
      const task = requireTask(store, positional[1])
      const result = await updateTask(store, {
        id: task.identifier,
        version: versionOf(flags, task),
        title: flags.title,
        description: flags.description,
        priority: flags.priority,
        labels: flags.label ? toArray(flags.label) : undefined,
        ...as,
      })
      printTask(result)
      return
    }
    default:
      fail(`unknown command: ${command}\n\n${usage}`)
  }
}

function toArray(value) {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

function versionOf(flags, task) {
  return flags.version !== undefined ? Number(flags.version) : task.version
}

function requireTask(store, id) {
  if (!id) {
    fail('this command needs a task id')
    process.exit(1)
  }
  const board = store.read()
  const reference = /^\d+$/.test(id) ? `${board.project.prefix}-${id}` : id
  const task = findTask(board, reference)
  if (!task) {
    fail(`no task matches ${id}`)
    process.exit(1)
  }
  return task
}

function openInBrowser(target) {
  const platform = process.platform
  const opener = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = platform === 'win32' ? ['/c', 'start', '', target] : [target]
  try {
    const child = spawn(opener, args, { detached: true, stdio: 'ignore' })
    child.unref()
  } catch {
    process.stdout.write(`open this file manually: ${target}\n`)
  }
}

main().catch((error) => {
  fail(`${error.code ? `[${error.code}] ` : ''}${error.message}`)
})
