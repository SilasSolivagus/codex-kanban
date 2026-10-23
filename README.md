<p align="center">
  <img src="plugin/assets/icon.svg" width="80" height="80" alt="Codex Kanban icon">
</p>

<h1 align="center">Codex Kanban</h1>

<p align="center"><strong>A Codex-native task board: import what you already discussed, then run projects, approvals, blockers and attachments from the repository.</strong></p>

<p align="center">
  <a href="https://github.com/SilasSolivagus/codex-kanban/actions/workflows/ci.yml"><img src="https://github.com/SilasSolivagus/codex-kanban/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/version-0.7.3-2F6FB2" alt="Version 0.7.3">
  <img src="https://img.shields.io/badge/tests-300%20passing-2ea043" alt="300 tests passing">
  <img src="https://img.shields.io/badge/design-B%203.42%2F4-6C5CE7" alt="UX audit B">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2F6FB2" alt="MIT license"></a>
</p>

<p align="center">English · <a href="README.zh-CN.md">简体中文</a></p>

![The Codex Kanban board with Backlog, Running, Needs you and Done columns](docs/assets/kanban-web.png)

Codex Kanban gives Codex a task layer that outlives the conversation. Tasks,
questions, blockers, comments, activity and attachments live in
`.kanban/board.json` inside your repository, so they survive restarts, show up in
code review, and belong to the project rather than to a chat.

It also meets you where you already are: on first run it can turn this repository's
existing Codex sessions into Backlog tasks, with a checklist before anything is
written. Codex reads and writes the board through 20 MCP tools and a `kanban` skill;
humans get the same board as a local web app and a CLI. No hosted service, database,
account or runtime dependency.

## What you get

| | |
| --- | --- |
| **Import what already happened** | Turn this repository's Codex sessions into Backlog tasks with a preview checklist, a time range (30/90 days/all) and a cap (10–100). Only the thread title and last user message are read. |
| **Four columns, six statuses** | Backlog (`backlog`, `todo`), Running (`in_progress`), Needs you (computed), Done (`done`). `in_review` waits in Needs you; `canceled` stays off the board. |
| **Needs you is automatic** | Computed from open questions, active blockers and review state, in that order. It is not a move target. |
| **Human approval boundary** | Approve and reject require `as: "user"` plus `confirmed_by`. An agent cannot move a task out of `in_review`, and cannot close one it opened for review. |
| **Questions with options** | Two to five real options with detail. One click selects, one confirm records the answer and decides. |
| **Blockers with one reason** | Block when external work is missing; the card shows an amber blocked strip and leaves Needs you when cleared. |
| **Projects** | Several workstreams per repository, each with its own prefix and counter. `APP-1` and `WEB-1` coexist. |
| **Archive and restore** | Projects and tasks archive independently. Archived projects are read-only in the domain layer; archived tasks stay hidden until **Show archived**. |
| **Attachments** | Upload from the drawer, stored under `.kanban/attachments/`, 10 MB per file, downloadable over HTTP. |
| **Ordering** | Drag between columns and within a column; `sortOrder` persists. `Alt+↑/↓` reorders, `Alt+←/→` moves columns. |
| **Search and filters** | Text search plus priority, label and assignee filters, removable chips, and `X / Y` counts. |
| **Bilingual, keyboard-first** | Chinese and English, `/` search, `n` new task, `Esc` closes layer by layer, reduced-motion support. |
| **Durable, reviewable state** | Plain JSON with atomic, versioned writes. Commit it with the code and review task changes in the same diff. |

## Install

Requirements: Codex with plugin support, and Node.js 22 or newer.

```bash
codex plugin marketplace add https://github.com/SilasSolivagus/codex-kanban
codex plugin add codex-kanban@silassolivagus
```

Local checkout:

```bash
codex plugin marketplace add /path/to/codex-kanban
codex plugin add codex-kanban@silassolivagus
```

Update later:

```bash
codex plugin marketplace upgrade silassolivagus
codex plugin add codex-kanban@silassolivagus
```

Start a new Codex session in the repository you want to track.

