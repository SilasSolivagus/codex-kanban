# Codex Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Codex-native kanban plugin — MCP tools, a `kanban` skill, repository-local JSON state, Markdown and HTML boards, tests, docs, CI — and publish it to `github.com/SilasSolivagus/codex-kanban`.

**Architecture:** Zero-dependency Node 22 ESM. `plugin/src/` holds rules, the atomic store, domain operations and rendering; `plugin/server/` wraps them in a hand-written MCP stdio server; `plugin/bin/` exposes the same operations to humans as a CLI. `.codex-plugin/plugin.json`, `.mcp.json` and `skills/kanban/SKILL.md` make it installable from a local Codex marketplace.

**Tech Stack:** Node.js 22 ESM, `node --test`, JSON-RPC 2.0 over stdio, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-22-codex-kanban-design.md`

## Global Constraints

- Node.js 22 or newer; ESM only; no runtime dependencies; no build step.
- All writes go through `plugin/src/store.mjs`: atomic temp-file + rename, `board.lock` with `O_EXCL`, optimistic `version` checks.
- `Needs you` is computed; it is never stored and never a move target.
- `kanban_task_approve` / `kanban_task_reject` only accept `as: "user"` plus a non-empty `confirmed_by`.
- Markdown is the primary surface; HTML is progressive enhancement and must load nothing from the network.
- The MCP server never runs shell commands, never opens sockets, and only touches `<root>/.kanban/`.
- Every task ends with `node --test` green and a commit.

## File Structure

```text
.agents/plugins/marketplace.json   marketplace "silassolivagus" → ./plugin
plugin/.codex-plugin/plugin.json   plugin manifest
plugin/.mcp.json                   MCP server declaration
plugin/bin/mcp-launcher.sh         node resolution + exec server
plugin/bin/codex-kanban.mjs        human CLI
plugin/server/protocol.mjs         JSON-RPC dispatch
plugin/server/tools.mjs            tool schemas + handlers
plugin/server/index.mjs            stdio loop
plugin/src/rules.mjs               statuses, columns, attention, ordering
plugin/src/store.mjs               board file, lock, atomic write, root resolution
plugin/src/domain.mjs              create/update/move/block/ask/answer/approve/reject/comment
plugin/src/render.mjs              Markdown board + task detail
plugin/src/html.mjs                self-contained HTML board
plugin/skills/kanban/SKILL.md      agent workflow
plugin/assets/icon.svg             icon
test/*.test.mjs                    node --test suites
docs/                              spec, plan, usage, assets
README.md, README.zh-CN.md, LICENSE, CONTRIBUTING.md, .github/workflows/ci.yml
```

---

### Task 1: Rules and atomic store

**Files:**
- Create: `plugin/src/rules.mjs`, `plugin/src/store.mjs`
- Test: `test/rules.test.mjs`, `test/store.test.mjs`

**Interfaces:**
- Produces: `STATUSES`, `PRIORITIES`, `COLUMNS`, `COLUMN_IDS`, `attentionReason(task)`, `columnForTask(task)`, `canDrop(task, column)`, `sortTasks(a,b)`, `nextIdentifier(project, tasks)`, `taskPrefixFor(name)`.
- Produces: `createStore({root, lockTimeoutMs})` → `{root, dir, path, read(), write(board), mutate(fn)}`; `resolveRoot(explicit)`; `emptyBoard(root)`.
- `mutate` is async, holds the lock, reads fresh state, calls `fn(board)`, validates, then writes.

- [ ] **Step 1: Write failing tests**

```js
// test/rules.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { attentionReason, columnForTask, canDrop } from '../plugin/src/rules.mjs'

test('attention priority is question, then blocked, then review', () => {
  const base = { status: 'in_review', blockedReason: 'x', pendingQuestion: {} }
  assert.equal(attentionReason(base), 'question')
  assert.equal(columnForTask(base), 'needs')
})

test('needs you is never a drop target', () => {
  assert.equal(canDrop({ status: 'todo' }, 'needs').ok, false)
})
```

```js
// test/store.test.mjs
test('fresh store does not create a file', () => {
  const store = createStore({ root: tempRoot() })
  assert.equal(store.read().tasks.length, 0)
  assert.equal(fs.existsSync(store.path), false)
})

test('mutate writes atomically and removes the lock', async () => {
  const store = createStore({ root: tempRoot() })
  await store.mutate((board) => board.tasks.push({ identifier: 'CK-1' }))
  assert.equal(JSON.parse(fs.readFileSync(store.path, 'utf8')).tasks.length, 1)
  assert.equal(fs.existsSync(path.join(store.dir, 'board.lock')), false)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test test/rules.test.mjs test/store.test.mjs`
Expected: `ERR_MODULE_NOT_FOUND` for `plugin/src/rules.mjs`.

- [ ] **Step 3: Implement rules**

Port the status model from dsh-kanban's `src/shared/statuses.js` and `rules.js`:

```js
export const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled']
export const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent']
export const COLUMNS = [
  { id: 'backlog', label: 'Backlog', statuses: ['backlog', 'todo'] },
  { id: 'running', label: 'Running', statuses: ['in_progress'] },
  { id: 'needs', label: 'Needs you', statuses: [] },
  { id: 'done', label: 'Done', statuses: ['done'] },
]
export function attentionReason(task) {
  if (task.pendingQuestion && !task.questionResolution) return 'question'
  if (task.blockedReason) return 'blocked'
  if (task.status === 'in_review') return 'review'
  return null
}
export function columnForTask(task) {
  if (attentionReason(task)) return 'needs'
  return COLUMNS.find((column) => column.statuses.includes(task.status))?.id ?? null
}
```

Add `canDrop`, `sortTasks` (priority rank, then `sortOrder`, then `updatedAt`), `nextIdentifier` (max existing numeric suffix, never reuse), `taskPrefixFor` (alphanumeric, 2–6 chars, fallback `KANBAN`), `statusForColumn`, `elapsedStart`.

- [ ] **Step 4: Implement the store**

```js
export function createStore({ root, lockTimeoutMs = 5000 }) {
  const base = path.resolve(root)
  const dir = path.join(base, '.kanban')
  const file = path.join(dir, 'board.json')
  const lockFile = path.join(dir, 'board.lock')
  return {
    root: base, dir, path: file,
    read() { /* ENOENT → emptyBoard; SyntaxError → CORRUPT_BOARD */ },
    write(board) { /* mkdir -p, write `${file}.tmp`, rename */ },
    async mutate(fn) { /* O_EXCL lock with retry + timeout, read, fn, write, unlock */ },
  }
}
```

`resolveRoot` order: explicit path (must exist, `realpath`) → `CODEX_KANBAN_ROOT` → walk up from `process.cwd()` for `.git` or `.kanban` → `process.cwd()`.

- [ ] **Step 5: Run, commit**

```bash
node --test test/rules.test.mjs test/store.test.mjs
git add -A && git commit -m "feat: add kanban rules and atomic store"
```

---

### Task 2: Domain operations

**Files:**
- Create: `plugin/src/domain.mjs`
- Test: `test/domain.test.mjs`

**Interfaces:**
- Consumes: `createStore`, rules.
- Produces: `createTask(store, input)`, `updateTask`, `moveTask`, `blockTask`, `unblockTask`, `askTask`, `answerTask`, `approveTask`, `rejectTask`, `addComment` — all async, returning `{ok: true, task}` or throwing `KanbanError(code, message)`.
- Produces: `getTaskView(store, {id})`, `boardView(board, opts)`, `summarizeBoard(board)`, `decorateTask(task)`, `findTask(board, ref)`.

**Rules to encode:**
- Every write takes the current `version`; missing → `VERSION_REQUIRED`; mismatch → `TASK_VERSION_CONFLICT`.
- `moveTask` to `needs` → `CANNOT_MOVE_TO_NEEDS`.
- Moving to Done with an open question or blocker → `CANNOT_MOVE` / `BLOCKER_ACTIVE` / `QUESTION_OPEN`.
- `askTask` requires 2–5 options; one open question per task.
- `answerTask` records `pendingQuestion.selected` and `answerNote` but does not close the question.
- `approveTask` requires `as: "user"` and a selected option; sets `questionResolution`, status `done`.
- `rejectTask` requires `as: "user"`; sets `questionResolution.decision = "reject"`, status `backlog`, clears the blocker.
- One activity entry per write, capped at 200.

- [ ] **Step 1: Write failing tests** covering create → `CK-1`, version increments, stale write rejection, `needs` rejection, ask → answer → approve, agent approve rejection, reject clearing the blocker, comment authoring, invalid link rejection, grouping order.

- [ ] **Step 2: Run and confirm failure**

Run: `node --test test/domain.test.mjs`

- [ ] **Step 3: Implement** with helpers `requireString`, `checkVersion`, `touch(task, actor, kind, summary, changes)`, `actorOf({as, actor})` (default agent `codex`, user `you`).

- [ ] **Step 4: Run, commit**

```bash
node --test test/domain.test.mjs
git add -A && git commit -m "feat: add task domain with optimistic concurrency"
```

---

### Task 3: Markdown rendering

**Files:**
- Create: `plugin/src/render.mjs`
- Test: `test/render.test.mjs`

**Interfaces:**
- Consumes: `boardView`.
- Produces: `renderMarkdown(board, {column, includeDone, now})`, `renderTaskDetail(task, {now})`, `renderTaskLine(task, now)`, `buildView(board, opts)`, `summarizeView(view)`, `formatAge(iso, now)`.

**Output contract:**
- Title `# Codex Kanban · <project>`; summary line with total, needs you, running.
- Section order: Needs you → Running → Backlog → Done.
- Needs you renders `_Nothing needs you right now._` when empty.
- Lines: `- **CK-3** title · medium · question: Which target? · 12m`.
- Empty board points at `kanban_task_create`.

