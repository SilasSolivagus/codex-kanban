# UX batch E — surface pending decisions and tidy round-2 findings

**Date** · 2026-10-23
**Scope** · R1–R9 from [`ux-audit-round2-2026-10-23.md`](ux-audit-round2-2026-10-23.md)
**Files changed** · `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`
**Tests** · 263 passing (`node --test`), up from 255; 8 new static tests
**Commit** · `fix(ux): surface pending decisions and tidy round-2 findings`

## What changed

### R1 · The drawer surfaces the pending decision

- `openTask` now opens `协作` when the task has an unresolved `pendingQuestion`
  or a `blockedReason`, and `详情` otherwise. `?task=<id>` goes through the same
  path, so a deep link lands on the tab that needs a human.
- The `协作` tab carries a 17px amber badge (`1`) whenever the task needs a
  decision. The badge is outside the panels, so switching to 详情 or 动态 keeps
  it visible.
- `.drawer-head` now holds a status chip (`待立项` / `处理中` / …) next to the
  title and a one-line pending message: `需要你回答：<prompt>` for an open
  question, `受阻：<reason>` for a blocker. Version and update time moved to a
  quiet meta line below the identifier and project.

### R2 · The decision dialog echoes the answer and promotes the chosen action

- A compact `问题 / 回答` block sits above the note field. It shows the pending
  prompt and the currently selected option label, or `尚未选择` when nothing is
  selected.
- The chosen action is the filled primary: approve is near-black
  (`#111827`) when approving, reject is red (`#b42318`) only when rejecting. The
  other action is an outline (`驳回` in red outline when approve is chosen,
  `批准` neutral outline when reject is chosen); `取消` stays neutral.
- All three buttons stay in the footer, 34px tall, right aligned, with the two
  decision buttons at a shared 88px width.

### R3 · The topbar reports the human queue

- `2 个运行中` is now followed by `2 需要你` with an amber dot. The needs chip
  turns muted when the count is zero. Both strings are rendered from
  `summary.counts` on every board payload.
- The zero state carries `data-empty="true"` so the dot and text both mute
  without changing layout.

### R4 · The mobile toolbar is labelled and overflow-safe

- Below 720px the search box spans the full topbar width on row one. Row two is
  `全部项目` (project switcher), `筛选`, `⋯`, `项目管理`.
- `筛选` and `项目管理` keep visible text instead of collapsing to icons.
  Language, refresh and archive moved into a labelled `⋯` popover
  (210px wide, 44px rows). Archive exposes `aria-pressed` and a filled dark
  pressed state.
- Every compact control is at least 44×44. The popover stays inside a 390px
  viewport and closes on outside click, selection or Escape.

### R5 · The filter summary is a compact inline strip

- `.filter-summary` is now content width (`fit-content`), 32px tall, transparent
  and single-line: chips followed immediately by `清除全部`. The filter row adds
  exactly 32px above the H1 instead of the previous 57px full-width banner.
- Every `+ 新建卡片` control (lane header and lane footer) is hidden whenever a
  filter or search is active, not only in the zero-result state. Clearing the
  filter brings them back.

### R6 · 详情 is a two-column inspector

- The property grid is four cells in two columns: `状态 / 优先级` and
  `负责人 / 日期`. `日期` stacks the updated and created timestamps. Title,
  description and labels remain full-width.
- Version and update time moved to the quiet `.drawer-meta` line in the header;
  the separate version cell is gone.
- On 详情 the drawer body sizes to content and the footer follows it. A measured
  429px body ends at y=609 on a 900px viewport, with the footer starting at the
  same y and the last field at y=572 — the former 270px void is gone. If the body
  does exceed the available height, `syncDrawerLayout` adds `drawer-overflow`
  and the footer becomes sticky again.

### R7 · Tags read as chips

- `.chip.tag` now has a 1px `#cfd4dc` (`--border-strong`) border, 6px radius,
  7px horizontal padding and the muted text colour. It stays 22px tall, the same
  height as the project and priority chips.

### R8 · The shortcut hint is always on screen