## Three ways to use it

![How Codex Kanban is used: install once, work in Codex, run serve only when you want the web board](docs/assets/usage-flow.en.png)

Installing the plugin never opens a browser. The default board appears in the
conversation; the web board is a separate `serve` step.

### 1. In Codex (agent writes, you decide)

> "Track the SSO redirect bug as a high-priority task with the `auth` label. Ask me
> whether staging or production should get the fix first."

Codex creates the task, posts a question, and leaves it in Needs you. Answer it, then
say "approve with the staging option" — Codex records the answer and closes the task
with your confirmation. Ask "what needs me?" any time for just the attention queue.

### 2. Local web board (for humans)

```bash
# from a checkout
node plugin/bin/codex-kanban.mjs serve

# from the installed plugin (version may differ)
node "$HOME/.codex/plugins/cache/silassolivagus/codex-kanban/0.7.3/bin/codex-kanban.mjs" serve
```

`serve` opens `http://127.0.0.1:4317` by default; pass `--no-open` to only print the
URL. It binds to loopback, has no account system, and makes no outbound requests.
`--port` changes the port; `--host 0.0.0.0` exposes the board to your network.

![The task drawer with status, attributes, collaboration and the sticky save bar](docs/assets/kanban-drawer.png)

To start the board at login:

| OS | Install | Uninstall |
| --- | --- | --- |
| macOS | `scripts/install-autostart.sh --root "$PWD"` | `scripts/uninstall-autostart.sh` |
| Linux | `scripts/install-autostart-linux.sh --root "$PWD"` | `scripts/uninstall-autostart-linux.sh` |
| Windows | `powershell -File scripts\install-autostart-windows.ps1 -Root .` | `powershell -File scripts\uninstall-autostart-windows.ps1` |

Add `--open` (macOS/Linux) or `-Open` (Windows) to also open the browser at login.

### 3. CLI (for scripts)

```bash
node plugin/bin/codex-kanban.mjs board
node plugin/bin/codex-kanban.mjs add "Fix the login redirect" \
  --description "Users land on / after SSO instead of the page they came from." \
  --priority high --label auth
node plugin/bin/codex-kanban.mjs move 1 --to in_progress
node plugin/bin/codex-kanban.mjs ask 1 \
  --prompt "Which environment should get the fix first?" \
  --option Staging --option Production
node plugin/bin/codex-kanban.mjs approve 1 --confirmed-by "Staging first"
node plugin/bin/codex-kanban.mjs render --open
```

Numeric references such as `1` resolve to `<prefix>-1`. `--root PATH` points at
another repository; by default the CLI uses the nearest directory above the current
one containing `.git` or `.kanban`.

## Import your history

A board does not have to start empty.

- **Web**: an empty board offers this repository's Codex sessions, with a time range
  (30 days / 90 days / all time), a candidate cap (10–100), and a checklist. Pick
  what belongs on the board; nothing is written before you confirm.
- **Codex chat**: when the board is empty, the `kanban` skill asks the same question
  and shows the titles first.
- **CLI**: preview by default, apply explicitly.

![Import offer on an empty board](docs/assets/import-onboarding.png)

![Import checklist with time range and cap](docs/assets/import-modal.png)

```bash
# preview only
node plugin/bin/codex-kanban.mjs import --root "$PWD" --since 30d

# create the previewed tasks
node plugin/bin/codex-kanban.mjs import --root "$PWD" --since 30d --apply
```

Rules: only sessions whose `cwd` is inside this repository; at least two user turns;
only the thread name and last user message are read; imported tasks land in Backlog
with an `imported` label and a `source` pointing at the session; duplicates by title
are skipped. **Skip** is remembered per repository, and **Projects → Import history**
reopens the offer.

## Tools

Every tool takes `root`, the absolute repository path. It is required unless
`CODEX_KANBAN_ROOT` is set; there is deliberately no fallback to the server's working
directory, because an installed plugin runs from the plugin cache. Writes to an
existing task take the current `version` from `kanban_task_get`; approve and reject
also require `as: "user"` and `confirmed_by`.

