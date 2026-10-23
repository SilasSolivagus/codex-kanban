# UX batch B — drawer information architecture and filter visibility

**Date** · 2026-10-23
**Scope** · F4, F5 from [`ux-audit-2026-10-23.md`](ux-audit-2026-10-23.md)
**Files changed** · `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`
**Tests** · 245 passing (`node --test`), up from 240; 5 new static tests
**Commit** · `fix(ux): restructure the drawer and surface filter state`

## What changed

### F4 · Drawer information architecture

- The drawer body is now three labelled bands in DOM order: **详情** / Details
  (title, status, priority, assignee, updated, created, version, description,
  labels), **协作** / Collaboration (links, blocker, question/approval,
  attachments, comments), **动态** / Activity (the existing latest-twelve feed
  with actor and relative time).
- Move destinations and `提问` / `阻塞` / `解除阻塞` moved into a compact
  **操作** / Actions band after the activity feed, so they no longer sit above
  collaboration.
- Added a sticky drawer footer (`footer.drawer-footer`, `position: sticky;
  bottom: 0`) containing `保存更改` plus secondary `归档` / `恢复`. The old inline
  save/archive row inside the attributes section is removed. All original
  control ids and API actions are unchanged.
- `保存更改` starts disabled. A dirty check compares title, description, priority,
  labels and link rows with the server task; when they differ the footer gains a
  `dirty` class, shows the small amber dot with `未保存`, and enables the save
  button. Reverting or saving returns it to the clean state.
- Below 600px the drawer is exactly full width (`width: 100%`), the attribute
  grid collapses to one column, and the bands keep the same order.
- Activity still slices the latest twelve entries and renders `actor · relative
  time`.

### F5 · Filter visibility

- A filter-summary row sits directly under the toolbar whenever any filter or
  search is active. It renders one removable chip per active dimension
  (`高 ×`, `design ×`, `zzzz ×`) and a `清除全部` action. Removing a chip or the
  action clears that state and re-renders the board.
- `筛选` gains `.active` styling, `aria-label="筛选 · N"` and a numeric badge
  (`#filter-badge`) whenever any filter/search is active. The badge counts active
  dimensions, not visible tasks.
- The board subtitle now reports `4 / 8 个任务` while filtered (`0 / 8` for an
  empty search) and stays `8 个任务` when nothing is filtered.
- When a filter/search leaves zero tasks, exactly one board-level empty state is
  rendered (`#board-empty`: `没有任务匹配当前筛选` + `清除筛选`), the four columns
  are hidden, all eight per-column `data-create` controls are hidden, and the
  per-column empty paragraphs stay hidden. When some tasks match, the four-column
  layout and `+ 新建卡片` buttons remain.
- Added the i18n keys `counts.filteredTasks`, `filter.emptyTitle`,
  `filter.clearAll`, `filter.remove`, `drawer.collaboration`, `drawer.actions`,
  `drawer.unsaved` in both dictionaries.

### Tests

Five new tests in `test/web-ui.test.mjs` assert:

- the four `data-band` headings and their order, with field ownership per band;
- the sticky footer class/position, disabled-until-dirty save, dirty hint and
  input listeners;
- the 600px full-width drawer and stacked attribute grid;
- the filter-summary row, removable chips, badge and active state;
- the `X / Y` meta logic and the single board-level empty state with hidden
  create controls.

## Verification

Chrome headless (`--headless=new`, remote-debugging pipe, zh locale), demo board
at `/tmp/codex-kanban-demo` (8 tasks, 2 projects) served at
`http://127.0.0.1:4399`.

| Screenshot | Viewport | Measured |
| --- | --- | --- |
| [`batch-b-drawer.png`](batch-b-drawer.png) | 1400 × 900 | Bands at y=80 / 578 / 1584 / 1733 in order 详情 → 协作 → 动态 → 操作; footer computed `position: sticky`, `bottom: 0px`, stays fully visible after scrolling the 1,813px drawer body; save disabled before editing |
| [`batch-b-filter.png`](batch-b-filter.png) | 1400 × 900 | Priority `高` applied with popover closed: meta `4 / 8 个任务`, badge `1`, active toggle, summary chip `高 ×`, 4 cards, 8 create controls still visible |
| [`batch-b-empty.png`](batch-b-empty.png) | 1400 × 900 | Search `zzzz`: meta `0 / 8 个任务`, badge `1`, chip `zzzz ×`, one board empty state, 0 visible columns / 0 column-empty messages, all 8 create controls hidden |
| [`batch-b-mobile.png`](batch-b-mobile.png) | 390 × 844 | Drawer width 390 = viewport, bands in the same order, footer bottom at 844, no horizontal overflow |

Dirty-state probe: editing the title set `footer.drawer-footer.dirty`, revealed
`未保存` and enabled save; reverting restored the disabled/clean state. Interaction
probe: removing the summary chip returned the board to `8 个任务` with the summary
and badge hidden; `清除筛选` from the empty state restored 8 cards, 8 create
controls and an empty search field. A 390px board with an active filter has
`scrollWidth === innerWidth` (390).

The demo board was not mutated: `board.json` sha256 is
`7ef6fe79f685b72c5f9d6fe57fedac03a98ea78b795714f8b6d8dffc1ad8d253` before and
after capture.

## Remaining issues

- The drawer is still one scrolling surface (~1,813px at 1400). Grouping makes
  collaboration scannable at y=578, but activity remains below the fold at
  y=1,584; tabs or a collapse affordance would shorten it further and are out of
  this batch.
- When a filter matches some tasks, a lane with zero matches still shows the
  long per-column clear-filters sentence. Only the all-zero board collapses to
  the single board-level state.
- Archive/restore live in the sticky footer rather than the compact actions band;
  move/ask/block/unblock are in the band above it, so the secondary actions are
  split across the last two regions.
- The filter badge counts active filter dimensions (search, priority, label,
  assignee), not the number of hidden tasks.
