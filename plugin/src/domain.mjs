import { randomUUID } from 'node:crypto'
import path from 'node:path'
import {
  deleteAttachmentFile,
  readAttachmentFile,
  writeAttachmentFile,
} from './store.mjs'
import {
  COLUMNS,
  PRIORITIES,
  STATUSES,
  attentionReason,
  canDrop,
  columnForTask,
  elapsedStart,
  nextIdentifier,
  sortByOrder,
  sortOrderOf,
  sortTasks,
  statusForColumn,
  taskPrefixFor,
} from './rules.mjs'

const MAX_TITLE = 240
const MAX_DESCRIPTION = 100_000
const MAX_REASON = 2000
const MAX_PROMPT = 2000
const MAX_NOTE = 2000
const MAX_OPTION_LABEL = 200
const MAX_OPTION_DETAIL = 1000
const MAX_COMMENT = 10_000
const MIN_OPTIONS = 2
const MAX_OPTIONS = 5
const MAX_LINKS = 50
const MAX_LABELS = 20
const MAX_ACTOR = 80
const MAX_ACTIVITY = 200
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_FILENAME = 255
const MAX_CONTENT_TYPE = 200
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'
const MAX_PROJECT_NAME = 120
const PROJECT_PREFIX = /^[A-Z0-9]{2,6}$/
const DISPLAY_ORDER = ['needs', 'running', 'backlog', 'done']
const ORDER_GAP = 1024

export class KanbanError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'KanbanError'
    this.code = code
  }
}

function nowIso() {
  return new Date().toISOString()
}

