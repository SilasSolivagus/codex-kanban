# UX batch D — dialogs, structured activity, drawer tabs and clock skew

**Date** · 2026-10-23
**Scope** · D1–D4 from the post-batch-C UX audit
**Files changed** · `plugin/src/domain.mjs`, `plugin/server/web.mjs`, `plugin/src/livehtml.mjs`, `test/domain.test.mjs`, `test/web.test.mjs`, `test/web-ui.test.mjs`
**Tests** · 255 passing (`node --test`), up from 251; 4 new tests
**Commit** · `fix(ux): dialogs, structured activity, drawer tabs and clock skew`

## What changed

### D1 · No native prompt or confirm

`grep -n "prompt(\|confirm(" plugin/src/livehtml.mjs` returns nothing. The
four remaining native paths are now in-product `<dialog>` modals built from the
existing dialog head, form grid, `.dialog-actions` and `.dialog-error` styles:

- **Approve / reject** — `#decision-dialog`: target line (`DSH-2 · …`), optional
  note textarea, `取消` / `确认批准` / `确认驳回`; reject uses the red
  `.danger-solid` treatment (`rgb(180, 35, 24)`).
- **Ask** — `#ask-dialog`: question textarea plus 2–5 option rows. Each row has
  a label input, an optional detail input and a remove button; `添加选项` is
  disabled at 5 rows, remove is disabled at 2. Validation covers an empty
  question, a detail without a label, and fewer than 2 / more than 5 options.
- **Block** — `#block-dialog`: required reason textarea, inline validation.
- **Project rename** — `#rename-project-dialog`: prefilled name and prefix
  fields; the prefix is validated against `^[A-Z0-9]{2,6}$` before
  `project.update`.

All four close on `取消`, the header `×`, or `Esc`, and `Esc` resolves them
before the drawer. No dialog mutates the board until its confirm action
succeeds, so a failed version conflict leaves the input on screen.

### D2 · Structured activity data

`touch(task, actor, kind, summary, changes, data)` now stores an optional `data`
object on the activity entry. `summary` is unchanged for MCP/Markdown consumers.
Data shapes:

| kind | data |
| --- | --- |
| `created` | `{ status }` |
| `moved` | `{ from, to }` |
| `updated` | `{ fields }` (extension; keeps the existing template) |
| `reordered` | `{ column }` |
| `blocked` | `{ reason }` |
| `unblocked` | `{}` |
| `question` | `{ prompt }` |
| `answered` | `{ optionLabel }` (null for a note-only answer) |
| `approved` | `{ optionLabel }` |
| `rejected` | `{ note }` when a note was given, else `{}` |
| `commented` | `{ preview }` |
| `attached` / `detached` | `{ filename }` |
| `archived` / `restored` | `{}` |

`web.mjs` still forwards the task payload unchanged, so the data reaches the
page. The drawer renders only `kind` + `data` through localised templates
(`activity.*`), each carrying `{actor}` (`你` / `Codex`, `You` / `Codex`).
Entries without `data` fall back to the stored English `summary` verbatim, with
the actor kept in the metadata line for attribution. The old summary parsers
(`/ in ([a-z_]+)$/`, `summary.replace(...)`, `indexOf('answered: ')`) are gone.

### D3 · Drawer tabs and type-ahead select

- The drawer body is split into `详情` / `协作` / `动态` panels behind a real
  `role="tablist"`. Each tab owns `aria-selected`, roving `tabindex` and
  `aria-controls`; each panel has `role="tabpanel"` and `aria-labelledby`.
  `Left` / `Right` (and `Home` / `End`) move and activate tabs.
- The save / archive / restore footer is outside the tab panels and the body is
  `flex: 1 1 auto`, so the footer stays anchored at the drawer bottom on every
  tab, including short content.
- `?task=<id>` opens on `详情`; `openTask` resets the tab to `详情` for every
  task, so tab state never leaks between tasks.
- Secondary actions (`移动到…`, `提出问题`, `标记阻塞`) now live at the end of
  `协作`, next to links, blocker, question, attachments and comments.
- The styled select now keeps focus on the combobox and uses
  `aria-activedescendant` instead of moving DOM focus into the list. Typing
  letters prefix-matches either the visible label or the stored value, highlights
  the match, `ArrowUp` / `ArrowDown` / `Home` / `End` move, `Enter` selects,
  `Esc` closes. Trigger labels still ellipsise (`text-overflow: ellipsis`) while
  list options wrap in full; the trigger also carries the full value as `title`.

### D4 · Clock skew

- `GET /api/board` and every JSON action response carry `serverNow` (ISO). The
  successful payload gets it explicitly; `sendJson` stamps any response that
  lacks it.
- After every load and action the page computes `skew = Date.now() -
  Date.parse(serverNow)` in `applyServerTime`, and all relative ages use
  `nowMs() = Date.now() - skew`. Day grouping uses the same corrected clock.
- Future timestamps clamp through `Math.max(0, …)`, so a timestamp ahead of the
  corrected clock reads `刚刚` / `just now`.

## Verification

Chrome headless via CDP at `http://127.0.0.1:4399`, zh locale, light scheme,
demo board `/tmp/codex-kanban-demo` (10 active tasks, 2 active projects plus one
archived default). The server was restarted on 4399 before capture and the demo
data was reset after the interaction probes.

