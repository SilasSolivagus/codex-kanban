import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { taskPrefixFor } from './rules.mjs'

export const BOARD_DIR = '.kanban'
export const BOARD_FILE = 'board.json'
export const LOCK_FILE = 'board.lock'
export const SCHEMA_VERSION = 2
export const DEFAULT_PROJECT_ID = 'prj_default'

const LOCK_RETRY_MS = 25
const MIN_STALE_LOCK_MS = 30_000
const PROJECT_PREFIX = /^[A-Z0-9]{2,6}$/

export function boardError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function defaultProject(name, createdAt) {
  return {
    id: DEFAULT_PROJECT_ID,
    name,
    prefix: taskPrefixFor(name),
    workspacePath: null,
    nextTaskNumber: 1,
    archivedAt: null,
    createdAt,
    updatedAt: createdAt,
  }
}

// A non-enumerable alias for the first active project. It keeps the v0.2 CLI,
// MCP and web entry points working during the v0.3 migration; it is never
// serialized and never shadows the canonical `projects` array.
function withProjectCompat(board) {
  Object.defineProperty(board, 'project', {
    configurable: true,
    enumerable: false,
    get() {
      const projects = Array.isArray(board.projects) ? board.projects : []
      return projects.find((project) => !project?.archivedAt) ?? projects[0] ?? null
    },
  })
  return board
}

export function emptyBoard(root) {
  const base = path.resolve(root || process.cwd())
  const name = path.basename(base) || 'board'
  const projects = [defaultProject(name, new Date().toISOString())]
  return withProjectCompat({ schema: SCHEMA_VERSION, projects, tasks: [] })
}

function normalizeProject(source, fallback, index) {
  const value = source && typeof source === 'object' && !Array.isArray(source) ? source : {}
  const name = typeof value.name === 'string' && value.name.trim()
    ? value.name.trim()
    : index === 0 ? fallback.name : `Project ${index + 1}`
  const createdAt = typeof value.createdAt === 'string' && value.createdAt
    ? value.createdAt
    : fallback.createdAt
  return {
    id: typeof value.id === 'string' && value.id.trim()
      ? value.id.trim()
      : index === 0 ? DEFAULT_PROJECT_ID : `prj_p${index + 1}`,
    name,
    prefix: typeof value.prefix === 'string' && PROJECT_PREFIX.test(value.prefix)
      ? value.prefix
      : taskPrefixFor(name),
    workspacePath: typeof value.workspacePath === 'string' && path.isAbsolute(value.workspacePath)
      ? value.workspacePath
      : null,
    nextTaskNumber: Number.isInteger(value.nextTaskNumber) && value.nextTaskNumber > 0
      ? value.nextTaskNumber
      : 1,
    archivedAt: typeof value.archivedAt === 'string' && value.archivedAt ? value.archivedAt : null,
    createdAt,
    updatedAt: typeof value.updatedAt === 'string' && value.updatedAt ? value.updatedAt : createdAt,
  }
}

function migrateV1Project(board, fallback) {
  const legacy = board.project && typeof board.project === 'object' && !Array.isArray(board.project)
    ? board.project
    : {}
  const name = typeof legacy.name === 'string' && legacy.name.trim()
    ? legacy.name.trim()
    : fallback.name
  const createdAt = typeof legacy.createdAt === 'string' && legacy.createdAt
    ? legacy.createdAt
    : fallback.createdAt
  return {
    id: DEFAULT_PROJECT_ID,
    name,
    prefix: typeof legacy.prefix === 'string' && PROJECT_PREFIX.test(legacy.prefix)
      ? legacy.prefix
      : taskPrefixFor(name),
    workspacePath: null,
    nextTaskNumber: Number.isInteger(board.nextTaskNumber) && board.nextTaskNumber > 0
      ? board.nextTaskNumber
      : 1,
    archivedAt: null,
    createdAt,
    updatedAt: createdAt,
  }
}