function actorOf(input) {
  const type = input?.as === 'user' ? 'user' : 'agent'
  const name = typeof input?.actor === 'string' && input.actor.trim()
    ? input.actor.trim().slice(0, MAX_ACTOR)
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
  if (value.length > MAX_LINKS) {
    throw new KanbanError('INVALID_INPUT', `links must have at most ${MAX_LINKS} entries`)
  }
  return value.map((entry) => {
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
}

function sameStrings(a, b) {
  return a.length === b.length && a.every((entry, index) => entry === b[index])
}

function sameLinks(existing, next) {
  return existing.length === next.length
    && existing.every((link, index) => link.label === next[index].label && link.url === next[index].url)
}

export function findTask(board, ref) {
  if (!board || !Array.isArray(board.tasks)) return undefined
  if (typeof ref !== 'string' || !ref.trim()) return undefined
  const needle = ref.trim().toLowerCase()
  return board.tasks.find(
    (task) => typeof task?.id === 'string'
      && (task.id.toLowerCase() === needle || String(task.identifier).toLowerCase() === needle),
  )
}

function mustFindTask(board, ref) {
  const task = findTask(board, ref)
  if (!task) throw new KanbanError('TASK_NOT_FOUND', `no task matches ${ref}`)
  return task
}

function checkVersion(task, version) {
  if (version === undefined || version === null) {
    throw new KanbanError(
      'VERSION_REQUIRED',
      `pass version ${task.version} from kanban_task_get`,
    )
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
  if (!Array.isArray(task.activity)) task.activity = []
  task.activity.push({ at: task.updatedAt, actor, kind, summary, changes })
  if (task.activity.length > MAX_ACTIVITY) {
    task.activity = task.activity.slice(-MAX_ACTIVITY)
  }
}

function labelForSelected(question) {
  if (!question || !question.selected) return null
  const option = question.options.find((entry) => entry.id === question.selected)
  return option ? option.label : null
}

function statusForTarget(target) {
  return STATUSES.includes(target) ? target : statusForColumn(target)
}

export function findProject(board, ref) {
  if (!board || !Array.isArray(board.projects)) return undefined
  if (typeof ref !== 'string' || !ref.trim()) return undefined
  const needle = ref.trim()
  return board.projects.find((project) => project?.id === needle)
    ?? board.projects.find((project) => typeof project?.name === 'string' && project.name === needle)
}

export function listProjects(board) {
  return Array.isArray(board?.projects) ? board.projects : []
}

function mustFindProject(board, ref) {
  const project = findProject(board, ref)
  if (!project) throw new KanbanError('PROJECT_NOT_FOUND', `no project matches ${ref}`)
  return project
}

function assertProjectWritable(project) {
  if (project?.archivedAt) {
    throw new KanbanError(
      'PROJECT_ARCHIVED',
      `project ${project.name} is archived; restore it before writing`,
    )
  }
}

function projectForTask(board, task) {
  const project = listProjects(board).find((entry) => entry?.id === task?.projectId)
  if (!project) {
    throw new KanbanError(
      'PROJECT_NOT_FOUND',
      `task ${task?.identifier ?? task?.id ?? '?'} belongs to an unknown project`,
    )
  }
  return project
}

function mustFindWritableTask(board, ref) {
  const task = mustFindTask(board, ref)
  assertProjectWritable(projectForTask(board, task))
  if (task.archivedAt) {
    throw new KanbanError(
      'TASK_ARCHIVED',
      `task ${task.identifier} is archived; restore it before writing`,
    )
  }
  return task
}

function projectForCreate(board, projectId) {
  if (projectId !== undefined && projectId !== null) {
    const project = mustFindProject(board, projectId)
    assertProjectWritable(project)
    return project
  }
  const active = listProjects(board).find((project) => !project.archivedAt)
  if (!active) {
    throw new KanbanError(
      'NO_ACTIVE_PROJECT',
      'every project is archived; restore one before creating tasks',
    )
  }
  return active
}

function validatePrefix(value) {
  if (typeof value !== 'string') {
    throw new KanbanError('INVALID_INPUT', 'prefix must be a string')
  }
  const prefix = value.trim()
  if (!PROJECT_PREFIX.test(prefix)) {
    throw new KanbanError(
      'INVALID_INPUT',
      'prefix must be 2-6 uppercase letters or digits',
    )
  }
  return prefix
}

function normalizeWorkspacePath(value) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !value.trim()) {
    throw new KanbanError('INVALID_INPUT', 'workspacePath must be an absolute path')
  }
  const candidate = value.trim()
  if (!path.isAbsolute(candidate)) {
    throw new KanbanError('INVALID_INPUT', 'workspacePath must be an absolute path')
  }
  return candidate
}

function tasksForProject(board, projectId) {
  const tasks = Array.isArray(board?.tasks) ? board.tasks : []
  if (projectId === undefined || projectId === null) return tasks
  const project = findProject(board, projectId)
  const id = project ? project.id : projectId
  return tasks.filter((task) => task?.projectId === id)
}

export async function createProject(store, input = {}) {
  const name = requireString(input.name, 'name', MAX_PROJECT_NAME)
  const prefix = input.prefix === undefined || input.prefix === null || input.prefix === ''
    ? taskPrefixFor(name)
    : validatePrefix(input.prefix)
  const workspacePath = normalizeWorkspacePath(input.workspacePath)

  return store.mutate((board) => {
    const at = nowIso()
    let id
    do {
      id = `prj_${randomUUID().slice(0, 8)}`
    } while (listProjects(board).some((project) => project.id === id))
    const project = {
      id,
      name,
      prefix,
      workspacePath,
      nextTaskNumber: 1,
      archivedAt: null,
      createdAt: at,
      updatedAt: at,
    }
    if (!Array.isArray(board.projects)) board.projects = []
    board.projects.push(project)
    return { ok: true, project }
  })
}

export async function updateProject(store, input = {}) {
  const name = input.name === undefined ? undefined : requireString(input.name, 'name', MAX_PROJECT_NAME)
  const prefix = input.prefix === undefined ? undefined : validatePrefix(input.prefix)
  const workspacePath = input.workspacePath === undefined
    ? undefined
    : normalizeWorkspacePath(input.workspacePath)

  return store.mutate((board) => {
    const project = mustFindProject(board, input.id)
    assertProjectWritable(project)
    let changed = false
    if (name !== undefined && name !== project.name) {
      project.name = name
      changed = true
    }
    if (prefix !== undefined && prefix !== project.prefix) {
      project.prefix = prefix
      changed = true
    }
    if (workspacePath !== undefined && workspacePath !== project.workspacePath) {
      project.workspacePath = workspacePath
      changed = true
    }
    if (!changed) return { ok: true, project, unchanged: true }
    project.updatedAt = nowIso()
    return { ok: true, project }
  })
}

export async function archiveProject(store, input = {}) {
  return store.mutate((board) => {
    const project = mustFindProject(board, input.id)
    if (project.archivedAt) return { ok: true, project, unchanged: true }
    const at = nowIso()
    project.archivedAt = at
    project.updatedAt = at
    return { ok: true, project }
  })
}

export async function restoreProject(store, input = {}) {
  return store.mutate((board) => {
    const project = mustFindProject(board, input.id)
    if (!project.archivedAt) return { ok: true, project, unchanged: true }
    project.archivedAt = null
    project.updatedAt = nowIso()
    return { ok: true, project }
  })
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
    const project = projectForCreate(board, input.projectId)
    const identifier = nextIdentifier(project, tasksForProject(board, project.id))
    const createdAt = nowIso()
    const sortOrder = board.tasks.reduce(
      (max, task) => (Number.isFinite(task.sortOrder) ? Math.max(max, task.sortOrder) : max),
      0,
    ) + 1024
    const task = {
      id: `tsk_${randomUUID()}`,
      projectId: project.id,
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
      attachments: [],
      comments: [],
      archivedAt: null,
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
    project.nextTaskNumber = Number(identifier.slice(identifier.lastIndexOf('-') + 1)) + 1
    return { ok: true, task }
  })
}

