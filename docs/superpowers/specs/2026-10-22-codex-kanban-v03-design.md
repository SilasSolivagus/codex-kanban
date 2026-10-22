# Codex Kanban v0.3 — Full Board Parity

- Status: Approved for implementation
- Date: 2026-10-22
- Supersedes: parts of `2026-10-22-codex-kanban-design.md` (single-board model)

## 1. Summary

Bring the local web board to feature parity with dsh-kanban: multiple projects,
attachments, archive and read-only projects, search and filters, a complete task
drawer with activity, collapsible columns, and zh/en UI.

The plugin still keeps one board per repository at `.kanban/board.json`. A
"project" is a workstream inside that repository, not a global cross-repo board;
`workspacePath` records where the work lives.

## 2. Locked decisions

1. Schema v2. A v1 board is migrated in place on first read; no data loss.
2. Projects live in the same file; every task carries `projectId`.
3. Project archive is read-only and restorable. Writes to archived projects fail
   with `PROJECT_ARCHIVED`.
4. Attachments are files under `.kanban/attachments/<id>` with metadata on the
   task. Upload is base64 JSON, 10 MB per file. The attachment directory is
   documented as gitignore-able.
5. The web server still binds `127.0.0.1` and listens on 4317 by default.
6. UI is one self-contained page: no framework, no CDN, no external requests.
7. MCP tools gain project selection and project lifecycle tools; attachments are
   managed from the web/CLI only in v0.3.
8. Non-goals: a global cross-repo board, realtime collaboration, rich attachment
   previews, a dedicated mobile layout.

## 3. Data model

```json
{
  "schema": 2,
  "projects": [
    {
      "id": "prj_x",
      "name": "my-app",
      "prefix": "APP",
      "workspacePath": "/abs/path" ,
      "nextTaskNumber": 4,
      "archivedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "tasks": [
    {
      "id": "tsk_x",
      "projectId": "prj_x",
      "identifier": "APP-3",
      "title": "...",
      "description": "",
      "status": "todo",
      "priority": "high",
      "labels": [],
      "assignee": { "type": "agent", "name": "codex" },
      "sortOrder": 1024,
      "statusSince": "...",
      "blockedReason": null,
      "blockedSince": null,
      "pendingQuestion": null,
      "questionResolution": null,
      "links": [],
      "attachments": [],
      "comments": [],
      "activity": [],
      "archivedAt": null,
      "version": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Attachment metadata: `{ id, filename, contentType, size, createdAt }`. Bytes are
not in JSON.

### Migration from v1

A v1 board (`{schema:1, project, nextTaskNumber, tasks}`) becomes one project:
`id = "prj_default"`, name/prefix/createdAt from `project`, `nextTaskNumber`
moved onto the project, and every task gets `projectId: "prj_default"`,
`attachments: []`. The rewrite happens on the first successful write.

## 4. Domain API

Projects:
`createProject(store, {name, prefix?, workspacePath?})`,
`updateProject(store, {id, name?, prefix?, workspacePath?})`,
`archiveProject(store, {id})`, `restoreProject(store, {id})`,
`listProjects(board)`.

Tasks: existing functions gain `projectId`:
`createTask(store, {projectId?, ...})` defaults to the first active project.
Identifier counters are per project. Every task write checks the owning project
and throws `PROJECT_ARCHIVED` when it is archived.

Attachments:
`addAttachment(store, {id, version, filename, contentType, data})` — `data` is
base64; validates size and MIME; writes `.kanban/attachments/<att_id>` atomically.
`removeAttachment(store, {id, version, attachmentId})` — deletes metadata and file.
`readAttachment(store, attachmentId)` — returns `{meta, buffer, task}` or null.

## 5. HTTP API

- `GET /api/board?project=all|<projectId>` → `{ok, projects, board, summary, filters}`
  where `filters` exposes the labels/priorities/assignees present.
- `GET /api/attachments/<id>` → raw bytes with the stored content type.
- `POST /api/action` with `action`:
  `project.create`, `project.update`, `project.archive`, `project.restore`,
  `task.create`, `task.update`, `task.move`, `task.block`, `task.unblock`,
  `task.ask`, `task.answer`, `task.approve`, `task.reject`, `task.comment`,
  `attachment.add`, `attachment.remove`.
- All write actions return the fresh board view. Errors keep
  `{ok:false, error:{code,message}}` with `409` for conflicts and archived writes.

## 6. Web UI

- Project switcher: All projects plus one entry per project; create, rename,
  archive, restore. Archived projects render read-only with a restore banner.
- Four columns, collapsible, persisted in localStorage; drag between Backlog,
  Running and Done; Needs you is not a drop target.
- Search plus filters: text, project, priority, label, assignee.
- Task drawer: edit title/description/priority/labels/links; activity feed;
  comments; attachments (upload, download, delete); ask with options and details;
  answer; approve/reject with a note; block/unblock.
- zh/en switch persisted in localStorage; `prefers-reduced-motion` respected;
  keyboard: `/` search, `n` new task, `Esc` close drawer.

## 7. MCP surface

- `kanban_board`, `kanban_task_*` accept an optional `project` (id, name or `all`).
- New tools: `kanban_project_list`, `kanban_project_create`,
  `kanban_project_update`, `kanban_project_archive`, `kanban_project_restore`.
- Attachments stay out of MCP in v0.3; the skill tells agents to reference links.

## 8. Safety

- Archived projects are read-only at the domain layer, not just in the UI.
- Attachment uploads validate filename, content type, size cap, and write with the
  same atomic pattern as the board.
- Attachment downloads resolve an id from the board; no path is taken from the
  request.
- The server remains loopback-only by default; no outbound requests.

## 9. Testing

- Store: v1→v2 migration, project normalization, corrupt data.
- Domain: project lifecycle, per-project identifiers, archived write rejection,
  attachment add/read/remove/size limit.
- HTTP: project filter, project actions, attachment upload/download, archived
  conflict, version conflict.
- UI: page contains project switcher, filters, drawer controls, i18n, no external
  URLs.
- MCP: new tools and project parameter; existing 13 tools stay compatible.
