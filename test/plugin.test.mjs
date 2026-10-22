import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const PLUGIN = path.join(ROOT, 'plugin')
const MANIFEST = path.join(PLUGIN, '.codex-plugin', 'plugin.json')
const MARKETPLACE = path.join(ROOT, '.agents', 'plugins', 'marketplace.json')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readText(file) {
  return fs.readFileSync(file, 'utf8')
}

test('manifest parses, matches the marketplace entry, and points at real skills and MCP config', () => {
  const manifest = readJson(MANIFEST)
  const marketplace = readJson(MARKETPLACE)
  const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name)

  assert.ok(entry, `marketplace has no entry named ${manifest.name}`)
  assert.equal(manifest.name, entry.name)
  assert.equal(manifest.version, '0.4.1')
  assert.equal(manifest.license, 'MIT')

  for (const key of ['skills', 'mcpServers']) {
    const relative = manifest[key]
    assert.equal(typeof relative, 'string', `${key} must be a path string`)
    const target = path.resolve(PLUGIN, relative)
    assert.ok(fs.existsSync(target), `${key} path does not exist: ${relative}`)
  }
})

test('default prompts are bounded strings and capabilities are declared', () => {
  const { interface: ui } = readJson(MANIFEST)
  const prompts = ui.defaultPrompt

  assert.ok(Array.isArray(prompts), 'interface.defaultPrompt must be an array')
  assert.ok(prompts.length > 0, 'interface.defaultPrompt must not be empty')
  assert.ok(prompts.length <= 3, `expected at most 3 default prompts, got ${prompts.length}`)
  for (const prompt of prompts) {
    assert.equal(typeof prompt, 'string')
    assert.ok(prompt.length > 0, 'default prompts must not be empty')
    assert.ok(prompt.length <= 128, `prompt is ${prompt.length} chars: ${prompt}`)
  }

  assert.ok(Array.isArray(ui.capabilities) && ui.capabilities.length > 0)
  for (const capability of ['Interactive', 'Read', 'Write']) {
    assert.ok(ui.capabilities.includes(capability), `missing capability ${capability}`)
  }
})

test('marketplace source resolves to the plugin directory and its manifest', () => {
  const marketplace = readJson(MARKETPLACE)
  assert.equal(marketplace.name, 'silassolivagus')

  const entry = marketplace.plugins.find((plugin) => plugin.name === 'codex-kanban')
  assert.ok(entry, 'marketplace must list codex-kanban')
  assert.deepEqual(entry.source, { source: 'local', path: './plugin' })
  assert.deepEqual(entry.policy, { installation: 'AVAILABLE', authentication: 'ON_USE' })
  assert.equal(entry.category, 'Productivity')

  const pluginDir = path.resolve(ROOT, entry.source.path)
  assert.equal(fs.realpathSync(pluginDir), fs.realpathSync(PLUGIN))
  assert.ok(fs.existsSync(path.join(pluginDir, '.codex-plugin', 'plugin.json')))
})

test('MCP launcher is executable and its server entry exists', () => {
  const launcher = path.join(PLUGIN, 'bin', 'mcp-launcher.sh')
  const stat = fs.statSync(launcher)
  assert.ok((stat.mode & 0o111) !== 0, 'mcp-launcher.sh must be executable')

  const script = readText(launcher)
  assert.match(script, /^#!\/bin\/sh/)
  assert.match(script, /server\/index\.mjs/)
  assert.ok(fs.existsSync(path.join(PLUGIN, 'server', 'index.mjs')))
})

test('kanban skill starts with frontmatter and describes the board', () => {
  const skill = readText(path.join(PLUGIN, 'skills', 'kanban', 'SKILL.md'))
  assert.ok(skill.startsWith('---\nname: kanban'), 'SKILL.md must start with --- and name: kanban')

  const end = skill.indexOf('\n---', 4)
  assert.ok(end > 0, 'frontmatter must be closed')
  const frontmatter = skill.slice(4, end)
  const description = frontmatter
    .split('\n')
    .find((line) => line.startsWith('description:'))
  assert.ok(description, 'frontmatter must declare a description')
  assert.match(description, /board/i)
})

test('plugin assets stay offline and the icon uses the brand color', () => {
  const icon = readText(path.join(PLUGIN, 'assets', 'icon.svg'))
  const skill = readText(path.join(PLUGIN, 'skills', 'kanban', 'SKILL.md'))

  const iconWithoutNamespace = icon.replace(
    /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g,
    'xmlns=""',
  )
  assert.ok(!iconWithoutNamespace.includes('http://'), 'icon must not reference http URLs')
  assert.ok(!skill.includes('http://'), 'skill must not reference http URLs')
  assert.ok(!skill.includes('https://'), 'skill must not reference https URLs')

  assert.match(icon, /viewBox="0 0 64 64"/)
  assert.match(icon, /#2F6FB2/i)
})