- [ ] **Step 1: Failing tests** — order, empty state, hidden Done, task line badges, detail options with `[x]`, summary counts.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run, commit** — `git commit -m "feat: render board as markdown"`

---

### Task 4: MCP server

**Files:**
- Create: `plugin/server/protocol.mjs`, `plugin/server/tools.mjs`, `plugin/server/index.mjs`
- Test: `test/mcp.test.mjs`

**Interfaces:**
- `tools.mjs` exports `TOOLS` (13 entries with `name`, `title`, `description`, `inputSchema`) and `callTool(name, args)` → `{content:[{type:'text',text}], isError?}`.
- `protocol.mjs` exports `createProtocol({tools, callTool})` → `{handle(message)}`; supports `initialize`, `notifications/*`, `ping`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`; `-32601` unknown method, `-32602` unknown tool.
- `index.mjs` reads newline-delimited JSON from stdin, writes one JSON line per response, logs only to stderr.

**Tool names (exactly):** `kanban_board`, `kanban_task_get`, `kanban_task_create`, `kanban_task_update`, `kanban_task_move`, `kanban_task_block`, `kanban_task_unblock`, `kanban_task_ask`, `kanban_task_answer`, `kanban_task_approve`, `kanban_task_reject`, `kanban_task_comment`, `kanban_render`.

**Shared parameters:** `root` (absolute path), `as` (`agent`|`user`), `version` (integer). Approve/reject also require `confirmed_by`.

- [ ] **Step 1: Failing test** — spawn `plugin/server/index.mjs` with `CODEX_KANBAN_ROOT=<tmp>`, run `initialize`, `notifications/initialized`, `tools/list` (assert 13 names), `tools/call kanban_task_create`, `kanban_board`, error tool call, unknown method.
- [ ] **Step 2: Implement protocol + tools + stdio loop.**
- [ ] **Step 3: Run, commit** — `git commit -m "feat: expose the board over mcp"`

---

### Task 5: CLI

**Files:**
- Create: `plugin/bin/codex-kanban.mjs`
- Test: `test/cli.test.mjs`

**Commands:** `board`, `list --json`, `get`, `add`, `update`, `move`, `block`, `unblock`, `ask`, `answer`, `approve`, `reject`, `comment`, `render`, `open`, `help`.
**Flags:** `--root`, `--json`, `--as`, `--version`, plus command-specific flags. Numeric refs (`1`) resolve to `<prefix>-1`. CLI approve/reject always run `as: "user"`; `confirmed_by` is required.

- [ ] **Step 1: Failing tests** — add/board/move/ask/answer/approve flow, `list --json`, render writes HTML, domain errors exit non-zero with the error code, help text.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run, commit** — `git commit -m "feat: add the codex-kanban cli"`

---

### Task 6: HTML board

**Files:**
- Create: `plugin/src/html.mjs`
- Test: `test/html.test.mjs`

**Interfaces:** `renderHtml(board, {now})`, `boardPayload(board, {now})`.

**Contract:** starts with `<!doctype html>`; zero `http://`/`https://` asset references; four columns; attention badges; detail drawer; card actions call `window.openai.sendFollowUpMessage` only when available; `light-dark()` theming; embedded JSON has `<` escaped.

