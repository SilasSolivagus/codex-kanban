import {
  COLUMNS,
  PRIORITY_LABELS,
  attentionReason,
  columnForTask,
  elapsedStart,
  sortTasks,
} from './rules.mjs'

const MAX_TITLE = 120
const MAX_PROMPT = 160
const MAX_COMMENTS = 5
const MAX_ACTIVITY = 12
const MAX_FULL_ACTIVITY = 20
const DISPLAY_ORDER = ['needs', 'running', 'backlog', 'done']
const EMPTY_NEEDS = '_Nothing needs you right now._'
const EMPTY_BOARD = 'The board is empty. Create the first task with `kanban_task_create`.'

function inline(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function shorten(value, max) {
  const text = inline(value)
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function formatAge(iso, now = Date.now()) {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function attentionLabel(task) {
  switch (attentionReason(task)) {
    case 'question':
      return `question: ${shorten(task.pendingQuestion?.prompt, MAX_PROMPT)}`
    case 'blocked':
      return `blocked: ${shorten(task.blockedReason, MAX_PROMPT)}`
    case 'review':
      return 'waiting for review'
    default:
      return null
  }
}

function selectedOption(task) {
  const question = task.pendingQuestion
  if (!question?.selected) return null
  return (question.options ?? []).find((option) => option.id === question.selected) ?? null
}

export function renderTaskLine(task, now = Date.now()) {
  const parts = [`**${task.identifier}** ${shorten(task.title, MAX_TITLE)}`]
  if (task.priority && task.priority !== 'none') {
    parts.push(PRIORITY_LABELS[task.priority] ?? task.priority)
  }

  const attention = attentionReason(task)
  if (attention === 'blocked') {
    parts.push(attentionLabel(task))
    const age = formatAge(elapsedStart(task), now)
    if (age) parts.push(`${age} blocked`)
  } else if (attention) {
    parts.push(attentionLabel(task))
    const age = formatAge(elapsedStart(task), now)
    if (age) parts.push(age)
  } else if (task.status === 'in_progress') {
    parts.push('in progress')
  }

  if (task.pendingQuestion?.selected && !task.questionResolution) {
    const option = selectedOption(task)
    if (option) parts.push(`answered: ${shorten(option.label, MAX_PROMPT)}`)
  }

  return `- ${parts.join(' · ')}`
}

export function summarizeView(view) {
  const { total, needsYou, counts } = view.summary
  return `${total} task${total === 1 ? '' : 's'} · ${needsYou} needs you · ${counts.running} running`
}

export function buildView(board, { includeDone = true, includeCanceled = false, includeArchived = false, projectId = null } = {}) {
  const allTasks = Array.isArray(board?.tasks) ? board.tasks : []
  const scoped = projectId ? allTasks.filter((task) => task.projectId === projectId) : allTasks
  const tasks = includeArchived ? scoped : scoped.filter((task) => !task.archivedAt)
  const columns = Object.fromEntries(COLUMNS.map((column) => [column.id, []]))
  const counts = { backlog: 0, running: 0, needs: 0, done: 0, canceled: 0 }

  for (const task of tasks) {
    const columnId = columnForTask(task)
    if (!columnId) {
      counts.canceled += 1
      if (includeCanceled && includeDone) columns.done.push(task)
      continue
    }
    if (columnId === 'done' && !includeDone) {
      counts.done += 1
      continue
    }
    counts[columnId] += 1
    columns[columnId].push(task)
  }
  for (const list of Object.values(columns)) list.sort(sortTasks)

  const flat = []
  for (const id of DISPLAY_ORDER) {
    if (id === 'done' && !includeDone) continue
    flat.push(...columns[id])
  }

  const project = projectId
    ? (board?.projects || []).find((entry) => entry.id === projectId) || null
    : board?.project

  return {
    project,
    columns,
    tasks: flat,
    summary: {
      project: board?.project,
      counts,
      total: tasks.length,
      needsYou: counts.needs,
    },
  }
}

export function renderMarkdown(board, { column, includeDone = true, now = Date.now(), projectId = null, projectName } = {}) {
  const view = buildView(board, { includeDone, projectId })
  if (view.summary.total === 0) return EMPTY_BOARD

  const name = inline(projectName || view.project?.name)
  const lines = [
    name ? `# Codex Kanban · ${name}` : '# Codex Kanban',
    '',
    summarizeView(view),
    '',
  ]

  const visible = DISPLAY_ORDER
    .filter((id) => !column || id === column)
    .filter((id) => id !== 'done' || includeDone)

  for (const id of visible) {
    const definition = COLUMNS.find((entry) => entry.id === id)
    const tasks = view.columns[id] ?? []
    if (id !== 'needs' && tasks.length === 0) continue
    lines.push(`## ${definition?.label ?? id}`)
    lines.push('')
    if (tasks.length === 0) {
      lines.push(EMPTY_NEEDS)
    } else {
      for (const task of tasks) lines.push(renderTaskLine(task, now))
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export function renderTaskDetail(task, { now = Date.now(), history = 'recent' } = {}) {
  const full = history === 'full'
  const lines = [`# ${task.identifier} · ${shorten(task.title, MAX_TITLE)}`, '']

  const column = columnForTask(task) ?? 'hidden'
  lines.push(`- Status: \`${task.status}\` (${column})`)
  lines.push(`- Priority: ${task.priority ?? 'none'}`)
  if (Array.isArray(task.labels) && task.labels.length) {
    lines.push(`- Labels: ${task.labels.join(', ')}`)
  }
  lines.push(`- Version: ${task.version}`)
  if (task.assignee) lines.push(`- Assignee: ${task.assignee.type}/${task.assignee.name}`)
  lines.push(`- Created: ${task.createdAt ?? '—'} · Updated: ${task.updatedAt ?? '—'}`)

  const attention = attentionReason(task)
  if (attention) {
    const age = formatAge(elapsedStart(task), now)
    lines.push(`- Attention: ${attention}${age ? ` (${age})` : ''}`)
  }
  if (task.blockedReason) {
    lines.push(`- Blocked: ${shorten(task.blockedReason, MAX_PROMPT)} since ${task.blockedSince ?? '—'}`)
  }

  if (task.description) {
    lines.push('', '## Description', '', task.description)
  }

  const question = task.pendingQuestion
  if (question) {
    lines.push('', '## Question', '', shorten(question.prompt, MAX_PROMPT))
    if (question.note) lines.push('', `> ${question.note}`)
    lines.push('')
    for (const option of question.options ?? []) {
      const mark = option.id === question.selected ? 'x' : ' '
      const detail = option.detail ? ` — ${inline(option.detail)}` : ''
      lines.push(`- [${mark}] ${option.id} ${inline(option.label)}${detail}`)
    }
  }

  if (task.questionResolution) {
    const resolution = task.questionResolution
    const answer = resolution.optionLabel
      ? `${resolution.optionLabel}${resolution.optionId ? ` (${resolution.optionId})` : ''}`
      : resolution.optionId ?? ''
    const parts = ['Resolution: ' + resolution.decision]
    if (answer) parts.push(answer)
    if (resolution.note) parts.push(inline(resolution.note))
    lines.push('', `- ${parts.join(' · ')}`)
  }

  if (Array.isArray(task.links) && task.links.length) {
    lines.push('', '## Links')
    for (const link of task.links) lines.push(`- [${inline(link.label)}](${link.url})`)
  }

  if (Array.isArray(task.comments) && task.comments.length) {
    lines.push('', '## Comments')
    const comments = full ? task.comments : task.comments.slice(-MAX_COMMENTS)
    for (const comment of comments) {
      const age = formatAge(comment.createdAt, now)
      const when = age ? ` (${age})` : ''
      lines.push(`- ${comment.author?.name ?? 'unknown'}${when}: ${inline(comment.body)}`)
    }
  }

  if (Array.isArray(task.activity) && task.activity.length) {
    lines.push('', '## Activity')
    const limit = full ? MAX_FULL_ACTIVITY : MAX_ACTIVITY
    const activity = task.activity.slice(-limit)
    for (const entry of activity) {
      const parts = [formatAge(entry.at, now), entry.actor?.name, inline(entry.summary)]
        .filter(Boolean)
      lines.push(`- ${parts.join(' · ')}`)
    }
    const omitted = full ? task.activity.length - activity.length : 0
    if (omitted > 0) lines.push(`… ${omitted} older entries omitted`)
  }

  return lines.join('\n')
}