export async function updateTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const changes = []

    if (input.title !== undefined) {
      const next = requireString(input.title, 'title', MAX_TITLE)
      if (next !== task.title) {
        changes.push({ field: 'title', before: task.title, after: next })
        task.title = next
      }
    }
    if (input.description !== undefined) {
      const next = optionalString(input.description, 'description', MAX_DESCRIPTION)
      if (next !== task.description) {
        changes.push({ field: 'description', before: task.description, after: next })
        task.description = next
      }
    }
    if (input.priority !== undefined) {
      if (!PRIORITIES.includes(input.priority)) {
        throw new KanbanError('INVALID_INPUT', `priority must be one of ${PRIORITIES.join(', ')}`)
      }
      if (input.priority !== task.priority) {
        changes.push({ field: 'priority', before: task.priority, after: input.priority })
        task.priority = input.priority
      }
    }
    if (input.labels !== undefined) {
      const next = normalizeLabels(input.labels)
      if (!sameStrings(task.labels, next)) {
        changes.push({ field: 'labels', before: task.labels, after: next })
        task.labels = next
      }
    }
    if (input.links !== undefined) {
      const next = normalizeLinks(input.links)
      if (!sameLinks(task.links, next)) {
        changes.push({
          field: 'links',
          before: task.links.map((link) => link.url),
          after: next.map((link) => link.url),
        })
        task.links = next
      }
    }

    if (!changes.length) return { ok: true, task, unchanged: true }
    touch(task, actor, 'updated', `updated ${changes.map((change) => change.field).join(', ')}`, changes)
    return { ok: true, task }
  })
}

export async function moveTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const target = typeof input.to === 'string' ? input.to.trim() : ''
    if (!target) throw new KanbanError('INVALID_INPUT', 'to is required (column or status)')
    if (target === 'needs') {
      throw new KanbanError(
        'CANNOT_MOVE_TO_NEEDS',
        'Needs you is computed; answer, unblock or reject instead',
      )
    }
    const status = statusForTarget(target)
    if (!status) {
      throw new KanbanError('INVALID_INPUT', `unknown column or status: ${target}`)
    }
    if (status === task.status) return { ok: true, task, unchanged: true }

    // Review is a human gate: an agent may not move a reviewed task anywhere.
    if (task.status === 'in_review' && actor.type !== 'user' && status !== 'in_review') {
      throw new KanbanError(
        'HUMAN_DECISION_REQUIRED',
        `${task.identifier} is in review; ask the human to approve, reject, or move it`,
      )
    }

    // Canceled has no column, so the column guard does not apply to it.
    if (status !== 'canceled') {
      if (status === 'done') {
        if (task.blockedReason) {
          throw new KanbanError('BLOCKER_ACTIVE', `unblock ${task.identifier} before moving it to Done`)
        }
        if (task.pendingQuestion && !task.questionResolution) {
          throw new KanbanError('QUESTION_OPEN', `answer or reject the question on ${task.identifier} first`)
        }
      }
      const next = { ...task, status }
      // Moving into review is legitimate; the review overlay pulls it into Needs you,
      // which is not itself a drop target.
      if (attentionReason(next) !== 'review') {
        const drop = canDrop(next, columnForTask(next))
        if (!drop.ok) throw new KanbanError('CANNOT_MOVE', drop.reason)
      }
    }

    const before = task.status
    task.status = status
    task.statusSince = nowIso()
    touch(task, actor, 'moved', `moved ${task.identifier} from ${before} to ${status}`, [
      { field: 'status', before, after: status },
    ])
    return { ok: true, task }
  })
}

