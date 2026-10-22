import { randomUUID } from 'node:crypto'
import {
  COLUMNS,
  PRIORITIES,
  STATUSES,
  attentionReason,
  canDrop,
  columnForTask,
  elapsedStart,
  nextIdentifier,
  sortTasks,
  statusForColumn,
} from './rules.mjs'

const MAX_TITLE = 240
const MAX_DESCRIPTION = 100000
const MAX_REASON = 2000
const MAX_COMMENT = 10000
const MAX_OPTIONS = 5
const MIN_OPTIONS = 2
const MAX_LINKS = 50
const MAX_LABELS = 20

export class KanbanError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  return { ok: false, code, message }
}

function ok(task, extra = {}) {
  return { ok: true, task, ...extra }
}

function nowIso() {
  return new Date().toISOString()
}

function actorOf(input) {
  const type = input?.as === 'user' ? 'user' : 'agent'
  const name = typeof input?.actor === 'string' && input.actor.trim()
    ? input.actor.trim().slice(0, 80)
    : type === 'user' ? 'you' : 'codex'
  return { type, name }
}

function requireString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new KanbanError('INVALID_INPUT', `${field} is required`)
  }
  const trimmed = value.trim()
  if (trimmed.length > max) {
    throw new KanbanError('INVALID_INPUT', `${field} must be at most ${max} characters`)
  }
  return trimmed
}

function optionalString(value, field, max) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    throw new KanbanError('INVALID_INPUT', `${field} must be a string`)
  }
  if (value.length > max) {
    throw new KanbanError('INVALID_INPUT', `${field} must be at most ${max} characters`)
  }
  return value
}

function normalizeLabels(value) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new KanbanError('INVALID_INPUT', 'labels must be an array')
  const labels = []
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new KanbanError('INVALID_INPUT', 'labels must be non-empty strings')
    }
    const label = entry.trim().slice(0, 64)
    if (!labels.includes(label)) labels.push(label)
  }
  if (labels.length > MAX_LABELS) {
    throw new KanbanError('INVALID_INPUT', `labels must have at most ${MAX_LABELS} entries`)
  }
  return labels
}

function normalizeLinks(value) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) throw new KanbanError('INVALID_INPUT', 'links must be an array')
  const links = value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new KanbanError('INVALID_INPUT', 'each link needs a label and an http(s) url')
    }
    const label = requireString(entry.label, 'link.label', 120)
    const url = requireString(entry.url, 'link.url', 2048)
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      throw new KanbanError('INVALID_INPUT', `link.url is not a valid url: ${url}`)
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new KanbanError('INVALID_INPUT', 'link.url must use http or https')
    }
    return { id: `lnk_${randomUUID().slice(0, 8)}`, label, url }
  })
  if (links.length > MAX_LINKS) {
    throw new KanbanError('INVALID_INPUT', `links must have at most ${MAX_LINKS} entries`)
  }
  return links
}

export function findTask(board, ref) {
  if (typeof ref !== 'string' || !ref.trim()) {
    throw new KanbanError('TASK_NOT_FOUND', 'task id or identifier is required')
  }
  const needle = ref.trim().toLowerCase()
  return board.tasks.find(
    (task) => task.id.toLowerCase() === needle || task.identifier.toLowerCase() === needle,
  )
}

function mustFindTask(board, ref) {
  const task = findTask(board, ref)
  if (!task) throw new KanbanError('TASK_NOT_FOUND', `no task matches ${ref}`)
  return task
}

function checkVersion(task, version) {
  if (version === undefined || version === null) {
    throw new KanbanError('VERSION_REQUIRED', `pass version ${task.version} from kanban_task_get`)
  }
  if (Number(version) !== task.version) {
    throw new KanbanError(
      'TASK_VERSION_CONFLICT',
      `task ${task.identifier} is at version ${task.version}, not ${version}; read it again`,
    )
  }
}

function touch(task, actor, kind, summary, changes = []) {
  task.version += 1
  task.updatedAt = nowIso()
  task.activity.push({ at: task.updatedAt, actor, kind, summary, changes })
  if (task.activity.length > 200) task.activity = task.activity.slice(-200)
}

