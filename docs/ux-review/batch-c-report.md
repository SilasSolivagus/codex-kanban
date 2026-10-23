# UX batch C — real controls, localised activity and shortcut fixes

**Date** · 2026-10-23
**Scope** · F6–F10 from [`ux-audit-2026-10-23.md`](ux-audit-2026-10-23.md)
**Files changed** · `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`
**Tests** · 251 passing (`node --test`), up from 245; 6 new static tests
**Commit** · `fix(ux): real controls, localised activity and shortcut fixes`

## What changed

### F6 · Real status control and question radios

- The drawer `状态` field is now a control, not static text. The six stored
  statuses (`backlog`, `todo`, `in_progress`, `in_review`, `done`, `canceled`)
  live in a real `<select id="attr-status">`; selecting one calls the existing
  `task.move` API with the status as `to`. The `操作` band with
  `移动到…` remains as the secondary shortcut, and both routes share the same
  API and re-render path.
- A failed status change (blocked task, open question, archived project) resets
  the control from the fresh task instead of leaving the UI claiming a move that
  did not happen.
- Drawer question options and inline Needs-you options now share one rule:
  `grid-template-columns: 16px minmax(0, 1fr)`, `min-height: 28px`,
  `input[type=radio] { width: 16px; height: 16px; margin-top: 2px }`. The radio
  sits in the first column and the label starts in the second, 8px away.
- Selected state is visible in both places: the drawer row gets a dark border
  and a tinted fill, the inline row gets a surface fill and an inset border.

### F7 · No native browser chrome

- The filter popover and the drawer priority field now use one styled select
  component: a 40px trigger with the same border, radius and chevron as the
  project chip, plus an in-product listbox. The real `<select>` stays in the
  DOM as the value store and change source, so existing ids, listeners and API
  payloads are unchanged.
- The component is keyboard operable: `Enter`/`Space` on the trigger opens the
  list, `ArrowDown`/`ArrowUp` opens and moves, `Home`/`End` jumps, `Enter`
  selects, `Escape` closes only the list, `Tab` leaves it. `aria-expanded`,
  `role="combobox"`, `role="listbox"` and `aria-selected` are kept in sync.
- The raw file input is gone from view. Attachments use a dashed dropzone with
  `选择文件`, a drag-over highlight, the selected filename
  (`已选择 spec.pdf`) and the existing 10 MB error message. `#attachment-input`
  remains, hidden, and is triggered by the button; dropping a file routes
  through the same `uploadAttachment` path.
- Archive and restore for tasks and projects, plus attachment removal, now use
  an in-product confirm sheet instead of `window.confirm()`: title, target
  name, explanatory line, `取消` / `确认归档` (or `确认恢复` / `确认移除`),
  destructive styling for archive/remove, focus trapped on the sheet, `Esc`
  cancels, and the previous focus is restored on close.

### F8 · Activity and time copy

- Generated activity entries are rendered as localised sentences from the
  stored `kind` plus `changes`, instead of printing the English server summary:
  `创建了 DSH-6（待立项）`, `回答了「所有项目」`, `批准了 DSH-6`,
  `驳回了 DSH-6`, `阻塞：等待权限`, `解除阻塞`, `添加了附件 spec.pdf`,
  `评论：…`, `移动：处理中 → 完成`, `归档`, `恢复`, `更新：标题、描述`,
  `提问：…`, `调整了排序`. The English dictionary mirrors these.
- Activity actors are localised: `你` / `Codex` in Chinese and `You` / `Codex`
  in English. Custom actor names pass through unchanged.
- Ages below 60 seconds now render `刚刚` (`just now`) everywhere. The card
  updated line uses `刚刚更新` / `更新于 14小时前`, while dwell time is labelled
  `已停留 14小时` instead of a bare `· 14小时前`; the card keeps
  `更新于 …` distinct from `已停留 …`.
- The activity feed still takes the latest 12 entries, now grouped newest-first
  by local calendar day with a subtle divider and `今天` / `昨天` / date
  headings.

### F9 · Contrast

- `.card-metrics` and `.card-metrics .metric` are 12px
  `light-dark(#6b7280, #9aa4b2)`; `.card-dwell` is 12px with the same colour.
  Metric icons stay 12px.
- `.column-empty` and `.board-empty p` use
  `light-dark(#4b5563, #aab4c2)`.
- Zero-valued metrics are still omitted before the metrics container is added.

### F10 · Escape and the shortcut chain

- Escape now resolves the topmost state: confirm sheet, then an open select
  list, then a focused search (clear it and keep focus if non-empty; blur it
  if empty), then the drawer, dialogs and filter popover.
- After `Esc` blurs an empty search, `n` opens the new-task dialog and focuses
  its title again; `/` still focuses search.
- The footer hint is now
  `按 / 搜索，Esc 清除或关闭，n 新建任务。` /
  `Press / to search, Esc to clear or close, n for a new task.` so the
  `/ → Esc → n` chain matches the behaviour.

## Verification