- The hint is a fixed 24px bar at the bottom edge (y=876–900 at 1400×900), with
  a top border and the board's surface colour. The shell reserves 56px, so the
  bar never covers the last row of cards. It is hidden at ≤720px where there is
  no hardware keyboard.
- The same fixed geometry keeps it visible at 1024×768; only the media query
  hides it on phones.

### R9 · Tabs are real touch targets

- Tabs are 44px tall with 16px horizontal padding and a 72px minimum width:
  measured 72px (详情) / 81px (协作 with badge) / 72px (动态) at both 1400 and
  390. The 2px selected underline is unchanged and the badge sits inside 协作.

## Verification

Chrome headless via CDP at `http://127.0.0.1:4399`, zh locale, light scheme,
demo board `/tmp/codex-kanban-demo` (8 tasks, 2 active projects). The server was
restarted on 4399 before capture. No server action was submitted; drawer,
dialog, filter and mobile probes were client-side only, so the demo board was
not mutated.

| Screenshot | Viewport | Measured |
| --- | --- | --- |
| [`batch-e-board.png`](batch-e-board.png) | 1400 × 900 | `innerWidth = scrollWidth = 1400`; topbar 59px; `2 个运行中` + `2 需要你` (amber); tag chip 22px, 1px `rgb(207,212,220)`, 6px radius, 7px padding; shortcut bar 24px at y=876–900 |
| [`batch-e-drawer.png`](batch-e-drawer.png) | 1400 × 900 | `?task=DSH-6` opens `协作`; badge `1` visible inside the tab; head chip `待立项`; `需要你回答：首次打开看板时，默认显示哪个视图？`; version in the meta line; tabs 72/81/72 × 44 |
| [`batch-e-confirm.png`](batch-e-confirm.png) | 1400 × 900 | 560 × 349 dialog; `问题 首次打开看板时…` → `回答 所有项目`; `确认批准` filled `rgb(17,24,39)` white, `确认驳回` red outline, both 88 × 34; `取消` neutral 55 × 34; right aligned |
| [`batch-e-filter.png`](batch-e-filter.png) | 1400 × 900 | summary 128.8 × 32 at x=24, transparent; chip `DSH ×` + `清除全部` on one line; H1 69 → 101 (+32), board 125 → 157; `0 / 8` create controls visible |
| [`batch-e-390.png`](batch-e-390.png) | 390 × 844 | `innerWidth = scrollWidth = 390`; search 366 × 44 on row one; `筛选` 52 × 44, `⋯` 44 × 44, `项目管理` 78 × 44; hint `display: none`; overflow popover 210px wide with 44px labelled items, still inside the viewport |

Additional CDP probes:

- **Blocked task** — `?task=DSH-5` opens `协作`, badge `1`, head chip `处理中`,
  pending line `受阻：等待视觉稿定稿后再继续`.
- **Badge persistence** — switching from `协作` to `详情` leaves the badge
  visible with text `1`.
- **Reject emphasis** — opening the dialog from `拒绝` with no option chosen
  shows `尚未选择` and fills only `确认驳回` (`rgb(180,35,24)`); `确认批准` is a
  neutral outline.
- **详情 footer** — body 429px high ending at y=609, footer starting at y=609,
  `drawer-fit` set and `drawer-overflow` clear.
- **1024 × 768 laptop** — topbar 59px, `innerWidth = scrollWidth = 1024`, hint
  visible at y=744–768 and hidden only below 720px.
- **Mobile drawer** — drawer width and scroll width both 390; tabs 72/81/72 ×
  44; pending line and question controls stay inside the viewport.

## Remaining issues

- `?task=` still forces `include_archived`, so the archive toggle shows its
  pressed state while a deep-linked task is open. This is pre-existing and does
  not affect the R1–R9 checks.
- The `批准` and `拒绝` buttons in the drawer's question section still follow the
  older record-then-decision flow; the new emphasis and answer echo live in the
  confirmation dialog only.
- R5 verification used a search chip (`DSH`); priority/label/assignee chips share
  the same compact strip and hide the same create controls.
