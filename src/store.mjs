import fs from 'node:fs'
import path from 'node:path'
import { taskPrefixFor } from './rules.mjs'

export const BOARD_DIR = '.kanban'
export const BOARD_FILE = 'board.json'
export const SCHEMA_VERSION = 1

export function emptyBoard(root) {
  const name = path.basename(path.resolve(root)) || 'board'
  const now = new Date().toISOString()
  return {
    schema: SCHEMA_VERSION,
    project: {
      name,
      prefix: taskPrefixFor(name),
      createdAt: now,
    },
    nextTaskNumber: 1,
    tasks: [],
  }
}

export function normalizeBoard(board, root) {
  if (!board || typeof board !== 'object' || !Array.isArray(board.tasks)) {
    throw boardError('CORRUPT_BOARD', 'board.json does not match the kanban schema')
  }
  const initial = emptyBoard(root)
  const project = board.project && typeof board.project === 'object' ? board.project : {}
  return {
    schema: SCHEMA_VERSION,
    project: {
      name: typeof project.name === 'string' && project.name ? project.name : initial.project.name,
      prefix: typeof project.prefix === 'string' && /^[A-Z0-9]{2,6}$/.test(project.prefix)
        ? project.prefix
        : initial.project.prefix,
      createdAt: typeof project.createdAt === 'string' ? project.createdAt : initial.project.createdAt,
    },
    nextTaskNumber: Number.isInteger(board.nextTaskNumber) && board.nextTaskNumber > 0
      ? board.nextTaskNumber
      : 1,
    tasks: board.tasks,
  }
}

export function boardError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export function createStore({ root, lockTimeoutMs = 5000 }) {
  const base = path.resolve(root)
  const dir = path.join(base, BOARD_DIR)
  const file = path.join(dir, BOARD_FILE)
  const lockFile = path.join(dir, 'board.lock')

  function readFromDisk() {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      return normalizeBoard(JSON.parse(raw), base)
    } catch (error) {
      if (error.code === 'ENOENT') return emptyBoard(base)
      if (error instanceof SyntaxError) {
        throw boardError('CORRUPT_BOARD', `board.json is not valid JSON: ${error.message}`)
      }
      throw error
    }
  }

  function writeToDisk(board) {
    fs.mkdirSync(dir, { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    const payload = `${JSON.stringify(board, null, 2)}\n`
    fs.writeFileSync(tmp, payload, 'utf8')
    fs.renameSync(tmp, file)
  }

  async function withLock(fn) {
    fs.mkdirSync(dir, { recursive: true })
    const deadline = Date.now() + lockTimeoutMs
    let handle
    for (;;) {
      try {
        handle = fs.openSync(lockFile, 'wx')
        break
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        if (Date.now() > deadline) {
          try {
            const age = Date.now() - fs.statSync(lockFile).mtimeMs
            if (age > lockTimeoutMs * 2) {
              fs.unlinkSync(lockFile)
              continue
            }
          } catch {
            // lock vanished; retry
          }
          throw boardError('BOARD_LOCKED', `board is locked by another process (${lockFile})`)
        }
        await sleep(25)
      }
    }
    try {
      return fn()
    } finally {
      try {
        fs.closeSync(handle)
      } catch {
        // ignore
      }
      try {
        fs.unlinkSync(lockFile)
      } catch {
        // ignore
      }
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
      writeToDisk(board)
      return board
    },
    async mutate(fn) {
      return withLock(() => {
        const board = readFromDisk()
        const result = fn(board)
        writeToDisk(board)
        return result
      })
    },
  }
}

export function resolveRoot(explicit) {
  const candidates = []
  if (explicit) candidates.push(explicit)
  if (process.env.CODEX_KANBAN_ROOT) candidates.push(process.env.CODEX_KANBAN_ROOT)

  for (const candidate of candidates) {
    try {
      const resolved = fs.realpathSync(path.resolve(candidate))
      if (fs.statSync(resolved).isDirectory()) return resolved
    } catch {
      // try next
    }
  }

  if (explicit) {
    throw boardError('ROOT_NOT_FOUND', `workspace path does not exist: ${explicit}`)
  }

  let current = process.cwd()
  const start = current
  for (;;) {
    if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, BOARD_DIR))) {
      return current
    }
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return start
}