function sameTaskRef(task, ref) {
  if (typeof ref !== 'string' || !ref.trim()) return false
  const needle = ref.trim().toLowerCase()
  return task?.id?.toLowerCase() === needle
    || String(task?.identifier ?? '').toLowerCase() === needle
}

function reorderIndex(siblings, input) {
  if (input.beforeId !== undefined && input.beforeId !== null) {
    const index = siblings.findIndex((entry) => sameTaskRef(entry, input.beforeId))
    if (index === -1) {
      throw new KanbanError(
        'TASK_NOT_FOUND',
        `beforeId must name a task in the same column: ${input.beforeId}`,
      )
    }
    return index
  }
  if (input.afterId !== undefined && input.afterId !== null) {
    const index = siblings.findIndex((entry) => sameTaskRef(entry, input.afterId))
    if (index === -1) {
      throw new KanbanError(
        'TASK_NOT_FOUND',
        `afterId must name a task in the same column: ${input.afterId}`,
      )
    }
    return index + 1
  }
  if (input.position !== undefined && input.position !== null) {
    const position = Number(input.position)
    if (!Number.isInteger(position) || position < 0) {
      throw new KanbanError('INVALID_INPUT', 'position must be a non-negative integer')
    }
    return Math.min(position, siblings.length)
  }
  // No anchor: append to the end of the column.
  return siblings.length
}

export async function reorderTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const column = columnForTask(task)
    if (!column) {
      throw new KanbanError('INVALID_INPUT', `task ${task.identifier} is not on the board`)
    }
    const siblings = board.tasks
      .filter((entry) => entry.id !== task.id && !entry.archivedAt && columnForTask(entry) === column)
      .sort(sortByOrder)
    const index = reorderIndex(siblings, input)

    let sortOrder
    if (siblings.length === 0) {
      sortOrder = ORDER_GAP
    } else if (index <= 0) {
      sortOrder = sortOrderOf(siblings[0]) - ORDER_GAP
    } else if (index >= siblings.length) {
      sortOrder = sortOrderOf(siblings[siblings.length - 1]) + ORDER_GAP
    } else {
      const previous = sortOrderOf(siblings[index - 1])
      const next = sortOrderOf(siblings[index])
      sortOrder = previous + (next - previous) / 2
      if (!(Number.isFinite(sortOrder) && sortOrder > previous && sortOrder < next)) {
        throw new KanbanError(
          'ORDER_CONFLICT',
          `no sort order fits between ${previous} and ${next}; rebalance the column first`,
        )
      }
    }

    const before = sortOrderOf(task)
    task.sortOrder = sortOrder
    touch(task, actor, 'reordered', `reordered ${task.identifier} in ${column}`, [
      { field: 'sortOrder', before, after: sortOrder },
    ])
    return { ok: true, task }
  })
}

export async function blockTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const reason = requireString(input.reason, 'reason', MAX_REASON)
    if (task.blockedReason === reason) return { ok: true, task, unchanged: true }
    const before = task.blockedReason
    task.blockedReason = reason
    task.blockedSince = nowIso()
    touch(task, actor, 'blocked', `blocked ${task.identifier}: ${reason}`, [
      { field: 'blockedReason', before, after: reason },
    ])
    return { ok: true, task }
  })
}

