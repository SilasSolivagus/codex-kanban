import { KanbanError, createTask, findProject, listProjects } from './domain.mjs'
import { normalizeTitle } from './sessions.mjs'

// Shared by the CLI and the web action so both create exactly the same task:
// Backlog, `imported` label, capped summary as description, and a `source`
// pointer to the Codex session. Titles already on the board are skipped, which
// makes a second run idempotent.

function activeProject(board) {
  return listProjects(board).find((project) => !project?.archivedAt) ?? null
}

export function projectForImport(board, projectId) {
  if (projectId !== undefined && projectId !== null && projectId !== '') {
    const project = findProject(board, projectId)
    if (!project) {
      throw new KanbanError('PROJECT_NOT_FOUND', `no project matches ${projectId}`)
    }
    return project
  }
  const project = activeProject(board)
  if (!project) {
    throw new KanbanError(
      'NO_ACTIVE_PROJECT',
      'every project is archived; restore one before importing sessions',
    )
  }
  return project
}

export async function applySessionImport(store, { candidates = [], projectId, as = 'user' } = {}) {
  const board = store.read()
  const project = projectForImport(board, projectId)
  const existing = new Set(
    (Array.isArray(board.tasks) ? board.tasks : [])
      .map((task) => normalizeTitle(task?.title))
      .filter(Boolean),
  )
  const created = []
  const skipped = []

  for (const candidate of candidates) {
    const title = typeof candidate?.title === 'string' ? candidate.title.trim() : ''
    const sessionId = typeof candidate?.id === 'string' ? candidate.id.trim() : ''
    if (!title || !sessionId) {
      skipped.push({ id: sessionId || null, title, reason: 'invalid' })
      continue
    }
    const key = normalizeTitle(title)
    if (existing.has(key)) {
      skipped.push({ id: sessionId, title, reason: 'duplicate' })
      continue
    }
    const result = await createTask(store, {
      title,
      description: typeof candidate.summary === 'string' ? candidate.summary : '',
      status: 'backlog',
      labels: ['imported'],
      projectId: project.id,
      source: { kind: 'session', id: sessionId, title },
      as,
    })
    created.push({ identifier: result.task.identifier, title: result.task.title })
    existing.add(key)
  }

  return { created, skipped }
}
