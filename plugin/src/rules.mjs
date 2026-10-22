export const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled']

export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent']

export const STATUS_LABELS = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in progress',
  in_review: 'in review',
  done: 'done',
  canceled: 'canceled',
}

export const PRIORITY_LABELS = {
  none: 'none',
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
}

export const COLUMNS = [
  { id: 'backlog', label: 'Backlog', statuses: ['backlog', 'todo'] },
  { id: 'running', label: 'Running', statuses: ['in_progress'] },
  { id: 'needs', label: 'Needs you', statuses: [] },
  { id: 'done', label: 'Done', statuses: ['done'] },
]

export const COLUMN_IDS = COLUMNS.map((column) => column.id)

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }

function rankOf(priority) {
  return PRIORITY_RANK[priority] ?? PRIORITY_RANK.none
}

export function attentionReason(task) {
  if (!task) return null
  if (task.pendingQuestion && !task.questionResolution) return 'question'
  if (task.blockedReason) return 'blocked'
  if (task.status === 'in_review') return 'review'
  return null
}

export function columnForTask(task) {
  if (!task) return null
  if (attentionReason(task)) return 'needs'
  const column = COLUMNS.find((entry) => entry.statuses.includes(task.status))
  return column ? column.id : null
}

export function isOpen(task) {
  return Boolean(task) && task.status !== 'done' && task.status !== 'canceled'
}

export function canDrop(task, columnId) {
  if (!COLUMN_IDS.includes(columnId)) {
    return { ok: false, reason: `unknown column: ${columnId}` }
  }
  if (columnId === 'needs') {
    return { ok: false, reason: 'Needs you is automatic' }
  }
  if (attentionReason(task) && columnId !== 'backlog') {
    return { ok: false, reason: 'Resolve attention before moving' }
  }
  return { ok: true }
}

export function statusForColumn(columnId) {
  const column = COLUMNS.find((entry) => entry.id === columnId)
  if (!column || column.statuses.length === 0) return null
  return column.statuses[0]
}

function sortOrderOf(task) {
  return Number.isFinite(task.sortOrder) ? task.sortOrder : Number.MAX_SAFE_INTEGER
}

export function sortTasks(a, b) {
  const byPriority = rankOf(a.priority) - rankOf(b.priority)
  if (byPriority !== 0) return byPriority
  const byOrder = sortOrderOf(a) - sortOrderOf(b)
  if (byOrder !== 0) return byOrder
  const updatedA = typeof a.updatedAt === 'string' ? a.updatedAt : ''
  const updatedB = typeof b.updatedAt === 'string' ? b.updatedAt : ''
  if (updatedA === updatedB) return 0
  // Newest first.
  return updatedA < updatedB ? 1 : -1
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function nextIdentifier(project, tasks = []) {
  const settings = project && typeof project === 'object' ? project : {}
  const prefix = typeof settings.prefix === 'string' && settings.prefix ? settings.prefix : 'KANBAN'
  const matcher = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`)
  let highest = 0
  for (const task of tasks) {
    if (!task || typeof task.identifier !== 'string') continue
    const match = matcher.exec(task.identifier)
    if (match) highest = Math.max(highest, Number(match[1]))
  }
  const next = Number.isInteger(settings.nextTaskNumber) && settings.nextTaskNumber > 0
    ? settings.nextTaskNumber
    : 1
  return `${prefix}-${Math.max(next, highest + 1)}`
}

export function taskPrefixFor(name) {
  const letters = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const prefix = letters.slice(0, 6)
  return prefix.length >= 2 ? prefix : 'KANBAN'
}

export function elapsedStart(task) {
  if (!task) return null
  const attention = attentionReason(task)
  if (attention === 'question') return task.pendingQuestion?.createdAt ?? null
  if (attention === 'blocked') return task.blockedSince || task.statusSince || null
  return task.statusSince ?? null
}
