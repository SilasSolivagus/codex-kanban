# Codex Kanban Design

- Status: Approved for implementation
- Date: 2026-10-22
- Reference product: <https://github.com/SilasSolivagus/dsh-kanban>
- Delivery: native Codex plugin (manifest + MCP tools + skill), no iframe, no second app

## 1. Summary

Codex Kanban gives Codex a task layer that outlives a single conversation.
Four columns — Backlog, Running, Needs you, Done — backed by a repository-local
JSON store and driven by MCP tools the agent can call directly.

The plugin is native in the Codex sense:

- `.codex-plugin/plugin.json` manifest, installable from a local marketplace.
- MCP server over stdio, launched by Codex from `.mcp.json`.
- A `kanban` skill that tells the agent when to write to the board and when to
  ask a human.
- In-conversation rendering: Markdown for the TUI, a self-contained HTML board
  for rich clients.

## 2. Locked Decisions

1. One board per repository; data lives in `<repo>/.kanban/board.json`.
2. No runtime dependencies. Node 22+, ESM, no build step.
3. The MCP server is hand-written JSON-RPC 2.0 over stdio.
4. Every task write carries a `version`; stale writes fail with
   `TASK_VERSION_CONFLICT`.
5. `Needs you` is an automatic attention queue, never a drag target.
6. Agents may create, move, block, ask, and comment. Approve and reject are
   human decisions: the server only accepts `as: "user"` for those calls.
7. Markdown is the primary surface. HTML is progressive enhancement.
8. Attachments, multi-project boards, realtime collaboration, and mobile layout
   are out of scope for v1.

## 3. Product Model

```text
Repository board
└─ Task (KAN-1)
   ├─ pending question (optional)
   ├─ blocker (optional)
   ├─ links
   ├─ comments
   └─ activity
```

Columns are a view over six stored statuses:

| Column | Statuses | Meaning |
| --- | --- | --- |
| Backlog | `backlog`, `todo` | Not started |
| Running | `in_progress` | Agent or human is working |
| Needs you | any status with attention | Question, blocker, or review |
| Done | `done` | Finished; `canceled` is hidden from the board |

Attention priority: `question` → `blocked` → `review`. A task keeps its stored
status while it waits for a human; the overlay is not a duplicate state.

## 4. Data Model

`.kanban/board.json`:

```json
{
  "schema": 1,
  "project": { "name": "codex-kanban", "prefix": "CK", "createdAt": "..." },
  "nextTaskNumber": 4,
  "tasks": []
}
```

Task:

```json
{
  "id": "tsk_01J...",
  "identifier": "CK-3",
  "title": "Ship the MCP server",
  "description": "",
  "status": "in_progress",
  "priority": "medium",
  "labels": ["mcp"],
  "assignee": { "type": "agent", "name": "codex" },
  "sortOrder": 1024,
  "statusSince": "2026-10-22T06:00:00.000Z",
  "blockedReason": null,
  "blockedSince": null,
  "pendingQuestion": null,
  "questionResolution": null,
  "links": [],
  "comments": [],
  "activity": [],
  "version": 3,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Question:

```json
{
  "prompt": "Which deploy target?",
  "note": "",
  "options": [
    { "id": "opt_1", "label": "Staging", "detail": "" },
    { "id": "opt_2", "label": "Production", "detail": "Needs approval" }
  ],
  "selected": null,
  "createdAt": "..."
}
```

Resolution: `{ "decision": "approve" | "reject", "optionId": "...", "optionLabel": "...", "note": "", "at": "..." }`.

Writes are atomic: write `board.json.tmp`, fsync, rename. A `board.lock` guard
uses `O_EXCL` with a 5s timeout to serialize concurrent tool calls.

## 5. Tools

| Tool | Purpose |
| --- | --- |
| `kanban_board` | Markdown board, optional `column` / `include_done` |
| `kanban_task_get` | Full task with comments and activity |
| `kanban_task_create` | Create in Backlog (or given status) |
| `kanban_task_update` | Title, description, priority, labels, links |
| `kanban_task_move` | Move to a column or status |
| `kanban_task_block` | Record a blocker |
| `kanban_task_unblock` | Clear the blocker |
| `kanban_task_ask` | Ask a question with 2–5 options |
| `kanban_task_answer` | Record a selected option and note |
| `kanban_task_approve` | Human approval; moves to Done |
| `kanban_task_reject` | Human rejection; returns to Backlog |
| `kanban_task_comment` | Add a comment |
| `kanban_render` | Write `board.html`, return path and inline reference |

All write tools take `root` (absolute repository path) and `as` (`agent` or
`user`). `root` defaults to `CODEX_KANBAN_ROOT`, then the nearest git root from
`process.cwd()`.

Errors are structured: `{ "ok": false, "code": "TASK_VERSION_CONFLICT", "message": "..." }`.

## 6. Rendering

### Markdown

```markdown
# Codex Kanban · my-repo
3 tasks · 1 needs you · 1 running

## Needs you
- **CK-4** Which deploy target? · question: Ship today?

## Running
- **CK-3** Ship the MCP server · medium · in progress
```

### HTML

`kanban_render` writes `board.html` next to the store. The document is
self-contained: inline CSS, inline JS, no network. It renders four columns,
attention badges, blocked state, and a details panel. Card actions call
`window.openai.sendFollowUpMessage({ prompt, title })` when the host exposes it;
otherwise the file still opens as a static board.

## 7. Plugin Packaging

Measured constraint: a marketplace entry whose `source.path` is `"./"` is
silently dropped by Codex 0.137.0 — `codex plugin list` reports no plugins.
The plugin therefore lives in a subdirectory and the marketplace points at it.

```text
.agents/plugins/marketplace.json   marketplace "silassolivagus",
                                   source.path "./plugin"
plugin/.codex-plugin/plugin.json   name, version, skills, mcpServers, interface
plugin/.mcp.json                   ./bin/mcp-launcher.sh, cwd "."
plugin/bin/mcp-launcher.sh         resolve Node 22+, then exec server/index.mjs
plugin/server/                     protocol.mjs, tools.mjs, index.mjs
plugin/src/                        rules, store, domain, render, html
plugin/skills/kanban/SKILL.md      workflow + rendering rules
plugin/assets/icon.svg
test/                              node --test, imports ../plugin/src/*
```

Install:

```bash
codex plugin marketplace add <repo-or-local-path>
codex plugin add codex-kanban@silassolivagus
```

Verification never writes the real `~/.codex/config.toml`. It uses an isolated
`CODEX_HOME` with a copied `auth.json`, runs the install and one `codex exec`,
then deletes the directory.

## 8. Safety

- Approve/reject require `as: "user"` and a non-empty `confirmed_by` note.
- The skill forbids an agent from answering or approving its own question.
- Writes use optimistic concurrency; no blind overwrite.
- The store is plain JSON so a human can review changes in a diff.
- No shell execution, no network, no file reads outside the board directory.

## 9. Testing

- Unit: rules, store atomicity, version conflicts, domain transitions.
- Protocol: initialize → tools/list → tools/call over a real pipe.
- CLI: `bin/codex-kanban.mjs` smoke tests against a temp repo.
- End-to-end: install the plugin in Codex, run `codex exec`, confirm the MCP
  server starts and the board round-trips.

## 10. Non-goals

Multi-project boards, attachments, realtime sync, WIP limits, custom columns,
Gantt/list views, agent-to-agent assignment, and mobile layout.
