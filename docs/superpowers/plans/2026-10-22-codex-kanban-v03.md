# Codex Kanban v0.3 Implementation Plan

> **For agentic workers:** execute tasks in order. Each task is independently testable and must leave `node --test` green.

**Goal:** full dsh-kanban parity for the local web board: projects, attachments, archive, search/filter, complete drawer, collapsible columns, zh/en.

**Architecture:** extend the existing JSON store to schema v2 (projects + tasks + attachment metadata), keep the domain layer as the only writer, then rebuild the HTTP layer and the single-page UI on top. MCP gains project-aware tools.

**Spec:** `docs/superpowers/specs/2026-10-22-codex-kanban-v03-design.md`

## Global constraints

- Node 22+, ESM, zero runtime dependencies, no build step.
- All writes go through `plugin/src/store.mjs` and `plugin/src/domain.mjs`.
- Archived projects are read-only at the domain layer (`PROJECT_ARCHIVED`).
- Web server binds `127.0.0.1:4317` by default; UI makes no external requests.
- Existing v0.2 tests must keep passing (except where this plan changes behaviour).

## File map

```text
plugin/src/store.mjs        schema v2, migration, attachment paths
plugin/src/rules.mjs        project-aware helpers (unchanged statuses)
plugin/src/domain.mjs       project lifecycle, per-project ids, attachments, archive guard
plugin/server/web.mjs       API v2 (projects, filters, attachments)
plugin/src/livehtml.mjs     full UI rewrite
plugin/server/tools.mjs     project params + project tools
plugin/skills/kanban/SKILL.md  project guidance
test/*.test.mjs             new suites
```

---

### Task 1: Schema v2 and projects

**Files:** `plugin/src/store.mjs`, `plugin/src/rules.mjs`, `plugin/src/domain.mjs`, `test/store.test.mjs`, `test/domain.test.mjs`

**Interfaces:**
- `emptyBoard(root)` → `{schema:2, projects:[project], tasks:[]}`, one default project named after the directory.
- `normalizeBoard(board, root)` migrates v1 → v2 and repairs missing arrays.
- `createStore({root})` unchanged externally; add `attachmentsDir` to the returned object.
- `createProject(store,{name,prefix?,workspacePath?})`, `updateProject(store,{id,name?,prefix?,workspacePath?})`, `archiveProject(store,{id})`, `restoreProject(store,{id})`, `listProjects(board)`.
- `createTask(store,{projectId?, ...})` writes `projectId`; identifiers use the project prefix and the project's `nextTaskNumber`.
- Every task write rejects when the project is archived with `PROJECT_ARCHIVED`.
- `boardView(board,{projectId?, ...})` filters by project; `summarizeBoard(board,{projectId?})`.

Tests:
- v1 board with two tasks migrates to one project, tasks keep identifiers, `projectId` set.
- two projects get independent counters (`APP-1`, `WEB-1`) and prefixes.
- archive project → create/move/comment rejected with `PROJECT_ARCHIVED`; restore re-enables.
- `boardView` filters a project and `all`.
- invalid prefix rejected.

### Task 2: Attachments

**Files:** `plugin/src/domain.mjs`, `plugin/src/store.mjs`, `test/attachments.test.mjs`

**Interfaces:**
- `addAttachment(store,{id,version,filename,contentType,data})` → `{ok:true,task,attachment}`; `data` base64; max 10 MB decoded; filename ≤255; contentType ≤200.
- `removeAttachment(store,{id,version,attachmentId})`.
- `readAttachment(store, attachmentId)` → `{meta, buffer, task, project}` or null.
- Files at `.kanban/attachments/<attachmentId>`; metadata `{id,filename,contentType,size,createdAt}` in `task.attachments`.
- Failed validation must not write the board or leave a file.

Tests: add → metadata + bytes on disk; read returns same bytes; remove deletes both; oversized base64 rejected (`ATTACHMENT_TOO_LARGE`); unknown attachment → null; attachment operations bump version.

### Task 3: HTTP API v2

**Files:** `plugin/server/web.mjs`, `test/web.test.mjs`

**Interfaces:**
- `GET /api/board?project=all|<id>` → `{ok, projects, board, summary, filters}`.
- `GET /api/attachments/<id>` → bytes + content type; 404 when unknown.
- `POST /api/action` actions: `project.create|update|archive|restore`, `task.create|update|move|block|unblock|ask|answer|approve|reject|comment`, `attachment.add|remove`.
- Errors: 409 for `TASK_VERSION_CONFLICT` and `PROJECT_ARCHIVED`; 400 otherwise; body `{ok:false,error:{code,message}}`.
- Create task accepts `projectId`; ask accepts `options:[{label,detail}]` or strings.

Tests: project create/archive round-trip; board filter; attachment upload/download/delete; archived write 409; existing v0.2 web tests updated (no breaking shape change: `board.columns` stays).

### Task 4: Web UI rewrite

**Files:** `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`

Requirements:
- Project switcher (All + per project) with create/rename/archive/restore.
- Search box + priority/label/assignee filters; result count.
- Collapsible columns persisted in `localStorage`.
- Drawer: edit title/description/priority/labels/links; activity feed; comments; attachments upload/download/delete; ask with option details; answer; approve/reject with note; block/unblock.
- zh/en switch persisted; `prefers-reduced-motion`; `/`, `n`, `Esc` shortcuts.
- No `http://`/`https://` in the document; all fetches relative.

Tests: document contains project switcher, search, filter, i18n, upload input, no external URL; payload helpers for filters exist; static checks for keyboard handlers.

### Task 5: MCP project support

**Files:** `plugin/server/tools.mjs`, `plugin/skills/kanban/SKILL.md`, `test/mcp.test.mjs`

- Add optional `project` to board/task tools; `all` lists every project.
- New tools: `kanban_project_list`, `kanban_project_create`, `kanban_project_update`, `kanban_project_archive`, `kanban_project_restore`.
- `kanban_board` Markdown groups by project when `project` is `all`.
- Skill: mention projects, archive read-only, and that attachments live on the web board.
- Tests: tool count 18, project create/list/archive via MCP, board filtered by project.

### Task 6: Docs and release

- README + zh: projects, attachments, archive, filters, i18n, updated screenshots.
- usage docs: project workflow, attachment limits, archive semantics.
- version `0.3.0` in manifest/package/badges; changelog/release notes.
- `node --test` green; tag `v0.3.0`; push; CI green.
