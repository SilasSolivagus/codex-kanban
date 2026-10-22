import fs from 'node:fs'
import path from 'node:path'
import {
  addComment,
  answerTask,
  approveTask,
  askTask,
  blockTask,
  createTask,
  getTaskView,
  moveTask,
  rejectTask,
  unblockTask,
  updateTask,
} from '../src/domain.mjs'
import { renderMarkdown, renderTaskDetail } from '../src/render.mjs'
import { renderHtml } from '../src/html.mjs'
import { createStore, resolveRoot } from '../src/store.mjs'

const BOARD_COLUMNS = ['needs', 'running', 'backlog', 'done']

const ROOT = {
  type: 'string',
  description:
    'Absolute path of the repository that owns the board. Required unless CODEX_KANBAN_ROOT is set.',
}
const ACTOR = {
  type: 'string',
  enum: ['agent', 'user'],
  default: 'agent',
  description: 'Who performs the write. Use "user" only when the human explicitly decided.',
}
const VERSION = {
  type: 'integer',
  minimum: 1,
  description: 'Current task version from kanban_task_get. Writes with a stale version are rejected.',
}
const TASK_REF = {
  type: 'string',
  description: 'Task identifier such as KAN-3, or its internal id.',
}

function schema(properties, required) {
  return { type: 'object', properties, required, additionalProperties: false }
}