- [ ] **Step 1: Failing tests** — doctype, no external URLs, every identifier present, embedded payload parses.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run, commit** — `git commit -m "feat: add self-contained html board"`

---

### Task 7: Plugin packaging and skill

**Files:**
- Create: `.agents/plugins/marketplace.json`, `plugin/.codex-plugin/plugin.json`, `plugin/.mcp.json`, `plugin/bin/mcp-launcher.sh`, `plugin/skills/kanban/SKILL.md`, `plugin/assets/icon.svg`

**Constraint:** `source.path` must be `./plugin`; `"./"` is silently dropped by Codex 0.137.0.

- [ ] **Step 1: Manifest** — name `codex-kanban`, version `0.1.0`, `skills: "./skills/"`, `mcpServers: "./.mcp.json"`, interface display name, category, capabilities, three default prompts ≤128 chars.
- [ ] **Step 2: MCP config** — `./bin/mcp-launcher.sh`, `cwd: "."`, `env_vars: ["CODEX_KANBAN_ROOT"]`.
- [ ] **Step 3: Launcher** — resolve `NODE_BIN`, then `command -v node`, `/opt/homebrew/bin/node`, `/usr/local/bin/node`; exec `server/index.mjs`; exit 1 with a clear message.
- [ ] **Step 4: Skill** — root discovery, board-first rule, ask vs block, human approval boundary, rendering rules, error recovery.
- [ ] **Step 5: Commit** — `git commit -m "feat: package as a codex plugin"`