function requireAttentionFree(task, action) {
  const attention = attentionReason(task)
  if (attention === 'blocked') {
    throw new KanbanError('BLOCKER_ACTIVE', `unblock ${task.identifier} before ${action}`)
  }
  if (attention === 'question') {
    throw new KanbanError('QUESTION_OPEN', `answer or reject the question on ${task.identifier} first`)
  }
}

export async function createTask(store, input = {}) {
  const title = requireString(input.title, 'title', MAX_TITLE)
  const description = optionalString(input.description, 'description', MAX_DESCRIPTION)
  const priority = input.priority ?? 'none'
  if (!PRIORITIES.includes(priority)) {
    throw new KanbanError('INVALID_INPUT', `priority must be one of ${PRIORITIES.join(', ')}`)
  }
  const status = input.status ?? 'backlog'
  if (!STATUSES.includes(status)) {
    throw new KanbanError('INVALID_INPUT', `status must be one of ${STATUSES.join(', ')}`)
  }
  const labels = normalizeLabels(input.labels)
  const links = normalizeLinks(input.links)
  const actor = actorOf(input)

  return store.mutate((board) => {
    const identifier = nextIdentifier(
      { prefix: board.project.prefix, nextTaskNumber: board.nextTaskNumber },
      board.tasks,
    )
    const createdAt = nowIso()
    const sortOrder = board.tasks.reduce((max, task) => Math.max(max, task.sortOrder || 0), 0) + 1024
    const task = {
      id: `tsk_${randomUUID()}`,
      identifier,
      title,
      description,
      status,
      priority,
      labels,
      assignee: actor,
      sortOrder,
      statusSince: createdAt,
      blockedReason: null,
      blockedSince: null,
      pendingQuestion: null,
      questionResolution: null,
      links,
      comments: [],
      activity: [
        {
          at: createdAt,
          actor,
          kind: 'created',
          summary: `created ${identifier} in ${status}`,
          changes: [],
        },
      ],
      version: 1,
      createdAt,
      updatedAt: createdAt,
    }
    board.tasks.push(task)
    board.nextTaskNumber = Number(identifier.split('-').pop()) + 1
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function updateTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const changes = []
    if (input.title !== undefined) {
      const next = requireString(input.title, 'title', MAX_TITLE)
      if (next !== task.title) changes.push({ field: 'title', before: task.title, after: next })
      task.title = next
    }
    if (input.description !== undefined) {
      const next = optionalString(input.description, 'description', MAX_DESCRIPTION)
      if (next !== task.description) {
        changes.push({ field: 'description', before: task.description, after: next })
      }
      task.description = next
    }
    if (input.priority !== undefined) {
      if (!PRIORITIES.includes(input.priority)) {
        throw new KanbanError('INVALID_INPUT', `priority must be one of ${PRIORITIES.join(', ')}`)
      }
      if (input.priority !== task.priority) {
        changes.push({ field: 'priority', before: task.priority, after: input.priority })
      }
      task.priority = input.priority
    }
    if (input.labels !== undefined) {
      const next = normalizeLabels(input.labels)
      changes.push({ field: 'labels', before: task.labels, after: next })
      task.labels = next
    }
    if (input.links !== undefined) {
      const next = normalizeLinks(input.links)
      changes.push({ field: 'links', before: task.links.length, after: next.length })
      task.links = next
    }
    if (input.archived === true) {
      throw new KanbanError('INVALID_INPUT', 'archive is not supported; move the task to canceled instead')
    }
    if (!changes.length) return ok(task, { unchanged: true, board: summarizeBoard(board) })
    touch(task, actor, 'updated', `updated ${changes.map((change) => change.field).join(', ')}`, changes)
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function moveTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const target = typeof input.to === 'string' ? input.to.trim() : ''
    if (!target) throw new KanbanError('INVALID_INPUT', 'to is required (column or status)')

    if (target === 'needs') {
      throw new KanbanError('CANNOT_MOVE_TO_NEEDS', 'Needs you is computed; answer, unblock or reject instead')
    }
    const status = STATUSES.includes(target) ? target : statusForColumn(target)
    if (!status) {
      throw new KanbanError('INVALID_INPUT', `unknown column or status: ${target}`)
    }
    const column = columnForTask({ ...task, status })
    const drop = canDrop({ ...task, status }, column)
    if (!drop.ok) {
      throw new KanbanError('CANNOT_MOVE', drop.reason)
    }
    if (status === 'done') requireAttentionFree(task, 'moving to Done')
    if (status === task.status) {
      return ok(task, { unchanged: true, board: summarizeBoard(board) })
    }
    const before = task.status
    task.status = status
    task.statusSince = nowIso()
    touch(task, actor, 'moved', `moved ${task.identifier} from ${before} to ${status}`, [
      { field: 'status', before, after: status },
    ])
    return ok(task, { board: summarizeBoard(board) })
  })
}

