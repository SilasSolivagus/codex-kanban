# UX batch G — decision versions and distinguishable lookup failures

**Date** · 2026-10-23
**Scope** · The last two UX tails from [`ux-audit-round2-2026-10-23.md`](ux-audit-round2-2026-10-23.md)
**Files changed** · `plugin/server/web.mjs`, `plugin/src/livehtml.mjs`, `test/web.test.mjs`, `test/web-ui.test.mjs`; evidence in `docs/ux-review/`
**Tests** · 271 passing (`node --test`), up from 266; 3 API tests and 2 UI static tests
**Commit** · `fix(ux): show versions and distinguish lookup failures`

## What changed

### 1 · The decision sheet shows the version it will send

`#decision-dialog` now carries a quiet meta line directly beneath the title:

```
DSH-6 · 确认首屏默认项目
DSH-6 · 版本 3    保存时会校验版本
```

- `decision.versionMeta` renders `{id} · 版本 {n}` in zh and `{id} · v{n}` in en;
  `decision.versionHint` carries the save-time check copy.
- `syncDecisionDialog()` reads `findTask(state.decisionTaskId)` and sets the line
  from `task.version`. That function already runs on every board re-render while
  the sheet is open, so a fresh `/api/action` or `/api/board` response refreshes
  the version together with the question and answer.
- The styling is muted (`11.5px/600` identifier-plus-version, `11px` hint) and
  does not compete with the question/answer summary.

### 2 · A missing deep link is looked up before it is reported

`GET /api/task?ref=<id-or-identifier>` is a read-only endpoint on the same
`store` as `/api/board`. It searches every task by id or identifier,
case-insensitively, including archived ones:

| Case | Response |
| --- | --- |
| Found | `200 {ok:true, task:{id, identifier, archived, projectId, projectName}}` |
| Missing | `404 {ok:false, error:{code:'TASK_NOT_FOUND', message:'no task matches <ref>'}}` |

`openDeepLink()` still resolves the reference against the loaded board first, so
tasks that are present open exactly as before with no extra request. Only a miss
calls the lookup; the result chooses the message:

| Lookup result | Toast | Drawer |
| --- | --- | --- |
| Found, archived | `该任务已归档，打开「显示已归档」后可见` | stays closed |
| Found, not archived | `该任务不在当前筛选结果中` | stays closed |
| 404 | `找不到任务 <ref>` | stays closed |

A failed request keeps its own `toast.networkError` instead of pretending the
task is missing. As before, the archive flag comes only from the user's
`显示已归档` setting; the deep link never appends `include_archived`.

## Verification

Chrome headless over CDP at `http://127.0.0.1:4399`, 1400×900, zh locale, demo
board `/tmp/codex-kanban-demo`. The server was restarted on 4399 before capture.
To make the version line match the requested `DSH-6 · 版本 3`, DSH-6 was moved
from v2 to v3 with a real `task.answer` write for `最近项目`; the sheet was
captured before confirming, then `board.json` was restored from its pre-capture
backup.

| Screenshot | What it shows | Measured |
| --- | --- | --- |
| [`batch-g-version.png`](batch-g-version.png) | Decision sheet for DSH-6 | target `DSH-6 · 确认首屏默认项目`; meta `DSH-6 · 版本 3`; hint `保存时会校验版本`; card `data-version="3"`; dialog 560×372 |
| [`batch-g-lookup.png`](batch-g-lookup.png) | `?task=DSH-404` | toast `找不到任务 DSH-404` (`role="status"`); drawer `aria-hidden="true"`; 8 cards |

Normal-path probe: `?task=DSH-6` opened the drawer (`aria-hidden="false"`,
title `确认首屏默认项目`) with no toast and no `/api/task` request. The live
lookup was also checked directly: `ref=dsh-6` returned the task with
`archived:false` and `projectName:"DSH 看板"`.

After capture the demo board was restored and verified byte-for-byte:
SHA-256 `5a2f09a5b65f3817b2ad718f52723365670fb98d6f0bbd57c544a215c606c869`,
identical to the pristine backup.

## Static and API coverage added

- **API lookup found** — resolves by identifier and by uppercase id; exact task
  shape (`archived`, `id`, `identifier`, `projectId`, `projectName`).
- **API lookup archived** — a task archived and absent from `/api/board` is
  still found with `archived: true`.
- **API lookup missing** — `404`, `TASK_NOT_FOUND`, exact
  `no task matches NOPE-404`; an empty ref also 404s; `POST /api/task` is not a
  route and the board stays empty.
- **UI version meta** — markup contains `#decision-version` and the hint key;
  the script sets it from `task.identifier` and `task.version` inside
  `syncDecisionDialog`, which `renderAll` calls whenever the sheet is open.
- **UI lookup toasts** — the handler calls
  `/api/task?ref=` + `encodeURIComponent(ref)`, branches archived vs filtered
  out from the payload, reports 404 with the reference, and has exact zh copy
  for all three messages in both dictionaries.

## Remaining issues

- The filtered-out branch is covered by API and static tests but has no
  screenshot: the demo board has one project and the deep-link flow starts with
  project `all`, so no URL-only filter can hide DSH-6 at load time.
- The version still appears only in the decision sheet; the drawer header does
  not expose it.
- An archived deep link still asks the user to enable `显示已归档` and does not
  reopen the task automatically after the toggle; this remains the specified
  behaviour.
- The lookup is an extra round-trip only on a miss; the common in-payload path
  is unchanged.

## Status

Complete. `node --test` 271/271 green; demo board restored; tree clean after the
commit.