---

### Task 8: Install and end-to-end verification

- [ ] **Step 1:** Create an isolated home: `mkdir .tmp-codex-home && cp ~/.codex/auth.json .tmp-codex-home/ && printf 'model = "gpt-5.4"\n' > .tmp-codex-home/config.toml`.
- [ ] **Step 2:** `CODEX_HOME=$PWD/.tmp-codex-home codex plugin marketplace add $PWD` → expect "Added marketplace".
- [ ] **Step 3:** `CODEX_HOME=... codex plugin list` → expect `codex-kanban@silassolivagus  not installed`.
- [ ] **Step 4:** `CODEX_HOME=... codex plugin add codex-kanban@silassolivagus` → expect success; re-run list shows installed.
- [ ] **Step 5:** In a temp repo, run `codex exec` with a prompt that asks to create a task and show the board; verify `.kanban/board.json` exists and the transcript mentions the identifier.
- [ ] **Step 6:** Delete `.tmp-codex-home` (contains auth). Commit any fixes.

---

### Task 9: Docs, CI, assets

- [ ] **Step 1:** `README.md` and `README.zh-CN.md`: badges, one-paragraph pitch, install, tools table, architecture diagram, roadmap, development, license.
- [ ] **Step 2:** `docs/usage.md` and `docs/usage.en.md`; `CONTRIBUTING.md`; `LICENSE` (MIT, Silas Solivagus); `.gitignore` (`node_modules/`, `.tmp-codex-home/`, `.kanban/board.html`, `.DS_Store`).
- [ ] **Step 3:** `.github/workflows/ci.yml` — Node 22, `node --test`, on push/PR/manual.
- [ ] **Step 4:** Screenshot of the rendered board in `docs/assets/`, produced by running the renderer and capturing it.
- [ ] **Step 5:** Commit — `git commit -m "docs: add readme, usage guide and ci"`

---

### Task 10: Publish

- [ ] **Step 1:** `gh repo create SilasSolivagus/codex-kanban --public --source . --remote origin --description "The Codex-native task board"`.
- [ ] **Step 2:** `git push -u origin main`; confirm Actions runs green.
- [ ] **Step 3:** Tag `v0.1.0`, push the tag, verify the release page.