export const TOOLS = [
  {
    name: 'kanban_board',
    title: 'Show the kanban board',
    description:
      'Render the repository board as Markdown: Needs you first, then Running, Backlog and Done. Use this when the user asks what is on the board or what needs them.',
    inputSchema: schema({
      root: ROOT,
      column: {
        type: 'string',
        enum: BOARD_COLUMNS,
        description: 'Limit the output to one column: needs, running, backlog or done.',
      },
      include_done: { type: 'boolean', default: true, description: 'Include the Done column.' },
    }, []),
  },
  {
    name: 'kanban_task_get',
    title: 'Read one task',
    description:
      'Return one task with description, open question, blocker, links, every comment and recent activity. Call this before any update so you have the current version.',
    inputSchema: schema({ root: ROOT, id: TASK_REF }, ['id']),
  },
  {
    name: 'kanban_task_create',
    title: 'Create a task',
    description:
      'Create a task in Backlog (or a given status) and return its identifier. Use it for work that should survive the current conversation.',
    inputSchema: schema({
      root: ROOT,
      title: { type: 'string', maxLength: 240 },
      description: { type: 'string', description: 'Details, acceptance criteria, or context.' },
      status: {
        type: 'string',
        enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'],
        default: 'backlog',
      },
      priority: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'urgent'], default: 'none' },
      labels: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      links: {
        type: 'array',
        maxItems: 50,
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, url: { type: 'string' } },
          required: ['label', 'url'],
          additionalProperties: false,
        },
      },
      as: ACTOR,
    }, ['title']),
  },
  {
    name: 'kanban_task_update',
    title: 'Update task fields',
    description:
      'Change title, description, priority, labels or links. Does not move the task; use kanban_task_move for that.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      title: { type: 'string', maxLength: 240 },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'urgent'] },
      labels: { type: 'array', items: { type: 'string' }, maxItems: 20 },
      links: {
        type: 'array',
        maxItems: 50,
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, url: { type: 'string' } },
          required: ['label', 'url'],
          additionalProperties: false,
        },
      },
      as: ACTOR,
    }, ['id', 'version']),
  },
  {
    name: 'kanban_task_move',
    title: 'Move a task',
    description:
      'Move a task to a column (backlog, running, done) or a status. Needs you is computed and cannot be chosen. Tasks with an open question or blocker cannot move to Running or Done.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      to: {
        type: 'string',
        enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled', 'running'],
        description: 'Target column or status.',
      },
      as: ACTOR,
    }, ['id', 'version', 'to']),
  },
  {
    name: 'kanban_task_block',
    title: 'Block a task',
    description:
      'Record what stops this task. It moves to Needs you until the blocker is cleared. Blockers are for missing access, decisions or dependencies, not for open questions.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      reason: { type: 'string', maxLength: 2000, description: 'One sentence the human can act on.' },
      as: ACTOR,
    }, ['id', 'version', 'reason']),
  },
  {
    name: 'kanban_task_unblock',
    title: 'Clear a blocker',
    description: 'Remove the blocker and return the task to its normal column.',
    inputSchema: schema({ root: ROOT, id: TASK_REF, version: VERSION, as: ACTOR }, ['id', 'version']),
  },
  {
    name: 'kanban_task_ask',
    title: 'Ask the human a question',
    description:
      'Put a question on the task with two to five options. It moves to Needs you. Prefer this over blocking when you need a decision rather than external work.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      prompt: { type: 'string', maxLength: 2000 },
      note: { type: 'string', maxLength: 2000 },
      options: {
        type: 'array',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', maxLength: 200 },
            detail: { type: 'string', maxLength: 1000 },
          },
          required: ['label'],
          additionalProperties: false,
        },
      },
      as: ACTOR,
    }, ['id', 'version', 'prompt', 'options']),
  },
  {
    name: 'kanban_task_answer',
    title: 'Record an answer',
    description:
      'Record the selected option and a note on an open question. The question stays in Needs you until a human approves or rejects it.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      option: { type: 'string', description: 'Option id (opt_1) or its label.' },
      note: { type: 'string', maxLength: 2000 },
      as: ACTOR,
    }, ['id', 'version']),
  },
  {
    name: 'kanban_task_approve',
    title: 'Approve (human only)',
    description:
      'Close the task as Done. Only call this after the human explicitly approved; it fails unless as is "user" and confirmed_by is set.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      note: { type: 'string', maxLength: 2000 },
      confirmed_by: { type: 'string', description: 'Short quote or summary of the human approval.' },
      as: ACTOR,
    }, ['id', 'version', 'confirmed_by']),
  },
  {
    name: 'kanban_task_reject',
    title: 'Reject (human only)',
    description:
      'Send the task back to Backlog with a rejection note. Only call this after the human explicitly rejected; it fails unless as is "user" and confirmed_by is set.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      note: { type: 'string', maxLength: 2000 },
      confirmed_by: { type: 'string', description: 'Short quote or summary of the human rejection.' },
      as: ACTOR,
    }, ['id', 'version', 'confirmed_by']),
  },
  {
    name: 'kanban_task_comment',
    title: 'Comment on a task',
    description: 'Append a comment. Use it for progress notes that should stay with the task.',
    inputSchema: schema({
      root: ROOT,
      id: TASK_REF,
      version: VERSION,
      body: { type: 'string', maxLength: 10000 },
      as: ACTOR,
    }, ['id', 'version', 'body']),
  },
  {
    name: 'kanban_render',
    title: 'Render the HTML board',
    description:
      'Write a self-contained board.html next to the store and return its absolute path plus an inline visual reference. Use it when the user wants to see the board visually; keep the Markdown board as the source of truth.',
    inputSchema: schema({ root: ROOT }, []),
  },
]

function text(value) {
  return { content: [{ type: 'text', text: value }] }
}

function failure(error) {
  const code = error?.code && typeof error.code === 'string' ? error.code : 'KANBAN_ERROR'
  return { content: [{ type: 'text', text: `ERROR ${code}: ${error?.message ?? 'unknown error'}` }], isError: true }
}

function inputError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function storeFor(args) {
  const explicit = args?.root ?? process.env.CODEX_KANBAN_ROOT
  if (!explicit) {
    throw inputError('ROOT_REQUIRED', 'pass the absolute repository path as root (or set CODEX_KANBAN_ROOT)')
  }
  return createStore({ root: resolveRoot(explicit) })
}

function requireVersion(args) {
  if (args.version === undefined || args.version === null) {
    throw inputError('VERSION_REQUIRED', 'version is required; call kanban_task_get first')
  }
}

function confirmGate(args = {}) {
  const confirmedBy = typeof args.confirmed_by === 'string' ? args.confirmed_by.trim() : ''
  if (args.as !== 'user' || !confirmedBy) {
    throw inputError(
      'HUMAN_DECISION_REQUIRED',
      'approve and reject require as:"user" and a non-empty confirmed_by from the human decision',
    )
  }
}

