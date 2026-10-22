import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { taskPrefixFor } from './rules.mjs'

export const BOARD_DIR = '.kanban'
export const BOARD_FILE = 'board.json'
export const LOCK_FILE = 'board.lock'
export const SCHEMA_VERSION = 1

const LOCK_RETRY_MS = 25
const MIN_STALE_LOCK_MS = 30_000

export function boardError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export function emptyBoard(root) {
  const base = path.resolve(root || process.cwd())
  const name = path.basename(base) || 'board'
  return {
    schema: SCHEMA_VERSION,
    project: {
      name,
      prefix: taskPrefixFor(name),
      createdAt: new Date().toISOString(),
    },
    nextTaskNumber: 1,
    tasks: [],
  }
}

export function normalizeBoard(board, root) {
  if (!board || typeof board !== 'object' || Array.isArray(board) || !Array.isArray(board.tasks)) {
    throw boardError('CORRUPT_BOARD', 'board.json does not match the kanban schema')
  }
  const fallback = emptyBoard(root)
  const project = board.project && typeof board.project === 'object' && !Array.isArray(board.project)
    ? board.project
    : {}
  return {
    schema: SCHEMA_VERSION,
    project: {
      name: typeof project.name === 'string' && project.name.trim()
        ? project.name
        : fallback.project.name,
      prefix: typeof project.prefix === 'string' && /^[A-Z0-9]{2,6}$/.test(project.prefix)
        ? project.prefix
        : fallback.project.prefix,
      createdAt: typeof project.createdAt === 'string' && project.createdAt
        ? project.createdAt
        : fallback.project.createdAt,
    },
    nextTaskNumber: Number.isInteger(board.nextTaskNumber) && board.nextTaskNumber > 0
      ? board.nextTaskNumber
      : 1,
    tasks: board.tasks,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createStore({ root, lockTimeoutMs = 5000 } = {}) {
  const base = path.resolve(root || process.cwd())
  const dir = path.join(base, BOARD_DIR)
  const file = path.join(dir, BOARD_FILE)
  const lockFile = path.join(dir, LOCK_FILE)
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
