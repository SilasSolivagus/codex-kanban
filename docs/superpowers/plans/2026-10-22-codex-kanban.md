# Codex Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Codex-native kanban plugin: MCP tools, a `kanban` skill, a repo-local JSON store, Markdown and HTML boards, tests, docs, and a publishable GitHub repository.

**Architecture:** A zero-dependency Node 22 plugin. `src/` holds the domain (rules, store, operations, rendering); `server/` wraps it in a hand-written MCP stdio server; `bin/` exposes the same operations as a CLI. `.codex-plugin/plugin.json` + `.mcp.json` + `skills/kanban/SKILL.md` make it installable through a local Codex marketplace.

**Tech Stack:** Node.js 22 ESM, `node --test`, JSON-RPC 2.0 over stdio, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-22-codex-kanban-design.md`

## Global Constraints

- Node.js 22 or newer; ESM only; no runtime dependencies.
- All writes go through `src/store.mjs` with atomic rename and optimistic `version` checks.
- `Needs you` is computed; it is never stored or assigned by a move.
- Approve/reject only accept `as: "user"`.
- All user-facing tool output is Markdown text; HTML is optional.
- Every commit keeps `node --test` green.

---

### Task 1: Rules and store

**Files:**
- Create: `src/rules.mjs`, `src/store.mjs`
- Test: `test/rules.test.mjs`, `test/store.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `STATUSES`, `COLUMNS`, `PRIORITIES`, `attentionReason(task)`, `columnForTask(task)`, `canDrop(task, column)`, `sortTasks(a, b)`; `createStore({ root })` with `read()`, `write(board)`, `mutate(fn)`, `path`.

- [ ] **Step 1: Write failing tests**

```js
// test/rules.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { attentionReason, columnForTask, canDrop } from '../src/rules.mjs'

test('question outranks blocked and review', () => {
  const task = { status: 'in_review', blockedReason: 'x', pendingQuestion: { createdAt: 'now' } }
  assert.equal(attentionReason(task), 'question')
  assert.equal(columnForTask(task), 'needs')
})

test('needs you cannot be a drag target', () => {
  assert.equal(canDrop({ status: 'todo' }, 'needs').ok, false)
})
```

- [ ] **Step 2: Run the tests, confirm they fail on missing modules**

Run: `node --test test/rules.test.mjs`

- [ ] **Step 3: Implement rules and store**

Port `src/shared/statuses.js` and `src/shared/rules.js` from dsh-kanban, then wrap the store:

```js
export function createStore({ root }) {
  const dir = path.join(root, '.kanban')
  const file = path.join(dir, 'board.json')
  return {
    path: file,
    read() { /* mkdir -p, parse, migrate, return board or initial board */ },
    mutate(fn) { /* lock, read, fn(board), validate, atomic write, unlock */ },
  }
}
```

- [ ] **Step 4: Run tests, then commit**

```bash
node --test && git add -A && git commit -m "feat: add rules and atomic board store"
```

### Task 2: Domain operations

**Files:**
- Create: `src/domain.mjs`
- Test: `test/domain.test.mjs`

**Interfaces:**
- Consumes: `createStore`, `rules.mjs`.
- Produces: `createTask`, `updateTask`, `moveTask`, `blockTask`, `unblockTask`, `askTask`, `answerTask`, `approveTask`, `rejectTask`, `addComment`, `getTask`, `listBoard`; each returns `{ ok: true, task }` or `{ ok: false, code, message }`.

- [ ] **Step 1: Write failing tests** — create → version 1; stale update → `TASK_VERSION_CONFLICT`; move to `needs` → `CANNOT_MOVE_TO_NEEDS`; approve moves to `done` and records resolution; approve with `as: "agent"` → `HUMAN_DECISION_REQUIRED`; ask then answer then approve clears attention.

- [ ] **Step 2: Implement** with a shared `touch(task, actor, summary)` helper that bumps `version`, `updatedAt`, and appends activity.

- [ ] **Step 3: Run tests, commit** — `git commit -m "feat: add task domain operations with versioning"`

### Task 3: Markdown rendering

**Files:**
- Create: `src/render.mjs`
- Test: `test/render.test.mjs`

**Interfaces:**
- Consumes: `listBoard` output.
- Produces: `renderMarkdown(board, { column, includeDone })`, `summarize(board)`.

- [ ] **Step 1: Write failing tests** — Needs you section appears first; identifiers render; empty board prints a create hint; `includeDone: false` hides Done.
- [ ] **Step 2: Implement** with a `formatAge(iso, now)` helper.
- [ ] **Step 3: Run tests, commit** — `git commit -m "feat: render board as markdown"`

### Task 4: MCP server and tools