| Tool | What it does |
| --- | --- |
| `kanban_board` | Render the Markdown board, Needs you first, optionally filtered by project or column. |
| `kanban_task_get` | Read one task with description, question, blocker, links, attachments, comments, activity and current version. |
| `kanban_task_create` | Create a task in a project, in Backlog or a given status. |
| `kanban_task_update` | Change title, description, priority, labels or links. |
| `kanban_task_move` | Move between columns/statuses, or reorder within a column. |
| `kanban_task_block` | Record one actionable blocker. |
| `kanban_task_unblock` | Clear the blocker. |
| `kanban_task_ask` | Post a question with two to five options. |
| `kanban_task_answer` | Record the selected option and a note. |
| `kanban_task_approve` | Human-only: approve and close as Done. |
| `kanban_task_reject` | Human-only: reject with a note back to Backlog. |
| `kanban_task_comment` | Append a comment that stays with the task. |
| `kanban_task_archive` | Hide a task from the board without deleting it. |
| `kanban_task_restore` | Bring an archived task back. |
| `kanban_render` | Write `.kanban/board.html` and return its path plus the inline reference. |
| `kanban_project_list` | List projects with prefix, archive state and task counts. |
| `kanban_project_create` | Create a project with an optional prefix and workspace path. |
| `kanban_project_update` | Rename a project, change its prefix, or set its workspace path. |
| `kanban_project_archive` | Archive a project; its tasks become read-only. |
| `kanban_project_restore` | Restore an archived project. |

## Projects, archive and attachments

- Projects are workstreams inside one repository; identifiers are unique per project.
- Archiving is enforced in the domain layer: `PROJECT_ARCHIVED` for a task in an
  archived project, `TASK_ARCHIVED` for an archived task.
- Attachments live in `.kanban/attachments/<id>` with metadata on the task. Add that
  directory to `.gitignore` if you do not want binaries in git.
- Needs you, blocked and review are overlays computed from state; they never overwrite
  the stored status.

## Architecture

```mermaid
flowchart LR
  U[You] --> A[Codex app or CLI]
  A --> S[kanban skill<br/>when to read, ask, write or import]
  A --> M[MCP server<br/>20 kanban_* tools]
  S --> M
  W[Local web board<br/>127.0.0.1] --> M
  I[Codex sessions<br/>$CODEX_HOME] --> P[Import scanner]
  P --> W
  P --> C[CLI import]
  C --> M
  M --> B[".kanban/board.json<br/>atomic · versioned"]
  M --> H[".kanban/board.html<br/>self-contained view"]
  M --> F[".kanban/attachments/"]
```

The skill owns policy — read before answering, ask instead of blocking, never approve
its own work, offer import on an empty board. The server owns the data path: one board
per repository, every write through the same store. The import scanner only reads
session titles and the last user message.

## Data model

Schema 2, created on first write:

```json
{
  "schema": 2,
  "projects": [
    {
      "id": "prj_default",
      "name": "my-app",
      "prefix": "MYAPP",
      "workspacePath": null,
      "nextTaskNumber": 2,
      "archivedAt": null,
      "createdAt": "2026-10-22T07:45:38.341Z",
      "updatedAt": "2026-10-22T07:45:38.341Z"
    }
  ],
  "tasks": [
    {
      "id": "tsk_8116bbc1-7390-4031-9c1f-719fd79c6f3b",
      "projectId": "prj_default",
      "identifier": "MYAPP-1",
      "title": "Fix the login redirect",
      "status": "in_progress",
      "priority": "high",
      "labels": ["auth"],
      "blockedReason": null,
      "pendingQuestion": null,
      "links": [],
      "attachments": [],
      "comments": [],
      "activity": [],
      "archivedAt": null,
      "version": 3,
      "createdAt": "2026-10-22T07:45:38.342Z",
      "updatedAt": "2026-10-22T07:46:12.000Z"
    }
  ]
}
```