export async function unblockTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (!task.blockedReason) return { ok: true, task, unchanged: true }
    const before = task.blockedReason
    task.blockedReason = null
    task.blockedSince = null
    touch(task, actor, 'unblocked', `unblocked ${task.identifier}`, [
      { field: 'blockedReason', before, after: null },
    ])
    return { ok: true, task }
  })
}

export async function askTask(store, input = {}) {
  const actor = actorOf(input)
  const prompt = requireString(input.prompt, 'prompt', MAX_PROMPT)
  const note = optionalString(input.note, 'note', MAX_NOTE)
  const options = Array.isArray(input.options) ? input.options : []
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new KanbanError(
      'INVALID_INPUT',
      `options must contain ${MIN_OPTIONS}-${MAX_OPTIONS} entries`,
    )
  }
  const normalized = options.map((option, index) => {
    if (!option || typeof option !== 'object') {
      throw new KanbanError('INVALID_INPUT', 'each option needs a label')
    }
    return {
      id: `opt_${index + 1}`,
      label: requireString(option.label, 'option.label', MAX_OPTION_LABEL),
      detail: optionalString(option.detail, 'option.detail', MAX_OPTION_DETAIL),
    }
  })

  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
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
    return { ok: true, task }
  })
}

export async function answerTask(store, input = {}) {
  const actor = actorOf(input)
  const note = optionalString(input.note, 'note', MAX_NOTE)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (!task.pendingQuestion) {
      throw new KanbanError('NO_QUESTION', `task ${task.identifier} has no open question`)
    }
    if (task.questionResolution) {
      throw new KanbanError('QUESTION_CLOSED', `task ${task.identifier} is already resolved`)
    }
    const optionId = typeof input.option === 'string' ? input.option.trim() : ''
    let selected = null
    if (optionId) {
      selected = task.pendingQuestion.options.find(
        (entry) => entry.id === optionId || entry.label === optionId,
      )
      if (!selected) throw new KanbanError('INVALID_INPUT', `unknown option: ${optionId}`)
      task.pendingQuestion.selected = selected.id
    }
    task.pendingQuestion.answerNote = note
    touch(task, actor, 'answered', selected ? `answered: ${selected.label}` : 'recorded an answer note')
    return { ok: true, task }
  })
}

export async function approveTask(store, input = {}) {
  const actor = actorOf(input)
  if (actor.type !== 'user') {
    throw new KanbanError(
      'HUMAN_DECISION_REQUIRED',
      'approve requires as:"user" and an explicit human decision',
    )
  }
  const note = optionalString(input.note, 'note', MAX_NOTE)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    if (task.status === 'done' && (!task.pendingQuestion || task.questionResolution?.decision === 'approve')) {
      return { ok: true, task, unchanged: true }
    }
    if (task.blockedReason) {
      throw new KanbanError('BLOCKER_ACTIVE', `unblock ${task.identifier} before approving it`)
    }
    const at = nowIso()
    const before = task.status
    if (task.pendingQuestion) {
      const selected = task.pendingQuestion.selected
      if (!task.questionResolution && !selected) {
        throw new KanbanError('ANSWER_REQUIRED', 'pick an option with kanban_task_answer before approving')
      }
      task.questionResolution = {
        decision: 'approve',
        optionId: selected ?? null,
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
    return { ok: true, task }
  })
}

export async function rejectTask(store, input = {}) {
  const actor = actorOf(input)
  if (actor.type !== 'user') {
    throw new KanbanError(
      'HUMAN_DECISION_REQUIRED',
      'reject requires as:"user" and an explicit human decision',
    )
  }
  const note = optionalString(input.note, 'note', MAX_NOTE)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
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
    return { ok: true, task }
  })
}

export async function archiveTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    assertProjectWritable(projectForTask(board, task))
    checkVersion(task, input.version)
    if (task.archivedAt) return { ok: true, task, unchanged: true }
    task.archivedAt = nowIso()
    touch(task, actor, 'archived', `archived ${task.identifier}`, [
      { field: 'archivedAt', before: null, after: task.archivedAt },
    ])
    return { ok: true, task }
  })
}

