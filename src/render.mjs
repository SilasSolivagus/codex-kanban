import { COLUMNS, PRIORITY_LABELS, attentionReason, columnForTask, elapsedStart, sortTasks } from './rules.mjs'

const MAX_PROMPT = 160

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
  const days = Math.round(hours / 24)
  return `${days}d`
}

function shorten(text, max = MAX_PROMPT) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim()
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function attentionLabel(task) {
  const attention = attentionReason(task)
  if (attention === 'question') {
    return `question: ${shorten(task.pendingQuestion?.prompt)}`
  }
  if (attention === 'blocked') {
    return `blocked: ${shorten(task.blockedReason)}`
  }
  if (attention === 'review') return 'waiting for review'
  return null
}

export function renderTaskLine(task, now = Date.now()) {
  const parts = [`**${task.identifier}** ${shorten(task.title, 120)}`]
  if (task.priority && task.priority !== 'none') parts.push(PRIORITY_LABELS[task.priority])
  const attention = attentionLabel(task)
  if (attention) {
    parts.push(attention)
  } else if (task.status === 'in_progress') {
    parts.push('in progress')
  }
  if (task.pendingQuestion?.selected && !task.questionResolution) {
    const option = task.pendingQuestion.options.find((entry) => entry.id === task.pendingQuestion.selected)
    if (option) parts.push(`answered: ${option.label}`)
  }
  if (task.blockedReason) {
    const age = formatAge(task.blockedSince, now)
    if (age) parts.push(`${age} blocked`)
  }
  return `- ${parts.join(' · ')}`
}

export function summarizeView(view) {
  const { counts, needsYou, total } = view.summary
  const pieces = [`${total} task${total === 1 ? '' : 's'}`]
  if (needsYou) pieces.push(`${needsYou} needs you`)
  pieces.push(`${counts.running} running`)
  return pieces.join(' · ')
}

export function renderMarkdown(board, { column, includeDone = true, now = Date.now() } = {}) {
  const view = buildView(board, { includeDone })
  const lines = []
  const title = view.project?.name ? `Codex Kanban · ${view.project.name}` : 'Codex Kanban'
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(summarizeView(view))
  lines.push('')

  if (view.summary.total === 0) {
    lines.push('The board is empty. Create the first task with `kanban_task_create`.')
    return lines.join('\n')
  }

  const displayOrder = ['needs', 'running', 'backlog', 'done']
  const ordered = [...COLUMNS].sort(
    (a, b) => displayOrder.indexOf(a.id) - displayOrder.indexOf(b.id),
  )
  const visibleColumns = column ? ordered.filter((entry) => entry.id === column) : ordered
  for (const entry of visibleColumns) {
    if (entry.id === 'done' && !includeDone) continue
    const tasks = view.columns[entry.id] ?? []
    if (!tasks.length && entry.id !== 'needs') continue
    lines.push(`## ${entry.label}`)
    lines.push('')
    if (!tasks.length) {
      lines.push('_Nothing needs you right now._')
      lines.push('')
      continue
    }
    for (const task of tasks) lines.push(renderTaskLine(task, now))
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export function buildView(board, { includeDone = true, includeCanceled = false } = {}) {
  const columns = Object.fromEntries(COLUMNS.map((entry) => [entry.id, []]))
  const counts = { backlog: 0, running: 0, needs: 0, done: 0, canceled: 0 }
  for (const task of board.tasks) {
    const columnId = columnForTask(task)
    if (!columnId) {
      counts.canceled += 1
      if (includeCanceled) columns.done.push(task)
      continue
    }
    counts[columnId] += 1
    if (columnId === 'done' && !includeDone) continue
    columns[columnId].push(task)
  }
  for (const list of Object.values(columns)) list.sort(sortTasks)
  return {
    project: board.project,
    columns,
    summary: {
      project: board.project,
      counts,
      total: board.tasks.length,
      needsYou: counts.needs,
    },
  }
}

export function renderTaskDetail(task, { now = Date.now() } = {}) {
  const lines = []
  lines.push(`# ${task.identifier} · ${shorten(task.title, 160)}`)
  lines.push('')
  lines.push(`- Status: \`${task.status}\` (${columnForTask(task) ?? 'hidden'})`)
  lines.push(`- Priority: ${task.priority}`)
  if (task.labels.length) lines.push(`- Labels: ${task.labels.join(', ')}`)
  lines.push(`- Version: ${task.version}`)
  if (task.assignee) lines.push(`- Assignee: ${task.assignee.type}/${task.assignee.name}`)
  lines.push(`- Created: ${task.createdAt} · Updated: ${task.updatedAt}`)
  const attention = attentionLabel(task)
  if (attention) lines.push(`- Attention: ${attention} (${formatAge(elapsedStart(task), now)})`)
  if (task.blockedReason) lines.push(`- Blocked since: ${task.blockedSince}`)
  if (task.description) {
    lines.push('')
    lines.push(task.description)
  }
  if (task.pendingQuestion) {
    lines.push('')
    lines.push('## Question')
    lines.push('')
    lines.push(task.pendingQuestion.prompt)
    if (task.pendingQuestion.note) lines.push(`> ${task.pendingQuestion.note}`)
    lines.push('')
    for (const option of task.pendingQuestion.options) {
      const mark = option.id === task.pendingQuestion.selected ? 'x' : ' '
      const detail = option.detail ? ` — ${option.detail}` : ''
      lines.push(`- [${mark}] \`${option.id}\` ${option.label}${detail}`)
    }
  }
  if (task.questionResolution) {
    lines.push('')
    lines.push(`Resolved: ${task.questionResolution.decision}${task.questionResolution.note ? ` — ${task.questionResolution.note}` : ''}`)
  }
  if (task.links.length) {
    lines.push('')
    lines.push('## Links')
    for (const link of task.links) lines.push(`- [${link.label}](${link.url})`)
  }
  if (task.comments.length) {
    lines.push('')
    lines.push('## Comments')
    for (const comment of task.comments) {
      lines.push(`- ${comment.author.name} (${formatAge(comment.createdAt, now)}): ${comment.body}`)
    }
  }
  if (task.activity.length) {
    lines.push('')
    lines.push('## Activity')
    for (const entry of task.activity.slice(-12)) {
      lines.push(`- ${formatAge(entry.at, now)} · ${entry.actor.name} · ${entry.summary}`)
    }
  }
  return lines.join('\n')
}
