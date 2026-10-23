import test from 'node:test'
import assert from 'node:assert/strict'
import {
  I18N_KEYS,
  STRINGS,
  UI_ACTIONS,
  renderLiveHtml,
} from '../plugin/src/livehtml.mjs'

const html = renderLiveHtml({ project: { name: 'demo-board', prefix: 'CK' } })
const markup = html.split('<script>')[0]
const script = html.slice(
  html.indexOf('<script>') + '<script>'.length,
  html.lastIndexOf('</script>'),
)

function quotedIn(text, value) {
  return text.includes(`'${value}'`) || text.includes(`"${value}"`)
}

const COLUMN_IDS = ['backlog', 'running', 'needs', 'done']

// --- document shell -------------------------------------------------------

test('the page is one complete self-contained document', () => {
  assert.ok(html.startsWith('<!doctype html>'))
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<meta charset="utf-8"\s*\/?>/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"\s*\/?>/)
  assert.match(html, /<title>Codex Kanban · demo-board<\/title>/)
  assert.match(markup, /color-scheme: light;/)
  assert.match(markup, /light-dark\(/)
  assert.match(markup, /font-size: 14px/)
  // No framework, no CDN, no stylesheet hop.
  assert.doesNotMatch(markup, /<script[^>]+src=/i)
  assert.doesNotMatch(markup, /<link[^>]+href=/i)
  assert.doesNotMatch(markup, /<iframe/i)
})

test('the layout keeps four columns, two at 600px and one below', () => {
  assert.match(markup, /grid-template-columns: repeat\(1, minmax\(0, 1fr\)\)/)
  assert.match(markup, /@media \(min-width: 600px\)[^}]*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(markup, /@media \(min-width: 980px\)[^}]*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/)
})