An imported task additionally carries `source: {kind:"session", id, title}`.
A v1 board is migrated in place on first read. `version` starts at 1 and increments on
every change; stale writes fail with `TASK_VERSION_CONFLICT`, missing versions with
`VERSION_REQUIRED`. Writes are serialized with `.kanban/board.lock` and applied by
writing `board.json.tmp`, syncing, then renaming.

## UX quality

The web board was audited twice by an independent designer against the dsh-kanban
reference, with screenshots and a goodwill meter:

| Round | Design score | AI-slop | Goodwill | Findings |
| --- | --- | --- | --- | --- |
| 1 | C (2.80/4) | B | 43/100 | 10 findings |
| 2 | **B (3.42/4)** | B | **90/100** | 9/10 fixed, no regressions |

Reports and evidence live in [`docs/ux-review/`](docs/ux-review/). The UI supports
keyboard navigation, visible focus, `prefers-reduced-motion`, and 4.83:1 minimum
contrast for metadata.

## Known limitations

- **Import is a heuristic, not a summary.** It uses the thread title and the last
  user message; a long conversation becomes one Backlog task, and "already finished"
  is not detected. Triage after import.
- **The approval boundary is cooperative, not authenticated.** `as: "user"` and
  `confirmed_by` are declarations. An agent that lies, runs the CLI, or edits
  `board.json` can bypass them; the real protection is reviewing the diff.
- **No realtime collaboration.** Two people on one board rely on git; the web server
  is single-user and loopback-only.
- **One repository per board.** Projects are workstreams, not a global cross-repo board.
- **The in-app visual is not verified end to end.** `kanban_render` writes the HTML and
  returns a host reference; the Markdown board is the verified path in every client.
- **Scale is untested beyond demo boards.** Filtering and rendering were checked with a
  few dozen tasks, not hundreds.

## Roadmap

- A global board across repositories, with the same file-per-repo escape hatch.
- Persist the human confirmation with the approval so the audit trail carries the
  exact words.
- Multi-user awareness (who is viewing, soft locks) without turning the board into a
  service.
- Optional model-assisted import that summarises a session into several tasks.

## Development

```bash
git clone https://github.com/SilasSolivagus/codex-kanban.git
cd codex-kanban
node --test
```

The suite has 300 tests at `v0.7.2`, uses only `node:test`, and needs no dependencies.
`npm test` runs the same command.

```
.agents/plugins/marketplace.json   local marketplace entry
plugin/.codex-plugin/plugin.json   plugin manifest
plugin/.mcp.json                   MCP server configuration
plugin/bin/                       launcher and CLI
plugin/server/                    JSON-RPC stdio server, HTTP API
plugin/src/                       domain, store, rules, renderers, session scanner, web UI
plugin/skills/kanban/SKILL.md     agent-facing workflow
test/                             node:test suites
scripts/                          autostart installers (macOS/Linux/Windows)
docs/ux-review/                   audits, evidence and batch reports
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the human guides:
[English](docs/usage.en.md) · [简体中文](docs/usage.md).

## Feedback and ideas

- **Bug?** Use the bug report template; it asks for the plugin version, Codex client and OS.
- **Concrete improvement?** The feature template asks for the workflow that hurts, not just the feature name.
- **Open-ended prioritisation?** Join [What should v0.8 build? (Discussions #1)](https://github.com/SilasSolivagus/codex-kanban/discussions/1).
- **Setup or how-to?** Use [Q&A](https://github.com/SilasSolivagus/codex-kanban/discussions/categories/q-a).

### Share usage without an account

```bash
node plugin/bin/codex-kanban.mjs stats        # human summary
node plugin/bin/codex-kanban.mjs stats --json # same data as JSON
```

It prints counts only — projects, tasks by column and status, attention, comments,
attachments, links, activity in the last 7 days, plugin/platform versions. No
repository path, project names, task titles, labels or session content. There is no
network request; paste the output into Discussions if you want it to influence the
roadmap.

If the board got in your way, describe the workflow you were in. That is easier to act on than a list of features.

## License

MIT © 2026 Silas Solivagus. See [LICENSE](LICENSE).