function validateColumn(column) {
  if (column === undefined || column === null) return undefined
  if (!BOARD_COLUMNS.includes(column)) {
    throw inputError('INVALID_INPUT', `column must be one of ${BOARD_COLUMNS.join(', ')}`)
  }
  return column
}

function describeTask(task) {
  return `${task.identifier} · ${task.title} · ${task.status} · v${task.version}`
}

export const HANDLERS = {
  async kanban_board(args) {
    const column = validateColumn(args.column)
    const store = storeFor(args)
    const board = store.read()
    return text(renderMarkdown(board, {
      column,
      // Selecting the Done column is an explicit request for it.
      includeDone: args.include_done !== false || column === 'done',
    }))
  },

  async kanban_task_get(args) {
    const store = storeFor(args)
    const result = getTaskView(store, args)
    return text(renderTaskDetail(result.task, { history: 'full' }))
  },

  async kanban_task_create(args) {
    const store = storeFor(args)
    const result = await createTask(store, args)
    const task = result.task
    return text(`Created ${describeTask(task)}.\nNext: kanban_task_get ${task.identifier} to read it, or kanban_board to see the queue.`)
  },

  async kanban_task_update(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await updateTask(store, args)
    return text(result.unchanged ? `${describeTask(result.task)} · nothing changed` : `Updated ${describeTask(result.task)}.`)
  },

  async kanban_task_move(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await moveTask(store, args)
    return text(result.unchanged ? `${describeTask(result.task)} · already there` : `Moved ${describeTask(result.task)}.`)
  },

  async kanban_task_block(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await blockTask(store, args)
    return text(`Blocked ${describeTask(result.task)}: ${result.task.blockedReason}`)
  },

  async kanban_task_unblock(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await unblockTask(store, args)
    return text(`Cleared the blocker on ${describeTask(result.task)}.`)
  },

  async kanban_task_ask(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await askTask(store, args)
    const options = result.task.pendingQuestion.options.map((option) => `${option.id}=${option.label}`).join(', ')
    return text(`Question posted on ${result.task.identifier}. Waiting for a human answer.\nOptions: ${options}`)
  },

  async kanban_task_answer(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await answerTask(store, args)
    const selected = result.task.pendingQuestion.selected
    return text(`Answer recorded on ${result.task.identifier}${selected ? `: ${selected}` : ''}. A human still has to approve or reject it.`)
  },

  async kanban_task_approve(args) {
    confirmGate(args)
    const store = storeFor(args)
    requireVersion(args)
    const result = await approveTask(store, args)
    return text(`Approved ${describeTask(result.task)}.`)
  },

  async kanban_task_reject(args) {
    confirmGate(args)
    const store = storeFor(args)
    requireVersion(args)
    const result = await rejectTask(store, args)
    return text(`Rejected ${describeTask(result.task)} back to Backlog.`)
  },

  async kanban_task_comment(args) {
    const store = storeFor(args)
    requireVersion(args)
    const result = await addComment(store, args)
    return text(`Comment added to ${describeTask(result.task)}.`)
  },

  async kanban_render(args) {
    const store = storeFor(args)
    const board = store.read()
    const outputPath = path.join(store.dir, 'board.html')
    fs.mkdirSync(store.dir, { recursive: true })
    fs.writeFileSync(outputPath, renderHtml(board), 'utf8')
    const inline = `\uE200visualize\uE202${JSON.stringify({ path: outputPath, title: `Codex Kanban · ${board.project.name}` })}\uE201`
    return text(`Wrote ${outputPath}\n\nInline reference (emit verbatim only in the Codex app):\n${inline}`)
  },
}

export async function callTool(name, args = {}) {
  const handler = HANDLERS[name]
  if (!handler) {
    return { content: [{ type: 'text', text: `ERROR UNKNOWN_TOOL: ${name}` }], isError: true }
  }
  try {
    return await handler(args ?? {})
  } catch (error) {
    return failure(error)
  }
}