function labelForSelected(question) {
  if (!question || !question.selected) return null
  const option = question.options.find((entry) => entry.id === question.selected)
  return option ? option.label : null
}

export async function blockTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const reason = requireString(input.reason, 'reason', MAX_REASON)
    if (task.blockedReason === reason) return ok(task, { unchanged: true, board: summarizeBoard(board) })
    task.blockedReason = reason
    task.blockedSince = nowIso()
    touch(task, actor, 'blocked', `blocked ${task.identifier}: ${reason}`, [
      { field: 'blockedReason', before: null, after: reason },
    ])
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function unblockTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (!task.blockedReason) return ok(task, { unchanged: true, board: summarizeBoard(board) })
    const before = task.blockedReason
    task.blockedReason = null
    task.blockedSince = null
    touch(task, actor, 'unblocked', `unblocked ${task.identifier}`, [
      { field: 'blockedReason', before, after: null },
    ])
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function askTask(store, input = {}) {
  const actor = actorOf(input)
  const prompt = requireString(input.prompt, 'prompt', 2000)
  const note = optionalString(input.note, 'note', 2000)
  const options = Array.isArray(input.options) ? input.options : []
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new KanbanError('INVALID_INPUT', `options must contain ${MIN_OPTIONS}-${MAX_OPTIONS} entries`)
  }
  const normalized = options.map((option, index) => {
    if (!option || typeof option !== 'object') {
      throw new KanbanError('INVALID_INPUT', 'each option needs a label')
    }
    return {
      id: `opt_${index + 1}`,
      label: requireString(option.label, 'option.label', 200),
      detail: optionalString(option.detail, 'option.detail', 1000),
    }
  })

  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (task.pendingQuestion && !task.questionResolution) {
      throw new KanbanError('QUESTION_OPEN', `task ${task.identifier} already waits for an answer`)
    }
    task.pendingQuestion = {
      prompt,
      note,
      options: normalized,
      selected: null,
      answerNote: '',
      createdAt: nowIso(),
    }
    task.questionResolution = null
    touch(task, actor, 'question', `asked: ${prompt}`)
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function answerTask(store, input = {}) {
  const actor = actorOf(input)
  const note = optionalString(input.note, 'note', 2000)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (!task.pendingQuestion) {
      throw new KanbanError('NO_QUESTION', `task ${task.identifier} has no open question`)
    }
    if (task.questionResolution) {
      throw new KanbanError('QUESTION_CLOSED', `task ${task.identifier} is already resolved`)
    }
    const optionId = typeof input.option === 'string' ? input.option.trim() : ''
    const selected = optionId
      ? task.pendingQuestion.options.find((entry) => entry.id === optionId || entry.label === optionId)
      : null
    if (optionId && !selected) {
      throw new KanbanError('INVALID_INPUT', `unknown option: ${optionId}`)
    }
    task.pendingQuestion.selected = selected ? selected.id : null
    task.pendingQuestion.answerNote = note
    touch(task, actor, 'answered', selected ? `answered: ${selected.label}` : 'recorded an answer note')
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function approveTask(store, input = {}) {
  const actor = actorOf(input)
  if (actor.type !== 'user') {
    throw new KanbanError('HUMAN_DECISION_REQUIRED', 'approve requires as:"user" and an explicit human decision')
  }
  const note = optionalString(input.note, 'note', 2000)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (task.status === 'done' && task.questionResolution?.decision === 'approve') {
      return ok(task, { unchanged: true, board: summarizeBoard(board) })
    }
    if (task.blockedReason) {
      throw new KanbanError('BLOCKER_ACTIVE', `unblock ${task.identifier} before approving it`)
    }
    const before = task.status
    const at = nowIso()
    if (task.pendingQuestion) {
      if (!task.pendingQuestion.selected) {
        throw new KanbanError('ANSWER_REQUIRED', 'pick an option with kanban_task_answer before approving')
      }
      task.questionResolution = {
        decision: 'approve',
        optionId: task.pendingQuestion.selected,
        optionLabel: labelForSelected(task.pendingQuestion),
        note: note || task.pendingQuestion.answerNote || '',
        at,
      }
    }
    task.status = 'done'
    task.statusSince = at
    touch(task, actor, 'approved', `approved ${task.identifier}`, [
      { field: 'status', before, after: 'done' },
    ])
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function rejectTask(store, input = {}) {
  const actor = actorOf(input)
  if (actor.type !== 'user') {
    throw new KanbanError('HUMAN_DECISION_REQUIRED', 'reject requires as:"user" and an explicit human decision')
  }
  const note = optionalString(input.note, 'note', 2000)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (task.status === 'done') {
      throw new KanbanError('INVALID_INPUT', 'this task is already done')
    }
    const at = nowIso()
    task.questionResolution = {
      decision: 'reject',
      optionId: task.pendingQuestion?.selected ?? null,
      optionLabel: labelForSelected(task.pendingQuestion),
      note,
      at,
    }
    const before = task.status
    task.status = 'backlog'
    task.statusSince = at
    task.blockedReason = null
    task.blockedSince = null
    touch(task, actor, 'rejected', `rejected ${task.identifier} back to backlog`, [
      { field: 'status', before, after: 'backlog' },
    ])
    return ok(task, { board: summarizeBoard(board) })
  })
}