Chrome headless via CDP at `http://127.0.0.1:4399`, demo board
`/tmp/codex-kanban-demo` (8 tasks, 2 projects), zh locale, light scheme.

| Screenshot | Viewport | Measured |
| --- | --- | --- |
| [`batch-c-drawer.png`](batch-c-drawer.png) | 1400 × 1700 | Status trigger 40px tall with six options and value `处理中`; question section y=720–1120; option grid `16px 537px`, row min-height 28px, radio 16×16 with 2px top margin; first option selected shows the tinted/bordered row; activity shows `昨天`, `提问：…`, `创建了 DSH-6（处理中）`, `Codex · 12小时前` |
| [`batch-c-confirm.png`](batch-c-confirm.png) | 1400 × 900 | Sheet open with title `归档任务`, target `DSH-1 · 设计任务卡片信息层级`, label `确认归档`, `rgb(180, 35, 24)` destructive fill, initial focus on `取消`; `Esc` closed it; `Tab` from `确认归档` wrapped to `取消` |
| [`batch-c-upload.png`](batch-c-upload.png) | 1400 × 900 | Dashed dropzone, `选择文件` button, hint `或将文件拖到这里 · 最大 10 MB`, selected filename `已选择 spec.pdf`; `#attachment-input` still hidden |
| [`batch-c-filter-select.png`](batch-c-filter-select.png) | 1400 × 900 | Priority list open in-product, trigger 40px, five options, selected `全部优先级` checked, `aria-expanded="true"`, menu bottom 312 / right 1004 inside the 1400×900 viewport; `Esc` closed the list but left the filter popover open |
| [`batch-c-390.png`](batch-c-390.png) | 390 × 844 | `scrollWidth === innerWidth === 390`, drawer width 390, drawer scroll width 390, status and question right edge 374, close button inside the viewport, option grid `16px 320px`, radio 16×16 |

Interaction probes:

- **Status → move API**: opening the drawer status list on DSH-1 and choosing
  `完成` produced the request body
  `{"action":"task.move","id":"…","version":1,"to":"done"}` (captured with a
  stubbed `fetch`, so the demo board was not mutated).
- **Select keyboard**: `ArrowDown` opened the priority list, a second
  `ArrowDown` moved focus to `低`, `Enter` selected it (`label: 低`,
  `aria-expanded: false`), the board reported `1 / 8 个任务` and the summary chip
  was `低 ×`; `清除全部` returned `8 个任务`.
- **Escape chain**: after `/`-style focus plus `dsh`, the first Escape left
  `value === ""` and focus on `#search`; the second moved focus to `<body>`;
  `n` then opened `#new-task-dialog` with focus on `#new-task-title`.
- **刚刚 threshold**: overriding the page clock to under a minute after DSH-6 was
  touched rendered `刚刚更新`, `· 刚刚进入此状态` and activity
  `Codex · 刚刚`.
- **Contrast**: computed `.card-metrics .metric` and `.card-dwell` were
  `rgb(107, 114, 128)` at 12px; `.column-empty` was `rgb(75, 85, 99)`.
- **No board mutation**: `board.json` sha256 is
  `7ef6fe79f685b72c5f9d6fe57fedac03a98ea78b795714f8b6d8dffc1ad8d253` after
  capture, unchanged since batch B.

## Tests

Six new static tests in `test/web-ui.test.mjs` assert:

- the six-option drawer status select, its label, `changeStatus` wiring and the
  retained move band;
- the shared 16px radio grid, 28px row, radio size/margin and selected state in
  both drawer and inline panels;
- the styled select markers (`data-select-field`, combobox/listbox roles,
  trigger height, listbox handlers), the hidden file input behind the dropzone,
  the 10 MB message, and the confirm sheet title/target/cancel/confirm markers
  with the removal of the old `window.confirm` archive calls;
- the localised activity keys and actor keys in both dictionaries;
- the 60-second `刚刚` threshold, `已停留` dwell label and distinct updated copy;
- the contrast tokens and the new Escape ordering, plus the accurate footer
  hint and `/ → Esc → n` chain.

## Remaining issues

- `window.prompt` / `window.confirm` are still used for approve/reject, ask,
  block and project rename. F7 only required archive/restore, but those paths
  remain the last native browser dialogs in the product.
- Activity localisation is client-side: the server still emits English
  `summary` strings and the page parses them for labels, reasons and filenames.
  A structured server payload would be more durable than summary parsing.
- The custom select is a flat listbox without type-ahead, option groups or a
  virtualised list; long option labels truncate in the trigger on narrow
  screens.
- The drawer is still one long scrolling surface (1,755px at 1400×1700);
  activity and the actions band remain below collaboration, so tabs or
  collapsible bands are still the next structural win.
- `刚刚` trusts the client clock: a clock skewed ahead can show `刚刚` for a
  future timestamp instead of a negative age.
- The card dwell line keeps the existing `·` separator before `已停留 …`; it is
  now labelled but not moved to its own metadata line.