export async function restoreTask(store, input = {}) {
  const actor = actorOf(input)
  return store.mutate((board) => {
    const task = mustFindTask(board, input.id ?? input.identifier)
    assertProjectWritable(projectForTask(board, task))
    checkVersion(task, input.version)
    if (!task.archivedAt) {
      throw new KanbanError('TASK_NOT_ARCHIVED', `task ${task.identifier} is not archived`)
    }
    const before = task.archivedAt
    task.archivedAt = null
    touch(task, actor, 'restored', `restored ${task.identifier}`, [
      { field: 'archivedAt', before, after: null },
    ])
    return { ok: true, task }
  })
}

export async function addComment(store, input = {}) {
  const actor = actorOf(input)
  const body = requireString(input.body, 'body', MAX_COMMENT)
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const comment = {
      id: `cmt_${randomUUID()}`,
      body,
      author: actor,
      createdAt: nowIso(),
    }
    task.comments.push(comment)
    touch(task, actor, 'commented', body.slice(0, 120))
    return { ok: true, task }
  })
}

function decodeAttachmentData(value) {
  if (typeof value !== 'string') {
    throw new KanbanError('INVALID_INPUT', 'data must be a base64 string')
  }
  const encoded = value.replace(/\s+/g, '')
  if (encoded.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new KanbanError('INVALID_INPUT', 'data must be a base64 string')
  }
  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new KanbanError(
      'ATTACHMENT_TOO_LARGE',
      `attachment must be at most ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`,
    )
  }
  return buffer
}

function normalizeContentType(value) {
  if (value === undefined || value === null) return DEFAULT_CONTENT_TYPE
  if (typeof value !== 'string') {
    throw new KanbanError('INVALID_INPUT', 'contentType must be a string')
  }
  const type = value.trim()
  if (!type) return DEFAULT_CONTENT_TYPE
  if (type.length > MAX_CONTENT_TYPE) {
    throw new KanbanError(
      'INVALID_INPUT',
      `contentType must be at most ${MAX_CONTENT_TYPE} characters`,
    )
  }
  if (/[\u0000-\u001f\u007f]/.test(type)) {
    throw new KanbanError('INVALID_INPUT', 'contentType must not contain control characters')
  }
  return type
}

export async function addAttachment(store, input = {}) {
  const filename = requireString(input.filename, 'filename', MAX_FILENAME)
  const contentType = normalizeContentType(input.contentType)
  const buffer = decodeAttachmentData(input.data)
  const actor = actorOf(input)
  let writtenId = null

  try {
    return await store.mutate((board) => {
      const task = mustFindWritableTask(board, input.id ?? input.identifier)
      checkVersion(task, input.version)
      if (!Array.isArray(task.attachments)) task.attachments = []
      let attachmentId
      do {
        attachmentId = `att_${randomUUID()}`
      } while (task.attachments.some((entry) => entry?.id === attachmentId))
      const attachment = {
        id: attachmentId,
        filename,
        contentType,
        size: buffer.length,
        createdAt: nowIso(),
      }
      // Bytes first: the metadata never points at a file that is not there.
      writeAttachmentFile(store, attachment.id, buffer)
      writtenId = attachment.id
      task.attachments.push(attachment)
      touch(task, actor, 'attached', `attached ${filename}`)
      return { ok: true, task, attachment }
    })
  } catch (error) {
    if (writtenId) {
      try {
        deleteAttachmentFile(store, writtenId)
      } catch {
        // the board write failed; leave the orphan for a manual cleanup
      }
    }
    throw error
  }
}

