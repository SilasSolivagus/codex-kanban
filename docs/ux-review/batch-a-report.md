# UX batch A — responsive toolbar, type scale, density

**Date** · 2026-10-23
**Scope** · F1, F2, F3 from [`ux-audit-2026-10-23.md`](ux-audit-2026-10-23.md)
**Files changed** · `plugin/src/livehtml.mjs`, `test/web-ui.test.mjs`
**Tests** · 240 passing (`node --test`), up from 237; 3 new tests

## What changed

### F1 · Responsive toolbar and status clipping

- Added a `@media (max-width: 720px)` two-row grid on `.topbar-inner`:
  row 1 is the project chip plus the search field (`min-width: 0`, full remaining
  width), row 2 is `.topbar-tools` spanning both columns.
- The five toolbar controls (filter, archived, language, refresh, projects) become
  icon-only `44 × 44` buttons below 720px. Their visible labels are wrapped in
  `.btn-label` and hidden; each button keeps its accessible name through
  `aria-label` and its tooltip through `title`. `data-i18n-aria` / new
  `data-i18n-title` attributes keep both localized. The running-count chip is
  hidden in that row, since it is information rather than a control and the board
  header still reports the totals.
- The desktop (single-row) toolbar is unchanged in order, but every control now
  shares one height: 40px for the project chip, search, filter, archived, language,
  refresh and projects (previously 30/32/40 mixed). `#manage-projects` and the
  icon button no longer shrink, and toolbar labels never wrap (`项目管理` wrapped
  onto two lines at 1024 before).
- `.search-wrap` now has `min-width: 0` at every width, which removes the residual
  821px overflow that existed between 721px and ~860px (just above the compact
  breakpoint). At 721px the search compresses to ~76px rather than forcing a
  horizontal scrollbar.
- `@media (max-width: 1120px)` lets `.card-footer` wrap (`flex-wrap: wrap`,
  `row-gap: 4px`). `.card-status` no longer clips, and `.card-status-label` has no
  `overflow: hidden` / `text-overflow: ellipsis`; metrics use `margin-left: auto`
  so they stay right-aligned when the footer wraps.

### F2 · Type scale

- The identifier and title now share a single `.card-head` flex row:
  `DSH-6` at 13px/600 in `--muted`, title at 17px/600 with `line-height: 1.3`,
  `gap: 8px`, baseline aligned. The chevron remains `margin-left: auto`, flex-none,
  and top-aligned so long titles wrap to two clamped lines without moving it.
- `.column-title` is 15px/650 instead of 13px/600. Count pill and column icons keep
  their smaller size as the audit allowed.

### F3 · Density

- `.card` padding 14px (row gap 8px), `.board` gap 14px, card-to-card spacing 12px.
- Chips are 12px with a 22px line box.
- Card metrics render only non-zero counters: `addMetric()` appends a metric only
  when `count > 0`, and `.card-metrics` is omitted entirely when no counter is
  non-zero. The mechanical cause of the 1024px truncation (three `0` icons) is
  gone, not merely hidden.
- Board breakpoints remain 4 columns at ≥980px, 2 at ≥600px, 1 below.

### Supporting changes

- `applyI18n()` now localizes `data-i18n-title` attributes and updates the
  `.btn-label` inside the language button instead of the button's `textContent`.
- `syncArchivedToggle()` updates the label span, `aria-label`, `title` and
  `data-i18n-title` when the archive state flips, so the icon-only compact control
  keeps a correct accessible name.

## Verification

Chrome headless (`--headless=new`, CDP, device scale factor 1), zh locale, demo
board recreated at `/tmp/codex-kanban-demo` (8 tasks, 2 projects) and served at
`http://127.0.0.1:4399`.

| Screenshot | Viewport | Measured |
| --- | --- | --- |
| [`batch-a-390.png`](batch-a-390.png) | 390 × 844 | `documentElement.scrollWidth` = 390 = `innerWidth`; toolbar 113px tall; five 44×44 controls in row 2 |
| [`batch-a-1024.png`](batch-a-1024.png) | 1024 × 768 | 8/8 `.card-status-label` nodes untruncated (`clipped: 0`); no horizontal overflow |
| [`batch-a-1400.png`](batch-a-1400.png) | 1400 × 900 | Needs-you footer (`+ 新建卡片`) bottom at 867px, inside the viewport |

Computed styles at every viewport: `.card-title` 17px, `.column-title` 15px,
card padding 14px, board gap 14px, chip height 22px. Only one metric rendered
across the eight cards (the single comment on DSH-3); every zero counter is absent.

Additional probes at 721, 760, 820, 880, 940, 980, 1120 and 1121px all report
`scrollWidth === innerWidth`, so the toolbar no longer overflows in the gap above
the compact breakpoint.

## Not fixed in this batch

- F4 (drawer information architecture) and later findings are out of scope.
- Zero counters are removed at all widths, which is stricter than the F1 wording
  (“hide metrics whose value is 0 below 1120px”). This is the F3 requirement and
  removes the cause of the status clipping rather than masking it.
- Between 721px and ~820px the single-row toolbar is legal but tight: all labels
  stay visible and the search field compresses to 76–175px. The specified compact
  breakpoint is 720px, so this band was left as-is instead of adding a third
  toolbar mode.
- The page-footer shortcut hint is still clipped below a 900px-tall viewport at
  1400px (pre-existing, not part of F1–F3).
- The demo board at `/tmp/codex-kanban-demo` was created for these screenshots; it
  is not part of the repository.
