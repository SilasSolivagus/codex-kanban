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

export function attentionReason(task) {
  if (!task) return null
  if (task.pendingQuestion && !task.questionResolution) return 'question'
  if (task.blockedReason) return 'blocked'
  if (task.status === 'in_review') return 'review'
  return null
}

export function columnForTask(task) {
  const attention = attentionReason(task)
  if (attention) return 'needs'
  const column = COLUMNS.find((entry) => entry.statuses.includes(task.status))
  return column ? column.id : null
}

export function isOpen(task) {
  return task.status !== 'done' && task.status !== 'canceled'
}

export function elapsedStart(task) {
  const attention = attentionReason(task)
  if (attention === 'question') return task.pendingQuestion.createdAt
  if (attention === 'blocked') return task.blockedSince || task.statusSince
  return task.statusSince
}

export function canDrop(task, columnId) {
  if (!COLUMN_IDS.includes(columnId)) {
    return { ok: false, reason: `unknown column: ${columnId}` }
  }
  if (columnId === 'needs') {
    return { ok: false, reason: 'Needs you is automatic' }
  }
  if (attentionReason(task) && columnForTask(task) === 'needs' && columnId !== 'backlog') {
    return { ok: false, reason: 'Resolve attention before moving' }
  }
  return { ok: true }
}

export function statusForColumn(columnId) {
  const column = COLUMNS.find((entry) => entry.id === columnId)
  if (!column || !column.statuses.length) return null
  return column.statuses[0]
}

export function sortTasks(a, b) {
  const rank = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4)
  if (rank !== 0) return rank
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.updatedAt < b.updatedAt ? 1 : -1
}

export function nextIdentifier(project, tasks) {
  const prefix = project.prefix
  let max = 0
  for (const task of tasks) {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(task.identifier)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix}-${Math.max(project.nextTaskNumber, max + 1)}`
}

export function taskPrefixFor(name) {
  const letters = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  const prefix = letters.slice(0, 6)
  return prefix.length >= 2 ? prefix : 'KANBAN'
}

export function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}