export async function removeAttachment(store, input = {}) {
  const actor = actorOf(input)
  const attachmentId = typeof input.attachmentId === 'string' ? input.attachmentId.trim() : ''
  if (!attachmentId) {
    throw new KanbanError('INVALID_INPUT', 'attachmentId is required')
  }
  return store.mutate((board) => {
    const task = mustFindWritableTask(board, input.id ?? input.identifier)
    checkVersion(task, input.version)
    const attachments = Array.isArray(task.attachments) ? task.attachments : []
    const index = attachments.findIndex((entry) => entry?.id === attachmentId)
    if (index === -1) {
      throw new KanbanError('ATTACHMENT_NOT_FOUND', `no attachment matches ${attachmentId}`)
    }
    const [attachment] = attachments.splice(index, 1)
    deleteAttachmentFile(store, attachment.id)
    touch(task, actor, 'detached', `removed attachment ${attachment.filename}`)
    return { ok: true, task, attachment }
  })
}

export function readAttachment(store, attachmentId) {
  const id = typeof attachmentId === 'string' ? attachmentId.trim() : ''
  if (!id) return null
  const board = store.read()
  for (const task of Array.isArray(board.tasks) ? board.tasks : []) {
    if (!Array.isArray(task?.attachments)) continue
    const attachment = task.attachments.find((entry) => entry?.id === id)
    if (!attachment) continue
    const buffer = readAttachmentFile(store, attachment.id)
    if (!buffer) return null
    const project = listProjects(board).find((entry) => entry?.id === task.projectId) ?? null
    return { attachment, buffer, task, project }
  }
  return null
}

export function decorateTask(task, project) {
  const attention = attentionReason(task)
  const decorated = {
    ...task,
    column: columnForTask(task),
    attention,
    attentionSince: attention ? elapsedStart(task) : null,
  }
  if (!Array.isArray(decorated.attachments)) decorated.attachments = []
  let resolved = null
  if (project && typeof project === 'object' && !Array.isArray(project)) {
    resolved = Array.isArray(project.projects)
      ? project.projects.find((entry) => entry?.id === task?.projectId)
      : project
  }
  if (resolved) {
    if (decorated.projectId === undefined) decorated.projectId = resolved.id
    decorated.projectName = resolved.name
  }
  return decorated
}

export function summarizeBoard(board, { projectId, includeArchived = false } = {}) {
  const tasks = tasksForProject(board, projectId)
    .filter((task) => includeArchived || !task.archivedAt)
  const counts = { backlog: 0, running: 0, needs: 0, done: 0, canceled: 0 }
  for (const task of tasks) {
    const column = columnForTask(task)
    if (column) counts[column] += 1
    else counts.canceled += 1
  }
  return {
    project: projectId === undefined || projectId === null ? null : findProject(board, projectId) ?? null,
    projects: listProjects(board),
    counts,
    total: tasks.length,
    needsYou: counts.needs,
  }
}

export function boardView(
  board,
  { column, includeDone = true, includeCanceled = false, includeArchived = false, projectId } = {},
) {
  const tasks = tasksForProject(board, projectId)
    .filter((task) => includeArchived || !task.archivedAt)
  const project = projectId === undefined || projectId === null
    ? null
    : findProject(board, projectId) ?? null
  const projectsById = new Map(listProjects(board).map((entry) => [entry.id, entry]))
  const decorate = (task) => decorateTask(task, project ?? projectsById.get(task.projectId))

  const groups = new Map(COLUMNS.map((entry) => [entry.id, []]))
  for (const task of tasks) {
    const columnId = columnForTask(task)
    if (!columnId) {
      if (includeCanceled && includeDone) groups.get('done').push(decorate(task))
      continue
    }
    if (columnId === 'done' && !includeDone) continue
    groups.get(columnId).push(decorate(task))
  }
  for (const list of groups.values()) list.sort(sortTasks)

  // The flat list is presentation data: Needs you first, then the normal flow.
  const flat = []
  for (const id of DISPLAY_ORDER) {
    if (id === 'done' && !includeDone) continue
    flat.push(...groups.get(id))
  }
  const selected = column ? groups.get(column) ?? [] : flat

  return {
    project,
    projects: listProjects(board),
    summary: summarizeBoard(board, { projectId, includeArchived }),
    columns: Object.fromEntries(groups),
    tasks: selected,
  }
}

export function getTaskView(store, input = {}) {
  const board = store.read()
  const task = mustFindTask(board, input.id ?? input.identifier)
  return { ok: true, task: decorateTask(task, findProject(board, task.projectId)) }
}