export async function addComment(store, input = {}) {
  const actor = actorOf(input)
  const body = requireString(input.body, 'body', MAX_COMMENT)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const comment = { id: `cmt_${randomUUID()}`, body, author: actor, createdAt: nowIso() }
    task.comments.push(comment)
    touch(task, actor, 'commented', body.slice(0, 120))
    return ok(task, { comment, board: summarizeBoard(board) })
  })
}

export function decorateTask(task) {
  const column = columnForTask(task)
  return {
    ...task,
    column,
    attention: attentionReason(task),
    attentionSince: attentionReason(task) ? elapsedStart(task) : null,
  }
}

export function summarizeBoard(board) {
  const counts = { backlog: 0, running: 0, needs: 0, done: 0, canceled: 0 }
  for (const task of board.tasks) {
    const column = columnForTask(task)
    if (column) counts[column] += 1
    else counts.canceled += 1
  }
  return {
    project: board.project,
    counts,
    total: board.tasks.length,
    needsYou: counts.needs,
  }
}

export function boardView(board, { column, includeDone = true, includeCanceled = false } = {}) {
  const groups = new Map(COLUMNS.map((entry) => [entry.id, []]))
  for (const task of board.tasks) {
    const columnId = columnForTask(task)
    if (!columnId) {
      if (includeCanceled) groups.get('done').push(decorateTask(task))
      continue
    }
    if (columnId === 'done' && !includeDone) continue
    groups.get(columnId).push(decorateTask(task))
  }
  for (const list of groups.values()) list.sort(sortTasks)
  const selected = column ? groups.get(column) ?? [] : null
  return {
    project: board.project,
    summary: summarizeBoard(board),
    columns: Object.fromEntries(groups),
    tasks: selected ?? board.tasks.map(decorateTask),
  }
}

export function getTaskView(store, input = {}) {
  const board = store.read()
  const task = mustFindTask(board, input.id ?? input.identifier)
  return ok(decorateTask(task), { board: summarizeBoard(board) })
}