test('below 720px the toolbar keeps labelled primaries and an overflow menu', () => {
  assert.match(markup, /<div class="topbar-tools">/)
  const compact = markup.split('@media (max-width: 720px)')[1].split('@media (prefers-reduced-motion')[0]
  assert.match(compact, /\.topbar-inner \{[^}]*display: grid/)
  assert.match(compact, /\.topbar-inner \{[^}]*grid-template-columns: auto minmax\(0, 1fr\)/)
  assert.match(compact, /\.search-wrap \{[^}]*grid-column: 1 \/ -1/)
  assert.match(compact, /\.search-wrap \{[^}]*min-width: 0/)
  assert.match(compact, /\.topbar-tools \{[^}]*grid-column: 2/)
  assert.match(compact, /\.topbar-actions \{ display: contents; \}/)
  assert.match(compact, /\.running-chip, \.needs-chip \{ display: none; \}/)
  assert.match(compact, /width: 44px; min-width: 44px; height: 44px/)
  // 筛选 and 项目 keep their text; language, refresh and archive move into ⋯.
  assert.match(compact, /#filter-toggle, #manage-projects \{[^}]*width: auto;[^}]*height: 44px/)
  assert.match(compact, /\.overflow-menu #lang-toggle, \.overflow-menu #refresh, \.overflow-menu #archived-toggle \{/)
  assert.match(compact, /\.overflow-menu \.btn-label \{ display: inline; \}/)
  assert.match(compact, /\.overflow-menu #archived-toggle\[aria-pressed="true"\]/)
  assert.match(markup, /<button id="overflow-toggle"[^>]*aria-haspopup="menu"[^>]*aria-expanded="false"[^>]*aria-controls="toolbar-overflow-menu"/)
  assert.match(markup, /<div class="overflow-menu" id="toolbar-overflow-menu" role="menu"/)
  assert.match(script, /overflowToggle\.addEventListener\('click'/)
  assert.match(script, /toolbarOverflow\.classList\.toggle\('open', open\)/)
  assert.match(script, /function closeOverflow\(\)/)
  // Every compact control keeps an accessible name and a tooltip.
  for (const id of ['filter-toggle', 'archived-toggle', 'lang-toggle', 'refresh', 'manage-projects']) {
    assert.match(markup, new RegExp(`<button id="${id}"[^>]*aria-label="[^"]+"[^>]*title="[^"]+"`), `${id} has aria-label and title`)
  }
})

test('desktop toolbar controls share one 40px height', () => {
  for (const selector of ['\\.archived-toggle', '#lang-toggle', '\\.icon-button', '#manage-projects']) {
    assert.match(markup, new RegExp(`${selector} \\{[^}]*height: 40px`), `${selector} is 40px tall`)
  }
})

test('the card header puts the identifier inline with a 17px title and a 15px column title', () => {
  assert.match(markup, /\.card-head \{ display: flex; align-items: baseline; gap: 8px; \}/)
  assert.match(markup, /\.card-identifier \{[^}]*font-size: 13px[^}]*font-weight: 600/)
  assert.match(markup, /\.card-title \{[^}]*font-size: 17px[^}]*line-height: 1\.3/)
  assert.match(markup, /\.card-chevron \{[^}]*margin-left: auto/)
  assert.match(markup, /\.column-title \{[^}]*font-size: 15px[^}]*font-weight: 650/)
  assert.doesNotMatch(markup, /\.card-top \{/)
  assert.match(script, /var head = el\('div', 'card-head'\)/)
  assert.match(script, /head\.appendChild\(el\('span', 'card-identifier', task\.identifier\)\)/)
  assert.match(script, /head\.appendChild\(el\('h3', 'card-title', task\.title\)\)/)
  assert.match(script, /head\.appendChild\(open\)/)
})

test('a project name cannot inject markup into the title', () => {
  const evil = renderLiveHtml({ project: { name: '<b>demo & co</b>' } })
  assert.match(evil, /<title>Codex Kanban · &lt;b&gt;demo &amp; co&lt;\/b&gt;<\/title>/)
  assert.doesNotMatch(evil, /<b>demo/)
})

test('the light theme uses the dsh reference tokens and layout scale', () => {
  for (const token of ['#f7f8fa', '#ffffff', '#111827', '#6b7280', '#f3f4f6', '#eff2f6', '#fff7e8', '#eef8f1', '#e5e7eb']) {
    assert.ok(markup.includes(token), `light token ${token} is present`)
  }
  assert.match(markup, /--bg: light-dark\(#f7f8fa/)
  assert.match(markup, /--panel-needs: light-dark\(#fff7e8/)
  assert.match(markup, /--panel-done: light-dark\(#eef8f1/)
  assert.match(markup, /border-radius: 14px/)
  assert.match(markup, /max-width: 1400px/)
  assert.match(markup, /gap: 10px/)
  assert.doesNotMatch(markup, /text-transform: uppercase/)
})

// --- header, switcher, search, language ----------------------------------

test('header has page title, project switcher, wide search, filters, running count, language toggle, refresh and projects', () => {
  assert.match(markup, /<h1 id="board-title">Codex Kanban<\/h1>/)
  assert.match(markup, /<select id="project-select"/)
  assert.match(markup, /<option value="all">All projects<\/option>/)
  assert.match(markup, /<input id="search" type="search"/)
  assert.match(markup, /data-i18n-placeholder="header.searchPlaceholder"/)
  assert.match(markup, /<button id="filter-toggle"[^>]*aria-label="Filters"/)
  assert.match(markup, /<span class="btn-label" data-i18n="header.filter">Filters<\/span>/)
  assert.match(markup, /<select id="filter-priority"/)
  assert.match(markup, /<select id="filter-label"/)
  assert.match(markup, /<select id="filter-assignee"/)
  assert.match(markup, /<button id="lang-toggle"[^>]*aria-label="Switch to Chinese"/)
  assert.match(markup, /<span class="btn-label" data-i18n="header.langToggle">中文<\/span>/)
  assert.match(markup, /<button id="refresh"[^>]*aria-label="Refresh"/)
  assert.match(markup, /<button id="manage-projects"[^>]*aria-label="Projects"/)
  assert.match(markup, /<span class="btn-label" data-i18n="header.projects">Projects<\/span>/)
  assert.match(markup, /id="running-count"/)
  assert.match(markup, /id="counts" aria-live="polite"/)
})

test('toolbar carries priority, label and assignee filters plus a visible count', () => {
  for (const id of ['filter-priority', 'filter-label', 'filter-assignee']) {
    assert.match(markup, new RegExp(`<select id="${id}"`), `${id} is a select`)
  }
  assert.match(markup, /<option value="">All priorities<\/option>/)
  assert.match(markup, /<option value="">All labels<\/option>/)
  assert.match(markup, /<option value="">All assignees<\/option>/)
  assert.match(markup, /<button id="clear-filters"[^>]*>Clear filters<\/button>/)
  assert.match(markup, /id="filter-count" aria-live="polite"/)
  assert.match(script, /filterCount\.textContent = t\('filter\.showing'/)
  assert.match(script, /function clearAllFilters\(\)/)
  assert.match(script, /state\.search = ''/)
})

// --- four collapsible columns --------------------------------------------

test('four columns are marked up in product order with collapsible headers', () => {
  const order = [...markup.matchAll(/<section class="column" data-column="([^"]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(order, COLUMN_IDS)
  for (const id of COLUMN_IDS) {
    assert.match(markup, new RegExp(`data-collapse="${id}"`), `${id} can collapse`)
    assert.match(markup, new RegExp(`data-i18n="columns\\.${id}"`), `${id} is translated`)
    assert.match(markup, new RegExp(`data-empty="${id}"`), `${id} has an empty state`)
    assert.match(markup, new RegExp(`id="cards-${id}"`), `${id} has a card container`)
  }
  assert.match(script, /aria-expanded/)
  assert.match(script, /storeSet\(STORAGE\.collapsed, JSON\.stringify\(state\.collapsed\)\)/)
})

test('drag and drop stays inside backlog, running and done', () => {
  assert.match(script, /var DRAG_COLUMNS = \['backlog', 'running', 'done'\]/)
  assert.match(script, /for \(var i = 0; i < DRAG_COLUMNS\.length; i \+= 1\)/)
  assert.match(script, /event\.dataTransfer\.setData\('text\/plain'/)
  assert.match(script, /addEventListener\('drop'/)
  assert.match(script, /act\('task\.move'/)
  assert.doesNotMatch(script, /\[data-column="needs"\]'\)\.addEventListener\('drop'/)
})

test('cards are keyboard accessible and open the drawer with Enter or Space', () => {
  assert.match(script, /card\.tabIndex = 0/)
  assert.match(script, /card\.setAttribute\('role', 'button'\)/)
  assert.match(script, /card\.setAttribute\('aria-haspopup', 'dialog'\)/)
  assert.match(script, /event\.key === 'Enter' \|\| event\.key === ' '/)
  assert.match(markup, /<aside class="drawer" id="drawer" role="dialog" aria-modal="true"/)
})

test('every column has a footer create button that creates in that column', () => {
  const footers = [...markup.matchAll(/class="column-new-card"[^>]*data-create="([^"]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(footers, COLUMN_IDS)
  const heads = [...markup.matchAll(/class="column-add"[^>]*data-create="([^"]+)"/g)]
    .map((match) => match[1])
  assert.deepEqual(heads, COLUMN_IDS)
  assert.equal((markup.match(/data-i18n="columns\.add"/g) || []).length, 4)
  assert.match(script, /querySelectorAll\('\[data-create\]'\)/)
  assert.match(script, /openNewTask\(this\.getAttribute\('data-create'\)\)/)
  assert.match(script, /status: COLUMN_STATUS\[state\.newTaskColumn\] \|\| 'backlog'/)
})

test('status dots and localized status labels are rendered on every card', () => {
  assert.match(markup, /\.status-dot \{/)
  assert.match(markup, /\.status-needs \.status-dot/)
  assert.match(markup, /\.status-done \.status-dot/)
  assert.match(script, /'status-dot'/)
  assert.match(script, /function statusClass\(task\)/)
  assert.match(script, /t\('status\.' \+ \(task\.status \|\| 'backlog'\)\)/)
  for (const status of ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled']) {
    assert.ok(I18N_KEYS.includes(`status.${status}`), `status.${status} is translated`)
  }
})

test('needs-you cards carry an inline question panel with options, note and decisions', () => {
  assert.match(markup, /<template id="question-panel-template">/)
  assert.match(markup, /class="question-panel"/)
  assert.match(markup, /data-question-options/)
  assert.match(markup, /role="radiogroup"/)
  assert.match(markup, /data-question-note/)
  assert.match(markup, /data-question-approve/)
  assert.match(markup, /data-question-reject/)
  assert.match(markup, /data-i18n="question.inlineTitle"/)
  assert.match(script, /function buildQuestionPanel\(task\)/)
  assert.match(script, /function inlineDecide\(task, decision, panel\)/)
  assert.match(script, /act\('task\.answer'/)
  assert.match(script, /decision === 'approve' \? 'task\.approve' : 'task\.reject'/)
  assert.match(script, /t\('card\.blockedPrefix'\) \+ task\.blockedReason/)
})

test('the reference search placeholder exists in both languages', () => {
  assert.equal(STRINGS.en['header.searchPlaceholder'], 'Search title / summary / project / label')
  assert.equal(STRINGS.zh['header.searchPlaceholder'], '搜索标题 / 摘要 / 项目 / 标签')
  assert.match(markup, /data-i18n-placeholder="header.searchPlaceholder"/)
  assert.match(markup, /placeholder="Search title \/ summary \/ project \/ label"/)
  for (const key of ['question.inlineTitle', 'question.notePlaceholder', 'card.updatedAgo', 'card.blockedPrefix', 'columns.add', 'header.filter', 'counts.running']) {
    assert.ok(I18N_KEYS.includes(key), `${key} is in both dictionaries`)
    assert.notEqual(STRINGS.en[key], STRINGS.zh[key], `${key} differs by language`)
  }
})

// --- drawer ---------------------------------------------------------------

test('drawer contains editable details, links, activity, comments and attachments', () => {
  for (const id of [
    'edit-title',
    'edit-description',
    'edit-priority',
    'edit-labels',
    'edit-links',
    'add-link',
    'save-task',
    'activity-list',
    'comment-list',
    'comment-body',
    'add-comment',
    'attachment-list',
    'attachment-input',
    'attachment-error',
  ]) {
    assert.match(markup, new RegExp(`id="${id}"`), `${id} is present`)
  }
  assert.match(markup, /<input id="attachment-input" type="file"/)
  assert.match(markup, /id="answer-hint"/)
  assert.match(markup, /id="question-section"/)
  assert.match(markup, /id="question-options"/)
  assert.match(markup, /id="approve"/)
  assert.match(markup, /id="reject"/)
  assert.match(markup, /id="block-task"/)
  assert.match(markup, /id="unblock-task"/)
  assert.match(markup, /id="ask-task"/)
  assert.match(markup, /id="drawer-version">Version 1<\/span>/)
  assert.match(script, /t\('drawer\.version', \{ n: task\.version \}\)/)
})

test('activity renders kind plus structured data and never parses English summaries', () => {
  assert.match(script, /var latest = activity\.slice\(-12\)/)
  assert.match(script, /function activityText\(entry, task\)/)
  assert.match(script, /function actorName\(actor\)/)
  assert.match(script, /function dayLabel\(iso\)/)
  assert.match(script, /var day = dayKey\(entry\.at\)/)
  assert.match(script, /el\('li', 'feed-day', dayLabel\(entry\.at\)\)/)
  assert.match(script, /t\('activity\.today'\)/)
  assert.match(script, /t\('activity\.yesterday'\)/)
  assert.match(script, /t\('actor\.you'\)/)
  assert.match(script, /t\('actor\.codex'\)/)
  assert.match(script, /var data = entry\.data/)
  assert.match(script, /t\('activity\.created', \{ actor: actor, id: id, status: statusName\(data\.status\) \}\)/)
  assert.match(script, /t\('activity\.moved', \{/)
  assert.match(script, /statusName\(data\.from\)/)
  assert.match(script, /data\.reason/)
  assert.match(script, /data\.optionLabel/)
  assert.match(script, /data\.prompt/)
  assert.match(script, /data\.preview/)
  assert.match(script, /data\.filename/)
  for (const kind of [
    'created', 'moved', 'blocked', 'unblocked', 'question', 'answered', 'approved',
    'rejected', 'commented', 'attached', 'detached', 'reordered', 'archived', 'restored',
  ]) {
    assert.match(script, new RegExp(`kind === '${kind}'`), `${kind} is rendered from its kind`)
  }
  // Legacy entries fall back to the stored summary instead of being parsed.
  assert.match(script, /if \(!data\) return entry\.summary \|\| kind/)
  assert.doesNotMatch(script, /summary\.replace/)
  assert.doesNotMatch(script, /indexOf\('answered: '\)/)
  assert.doesNotMatch(script, /\.exec\(summary\)/)
  // Every template is localised and carries the actor label.
  for (const key of [
    'activity.created', 'activity.moved', 'activity.blocked', 'activity.unblocked',
    'activity.question', 'activity.answered', 'activity.approved', 'activity.rejected',
    'activity.commented', 'activity.attached', 'activity.detached', 'activity.reordered',
    'activity.archived', 'activity.restored',
  ]) {
    assert.match(STRINGS.en[key], /\{actor\}/, `en ${key} names the actor`)
    assert.ok(I18N_KEYS.includes(key), `${key} is in both dictionaries`)
  }
  assert.equal(STRINGS.zh['actor.you'], '你')
  assert.equal(STRINGS.zh['actor.codex'], 'Codex')
  assert.equal(STRINGS.zh['activity.created'], '{actor}创建了 {id}（{status}）')
  assert.equal(STRINGS.zh['activity.answered'], '{actor}回答了「{option}」')
  assert.equal(STRINGS.zh['activity.approved'], '{actor}批准了 {id}')
  assert.equal(STRINGS.zh['activity.rejected'], '{actor}驳回了 {id}')
  assert.equal(STRINGS.zh['activity.blocked'], '{actor}将 {id} 标记为阻塞：{reason}')
  assert.equal(STRINGS.zh['activity.unblocked'], '{actor}解除了 {id} 的阻塞')
  assert.equal(STRINGS.zh['activity.attached'], '{actor}添加了附件 {name}')
  assert.equal(STRINGS.zh['activity.commented'], '{actor}评论：{body}')
  assert.equal(STRINGS.zh['activity.moved'], '{actor}移动了 {id}：{from} → {to}')
  assert.equal(STRINGS.zh['activity.archived'], '{actor}归档了 {id}')
  assert.equal(STRINGS.zh['activity.restored'], '{actor}恢复了 {id}')
})

test('comments and attachments use the v2 api and show sizes', () => {
  assert.match(script, /act\('task\.comment'/)
  assert.match(script, /act\('attachment\.add'/)
  assert.match(script, /act\('attachment\.remove'/)
  assert.match(script, /ATTACHMENT_API \+ encodeURIComponent\(attachment\.id\)/)
  assert.match(script, /formatSize\(attachment\.size\)/)
  assert.match(script, /link\.download = attachment\.filename/)
})

test('attachment uploads read base64 with FileReader and stop above 10 MB', () => {
  assert.match(script, /var MAX_ATTACHMENT_BYTES = 10 \* 1024 \* 1024/)
  assert.match(script, /new FileReader\(\)/)
  assert.match(script, /reader\.readAsDataURL\(file\)/)
  assert.match(script, /file\.size > MAX_ATTACHMENT_BYTES/)
  assert.match(script, /attachmentError\.textContent = t\('drawer\.attachmentTooLarge'\)/)
  assert.match(script, /contentType: file\.type \|\| 'application\/octet-stream'/)
})

test('question options show label and detail, then a decision dialog approves or rejects with a note', () => {
  assert.match(script, /el\('span', 'option-label', option\.label\)/)
  assert.match(script, /option\.detail/)
  assert.match(script, /act\('task\.answer'/)
  assert.match(markup, /<dialog id="decision-dialog"/)
  assert.match(markup, /<textarea id="decision-note"/)
  assert.match(script, /function submitDecision\(kind\)/)
  assert.match(script, /var action = kind === 'approve' \? 'task\.approve' : 'task\.reject'/)
  assert.match(script, /note: decisionNote\.value/)
  assert.match(script, /act\('task\.ask'/)
  assert.match(script, /options: options/)
  assert.equal(STRINGS.zh['decision.approve'], '确认批准')
  assert.equal(STRINGS.zh['decision.reject'], '确认驳回')
  assert.equal(STRINGS.zh['decision.cancel'], '取消')
})

// --- projects -------------------------------------------------------------

test('project management creates, renames, archives and restores', () => {
  assert.match(markup, /<dialog id="project-dialog"/)
  assert.match(markup, /id="project-name"/)
  assert.match(markup, /id="project-prefix"/)
  assert.match(markup, /id="project-workspace"/)
  assert.match(script, /act\('project\.create'/)
  assert.match(script, /act\('project\.update'/)
  assert.match(script, /act\('project\.archive'/)
  assert.match(script, /act\('project\.restore'/)
  assert.match(script, /function openConfirm\(options\)/)
  assert.match(script, /t\('confirm\.archiveProjectTitle'\)/)
  assert.match(script, /t\('confirm\.restoreProjectTitle'\)/)
  assert.match(script, /function closeConfirm\(\)/)
  assert.doesNotMatch(script, /window\.confirm\(t\('project\.archiveConfirm'/)
  assert.match(script, /project\.archivedSuffix/)
})

test('an archived project renders a readonly banner and disables every write', () => {
  assert.match(markup, /<div class="banner" id="readonly-banner"/)
  assert.match(markup, /id="restore-selected"/)
  assert.match(script, /state\.readOnly = Boolean\(payload\.board && payload\.board\.project && payload\.board\.project\.archivedAt\)/)
  assert.match(script, /createButtons\[i\]\.disabled = state\.readOnly/)
  assert.match(script, /writes\[i\]\.disabled = readOnly/)
  assert.match(script, /if \(state\.readOnly && action\.indexOf\('project\.'\) !== 0\)/)
  assert.match(script, /PROJECT_ARCHIVED/)
})

// --- i18n, persistence, shortcuts, errors --------------------------------

test('both dictionaries cover every key and every static translated label', () => {
  assert.ok(I18N_KEYS.length >= 150, `dictionary has ${I18N_KEYS.length} keys`)
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.zh).sort())
  for (const key of I18N_KEYS) {
    assert.equal(typeof STRINGS.en[key], 'string', `en ${key}`)
    assert.equal(typeof STRINGS.zh[key], 'string', `zh ${key}`)
    assert.ok(STRINGS.en[key].length > 0, `en ${key} is not empty`)
    assert.ok(STRINGS.zh[key].length > 0, `zh ${key} is not empty`)
  }
  assert.equal(STRINGS.zh['columns.needs'], 'Needs you')
  assert.notEqual(STRINGS.en['header.newTask'], STRINGS.zh['header.newTask'])

  const attributes = ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria', 'data-i18n-title']
  for (const attribute of attributes) {
    const pattern = new RegExp(`${attribute}="([^"]+)"`, 'g')
    for (const match of markup.matchAll(pattern)) {
      assert.ok(I18N_KEYS.includes(match[1]), `${attribute}="${match[1]}" exists in both dictionaries`)
    }
  }
  assert.ok(html.includes(JSON.stringify(STRINGS.en)), 'the page embeds the en dictionary')
  assert.ok(html.includes(JSON.stringify(STRINGS.zh)), 'the page embeds the zh dictionary')
})

test('language, collapsed columns and the selected project persist in localStorage', () => {
  assert.match(script, /window\.localStorage\.getItem/)
  assert.match(script, /window\.localStorage\.setItem/)
  assert.match(script, /lang: 'codex-kanban\.lang'/)
  assert.match(script, /collapsed: 'codex-kanban\.collapsed'/)
  assert.match(script, /project: 'codex-kanban\.project'/)
  assert.match(script, /storeSet\(STORAGE\.lang, state\.lang\)/)
  assert.match(script, /storeSet\(STORAGE\.project, state\.projectId\)/)
  assert.match(script, /state\.lang = state\.lang === 'zh' \? 'en' : 'zh'/)
  assert.match(script, /document\.documentElement\.lang = state\.lang/)
})

test('the page defaults to zh for a Chinese browser and en otherwise', () => {
  assert.match(script, /window\.navigator\.language/)
  assert.match(script, /browser\.indexOf\('zh'\) === 0 \? 'zh' : 'en'/)
})

test('keyboard shortcuts cover /, n and Escape', () => {
  assert.match(script, /event\.key === 'Escape'/)
  assert.match(script, /event\.key === '\/'/)
  assert.match(script, /searchInput\.focus\(\)/)
  assert.match(script, /event\.key === 'n' \|\| event\.key === 'N'/)
  assert.match(script, /openNewTask\(\)/)
  assert.match(script, /closeDrawer\(\)/)
  assert.match(script, /newTaskDialog\.close\(\)/)
  assert.match(script, /projectDialog\.close\(\)/)
})

test('reduced motion disables transitions in css and in the page script', () => {
  assert.match(markup, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(markup, /transition: none !important/)
  assert.match(script, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)
  assert.match(script, /classList\.add\('reduced-motion'\)/)
})

test('api errors surface as code: message in the toast', () => {
  assert.match(script, /function errorText\(error\)/)
  assert.match(script, /return code \+ ': ' \+ message/)
  assert.match(script, /toast\.setAttribute\('role', isError \? 'alert' : 'status'\)/)
  assert.match(script, /classList\.add\(' error'\)|'toast show' \+ \(isError \? ' error' : ''\)/)
  assert.match(script, /\.catch\(function \(error\) \{\s*handleError\(error\)/)
})

test('every successful action re-renders from the response payload', () => {
  assert.match(script, /function applyPayload\(payload\)/)
  assert.match(script, /state\.data = payload/)
  assert.match(script, /applyPayload\(json\)/)
  assert.match(script, /renderAll\(\)/)
  // The action helper never mutates state before the server answers.
  assert.doesNotMatch(script, /state\.data\.[A-Za-z]+\.push/)
})

// --- api vocabulary -------------------------------------------------------

test('the page only talks to the relative v2 api', () => {
  assert.match(script, /var API_BOARD = '\/api\/board'/)
  assert.match(script, /var API_ACTION = '\/api\/action'/)
  assert.match(script, /var ATTACHMENT_API = '\/api\/attachments\/'/)
  assert.match(script, /fetch\(API_ACTION/)
  assert.match(script, /fetch\(API_BOARD/)
  assert.match(script, /method: 'POST'/)
  assert.match(script, /'content-type': 'application\/json'/)
  assert.doesNotMatch(html, /https?:\/\//)
})

test('UI_ACTIONS matches the v0.3 action vocabulary and is used by the script', () => {
  assert.deepEqual([...UI_ACTIONS].sort(), [
    'attachment.add',
    'attachment.remove',
    'project.archive',
    'project.create',
    'project.restore',
    'project.update',
    'task.answer',
    'task.approve',
    'task.archive',
    'task.ask',
    'task.block',
    'task.comment',
    'task.create',
    'task.move',
    'task.reject',
    'task.reorder',
    'task.restore',
    'task.unblock',
    'task.update',
  ])
  assert.equal(new Set(UI_ACTIONS).size, UI_ACTIONS.length)
  for (const action of UI_ACTIONS) {
    assert.ok(quotedIn(script, action), `${action} is sent by the page`)
  }
})

test('the new task dialog creates through the api with project and priority', () => {
  assert.match(markup, /<dialog id="new-task-dialog"/)
  assert.match(markup, /id="new-task-title"/)
  assert.match(markup, /id="new-task-project"/)
  assert.match(markup, /id="new-task-priority"/)
  assert.match(script, /act\('task\.create'/)
  assert.match(script, /projectId: newTaskProject\.value/)
  assert.match(script, /priority: newTaskPriority\.value/)
})

// --- parity gaps ----------------------------------------------------------

test('the card footer shows status, dwell time and only non-zero metric counts', () => {
  assert.match(markup, /\.card-dwell \{/)
  assert.match(script, /function taskStatusLabel\(task\)/)
  assert.match(script, /function taskElapsed\(task\)/)
  assert.match(script, /function dwellText\(iso\)/)
  assert.match(script, /t\('card\.dwellLabel'/)
  assert.match(script, /' · ' \+ dwellText\(elapsed\)/)
  assert.match(script, /task\.attentionSince/)
  assert.match(script, /pendingQuestion\.createdAt/)
  assert.match(script, /blockedSince \|\| task\.statusSince/)
  assert.match(script, /function addMetric\(name, count, key\)/)
  assert.match(script, /if \(count > 0\) metrics\.appendChild\(metric\(name, count/)
  assert.match(script, /addMetric\('comment'/)
  assert.match(script, /addMetric\('attachment'/)
  assert.match(script, /addMetric\('link'/)
  assert.match(script, /if \(metrics\.childElementCount\) footer\.appendChild\(metrics\)/)
  const cardBody = script.slice(script.indexOf('function renderCard'), script.indexOf('function clearDropMarkers'))
  assert.doesNotMatch(cardBody, /^\s*metrics\.appendChild\(metric\(/m)
  // The status label is never ellipsized and the footer wraps before packing it.
  assert.doesNotMatch(markup, /\.card-status-label \{[^}]*text-overflow: ellipsis/)
  assert.match(markup, /@media \(max-width: 1120px\) \{\s*\.card-footer \{ flex-wrap: wrap;/)
  assert.equal(STRINGS.en['card.dwell'], '{time} ago')
  assert.equal(STRINGS.zh['card.dwell'], '{time}前')
})

test('same-column drag shows an insertion line and reorders before the target', () => {
  assert.match(markup, /\.drop-before::before/)
  assert.match(markup, /\.drop-before::before \{[^}]*top: -5px/)
  assert.match(script, /classList\.add\('drop-before'\)/)
  assert.match(script, /function clearDropMarkers\(\)/)
  assert.match(script, /state\.dragTask = \{ id: task\.id, version: task\.version, column: columnId \}/)
  assert.match(script, /act\('task\.reorder'/)
  assert.match(script, /beforeId: beforeId \|\| undefined/)
  assert.match(script, /task\.column === columnId/)
  assert.match(script, /act\('task\.move'/)
})

test('archived tasks can be shown, dimmed and restored from the drawer', () => {
  assert.match(markup, /<button id="archived-toggle"[^>]*aria-pressed="false"/)
  assert.match(markup, /data-i18n="filter\.archived"/)
  assert.match(markup, /<button id="archive-task"[^>]*data-i18n="drawer\.archive"/)
  assert.match(markup, /<button id="restore-task"[^>]*data-i18n="drawer\.restore"/)
  assert.match(script, /includeArchived: readArchived\(\) \|\| Boolean\(readTaskRef\(\)\)/)
  assert.match(script, /'&include_archived=1'/)
  assert.match(script, /state\.includeArchived = !state\.includeArchived/)
  assert.match(script, /storeSet\(STORAGE\.archived/)
  assert.match(script, /act\('task\.archive'/)
  assert.match(script, /act\('task\.restore'/)
  assert.match(script, /archiveButton\.hidden = archived/)
  assert.match(script, /restoreButton\.hidden = !archived/)
  assert.match(markup, /\[hidden\] \{ display: none !important; \}/)
  assert.match(markup, /article\.card\.archived \{ opacity/)
  assert.match(script, /if \(task && task\.archivedAt\) return false/)
  assert.match(script, /task\.id\) return/)
  assert.match(script, /'chip archived'/)
})

test('the drawer uses the two-column attribute grid with full-width sections', () => {
  assert.match(markup, /class="attr-grid"/)
  assert.match(markup, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/)
  assert.match(markup, /\.attr\.full \{ grid-column: 1 \/ -1; \}/)
  for (const id of ['attr-status', 'attr-assignee', 'attr-updated', 'attr-created']) {
    assert.match(markup, new RegExp(`id="${id}"`), `${id} is an attribute cell`)
  }
  const details = markup.slice(
    markup.indexOf('id="drawer-panel-details"'),
    markup.indexOf('id="drawer-panel-collaboration"'),
  )
  const propertyOrder = [...details.matchAll(/data-i18n="(drawer\.(?:statusLabel|priority|assignee|datesLabel))"/g)]
    .map((match) => match[1])
  assert.deepEqual(propertyOrder, ['drawer.statusLabel', 'drawer.priority', 'drawer.assignee', 'drawer.datesLabel'])
  const detailsOrder = [...details.matchAll(/data-i18n="(drawer\.(?:description|labels))"/g)]
    .map((match) => match[1])
  assert.deepEqual(detailsOrder, ['drawer.description', 'drawer.labels'])
  const collaboration = markup.slice(
    markup.indexOf('id="drawer-panel-collaboration"'),
    markup.indexOf('id="drawer-panel-activity"'),
  )
  const collaborationOrder = [...collaboration.matchAll(
    /data-i18n="(drawer\.(?:links|blocker|question|attachments|comments|actions))"/g,
  )].map((match) => match[1])
  assert.deepEqual(collaborationOrder, [
    'drawer.links',
    'drawer.blocker',
    'drawer.question',
    'drawer.attachments',
    'drawer.comments',
    'drawer.actions',
  ])
  // Version and updated time move to a quiet meta line in the header, not the grid.
  assert.doesNotMatch(details, /id="attr-version"/)
  assert.match(markup, /<p class="drawer-meta">\s*<span id="drawer-version">Version 1<\/span>\s*<span id="drawer-updated-meta"><\/span>/)
  assert.match(script, /drawerVersion\.textContent = t\('drawer\.version', \{ n: task\.version \}\)/)
  assert.match(script, /drawerUpdatedMeta\.textContent = t\('drawer\.updatedMeta'/)
  assert.match(script, /attrStatus\.value = task\.status \|\| 'backlog'/)
  assert.match(script, /attrUpdated\.textContent = formatTime\(task\.updatedAt\)/)
  assert.match(script, /attrCreated\.textContent = formatTime\(task\.createdAt\)/)
})

test('column headings stay English in both locales while statuses are localized', () => {
  for (const [key, value] of Object.entries({
    'columns.backlog': 'Backlog',
    'columns.running': 'Running',
    'columns.needs': 'Needs you',
    'columns.done': 'Done',
  })) {
    assert.equal(STRINGS.en[key], value)
    assert.equal(STRINGS.zh[key], value)
  }
  assert.equal(STRINGS.zh['status.backlog'], '待立项')
  assert.equal(STRINGS.zh['status.in_progress'], '处理中')
  assert.equal(STRINGS.zh['filter.archived'], '显示已归档')
})

test('the drawer takes focus, restores it and supports the ?task= deep link', () => {
  assert.match(script, /drawerClose\.focus\(/)
  assert.match(script, /state\.focusReturn = document\.activeElement/)
  assert.match(script, /function cardForTask\(id\)/)
  assert.match(script, /target\.focus\(\{ preventScroll: true \}\)/)
  assert.match(script, /new URLSearchParams\(window\.location\.search\)\.get\('task'\)/)
  assert.match(script, /pendingTaskRef: readTaskRef\(\)/)
  assert.match(script, /function openDeepLink\(\)/)
  assert.match(script, /event\.key === 'Escape'/)
})

test('the drawer is split into three tabs with keyboard navigation and a footer shared by every tab', () => {
  const tabs = [...markup.matchAll(/data-drawer-tab="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(tabs, ['details', 'collaboration', 'activity'])
  assert.match(markup, /role="tablist"/)
  assert.match(markup, /id="drawer-tab-details"[^>]*role="tab"[^>]*aria-selected="true"/)
  for (const id of ['details', 'collaboration', 'activity']) {
    assert.match(markup, new RegExp(`id="drawer-tab-${id}"`))
    assert.match(markup, new RegExp(`aria-controls="drawer-panel-${id}"`))
  }
  const panels = [...markup.matchAll(/data-tab-panel="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(panels, ['details', 'collaboration', 'activity'])
  assert.match(markup, /id="drawer-panel-collaboration"[^>]*hidden/)
  assert.match(markup, /id="drawer-panel-activity"[^>]*hidden/)
  // The details panel owns the editable metadata.
  const details = markup.slice(
    markup.indexOf('id="drawer-panel-details"'),
    markup.indexOf('id="drawer-panel-collaboration"'),
  )
  for (const id of ['edit-title', 'attr-status', 'edit-priority', 'attr-assignee', 'attr-updated', 'attr-created', 'edit-description', 'edit-labels']) {
    assert.ok(details.includes(`id="${id}"`), `${id} lives in the details tab`)
  }
  // Collaboration owns links, blocker, question, attachments, comments and secondary actions.
  const collaboration = markup.slice(
    markup.indexOf('id="drawer-panel-collaboration"'),
    markup.indexOf('id="drawer-panel-activity"'),
  )
  for (const id of ['edit-links', 'blocker-section', 'question-section', 'attachment-list', 'comment-list', 'move-actions', 'ask-task']) {
    assert.ok(collaboration.includes(`id="${id}"`), `${id} lives in the collaboration tab`)
  }
  const activity = markup.slice(
    markup.indexOf('id="drawer-panel-activity"'),
    markup.indexOf('id="drawer-footer"'),
  )
  assert.ok(activity.includes('id="activity-list"'))
  // The footer sits outside the tab panels, so save/archive/restore never hide with a tab.
  assert.ok(markup.indexOf('id="drawer-footer"') > markup.indexOf('id="drawer-panel-activity"'))
  assert.match(markup, /\.drawer-body \{[^}]*flex: 1 1 auto;[^}]*min-height: 0;/)
  const footer = markup.slice(markup.indexOf('id="drawer-footer"'))
  assert.match(footer, /id="save-task"/)
  assert.match(footer, /id="archive-task"/)
  assert.match(footer, /id="restore-task"/)
  assert.match(script, /function setDrawerTab\(name, focusTab\)/)
  assert.match(script, /state\.drawerTab = needsDecision \? 'collaboration' : 'details'/)
  assert.match(script, /drawerPanels\[j\]\.hidden = /)
  assert.match(script, /tab\.setAttribute\('aria-selected'/)
  assert.match(script, /event\.key === 'ArrowLeft'/)
  assert.match(script, /event\.key === 'ArrowRight'/)
  assert.match(script, /setDrawerTab\(order\[next\], true\)/)
  assert.equal(STRINGS.zh['drawer.details'], '详情')
  assert.equal(STRINGS.zh['drawer.collaboration'], '协作')
  assert.equal(STRINGS.zh['drawer.activity'], '动态')
})

test('the drawer has a sticky footer whose save button waits for unsaved changes', () => {
  assert.match(markup, /<footer class="drawer-footer" id="drawer-footer">/)
  assert.match(markup, /\.drawer-footer \{[^}]*position: sticky;[^}]*bottom: 0;/)
  assert.match(markup, /<span class="drawer-dirty" id="drawer-dirty"[^>]*hidden>/)
  assert.match(markup, /<span class="dirty-dot" aria-hidden="true"><\/span>/)
  assert.match(markup, /<button id="save-task"[^>]*disabled>Save changes<\/button>/)
  assert.match(markup, /<button id="archive-task"[^>]*data-i18n="drawer\.archive"/)
  assert.match(markup, /<button id="restore-task"[^>]*data-i18n="drawer\.restore"/)
  assert.match(script, /function syncDirty\(\)/)
  assert.match(script, /function isDrawerDirty\(task\)/)
  assert.match(script, /saveTaskButton\.disabled = !task \|\| !dirty \|\| !isWritable\(task\)/)
  assert.match(script, /drawerDirty\.hidden = !dirty/)
  assert.match(script, /drawerFooter\.classList\.toggle\('dirty', dirty\)/)
  assert.match(script, /drawer\.addEventListener\('input', syncDirty\)/)
  assert.match(script, /drawer\.addEventListener\('change', syncDirty\)/)
  // The old inline save action row is gone.
  assert.doesNotMatch(markup, /<div class="actions">\s*<button id="save-task"/)
})

test('below 600px the drawer is full width and the three tabs stay reachable', () => {
  const compact = markup.split('@media (max-width: 600px)')[1].split('@media (prefers-reduced-motion')[0]
  assert.match(compact, /aside\.drawer \{ width: 100%; border-left: 0; \}/)
  assert.match(compact, /\.attr-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/)
  assert.match(compact, /\.drawer-tabs \{ padding: 0 16px; \}/)
  const tabs = [...markup.matchAll(/data-drawer-tab="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(tabs, ['details', 'collaboration', 'activity'])
})

test('the density scale gives cards room while keeping the fold', () => {
  assert.match(markup, /min-height: 56px/)
  assert.match(markup, /padding: 9px 24px/)
  assert.match(markup, /section\.column \{[^}]*gap: 8px/)
  assert.match(markup, /section\.column \{[^}]*padding: 10px/)
  assert.match(markup, /article\.card \{[^}]*gap: 8px/)
  assert.match(markup, /article\.card \{[^}]*padding: 14px/)
  assert.match(markup, /\.board \{[^}]*gap: 14px/)
  assert.match(markup, /\.cards \{ display: flex; flex-direction: column; gap: 12px; \}/)
  assert.match(markup, /\.chip \{[^}]*height: 22px/)
  assert.match(markup, /\.chip \{[^}]*font-size: 12px/)
  assert.match(markup, /\.card-footer \{[^}]*padding-top: 7px/)
})

test('active filters surface as a summary row and a toolbar badge', () => {
  assert.match(markup, /<div class="filter-summary" id="filter-summary"[^>]*hidden>/)
  assert.match(markup, /<div class="filter-chips" id="filter-chips">/)
  assert.match(markup, /<button id="filter-clear-all"[^>]*data-i18n="filter\.clearAll"/)
  assert.match(markup, /<span class="filter-badge" id="filter-badge"[^>]*hidden>/)
  assert.match(markup, /#filter-toggle\.active \{/)
  assert.match(script, /function renderFilterSummary\(\)/)
  assert.match(script, /function activeFilterCount\(\)/)
  assert.match(script, /function addFilterChip\(kind, value, label\)/)
  assert.match(script, /chip\.appendChild\(el\('span', 'filter-chip-x', '×'\)\)/)
  assert.match(script, /filterSummary\.hidden = count === 0/)
  assert.match(script, /filterBadge\.hidden = count === 0/)
  assert.match(script, /filterBadge\.textContent = String\(count\)/)
  assert.match(script, /filterToggle\.classList\.toggle\('active', count > 0\)/)
  assert.match(script, /function removeFilter\(kind\)/)
  assert.equal(STRINGS.zh['filter.clearAll'], '清除全部')
  assert.equal(STRINGS.zh['filter.emptyTitle'], '没有任务匹配当前筛选')
})

test('the board meta reports visible / total tasks only while filtering', () => {
  assert.match(script, /counts\.textContent = filtered\s*\n?\s*\? t\('counts\.filteredTasks', \{ visible: totals\.visible, total: totals\.total \}\)/)
  assert.match(script, /: t\('counts\.tasks', \{ n: totals\.total \}\)/)
  assert.equal(STRINGS.en['counts.filteredTasks'], '{visible} / {total} tasks')
  assert.equal(STRINGS.zh['counts.filteredTasks'], '{visible} / {total} 个任务')
  // With no filter the old single-total copy is kept.
  assert.match(STRINGS.zh['counts.tasks'], /^\{n\} 个任务$/)
})

test('a filtered empty board renders one board-level empty state and hides create controls', () => {
  assert.match(markup, /<div class="board-empty" id="board-empty" role="status" hidden>/)
  assert.match(markup, /<button id="board-empty-clear"[^>]*data-i18n="filter\.clear"/)
  assert.equal((markup.match(/class="board-empty"/g) || []).length, 1)
  assert.match(markup, /main\.board\.empty-filtered section\.column \{ display: none; \}/)
  assert.match(script, /var emptyFiltered = filtered && totals\.visible === 0/)
  assert.match(script, /boardEmpty\.hidden = !emptyFiltered/)
  assert.match(script, /board\.classList\.toggle\('empty-filtered', emptyFiltered\)/)
  assert.match(script, /empty\.hidden = columnTasks\.length > 0 \|\| emptyFiltered/)
  assert.match(script, /creates\[c\]\.hidden = filtered/)
  assert.match(script, /foot\.hidden = filtered/)
  assert.match(script, /boardEmptyClear\.addEventListener\('click', clearAllFilters\)/)
  assert.match(script, /function clearAllFilters\(\)/)
  assert.match(STRINGS.en['filter.none'], /Clear the filters/)
  assert.match(STRINGS.zh['filter.none'], /清除筛选/)
})

test('keyboard reorder, focus trap and archived toggle state are wired', () => {
  assert.match(script, /event\.altKey && \(event\.key === 'ArrowUp' \|\| event\.key === 'ArrowDown'\)/)
  assert.match(script, /action: 'task\.reorder'/)
  assert.match(script, /drawer\.addEventListener\('keydown'/)
  assert.match(script, /event\.key !== 'Tab'/)
  assert.match(script, /'filter\.hideArchived'/)
  assert.match(script, /syncArchivedToggle/)
  assert.match(script, /archivedToggle\.setAttribute\('aria-pressed'/)
})

// --- UX batch C -----------------------------------------------------------

test('the drawer status control is a real six-status select wired to the move api', () => {
  assert.match(markup, /<select id="attr-status"[^>]*data-write/)
  for (const status of ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled']) {
    assert.match(
      markup,
      new RegExp(`<option value="${status}" data-i18n="status\\.${status}"`),
      `${status} is a stored status option`,
    )
  }
  assert.match(markup, /<label for="attr-status" data-i18n="drawer\.statusLabel">Status<\/label>/)
  assert.match(script, /function changeStatus\(\)/)
  assert.match(script, /act\('task\.move', \{ id: task\.id, version: task\.version, to: next \}\)/)
  assert.match(script, /attrStatus\.addEventListener\('change', changeStatus\)/)
  assert.match(script, /t\('drawer\.statusChanged'/)
  // The move band survives as the secondary route to the same action.
  assert.match(script, /function renderMoveActions\(task\)/)
  assert.equal(STRINGS.zh['drawer.statusChanged'], '状态已改为{status}')
})

test('question options align a 16px radio next to a 28px row in both surfaces', () => {
  assert.match(markup, /\.question-option,\s*\n\s*\.option \{\s*\n\s*display: grid; grid-template-columns: 16px minmax\(0, 1fr\);/)
  assert.match(markup, /\.question-option,\s*\n\s*\.option \{[^}]*min-height: 28px/)
  assert.match(markup, /\.question-option input\[type="radio"\],\s*\n\s*\.option input\[type="radio"\] \{/)
  assert.match(markup, /width: 16px; height: 16px; margin: 0; margin-top: 2px;/)
  assert.match(markup, /\.question-option:has\(input:checked\)/)
  assert.match(markup, /\.option:has\(input:checked\)/)
  assert.match(script, /el\('span', 'option-label', option\.label\)/)
  assert.match(script, /questionTemplate\.content/)
})

test('native browser chrome is replaced with styled selects, a dropzone and a confirm sheet', () => {
  assert.ok((markup.match(/class="select-field"/g) || []).length >= 5)
  assert.ok((markup.match(/class="select-chevron"/g) || []).length >= 5)
  assert.match(markup, /\.select-trigger \{[^}]*height: 40px/)
  assert.match(markup, /\.select-menu \{/)
  assert.match(markup, /\.select-option\.selected/)
  assert.equal((markup.match(/role="combobox"/g) || []).length, 5)
  assert.equal((markup.match(/role="listbox"/g) || []).length, 5)
  assert.match(script, /function setupSelectFields\(\)/)
  assert.match(script, /function handleSelectKeydown\(event, field\)/)
  assert.match(script, /function typeAheadSelect\(field, char\)/)
  assert.match(script, /trigger\.setAttribute\('aria-activedescendant'/)
  assert.match(script, /trigger\.removeAttribute\('aria-activedescendant'\)/)
  assert.match(script, /event\.key === 'ArrowDown' \|\| event\.key === 'ArrowUp'/)
  assert.match(script, /event\.key === 'Enter'/)
  assert.match(script, /event\.key === 'Escape'/)
  for (const id of ['filter-priority', 'filter-label', 'filter-assignee', 'edit-priority']) {
    assert.match(markup, new RegExp(`data-select-field>\\s*<select id="${id}"`), `${id} sits in a styled field`)
  }
  // The file input is hidden behind a dashed dropzone with an explicit button.
  assert.match(markup, /<div class="dropzone" id="attachment-dropzone">/)
  assert.match(markup, /<button class="dropzone-button" id="attachment-browse" type="button" data-i18n="drawer\.chooseFile">Choose file<\/button>/)
  assert.match(markup, /<input id="attachment-input" type="file" data-write hidden \/>/)
  assert.match(markup, /<p class="dropzone-file" id="attachment-filename" hidden><\/p>/)
  assert.match(markup, /\.dropzone\.dragover/)
  assert.match(script, /uploadAttachment\(dropped\)/)
  assert.match(script, /setAttachmentFilename\(file\.name\)/)
  assert.match(script, /file\.size > MAX_ATTACHMENT_BYTES/)
  assert.match(script, /attachmentError\.textContent = t\('drawer\.attachmentTooLarge'\)/)
  // The confirm sheet replaces native confirmation for archive and restore.
  assert.match(markup, /<div class="confirm-sheet" id="confirm-sheet" role="alertdialog" aria-modal="true"/)
  assert.match(markup, /<h2 id="confirm-title"><\/h2>/)
  assert.match(markup, /<p class="confirm-target" id="confirm-target"><\/p>/)
  assert.match(markup, /<button id="confirm-cancel"[^>]*data-i18n="confirm\.cancel">Cancel<\/button>/)
  assert.match(markup, /<button id="confirm-ok" class="danger-solid" type="button"><\/button>/)
  assert.match(markup, /#confirm-ok\.danger-solid \{[^}]*background: light-dark\(#b42318/)
  assert.match(script, /function openConfirm\(options\)/)
  assert.match(script, /function closeConfirm\(\)/)
  assert.match(script, /function confirmAccept\(\)/)
  assert.match(script, /confirmCancel\.focus\(/)
  assert.match(script, /if \(event\.key === 'Tab'\) trapFocus\(confirmSheet, event\)/)
  assert.match(script, /t\('confirm\.archiveTaskTitle'\)/)
  assert.match(script, /t\('confirm\.archiveProjectTitle'\)/)
  assert.match(script, /t\('confirm\.restoreTaskTitle'\)/)
  assert.match(script, /t\('confirm\.restoreProjectTitle'\)/)
  assert.equal(STRINGS.zh['confirm.archive'], '确认归档')
  assert.equal(STRINGS.zh['confirm.cancel'], '取消')
})

test('sub-minute ages read just now and card dwell time is labelled', () => {
  assert.equal(STRINGS.zh['age.justNow'], '刚刚')
  assert.equal(STRINGS.en['age.justNow'], 'just now')
  assert.match(script, /if \(seconds < 60\) return \{ justNow: true, value: '' \}/)
  assert.match(script, /function agoText\(iso\)/)
  assert.match(script, /function updatedText\(iso\)/)
  assert.match(script, /function dwellText\(iso\)/)
  assert.match(script, /parts\.justNow \? t\('card\.updatedJustNow'\)/)
  assert.match(script, /parts\.justNow \? t\('card\.dwellJustNow'\)/)
  assert.match(script, /t\('card\.dwellLabel'/)
  assert.match(script, /' · ' \+ dwellText\(elapsed\)/)
  assert.equal(STRINGS.zh['card.dwellLabel'], '已停留 {time}')
  assert.equal(STRINGS.zh['card.updatedJustNow'], '刚刚更新')
  assert.equal(STRINGS.zh['card.updatedAgo'], '更新于 {time}前')
})

test('card metrics and empty-state copy meet the contrast floor', () => {
  assert.match(markup, /\.card-metrics \.metric \{[^}]*color: light-dark\(#6b7280, #9aa4b2\);[^}]*font-size: 12px/)
  assert.match(markup, /\.card-dwell \{[^}]*color: light-dark\(#6b7280, #9aa4b2\);[^}]*font-size: 12px/)
  assert.match(markup, /\.card-metrics \{[^}]*color: light-dark\(#6b7280, #9aa4b2\);[^}]*font-size: 12px/)
  assert.match(markup, /\.column-empty \{[^}]*color: light-dark\(#4b5563, #aab4c2\)/)
  assert.match(markup, /\.board-empty p \{[^}]*color: light-dark\(#4b5563, #aab4c2\)/)
  // Zero counts stay omitted.
  assert.match(script, /if \(count > 0\) metrics\.appendChild\(metric\(name, count/)
})

test('Escape clears or blurs the search before closing the topmost layer', () => {
  const keydown = script.slice(script.indexOf("document.addEventListener('keydown'"))
  const escape = keydown.slice(
    keydown.indexOf("if (event.key === 'Escape')"),
    keydown.indexOf("if (event.ctrlKey || event.metaKey || event.altKey) return;"),
  )
  assert.match(escape, /if \(!confirmSheet\.hidden\) \{\s*closeConfirm\(\);/)
  assert.match(escape, /if \(document\.activeElement === searchInput\) \{/)
  assert.match(escape, /if \(searchInput\.value\) \{/)
  assert.match(escape, /state\.search = '';/)
  assert.match(escape, /searchInput\.value = '';/)
  assert.match(escape, /searchInput\.blur\(\);/)
  assert.ok(escape.indexOf('closeConfirm()') < escape.indexOf('closeDrawer()'), 'confirm sheet outranks the drawer')
  assert.ok(escape.indexOf('searchInput.blur()') < escape.indexOf('closeDrawer()'), 'search blur outranks the drawer')
  // The advertised chain / -> Esc -> n stays intact.
  assert.match(keydown, /if \(event\.key === '\/'\)/)
  assert.match(keydown, /searchInput\.focus\(\)/)
  assert.match(keydown, /if \(event\.key === 'n' \|\| event\.key === 'N'\)/)
  assert.match(keydown, /openNewTask\(\)/)
  assert.match(STRINGS.zh['shortcuts.hint'], /Esc.*n 新建任务/)
  assert.match(STRINGS.en['shortcuts.hint'], /Esc.*n for a new task/)
})

// --- UX batch D -----------------------------------------------------------

test('no native prompt or confirm survives; decisions, questions, blockers and renames use dialogs', () => {
  assert.doesNotMatch(script, /window\.prompt\(/)
  assert.doesNotMatch(script, /window\.confirm\(/)
  for (const id of ['decision-dialog', 'ask-dialog', 'block-dialog', 'rename-project-dialog']) {
    assert.match(markup, new RegExp(`<dialog id="${id}"`), `${id} is an in-product modal`)
  }
  // Approve / reject: one note textarea with cancel, confirm approve and destructive confirm reject.
  assert.match(markup, /<textarea id="decision-note"/)
  assert.match(markup, /id="decision-cancel"[^>]*data-i18n="decision\.cancel"/)
  assert.match(markup, /id="decision-approve"[^>]*data-i18n="decision\.approve"/)
  assert.match(markup, /id="decision-reject" class="danger-outline"[^>]*data-i18n="decision\.reject"/)
  assert.match(markup, /id="decision-question"/)
  assert.match(markup, /id="decision-answer"/)
  assert.equal(STRINGS.zh['decision.cancel'], '取消')
  assert.equal(STRINGS.zh['decision.approve'], '确认批准')
  assert.equal(STRINGS.zh['decision.reject'], '确认驳回')
  assert.match(script, /note: decisionNote\.value/)
  // Ask: a question textarea plus 2–5 label/detail option rows with add, remove and validation.
  assert.match(markup, /<textarea id="ask-prompt"/)
  assert.match(markup, /<div class="ask-options" id="ask-options">/)
  assert.match(markup, /id="ask-add-option"[^>]*data-i18n="ask\.addOption"/)
  assert.match(markup, /id="ask-error"[^>]*role="alert"/)
  assert.match(script, /var MIN_ASK_OPTIONS = 2/)
  assert.match(script, /var MAX_ASK_OPTIONS = 5/)
  assert.match(script, /function appendAskOption\(option, focus\)/)
  assert.match(script, /function refreshAskControls\(\)/)
  assert.match(script, /function submitAsk\(\)/)
  assert.match(script, /label\.className = 'ask-option-label'/)
  assert.match(script, /detail\.className = 'ask-option-detail'/)
  assert.match(script, /options\.length < MIN_ASK_OPTIONS \|\| options\.length > MAX_ASK_OPTIONS/)
  assert.match(script, /askError\.textContent = t\('ask\.optionsRange'\)/)
  // Block: a required reason textarea.
  assert.match(markup, /<textarea id="block-reason"/)
  assert.match(script, /function submitBlock\(\)/)
  assert.match(script, /blockReasonInput\.value\.trim\(\)/)
  assert.match(script, /blockError\.textContent = t\('drawer\.blockReasonRequired'\)/)
  // Rename: name and prefix fields wired to project.update.
  assert.match(markup, /<input id="rename-name"/)
  assert.match(markup, /<input id="rename-prefix"/)
  assert.match(script, /function submitRename\(\)/)
  assert.match(script, /act\('project\.update', payload\)/)
  assert.match(script, /renameError\.textContent = t\('rename\.prefixInvalid'\)/)
  // Every new dialog closes on Escape before the drawer.
  for (const name of ['decisionDialog', 'askDialog', 'blockDialog', 'renameDialog']) {
    assert.match(script, new RegExp(`if \\(${name}\\.open\\) \\{\\s*${name}\\.close\\(\\);`))
  }
})

test('styled selects type ahead, track the active option and truncate only in the trigger', () => {
  assert.match(script, /field\._typeBuffer/)
  assert.match(script, /field\._typeTimer/)
  assert.match(script, /function typeAheadSelect\(field, char\)/)
  assert.match(script, /label\.indexOf\(buffer\) === 0/)
  assert.match(script, /setActiveSelectOption\(field, match, true\)/)
  assert.match(script, /aria-autocomplete', 'list'/)
  assert.match(script, /item\.id = \(select\.id \|\| 'select'\) \+ '-option-' \+ i/)
  assert.match(script, /trigger\.setAttribute\('aria-activedescendant'/)
  assert.match(script, /trigger\.title = selected \? selected\.textContent : ''/)
  assert.match(markup, /\.select-value \{[^}]*text-overflow: ellipsis;[^}]*white-space: nowrap;/)
  assert.match(markup, /\.select-option \{[^}]*overflow-wrap: anywhere;/)
  assert.match(markup, /\.select-option\.active \{/)
})

test('relative times follow the server clock and future timestamps clamp to just now', () => {
  assert.match(script, /skew: 0/)
  assert.match(script, /function nowMs\(\)/)
  assert.match(script, /return Date\.now\(\) - \(state\.skew \|\| 0\)/)
  assert.match(script, /function applyServerTime\(payload\)/)
  assert.match(script, /if \(!payload \|\| typeof payload\.serverNow !== 'string'\) return/)
  assert.match(script, /state\.skew = Date\.now\(\) - parsed/)
  assert.match(script, /applyServerTime\(payload\)/)
  assert.match(script, /Math\.max\(0, Math\.round\(\(nowMs\(\) - then\) \/ 1000\)\)/)
  assert.match(script, /var now = new Date\(nowMs\(\)\)/)
  assert.equal(STRINGS.zh['age.justNow'], '刚刚')
  assert.equal(STRINGS.en['age.justNow'], 'just now')
})

// --- UX batch E -----------------------------------------------------------

test('a pending decision opens the drawer on collaboration with a tab badge and header context', () => {
  const collabTab = markup.slice(
    markup.indexOf('id="drawer-tab-collaboration"'),
    markup.indexOf('id="drawer-tab-activity"'),
  )
  assert.match(collabTab, /id="drawer-tab-badge"[^>]*aria-hidden="true"[^>]*hidden>1<\/span>/)
  assert.match(markup, /id="drawer-status-chip"/)
  assert.match(markup, /id="drawer-pending" hidden/)
  assert.ok(markup.indexOf('id="drawer-status-chip"') < markup.indexOf('class="drawer-tabs"'), 'status chip lives in the head')
  assert.ok(markup.indexOf('id="drawer-pending"') < markup.indexOf('class="drawer-tabs"'), 'pending line lives in the head')
  assert.match(script, /var needsDecision = Boolean\(\(task\.pendingQuestion && !task\.questionResolution\) \|\| task\.blockedReason\)/)
  assert.match(script, /state\.drawerTab = needsDecision \? 'collaboration' : 'details'/)
  assert.match(script, /setDrawerTab\(state\.drawerTab, false\)/)
  assert.match(script, /drawerStatusChip\.textContent = t\('status\.' \+ \(task\.status \|\| 'backlog'\)\)/)
  assert.match(script, /function syncDrawerAttention\(task, pendingQuestion\)/)
  assert.match(script, /drawerTabBadge\.hidden = !needsDecision/)
  assert.match(script, /drawerTabBadge\.textContent = '1'/)
  assert.match(script, /drawerPendingLine\.textContent = t\('drawer\.pendingQuestionLine', \{/)
  assert.match(script, /drawerPendingLine\.textContent = t\('drawer\.pendingBlockedLine', \{ reason: task\.blockedReason \}\)/)
  // The base layout has no badge; setDrawerTab never touches it, so it survives tab switches.
  const setTab = script.slice(script.indexOf('function setDrawerTab'), script.indexOf('function syncDrawerLayout'))
  assert.doesNotMatch(setTab, /drawerTabBadge/)
  assert.equal(STRINGS.zh['drawer.pendingQuestionLine'], '需要你回答：{prompt}')
  assert.equal(STRINGS.zh['drawer.pendingBlockedLine'], '受阻：{reason}')
})

test('the decision dialog shows question and answer and promotes the chosen decision', () => {
  const dialog = markup.slice(
    markup.indexOf('<dialog id="decision-dialog"'),
    markup.indexOf('<dialog id="ask-dialog"'),
  )
  assert.match(dialog, /data-i18n="decision\.questionLabel"/)
  assert.match(dialog, /data-i18n="decision\.answerLabel"/)
  assert.match(dialog, /id="decision-question"/)
  assert.match(dialog, /id="decision-answer"/)
  assert.ok(dialog.indexOf('id="decision-question"') < dialog.indexOf('id="decision-note"'), 'answer block sits above the note')
  assert.match(script, /decisionQuestion\.textContent = pending\.prompt \|\| t\('drawer\.review'\)/)
  assert.match(script, /decisionAnswer\.textContent = answer \|\| t\('decision\.noAnswer'\)/)
  assert.match(script, /function applyDecisionEmphasis\(kind\)/)
  assert.match(script, /decisionApprove\.className = 'primary'/)
  assert.match(script, /decisionReject\.className = 'danger-outline'/)
  assert.match(script, /decisionApprove\.className = 'outline-neutral'/)
  assert.match(script, /decisionReject\.className = 'danger-solid'/)
  assert.match(markup, /#decision-approve\.primary \{[^}]*background: light-dark\(#111827/)
  assert.match(markup, /#decision-reject\.danger-solid \{[^}]*background: light-dark\(#b42318/)
  assert.match(markup, /#decision-reject\.danger-outline \{[^}]*color: var\(--danger\)/)
  assert.match(markup, /#decision-dialog \.dialog-actions #decision-approve,[\s\S]*?#decision-reject \{ min-width: 88px; \}/)
  assert.ok(STRINGS.zh['decision.noAnswer'] === '尚未选择')
})

test('the topbar reports the needs-you count beside running and mutes it at zero', () => {
  assert.ok(markup.indexOf('id="running-count"') < markup.indexOf('id="needs-count"'), 'needs count follows running')
  assert.match(markup, /<span class="needs-dot" aria-hidden="true"><\/span><span id="needs-count">0 needs you<\/span>/)
  assert.match(script, /var needs = columnCounts\.needs \|\| 0/)
  assert.match(script, /needsCount\.textContent = t\('counts\.needs', \{ n: needs \}\)/)
  assert.match(script, /needsChip\.setAttribute\('data-empty', needs === 0 \? 'true' : 'false'\)/)
  assert.match(markup, /\.needs-chip \{[^}]*color: var\(--warn\)/)
  assert.match(markup, /\.needs-chip\[data-empty="true"\] \{ color: var\(--muted-soft\)/)
  assert.match(markup, /\.needs-dot \{[^}]*background: var\(--warn\)/)
  assert.equal(STRINGS.zh['counts.needs'], '{n} 需要你')
})

test('the filter summary stays a compact inline strip and hides every create control while filtering', () => {
  const summary = markup.match(/\.filter-summary \{[^}]*\}/)[0]
  assert.match(summary, /width: fit-content/)
  assert.match(summary, /height: 32px/)
  assert.match(summary, /background: transparent/)
  assert.match(summary, /flex-wrap: nowrap/)
  assert.doesNotMatch(summary, /background: var\(--surface\)/)
  assert.match(markup, /\.filter-chips \{[^}]*flex-wrap: nowrap/)
  assert.match(markup, /#filter-clear-all \{[^}]*margin-left: 2px/)
  assert.doesNotMatch(markup, /#filter-clear-all \{[^}]*margin-left: auto/)
  // Any active filter hides both the lane + and the footer 新建卡片.
  assert.match(script, /creates\[c\]\.hidden = filtered/)
  assert.match(script, /foot\.hidden = filtered/)
  assert.doesNotMatch(script, /creates\[c\]\.hidden = emptyFiltered/)
})

test('tag chips share the project chip border, radius and padding', () => {
  const tag = markup.match(/\.chip\.tag \{[^}]*\}/)[0]
  assert.match(tag, /padding: 0 7px/)
  assert.match(tag, /border: 1px solid var\(--border-strong\)/)
  assert.match(tag, /border-radius: 6px/)
  assert.match(tag, /color: var\(--muted\)/)
  assert.match(markup, /--border-strong: light-dark\(#cfd4dc/)
})

test('the keyboard hint is a 24px sticky bar that hides on mobile', () => {
  const hint = markup.match(/\.shortcuts \{[^}]*\}/)[0]
  assert.match(hint, /position: fixed/)
  assert.match(hint, /bottom: 0/)
  assert.match(hint, /height: 24px/)
  assert.match(hint, /border-top: 1px solid var\(--border\)/)
  const compact = markup.split('@media (max-width: 720px)')[1].split('@media (prefers-reduced-motion')[0]
  assert.match(compact, /\.shortcuts \{ display: none; \}/)
  assert.match(markup, /<footer class="shortcuts hint"/)
})

test('drawer tabs are 44px tall with 16px padding and keep the badge inside 协作', () => {
  const tab = markup.match(/\.drawer-tab \{[^}]*\}/)[0]
  assert.match(tab, /min-width: 72px/)
  assert.match(tab, /height: 44px/)
  assert.match(tab, /padding: 0 16px/)
  assert.match(tab, /border-bottom: 2px solid transparent/)
  assert.match(markup, /\.drawer-tab\[aria-selected="true"\] \{[^}]*border-bottom-color/)
  const collabTab = markup.slice(
    markup.indexOf('id="drawer-tab-collaboration"'),
    markup.indexOf('id="drawer-tab-activity"'),
  )
  assert.match(collabTab, /drawer-tab-badge/)
})

test('the details drawer sizes to content and only sticks the footer when it overflows', () => {
  assert.match(markup, /aside\.drawer\.drawer-fit \.drawer-body \{[^}]*flex: 0 0 auto/)
  assert.match(markup, /aside\.drawer\.drawer-fit \.drawer-footer \{ position: static; \}/)
  assert.match(markup, /aside\.drawer\.drawer-fit\.drawer-overflow \.drawer-body \{[^}]*flex: 1 1 auto/)
  assert.match(markup, /aside\.drawer\.drawer-fit\.drawer-overflow \.drawer-footer \{[^}]*position: sticky/)
  assert.match(script, /function syncDrawerLayout\(\)/)
  assert.match(script, /drawer\.classList\.toggle\('drawer-fit', details\)/)
  assert.match(script, /drawer\.classList\.add\('drawer-overflow'\)/)
  assert.match(script, /drawer\.setAttribute\('data-tab', name\)/)
})
