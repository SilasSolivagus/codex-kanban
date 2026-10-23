import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(here, '..', 'plugin', 'bin', 'codex-kanban.mjs')
const install = path.join(here, '..', 'scripts', 'install-autostart.sh')
const uninstall = path.join(here, '..', 'scripts', 'uninstall-autostart.sh')

test('serve --no-open starts the board without launching a browser', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-kanban-serve-'))
  fs.mkdirSync(path.join(root, '.git'))
  const child = spawn(process.execPath, [cli, 'serve', '--no-open', '--port', '0', '--root', root], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => {
    child.kill('SIGKILL')
    fs.rmSync(root, { recursive: true, force: true })
  })

  const url = await new Promise((resolve, reject) => {
    let output = ''
    const timer = setTimeout(() => reject(new Error(`no url printed: ${output}`)), 8000)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      output += chunk
      const match = /http:\/\/127\.0\.0\.1:\d+/.exec(output)
      if (match) {
        clearTimeout(timer)
        resolve(match[0])
      }
    })
    child.once('exit', (code) => reject(new Error(`server exited early (${code}): ${output}`)))
  })

  const response = await fetch(`${url}/api/board`)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.ok, true)
  assert.equal(body.board.project, null)
})

test('the autostart scripts are valid shell and executable', () => {
  for (const script of [install, uninstall]) {
    assert.ok(fs.existsSync(script), script)
    assert.ok(fs.statSync(script).mode & 0o111, `${script} must be executable`)
    const check = spawnSync('sh', ['-n', script], { encoding: 'utf8' })
    assert.equal(check.status, 0, check.stderr)
  }
  const text = fs.readFileSync(install, 'utf8')
  assert.match(text, /com\.silassolivagus\.codex-kanban/)
  assert.match(text, /LaunchAgents/)
  assert.match(text, /--no-open/)
})