**Files:**
- Create: `server/index.mjs`, `server/protocol.mjs`, `server/tools.mjs`
- Test: `test/mcp.test.mjs`

**Interfaces:**
- Consumes: transport `{ readLine, writeLine }`.
- Produces: `createServer({ transport })` with `start()`; tools `kanban_board`, `kanban_task_get`, `kanban_task_create`, `kanban_task_update`, `kanban_task_move`, `kanban_task_block`, `kanban_task_unblock`, `kanban_task_ask`, `kanban_task_answer`, `kanban_task_approve`, `kanban_task_reject`, `kanban_task_comment`, `kanban_render`.

- [ ] **Step 1: Write failing protocol test** — feed `initialize`, `tools/list`, and a `tools/call` for `kanban_task_create` into a fake transport, assert JSON-RPC responses and a persisted task.
- [ ] **Step 2: Implement framing** — newline-delimited JSON, ignore notifications, return `-32601` for unknown methods, `isError: true` content for tool failures.
- [ ] **Step 3: Implement tool schemas** — JSON Schema with `required`, enums from `rules.mjs`, defaults documented.
- [ ] **Step 4: Run tests, commit** — `git commit -m "feat: expose kanban through an MCP server"`

### Task 5: CLI

**Files:**
- Create: `bin/codex-kanban.mjs`
- Test: `test/cli.test.mjs`

- [ ] **Step 1: Failing test** — `node bin/codex-kanban.mjs add "Task" --root <tmp>` prints `CK-1` and `board` lists it.
- [ ] **Step 2: Implement** subcommands `board`, `list`, `add`, `move`, `block`, `unblock`, `ask`, `answer`, `approve`, `reject`, `comment`, `render`, `open`, with `--root` and `--json`.
- [ ] **Step 3: Run tests, commit** — `git commit -m "feat: add codex-kanban cli"`

### Task 6: HTML board

**Files:**
- Create: `src/html.mjs`
- Test: `test/html.test.mjs`

- [ ] **Step 1: Failing test** — output starts with `<!doctype html>`, contains no `http://` or `https://` asset references, includes every task identifier.
- [ ] **Step 2: Implement** four-column layout, `light-dark()` colors, keyboard accessible cards, static fallback, `window.openai.sendFollowUpMessage` actions guarded by `typeof window.openai?.sendFollowUpMessage === 'function'`.
- [ ] **Step 3: Run tests, commit** — `git commit -m "feat: add self-contained html board"`

### Task 7: Plugin packaging and skill

**Files:**
- Create: `.codex-plugin/plugin.json`, `.mcp.json`, `.agents/plugins/marketplace.json`, `skills/kanban/SKILL.md`, `icon.svg`

- [ ] **Step 1: Manifest** — name `codex-kanban`, version `0.1.0`, `skills: "./skills/"`, `mcpServers: "./.mcp.json"`, interface metadata with display name, category, capabilities, default prompts under 128 chars.
- [ ] **Step 2: MCP config** — `node ./server/index.mjs`, `cwd: "."`, env `["CODEX_KANBAN_ROOT"]`.
- [ ] **Step 3: Skill** — when to create a task, when to ask vs block, never self-approve, how to render on Markdown vs rich clients, how to pass `root`.
- [ ] **Step 4: Commit** — `git commit -m "feat: package as codex plugin"`

### Task 8: Install and end-to-end verification

- [ ] **Step 1:** `codex plugin marketplace add <repo>` then `codex plugin add codex-kanban@silassolivagus`.
- [ ] **Step 2:** Confirm `codex plugin list` shows it installed and `codex mcp list` shows the server.
- [ ] **Step 3:** Run `codex exec` in a temp repo with a prompt that exercises the board; verify `.kanban/board.json` and the transcript.
- [ ] **Step 4:** Fix anything the real handshake reveals; commit.

### Task 9: Docs, CI, assets

- [ ] **Step 1:** README (English) and README.zh-CN with badges, install, tools table, architecture, roadmap.
- [ ] **Step 2:** `docs/usage.md`, `docs/usage.en.md`, `CONTRIBUTING.md`, `LICENSE`, `.gitignore`.
- [ ] **Step 3:** `.github/workflows/ci.yml` running `node --test` on Node 22.
- [ ] **Step 4:** Screenshots of the HTML board in `docs/assets/`; icon.
- [ ] **Step 5:** Commit — `git commit -m "docs: add readme, usage guide and ci"`

### Task 10: Publish

- [ ] **Step 1:** `gh repo create SilasSolivagus/codex-kanban --public --source . --remote origin`.
- [ ] **Step 2:** Push `main`; verify CI and the rendered README.
- [ ] **Step 3:** Tag `v0.1.0` and push the tag.