export function normalizeBoard(board, root) {
  if (!board || typeof board !== 'object' || Array.isArray(board) || !Array.isArray(board.tasks)) {
    throw boardError('CORRUPT_BOARD', 'board.json does not match the kanban schema')
  }
  const fallback = emptyBoard(root).projects[0]
  const legacyProject = board.project && typeof board.project === 'object' && !Array.isArray(board.project)
    ? board.project
    : null
  const isV1 = legacyProject !== null || board.schema === 1

  let projects
  if (Array.isArray(board.projects) && board.projects.length) {
    projects = board.projects.map((project, index) => normalizeProject(project, fallback, index))
  } else if (isV1) {
    projects = [migrateV1Project(board, fallback)]
  } else {
    projects = [normalizeProject(null, fallback, 0)]
  }

  const projectIds = new Set(projects.map((project) => project.id))
  const tasks = board.tasks.map((task) => {
    if (!task || typeof task !== 'object' || Array.isArray(task)) return task
    return {
      ...task,
      projectId: typeof task.projectId === 'string' && projectIds.has(task.projectId)
        ? task.projectId
        : projects[0].id,
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
    }
  })

  return withProjectCompat({ schema: SCHEMA_VERSION, projects, tasks })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createStore({ root, lockTimeoutMs = 5000 } = {}) {
  const base = path.resolve(root || process.cwd())
  const dir = path.join(base, BOARD_DIR)
  const file = path.join(dir, BOARD_FILE)
  const lockFile = path.join(dir, LOCK_FILE)
  const attachmentsDir = path.join(dir, 'attachments')
  const timeout = Number.isFinite(lockTimeoutMs) && lockTimeoutMs >= 0 ? lockTimeoutMs : 5000

  function readFromDisk() {
    let raw
    try {
      raw = fs.readFileSync(file, 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') return emptyBoard(base)
      throw error
    }
    let parsed
    try {
      parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw boardError('CORRUPT_BOARD', `board.json is not valid JSON: ${error.message}`)
      }
      throw error
    }
    return normalizeBoard(parsed, base)
  }

  function writeToDisk(board) {
    const normalized = normalizeBoard(board, base)
    const payload = `${JSON.stringify(normalized, null, 2)}\n`
    fs.mkdirSync(dir, { recursive: true })
    const tmp = `${file}.tmp`
    try {
      const handle = fs.openSync(tmp, 'w')
      try {
        fs.writeFileSync(handle, payload, 'utf8')
        fs.fsyncSync(handle)
      } finally {
        fs.closeSync(handle)
      }
      fs.renameSync(tmp, file)
    } catch (error) {
      try {
        fs.unlinkSync(tmp)
      } catch {
        // leave the original board untouched
      }
      throw error
    }
    return normalized
  }

  function reclaimStaleLock() {
    let staleContent
    let stats
    try {
      staleContent = fs.readFileSync(lockFile, 'utf8')
      stats = fs.statSync(lockFile)
    } catch (error) {
      // only a vanished lock means the ordinary acquisition path can retry
      return error.code === 'ENOENT'
    }
    const staleAfter = Math.max(timeout * 2, MIN_STALE_LOCK_MS)
    if (Date.now() - stats.mtimeMs <= staleAfter) return false

    const claimedPath = `${lockFile}.claimed-${process.pid}-${randomUUID()}`
    try {
      fs.renameSync(lockFile, claimedPath)
    } catch (error) {
      return error.code === 'ENOENT'
    }

    let claimedContent
    try {
      claimedContent = fs.readFileSync(claimedPath, 'utf8')
    } catch {
      try {
        fs.renameSync(claimedPath, lockFile)
      } catch {
        // the path was taken again; leave ownership checks to the holder
      }
      return false
    }

    if (claimedContent !== staleContent) {
      // A fresh holder replaced the lock between our read and the rename.
      try {
        fs.renameSync(claimedPath, lockFile)
      } catch {
        // best effort restoration
      }
      return false
    }

    try {
      fs.unlinkSync(claimedPath)
    } catch {
      // the claimed file is unreachable; the lock itself is already gone
    }
    return true
  }

  async function acquireLock() {
    fs.mkdirSync(dir, { recursive: true })
    const deadline = Date.now() + timeout
    const token = `${process.pid}-${randomUUID()}`
    for (;;) {
      let handle
      try {
        handle = fs.openSync(lockFile, 'wx')
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        if (Date.now() >= deadline) {
          if (reclaimStaleLock()) continue
          let age = 'unknown'
          try {
            age = `${Math.max(0, Math.round(Date.now() - fs.statSync(lockFile).mtimeMs))}ms`
          } catch {
            // the lock vanished while composing the error
          }
          throw boardError(
            'BOARD_LOCKED',
            `board is locked by another process (${lockFile}, age ${age})`,
          )
        }
        await sleep(Math.min(LOCK_RETRY_MS, Math.max(1, deadline - Date.now())))
        continue
      }
      try {
        fs.writeSync(handle, token)
        fs.fsyncSync(handle)
      } catch (error) {
        try {
          fs.closeSync(handle)
        } catch {
          // ignore a descriptor that is already gone
        }
        try {
          fs.unlinkSync(lockFile)
        } catch {
          // nothing else to clean up
        }
        throw error
      }
      return { handle, token }
    }
  }

  function ownershipLost() {
    return boardError('BOARD_LOCKED', `board lock ownership was lost (${lockFile})`)
  }

  function assertLockOwned(token) {
    let owner = null
    try {
      owner = fs.readFileSync(lockFile, 'utf8')
    } catch {
      // a missing lock is a lost lock
    }
    if (owner !== token) throw ownershipLost()
  }

  function releaseLock(handle, token) {
    try {
      fs.closeSync(handle)
    } catch {
      // the descriptor may already be closed
    }
    try {
      const owner = fs.readFileSync(lockFile, 'utf8')
      if (owner === token) fs.unlinkSync(lockFile)
    } catch {
      // the lock was reclaimed or already released; never remove a foreign lock
    }
  }

  async function withLock(fn) {
    const { handle, token } = await acquireLock()
    try {
      return await fn(() => assertLockOwned(token))
    } finally {
      releaseLock(handle, token)
    }
  }

  return {
    root: base,
    dir,
    path: file,
    attachmentsDir,
    read() {
      return readFromDisk()
    },
    write(board) {
      return writeToDisk(board)
    },
    async mutate(fn) {
      return withLock(async (assertOwned) => {
        const board = readFromDisk()
        const result = await fn(board)
        assertOwned()
        writeToDisk(board)
        return result
      })
    },
  }
}

function resolveDirectory(candidate) {
  try {
    const resolved = fs.realpathSync(path.resolve(candidate))
    return fs.statSync(resolved).isDirectory() ? resolved : null
  } catch {
    return null
  }
}

function realpathOrSelf(candidate) {
  try {
    return fs.realpathSync(candidate)
  } catch {
    return candidate
  }
}

export function resolveRoot(explicit) {
  if (explicit) {
    const resolved = resolveDirectory(explicit)
    if (resolved) return resolved
    throw boardError('ROOT_NOT_FOUND', `workspace path does not exist: ${explicit}`)
  }

  if (process.env.CODEX_KANBAN_ROOT) {
    const resolved = resolveDirectory(process.env.CODEX_KANBAN_ROOT)
    if (resolved) return resolved
    throw boardError(
      'ROOT_NOT_FOUND',
      `CODEX_KANBAN_ROOT does not exist: ${process.env.CODEX_KANBAN_ROOT}`,
    )
  }

  let current = process.cwd()
  const start = current
  for (;;) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, BOARD_DIR))) {
      return realpathOrSelf(current)
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return realpathOrSelf(start)
}
