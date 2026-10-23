import { COLUMNS, STATUSES, attentionReason, columnForTask } from './rules.mjs'

const DAY_MS = 24 * 60 * 60 * 1000

function countBy(list, pick) {
  const counts = {}
  for (const entry of list) {
    const key = pick(entry)
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

function ageDays(iso, now) {
  const then = Date.parse(iso || '')
  if (!Number.isFinite(then)) return null
  return Math.max(0, Math.floor((now - then) / DAY_MS))
}

// Builds a shareable summary of the board. Deliberately excludes project names,
// task titles, paths, session ids and any free text: only counts and buckets.
export function buildStats(board, { now = Date.now(), version = 'unknown', platform = process.platform, node = process.versions.node, windowDays = 7 } = {}) {
  const projects = Array.isArray(board?.projects) ? board.projects : []
  const tasks = Array.isArray(board?.tasks) ? board.tasks : []
  const cutoff = now - windowDays * DAY_MS

  const byStatus = {}
  for (const status of STATUSES) byStatus[status] = 0
  const byColumn = {}
  for (const column of COLUMNS) byColumn[column.id] = 0

  let archivedTasks = 0
  let recentActivity = 0
  let comments = 0
  let attachments = 0
  let links = 0
  const labels = new Set()
  const attention = { question: 0, blocked: 0, review: 0 }

  for (const task of tasks) {
    if (typeof task.status === 'string') byStatus[task.status] = (byStatus[task.status] || 0) + 1
    if (task.archivedAt) {
      archivedTasks += 1
    } else {
      const column = columnForTask(task)
      if (column) byColumn[column] += 1
      const reason = attentionReason(task)
      if (reason) attention[reason] += 1
    }
    comments += Array.isArray(task.comments) ? task.comments.length : 0
    attachments += Array.isArray(task.attachments) ? task.attachments.length : 0
    links += Array.isArray(task.links) ? task.links.length : 0
    for (const label of Array.isArray(task.labels) ? task.labels : []) labels.add(label)
    for (const entry of Array.isArray(task.activity) ? task.activity : []) {
      const at = Date.parse(entry?.at || '')
      if (Number.isFinite(at) && at >= cutoff) recentActivity += 1
    }
  }

  return {
    pluginVersion: version,
    schema: Number.isInteger(board?.schema) ? board.schema : null,
    platform,
    node,
    projects: {
      total: projects.length,
      archived: projects.filter((project) => project.archivedAt).length,
    },
    tasks: {
      total: tasks.length,
      archived: archivedTasks,
      canceled: byStatus.canceled || 0,
      byStatus,
      byColumn,
    },
    attention,
    content: {
      comments,
      attachments,
      links,
      distinctLabels: labels.size,
    },
    activity: {
      last7d: recentActivity,
      windowDays,
    },
    boardAgeDays: projects.reduce((oldest, project) => {
      const age = ageDays(project.createdAt, now)
      return age === null ? oldest : oldest === null ? age : Math.max(oldest, age)
    }, null),
  }
}

export function formatStats(stats) {
  const lines = [
    `Codex Kanban usage · v${stats.pluginVersion} · schema ${stats.schema ?? '?'} · ${stats.platform} · Node ${stats.node}`,
    '',
    `Projects   ${stats.projects.total} (${stats.projects.archived} archived)`,
    `Tasks      ${stats.tasks.total} total · ${stats.tasks.archived} archived · ${stats.tasks.canceled} canceled`,
    `Columns    backlog ${stats.tasks.byColumn.backlog} · running ${stats.tasks.byColumn.running} · needs ${stats.tasks.byColumn.needs} · done ${stats.tasks.byColumn.done}`,
    `Statuses   ${Object.entries(stats.tasks.byStatus).map(([key, value]) => `${key} ${value}`).join(' · ')}`,
    `Attention  question ${stats.attention.question} · blocked ${stats.attention.blocked} · review ${stats.attention.review}`,
    `Content    ${stats.content.comments} comments · ${stats.content.attachments} attachments · ${stats.content.links} links · ${stats.content.distinctLabels} labels`,
    `Activity   ${stats.activity.last7d} events in the last ${stats.activity.windowDays} days`,
    stats.boardAgeDays === null ? 'Board age  unknown' : `Board age  ${stats.boardAgeDays} days`,
    '',
    'This summary contains counts only: no repository path, project names, task titles or session content.',
    'Share it in https://github.com/SilasSolivagus/codex-kanban/discussions/1 if you want to influence the roadmap.',
  ]
  return lines.join('\n')
}