| Screenshot | Viewport | Measured |
| --- | --- | --- |
| [`batch-d-drawer-detail.png`](batch-d-drawer-detail.png) | 1400 × 900 | Drawer 620px wide at x=780; three 50px tabs, `详情` selected (`tabindex=0`); footer top 843 / bottom 900; detail body 722/722 (no long scroll) |
| [`batch-d-drawer-collab.png`](batch-d-drawer-collab.png) | 1400 × 900 | `协作` selected; details and activity panels `hidden`; links, attachments (`card-hierarchy-spec.pdf`), two comments and the move/ask/block actions inside the panel |
| [`batch-d-drawer-activity.png`](batch-d-drawer-activity.png) | 1400 × 900 | `动态` selected; one `今天` head, six rows, all localised from `kind` + `data` (`Codex移动了 DSH-1：待立项 → 处理中`, `你评论：…`, `Codex添加了附件 …`), meta `刚刚` |
| [`batch-d-ask-dialog.png`](batch-d-ask-dialog.png) | 1400 × 900 | 560px dialog at y=245–655; question textarea, two option rows (label + detail + remove), `添加选项` enabled, remove disabled at the 2-row minimum, buttons `取消` / `确认提问` |
| [`batch-d-confirm-approve.png`](batch-d-confirm-approve.png) | 1400 × 900 | 560px decision dialog at y=312–588; target `DSH-2 · 审核问答面板的交互`; note prefilled from the recorded answer; buttons `取消` / `确认批准` / `确认驳回`; reject background `rgb(180, 35, 24)` |
| [`batch-d-select-typeahead.png`](batch-d-select-typeahead.png) | 1400 × 900 | Status list open; typing `d` set `aria-activedescendant="attr-status-option-4"` with the `完成` row highlighted while the trigger still read `处理中`; six options visible, labels wrap in the list |
| [`batch-d-390.png`](batch-d-390.png) | 390 × 844 | `innerWidth = scrollWidth = 390`; drawer width and drawer scroll width 390; tab strip right edge 174; footer bottom 844; question panel, options, note and attachment dropzone all inside the viewport |

Interaction probes (CDP, same demo board):

- **Ask validation and submit**: empty prompt → `请先填写问题。`; one option →
  `请提供 2–5 个带名称的选项。`; five rows → add disabled; remove → add enabled;
  submit posted the question and the API activity was
  `{ kind: 'question', data: { prompt: '验证对话框提交路径' } }`.
- **Decision approve**: `确认批准` moved DSH-2 to `done`, set
  `questionResolution.optionLabel = 紧跟在选项之后`, and recorded
  `{ kind: 'approved', data: { optionLabel: '紧跟在选项之后' } }`.
- **Block**: saving `等待第二轮审计结论` set `blockedReason` and recorded
  `{ kind: 'blocked', data: { reason: '等待第二轮审计结论' } }`.
- **Rename**: name `Codex Kanban Renamed` + prefix `CKX` persisted through
  `project.update`; the project list refreshed behind the dialog.
- **Tabs**: `ArrowRight` from `详情` selected `协作`; `ArrowLeft` returned to
  `详情`; reopening another task landed on `详情` (`aria-selected` probe).
- **Type-ahead**: typing `d` highlighted `完成`; `Enter` changed DSH-8 to
  `done` and the trigger to `完成`; `Esc` closed the list without selecting.
- **Clock skew**: the slow-clock run overrode `Date.now()` two hours behind and
  reloaded; activity still read `2分钟前` rather than `2小时前`, proving the
  `serverNow` correction. `Math.max(0, …)` covers future timestamps.
- **Console**: no exceptions or error logs during the capture run.

## Tests

- `test/domain.test.mjs` — created activity includes `data`; a new end-to-end
  test walks create → update → move → reorder → block → unblock → ask → answer
  → approve → comment → attach → detach → archive → restore → reject and
  asserts `kind` + `data` at every step while keeping a non-empty `summary`.
- `test/web.test.mjs` — board and action payloads expose a parseable
  `serverNow`; activity `data` survives the API for created, asked, answered,
  approved, blocked and unblocked tasks.
- `test/web-ui.test.mjs` — 3 new static tests:
  - no `window.prompt` / `window.confirm`; all four dialogs, their fields,
    Chinese button copy, 2–5 option limits, validation strings and Escape order;
  - type-ahead markers (`typeAheadSelect`, `_typeBuffer`, prefix matching,
    `aria-activedescendant`, trigger truncation and list wrapping);
  - `serverNow` / `skew` / `nowMs` markers and the future clamp.
  The old summary-parser assertions were replaced with structured-data and
  template assertions, plus tab/listbox geometry and footer-visibility checks.

## Remaining issues

- The inline Needs-you question panel on the board still approves or rejects
  directly from its own note field instead of opening the shared decision
  dialog. It never used a native prompt, but it is now the second decision
  surface and a candidate for unification in the next audit.
- Type-ahead is prefix matching over the label and stored value; it highlights
  and selects a matching option but does not narrow the visible list, and there
  is no fuzzy or diacritic-insensitive matching.
- Legacy activity entries without `data` still show their stored English
  summaries by design; old boards will keep English text in an otherwise
  localised feed until those tasks receive a new event.
- `serverNow` is applied from successful payloads only. Error responses are
  stamped server-side too, but the page does not refresh its skew from them.
- Tabs are client state only: `?task=<id>` always lands on `详情`, and there is
  no deep link to `协作` or `动态`.
- The move / ask / block actions now sit in the `协作` tab rather than at the
  end of the drawer; discoverability should be checked in the second audit.
- The static UI tests still assert source markers rather than executing the
  script; interaction coverage lives in the CDP probes above.
