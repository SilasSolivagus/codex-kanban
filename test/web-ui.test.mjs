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
  assert.match(markup, /<button id="filter-toggle"[^>]*>Filters<\/button>/)
  assert.match(markup, /<select id="filter-priority"/)
  assert.match(markup, /<select id="filter-label"/)
  assert.match(markup, /<select id="filter-assignee"/)
  assert.match(markup, /<button id="lang-toggle"[^>]*>中文<\/button>/)
  assert.match(markup, /<button id="refresh"[^>]*aria-label="Refresh"/)
  assert.match(markup, /<button id="manage-projects"[^>]*>Projects<\/button>/)
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

test('activity feeds the latest twelve events with actor and relative time', () => {
  assert.match(script, /var latest = activity\.slice\(-12\)/)
  assert.match(script, /entry\.actor && entry\.actor\.name/)
  assert.match(script, /dwellLabel\(entry\.at\)/)
  assert.match(script, /entry\.summary \|\| entry\.kind/)
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

test('question options show label and detail, then answer, approve or reject with a note', () => {
  assert.match(script, /el\('span', 'option-label', option\.label\)/)
  assert.match(script, /option\.detail/)
  assert.match(script, /act\('task\.answer'/)
  assert.match(script, /var note = window\.prompt\(/)
  assert.match(script, /window\.confirm\(t\(confirmKey/)
  assert.match(script, /var action = kind === 'approve' \? 'task\.approve' : 'task\.reject'/)
  assert.match(script, /act\('task\.ask'/)
  assert.match(script, /options: options/)
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
  assert.match(script, /window\.confirm\(t\('project\.archiveConfirm'/)
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

  const attributes = ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria']
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

test('the card footer shows status, dwell time and the metric counts', () => {
  assert.match(markup, /\.card-dwell \{/)
  assert.match(script, /function taskStatusLabel\(task\)/)
  assert.match(script, /function taskElapsed\(task\)/)
  assert.match(script, /'card\.dwell'/)
  assert.match(script, /' · ' \+ t\('card\.dwell'/)
  assert.match(script, /task\.attentionSince/)
  assert.match(script, /pendingQuestion\.createdAt/)
  assert.match(script, /blockedSince \|\| task\.statusSince/)
  assert.match(script, /metric\('comment'/)
  assert.match(script, /metric\('attachment'/)
  assert.match(script, /metric\('link'/)
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
  for (const id of ['attr-status', 'attr-assignee', 'attr-updated', 'attr-created', 'attr-version']) {
    assert.match(markup, new RegExp(`id="${id}"`), `${id} is an attribute cell`)
  }
  const order = [...markup.matchAll(/data-i18n="(drawer\.(?:description|labels|links|blocker|question|attachments|comments|activity))"/g)]
    .map((match) => match[1])
  assert.deepEqual(order, [
    'drawer.description',
    'drawer.labels',
    'drawer.links',
    'drawer.blocker',
    'drawer.question',
    'drawer.attachments',
    'drawer.comments',
    'drawer.activity',
  ])
  assert.match(script, /attrStatus\.appendChild/)
  assert.match(script, /attrUpdated\.textContent = formatTime\(task\.updatedAt\)/)
  assert.match(script, /attrCreated\.textContent = formatTime\(task\.createdAt\)/)
  assert.match(script, /attrVersion\.textContent = String\(task\.version\)/)
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

test('the fold trims header, padding and gaps without cramping cards', () => {
  assert.match(markup, /min-height: 56px/)
  assert.match(markup, /padding: 9px 24px/)
  assert.match(markup, /section\.column \{[^}]*gap: 8px/)
  assert.match(markup, /section\.column \{[^}]*padding: 10px/)
  assert.match(markup, /article\.card \{[^}]*gap: 7px/)
  assert.match(markup, /article\.card \{[^}]*padding: 11px/)
  assert.match(markup, /\.cards \{ display: flex; flex-direction: column; gap: 8px; \}/)
  assert.match(markup, /\.card-footer \{[^}]*padding-top: 7px/)
})

test('filter and empty states tell the user how to clear the filters', () => {
  assert.match(STRINGS.en['filter.none'], /Clear the filters/)
  assert.match(STRINGS.zh['filter.none'], /清除筛选/)
  assert.match(script, /empty\.textContent = hasFilters\(\) \? t\('filter\.none'\) : t\('columns\.empty\.' \+ id\)/)
  assert.match(script, /function clearAllFilters\(\)/)
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
