# UX batch F — archive-aware deep links and one-step decisions

**Date** · 2026-10-23
**Scope** · The three remaining issues from [`ux-audit-round2-2026-10-23.md`](ux-audit-round2-2026-10-23.md)
**Files changed** · `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`; evidence in `docs/ux-review/`
**Tests** · 266 passing (`node --test`), up from 263; 3 new static tests
**Commit** · `fix(ux): respect archive state and one-step decisions`

## What changed

### 1 · Deep links no longer force archived tasks

`?task=<id>` previously did two things at once: it forced `project=all` (needed
to resolve a cross-project link) and it ORed `include_archived=1` into the
board request. The second half is gone.

- Initial state is `includeArchived: readArchived()`; `apiQuery()` appends
  `&include_archived=1` only from the user's toggle.
- `openDeepLink()` consumes the pending ref exactly once. If the referenced
  task is not in the payload, it shows
  `该任务已归档，打开「显示已归档」后可见`, opens no drawer, and leaves the
  current board untouched.
- With 显示已归档 on, the board includes the archived task and the link opens
  it normally: read-only body, 恢复 in the footer, no edit controls.
- The toast string is in both dictionaries (`toast.archivedDeepLink`), with the
  required zh copy verbatim.

### 2 · One-step answer + decision

Option clicks are now purely local. The inline panel and the drawer both call
`selectOption(task, optionId)`, which stores a draft in
`state.optionDrafts[task.id]`; no `task.answer` request is sent and the task
version does not move. The selected row updates immediately because the radio
and its `:has(input:checked)` styling are native.

批准 / 拒绝 open the existing `#decision-dialog`, which shows `问题 → 所选答案`
(or `尚未选择`) plus a note field. `submitDecision(kind)` then performs the
whole decision:

| Draft state | Writes |
| --- | --- |
| Draft differs from `pendingQuestion.selected` | `task.answer` with the current version → read the fresh task from the returned board → `task.approve` / `task.reject` with `fresh.version` |
| Draft already recorded | `task.approve` / `task.reject` with the current version |
| No draft, reject | `task.reject` directly (allowed, as required) |
| No draft, approve | Blocked client-side and server-side (`ANSWER_REQUIRED`) |

The first request disables both dialog buttons. If it succeeds and the second
fails, the API error is toasted and the dialog stays open; `syncDecisionDialog()`
re-renders the target, question and answer from the board returned by the first
write, so the next click uses the fresh version. If the first write fails, the
dialog remains open on the unchanged board.

The drawer's separate `记录答案` button and its duplicate note textarea are
removed; the note lives only in the decision sheet. The hint now reads
`选择答案后点「批准」或「拒绝」，一次确认即可记录。`

### 3 · R5 evidence

The demo board was served on 4399 with the popover closed. Filters were applied
through the hidden select `change` handlers, so the chip row rendered exactly as
it does for a user, with no server write.

| Filter | Summary box | Chip | Counts | Create controls |
| --- | --- | --- | --- | --- |
| 优先级 = 高 | 115 × 32px, transparent | `高 ×`, 24px | `4 / 8 个任务` | 0 of 8 visible |
| 标签 = design | 142.1 × 32px, transparent | `design ×`, 24px | `2 / 8 个任务` | 0 of 8 visible |

Both screenshots show the inline chip row at y=67 (`清除全部` immediately after
the chip), the H1 at y=101 and the board at y=157. The 8 create controls (four
lane headers and four footers) are all `hidden`, not merely empty.

## Verification

Chrome headless over CDP at `http://127.0.0.1:4399`, 1400×900, zh locale, light
scheme, demo board `/tmp/codex-kanban-demo`. The server was restarted on 4399
before capture. The option selection, dialog open/cancel and filter probes were
client-side only; the only API write was the temporary archive of DSH-7 needed
to produce the archived-link toast.

| Screenshot | What it shows | Measured |
| --- | --- | --- |
| [`batch-f-inline.png`](batch-f-inline.png) | Inline question with `最近项目` selected and one confirm step | 3 radios, `opt_2` checked, row highlighted, 批准/拒绝 enabled, **0** `/api/action` calls, card version still `2` |
| [`batch-f-archived-link.png`](batch-f-archived-link.png) | `?task=DSH-7` while DSH-7 is archived and 显示已归档 is off | toast `该任务已归档，打开「显示已归档」后可见`; drawer `aria-hidden="true"`; 7 visible tasks; 0 archived cards; toggle `aria-pressed="false"` |
| [`round2-filter-priority.png`](round2-filter-priority.png) | 优先级 = 高, popover closed | summary 115 × 32; `高 ×` 24px; `4 / 8`; 0/8 create controls |
| [`round2-filter-label.png`](round2-filter-label.png) | 标签 = design, popover closed | summary 142.1 × 32; `design ×` 24px; `2 / 8`; 0/8 create controls |

Additional probe (not a deliverable): clicking the selected inline 批准 opened
the decision sheet with `DSH-6 · 确认首屏默认项目`,
`问题 首次打开看板时，默认显示哪个视图？`, `回答 最近项目`, the note field
empty, 确认批准/确认驳回 enabled, and still 0 action calls. Cancelling left the
card at version 2.

The decision-dialog capture is intentionally taken before confirming, so the
demo board was not mutated by the one-step flow. The temporary archive for the
toast was undone by restoring `.kanban/board.json` from the pre-capture backup.
Final SHA-256 `5a2f09a5b65f3817b2ad718f52723365670fb98d6f0bbd57c544a215c606c869`
matches the pristine backup byte-for-byte.

## Static coverage added

- **Deep link** — initial `includeArchived` is `readArchived()`; the
  `openDeepLink` body has no `include_archived`, clears the pending ref, and
  calls `notify(t('toast.archivedDeepLink'))` when the task is absent; zh copy
  is exact.
- **Local-only selection** — `buildQuestionPanel` and `renderQuestion` contain
  no `act(` calls, use `selectOption`, keep reject enabled, and the drawer has
  no `answer-question` / `answer-note` elements.
- **Sequential decision** — `submitDecision` compares the draft with
  `pendingQuestion.selected`, calls `task.answer` first when needed, reads
  `findTask(task.id)`, then calls the decision with `fresh.version`;
  `syncDecisionDialog()` runs on failure and whenever the board re-renders.

## Remaining issues

- The decision sheet does not show the task version, so the "never stale"
  guarantee is behavioural rather than visible. A version line in the sheet
  would make it inspectable.
- Confirm is still a two-surface path: the inline panel opens the sheet, then
  the sheet confirms. That matches the requested existing-dialog flow, but the
  inline panel could eventually host the confirm itself.
- The archived-link miss cannot distinguish "archived and hidden" from "bad
  link" because `/api/board` does not return a lookup result. The toast is the
  specified behaviour for both.

## Status

Complete. `node --test` 266/266 green; demo board byte-for-byte restored; tree
committed clean.
