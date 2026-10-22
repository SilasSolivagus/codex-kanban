import { COLUMNS, attentionReason, columnForTask, sortTasks } from './rules.mjs'

const MAX_COMMENTS = 5

const COLUMN_HINTS = {
  backlog: 'Not started yet.',
  running: 'Work in progress.',
  needs: 'Questions, blockers and reviews land here.',
  done: 'Shipped and closed.',
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * The board is a local file, so it must not contain a single network URL.
 * Strip the scheme from every string (links as well as free text), then render
 * links as plain text so a click can never leave the file.
 */
function clean(value) {
  return String(value ?? '').replace(/https?:\/\//gi, '')
}

function escapeHtml(value) {
  return clean(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/**
 * JSON.stringify output is embedded in a script tag. Escaping every `<` keeps
 * a title such as "</script><img onerror=x>" inside the JSON text; U+2028 and
 * U+2029 are escaped for older JavaScript parsers.
 */
function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function formatAge(iso, now = Date.now()) {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function statusLabel(status) {
  const text = clean(status).replace(/_/g, ' ')
  return text || 'unknown'
}

function attentionLabel(attention) {
  switch (attention) {
    case 'question':
      return 'Question'
    case 'blocked':
      return 'Blocked'
    case 'review':
      return 'Review'
    default:
      return ''
  }
}

function attentionDetail(task, attention) {
  switch (attention) {
    case 'question':
      return clean(task.pendingQuestion?.prompt)
    case 'blocked':
      return clean(task.blockedReason)
    case 'review':
      return 'Waiting for review'
    default:
      return ''
  }
}

function listOf(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function cleanNullable(value) {
  if (value === null || value === undefined) return null
  return clean(value)
}

function cardModel(task, now) {
  const attention = attentionReason(task)
  const question = task.pendingQuestion
    ? {
      prompt: clean(task.pendingQuestion.prompt),
      note: clean(task.pendingQuestion.note),
      selected: cleanNullable(task.pendingQuestion.selected),
      options: listOf(task.pendingQuestion.options).map((option) => ({
        id: clean(option.id),
        label: clean(option.label),
        detail: clean(option.detail),
      })),
      age: formatAge(task.pendingQuestion.createdAt, now),
    }
    : null
  const resolution = task.questionResolution
    ? {
      decision: clean(task.questionResolution.decision),
      optionId: clean(task.questionResolution.optionId),
      optionLabel: clean(task.questionResolution.optionLabel),
      note: clean(task.questionResolution.note),
    }
    : null

  return {
    id: clean(task.id),
    identifier: clean(task.identifier),
    title: clean(task.title),
    description: clean(task.description),
    status: clean(task.status),
    statusLabel: statusLabel(task.status),
    priority: clean(task.priority) || 'none',
    labels: listOf(task.labels).map(clean),
    assignee: task.assignee
      ? { type: clean(task.assignee.type), name: clean(task.assignee.name) }
      : null,
    attention,
    attentionLabel: attentionLabel(attention),
    attentionDetail: attentionDetail(task, attention),
    blockedReason: clean(task.blockedReason),
    blockedAge: task.blockedSince ? formatAge(task.blockedSince, now) : '',
    statusAge: formatAge(task.statusSince ?? task.updatedAt, now),
    question,
    resolution,
    links: listOf(task.links).map((link) => ({
      label: clean(link.label),
      url: clean(link.url),
    })),
    comments: listOf(task.comments)
      .slice(-MAX_COMMENTS)
      .map((comment) => ({
        author: clean(comment.author?.name) || 'someone',
        body: clean(comment.body),
        age: formatAge(comment.createdAt, now),
      })),
    version: typeof task.version === 'number' ? task.version : cleanNullable(task.version),
  }
}

/**
 * Embedded model for the board page. Columns are in product order
 * (Backlog, Running, Needs you, Done) and sorted with the shared rules.
 * Canceled tasks are hidden from the columns but stay in the payload so their
 * identifiers remain in the document.
 */
export function boardPayload(board, { now = Date.now() } = {}) {
  const tasks = Array.isArray(board?.tasks) ? board.tasks.filter(Boolean) : []
  const columns = COLUMNS.map((column) => ({
    id: column.id,
    label: column.label,
    tasks: tasks
      .filter((task) => columnForTask(task) === column.id)
      .sort(sortTasks)
      .map((task) => cardModel(task, now)),
  }))
  const canceled = tasks
    .filter((task) => task.status === 'canceled')
    .sort(sortTasks)
    .map((task) => ({
      id: clean(task.id),
      identifier: clean(task.identifier),
      title: clean(task.title),
    }))

  return {
    project: {
      name: clean(board?.project?.name),
      prefix: clean(board?.project?.prefix),
      createdAt: clean(board?.project?.createdAt),
    },
    generatedAt: new Date(now).toISOString(),
    columns,
    canceled,
  }
}

function displayTimestamp(iso) {
  return String(iso)
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ' UTC')
    .replace(/Z$/, ' UTC')
}

function columnShell(column) {
  const hint = COLUMN_HINTS[column.id] ?? 'No tasks.'
  return `      <section class="column" data-column="${column.id}" aria-labelledby="column-${column.id}">
        <header class="column-head">
          <h2 id="column-${column.id}">${escapeHtml(column.label)}</h2>
          <span class="count" data-count>${column.tasks.length}</span>
        </header>
        <div class="cards" data-cards></div>
        <p class="column-empty" data-empty>${escapeHtml(hint)}</p>
      </section>`
}

export function renderHtml(board, { now = Date.now() } = {}) {
  const payload = boardPayload(board, { now })
  const name = payload.project.name
  const pageTitle = name ? `Codex Kanban · ${name}` : 'Codex Kanban'
  const projectLabel = name || 'Untitled board'
  const total = payload.columns.reduce((sum, column) => sum + column.tasks.length, 0)
  const needs = payload.columns.find((column) => column.id === 'needs')?.tasks.length ?? 0
  const running = payload.columns.find((column) => column.id === 'running')?.tasks.length ?? 0
  const canceled = payload.canceled.length
  const stats = `${total} task${total === 1 ? '' : 's'} · ${needs} needs you · ${running} running · updated ${displayTimestamp(payload.generatedAt)}${canceled ? ` · ${canceled} canceled hidden` : ''}`
  const sections = payload.columns.map(columnShell).join('\n')
  const data = safeJson(payload)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: light-dark(#f3f5f8, #0b0f15);
      --surface: light-dark(#ffffff, #141b24);
      --surface-2: light-dark(#eef1f5, #1a2330);
      --border: light-dark(#dbe1e8, #2a3646);
      --text: light-dark(#101720, #e8eef6);
      --muted: light-dark(#5b6777, #93a2b4);
      --accent: light-dark(#2a63a8, #83b6f0);
      --accent-contrast: light-dark(#ffffff, #0a1220);
      --needs: light-dark(#996000, #f2c463);
      --danger: light-dark(#a93838, #f09a9a);
      --shadow: 0 1px 2px light-dark(rgba(16, 24, 40, 0.05), rgba(0, 0, 0, 0.45));
      --shadow-lg: 0 18px 50px light-dark(rgba(16, 24, 40, 0.16), rgba(0, 0, 0, 0.6));
      --radius: 14px;
      --radius-sm: 10px;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-size: 14px;
      line-height: 1.5;
    }
    body.drawer-open { overflow: hidden; }
    :where(button, a, [role="button"], [tabindex]):focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .skip-link {
      position: absolute;
      left: -9999px;
      top: 8px;
      z-index: 100;
      padding: 8px 14px;
      border-radius: 999px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      font-size: 12px;
      text-decoration: none;
    }
    .skip-link:focus { left: 12px; }
    .shell { max-width: 1280px; margin: 0 auto; padding: 24px clamp(14px, 2.6vw, 32px) 48px; }
    .board-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .eyebrow {
      margin: 0 0 3px;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .board-head h1 {
      margin: 0;
      font-size: clamp(20px, 2.6vw, 27px);
      font-weight: 680;
      line-height: 1.15;
      letter-spacing: -0.02em;
      overflow-wrap: anywhere;
    }
    .meta { margin: 7px 0 0; color: var(--muted); font-size: 12px; }
    .ghost {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      border-radius: 999px;
      padding: 6px 14px;
      font: inherit;
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      transition: color 120ms ease, border-color 120ms ease;
    }
    .ghost:hover {
      color: var(--text);
      border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
    }
    .board {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
    }
    .column {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 150px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface-2);
    }
    .column[data-column="needs"] {
      border-color: color-mix(in oklab, var(--needs) 50%, var(--border));
      background: color-mix(in oklab, var(--needs) 8%, var(--surface-2));
    }
    .column-head { display: flex; align-items: center; gap: 8px; padding: 2px 4px 0; }
    .column-head h2 {
      display: flex;
      align-items: center;
      gap: 7px;
      margin: 0;
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.075em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .column[data-column="needs"] .column-head h2 { color: var(--needs); }
    .column[data-column="needs"] .column-head h2::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--needs);
      box-shadow: 0 0 0 3px color-mix(in oklab, var(--needs) 22%, transparent);
    }
    .column-head .count {
      margin-left: auto;
      padding: 0 8px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
    .cards { display: flex; flex-direction: column; gap: 8px; }
    .column-empty { margin: 0; padding: 8px 4px 10px; color: var(--muted); font-size: 12px; }
    .column-empty[hidden] { display: none; }
    .card {
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding: 11px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
    }
    .card:hover {
      border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
      transform: translateY(-1px);
    }
    .card:active { transform: translateY(0); }
    .card-top { display: flex; align-items: center; gap: 8px; }
    .identifier {
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
    }
    .age { margin-left: auto; color: var(--muted); font-size: 11px; }
    .card-title {
      margin: 0;
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .badges { display: flex; flex-wrap: wrap; gap: 4px; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0 7px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--muted);
      font-size: 10.5px;
      line-height: 1.6;
      white-space: nowrap;
    }
    .badge.attention {
      color: var(--needs);
      border-color: color-mix(in oklab, var(--needs) 45%, var(--border));
      background: color-mix(in oklab, var(--needs) 12%, var(--surface));
    }
    .badge.priority-urgent, .badge.priority-high {
      color: var(--danger);
      border-color: color-mix(in oklab, var(--danger) 40%, var(--border));
    }
    .badge.status { color: var(--accent); }
    .card-note {
      display: -webkit-box;
      margin: 0;
      overflow: hidden;
      color: var(--muted);
      font-size: 12px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      overflow-wrap: anywhere;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: light-dark(rgba(15, 23, 42, 0.32), rgba(0, 0, 0, 0.62));
      opacity: 0;
      transition: opacity 180ms ease;
    }
    .backdrop.open { opacity: 1; }
    .backdrop[hidden] { display: none; }
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 41;
      display: flex;
      flex-direction: column;
      width: min(460px, 100%);
      border-left: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      transform: translateX(100%);
      transition: transform 200ms cubic-bezier(0.22, 0.8, 0.24, 1);
    }
    .drawer.open { transform: translateX(0); }
    .drawer[hidden] { display: none; }
    .drawer-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
    }
    .drawer-head h2 { margin: 0; font-size: 15px; font-weight: 650; letter-spacing: -0.01em; }
    .icon-button {
      appearance: none;
      padding: 3px 7px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }
    .icon-button:hover { background: var(--surface-2); color: var(--text); }
    .drawer-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 18px;
      overflow: auto;
      overscroll-behavior: contain;
    }
    .drawer-task { display: flex; flex-direction: column; gap: 7px; }
    .drawer-task-title {
      margin: 0;
      font-size: 17px;
      font-weight: 650;
      line-height: 1.3;
      letter-spacing: -0.01em;
      overflow-wrap: anywhere;
    }
    .drawer-section { display: flex; flex-direction: column; gap: 8px; }
    .drawer-section h4 {
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.075em;
      text-transform: uppercase;
    }
    .prose { margin: 0; font-size: 13px; overflow-wrap: anywhere; white-space: pre-wrap; }
    .hint { margin: 0; color: var(--muted); font-size: 11.5px; }
    .question {
      padding: 12px;
      border: 1px solid color-mix(in oklab, var(--needs) 38%, var(--border));
      border-radius: var(--radius-sm);
      background: color-mix(in oklab, var(--needs) 7%, var(--surface-2));
    }
    .blocked {
      padding: 12px;
      border: 1px solid color-mix(in oklab, var(--danger) 35%, var(--border));
      border-radius: var(--radius-sm);
      background: color-mix(in oklab, var(--danger) 6%, var(--surface-2));
    }
    .options { display: flex; flex-direction: column; gap: 6px; }
    .option {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 7px 9px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      font-size: 12.5px;
    }
    .option.selected { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .option-mark { color: var(--accent); line-height: 1.4; }
    .option-copy { display: flex; flex-direction: column; gap: 1px; overflow-wrap: anywhere; }
    .option-label { font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .action {
      appearance: none;
      padding: 7px 12px;
      border: 1px solid var(--border);
      border-radius: 9px;
      background: var(--surface-2);
      color: var(--text);
      font: inherit;
      font-size: 12px;
      font-weight: 550;
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease;
    }
    .action:hover {
      border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
      background: var(--surface);
    }
    .action.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-contrast);
    }
    .action.primary:hover { background: color-mix(in oklab, var(--accent) 86%, var(--text)); }
    .facts { display: grid; grid-template-columns: auto 1fr; gap: 5px 14px; margin: 0; font-size: 12px; }
    .facts dt { color: var(--muted); }
    .facts dd { margin: 0; overflow-wrap: anywhere; }
    .plain { display: flex; flex-direction: column; gap: 7px; margin: 0; padding: 0; list-style: none; }
    .plain li { font-size: 12.5px; overflow-wrap: anywhere; }
    .link-label { font-weight: 600; }
    .link-url { display: block; color: var(--muted); font-size: 11.5px; overflow-wrap: anywhere; }
    .comment { display: flex; flex-direction: column; gap: 1px; padding-left: 9px; border-left: 2px solid var(--border); }
    .comment-meta { color: var(--muted); font-size: 11px; }
    .toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      z-index: 50;
      max-width: min(90vw, 420px);
      padding: 9px 15px;
      border-radius: 999px;
      background: var(--text);
      color: var(--bg);
      box-shadow: var(--shadow-lg);
      font-size: 12px;
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, 10px);
      transition: opacity 160ms ease, transform 160ms ease;
    }
    .toast.show { opacity: 1; transform: translate(-50%, 0); }
    .noscript {
      margin: 14px 0 0;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      font-size: 12.5px;
    }
    .board-foot { margin-top: 18px; color: var(--muted); font-size: 11.5px; }
    .board-foot p { margin: 0; }
    @media (max-width: 900px) {
      .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .column { min-height: 0; }
    }
    @media (max-width: 560px) {
      .shell { padding: 16px 12px 36px; }
      .board { grid-template-columns: minmax(0, 1fr); }
      .drawer { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }
    }
    @media print {
      .head-actions, .backdrop, .drawer, .toast, .skip-link { display: none !important; }
      .shell { max-width: none; padding: 0; }
      .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .column, .card { break-inside: avoid; }
      .card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#board">Skip to board</a>
  <div class="shell">
    <header class="board-head">
      <div class="board-heading">
        <p class="eyebrow">Codex Kanban</p>
        <h1>${escapeHtml(projectLabel)}</h1>
        <p class="meta">${stats}</p>
      </div>
      <div class="head-actions">
        <button class="ghost" type="button" data-action="print">Print</button>
      </div>
    </header>
    <main class="board" id="board" aria-label="Kanban board">
${sections}
    </main>
    <noscript>
      <p class="noscript">This board needs JavaScript to draw its cards. The task data is embedded in the page.</p>
    </noscript>
    <footer class="board-foot">
      <p>Actions run through Codex. This file never writes to the board.</p>
    </footer>
  </div>
  <div class="backdrop" id="backdrop" hidden></div>
  <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true" hidden>
    <header class="drawer-head">
      <div>
        <p class="eyebrow">Task details</p>
        <h2 id="drawer-title">Task</h2>
      </div>
      <button class="icon-button" id="drawer-close" type="button" aria-label="Close task details">×</button>
    </header>
    <div class="drawer-body" id="drawer-body"></div>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script type="application/json" id="board-data">${data}</script>
  <script>
(function () {
  'use strict';

  var dataNode = document.getElementById('board-data');
  var fallback = { columns: [], canceled: [] };
  var data = fallback;
  try {
    data = JSON.parse((dataNode && dataNode.textContent) || '{}');
  } catch (error) {
    data = fallback;
  }
  var columns = Array.isArray(data.columns) ? data.columns : [];
  var board = document.getElementById('board');
  var drawer = document.getElementById('drawer');
  var backdrop = document.getElementById('backdrop');
  var drawerBody = document.getElementById('drawer-body');
  var drawerTitle = document.getElementById('drawer-title');
  var closeButton = document.getElementById('drawer-close');
  var toast = document.getElementById('toast');
  var toastTimer = null;
  var lastFocus = null;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== '') node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('show');
      toastTimer = null;
    }, 2400);
  }

  function sendToHost(prompt, title) {
    if (typeof window.openai?.sendFollowUpMessage === 'function') {
      window.openai.sendFollowUpMessage({ prompt: prompt, title: title });
      notify('Sent to Codex');
      return true;
    }
    notify('Open this board inside Codex to send actions');
    return false;
  }

  function badge(text, variant) {
    return element('span', 'badge' + (variant ? ' ' + variant : ''), text);
  }

  function badgesFor(task) {
    var row = element('div', 'badges');
    if (task.priority && task.priority !== 'none') {
      row.appendChild(badge(task.priority, 'priority-' + task.priority));
    }
    if (task.attention) {
      row.appendChild(badge(task.attentionLabel || task.attention, 'attention'));
    }
    if (task.statusLabel) row.appendChild(badge(task.statusLabel, 'status'));
    var labels = Array.isArray(task.labels) ? task.labels : [];
    for (var index = 0; index < labels.length; index += 1) {
      row.appendChild(badge(labels[index], 'label'));
    }
    return row;
  }

  function summaryFor(task) {
    if (task.question && task.question.prompt) return task.question.prompt;
    if (task.blockedReason) return 'Blocked: ' + task.blockedReason;
    if (task.attention === 'review' && task.attentionDetail) return task.attentionDetail;
    if (task.description) return task.description;
    return '';
  }

  function makeCard(task) {
    var card = element('article', 'card');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('data-task', task.id || '');
    card.setAttribute('aria-label', (task.identifier || 'Task') + ': ' + (task.title || ''));
    var top = element('div', 'card-top');
    top.appendChild(element('span', 'identifier', task.identifier));
    if (task.statusAge) top.appendChild(element('span', 'age', task.statusAge));
    card.appendChild(top);
    card.appendChild(element('h3', 'card-title', task.title));
    var badges = badgesFor(task);
    if (badges.childNodes.length) card.appendChild(badges);
    var summary = summaryFor(task);
    if (summary) card.appendChild(element('p', 'card-note', summary));
    card.addEventListener('click', function () {
      openDrawer(task, card);
    });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        openDrawer(task, card);
      }
    });
    return card;
  }

  function renderBoard() {
    for (var index = 0; index < columns.length; index += 1) {
      var column = columns[index];
      if (!column || !board) continue;
      var section = board.querySelector('[data-column="' + column.id + '"]');
      if (!section) continue;
      var host = section.querySelector('[data-cards]');
      var count = section.querySelector('[data-count]');
      var empty = section.querySelector('[data-empty]');
      var tasks = Array.isArray(column.tasks) ? column.tasks : [];
      if (host) {
        host.textContent = '';
        for (var taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
          host.appendChild(makeCard(tasks[taskIndex]));
        }
      }
      if (count) count.textContent = String(tasks.length);
      if (empty) empty.hidden = tasks.length > 0;
    }
  }

  function panelFor(title, modifier) {
    var panel = element('section', 'drawer-section' + (modifier ? ' ' + modifier : ''));
    panel.appendChild(element('h4', '', title));
    return panel;
  }

  function action(label, primary, handler) {
    var button = element('button', 'action' + (primary ? ' primary' : ''), label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  function questionPanel(task) {
    var panel = panelFor('Needs you', 'question');
    panel.appendChild(element('p', 'prose', task.question.prompt));
    if (task.question.note) panel.appendChild(element('p', 'hint', task.question.note));
    if (task.question.age) panel.appendChild(element('p', 'hint', 'Waiting ' + task.question.age));
    var options = Array.isArray(task.question.options) ? task.question.options : [];
    if (options.length) {
      var list = element('div', 'options');
      for (var index = 0; index < options.length; index += 1) {
        var option = options[index] || {};
        var selected = task.question.selected === option.id;
        var row = element('div', 'option' + (selected ? ' selected' : ''));
        row.appendChild(element('span', 'option-mark', selected ? '●' : '○'));
        var copy = element('span', 'option-copy');
        copy.appendChild(element('span', 'option-label', option.label));
        if (option.detail) copy.appendChild(element('span', 'hint', option.detail));
        row.appendChild(copy);
        list.appendChild(row);
      }
      panel.appendChild(list);
    }
    var actions = element('div', 'actions');
    actions.appendChild(action('Answer in Codex', true, function () {
      sendToHost('Answer ' + task.identifier + ' "' + task.question.prompt + '". My note: ', 'Answer ' + task.identifier);
    }));
    actions.appendChild(action('Approve', false, function () {
      sendToHost('Approve ' + task.identifier + ' (' + task.title + ').', 'Approve ' + task.identifier);
    }));
    actions.appendChild(action('Reject', false, function () {
      sendToHost('Reject ' + task.identifier + ' (' + task.title + ') and send it back to Backlog.', 'Reject ' + task.identifier);
    }));
    panel.appendChild(actions);
    return panel;
  }

  function blockedPanel(task) {
    var panel = panelFor('Blocked', 'blocked');
    panel.appendChild(element('p', 'prose', task.blockedReason));
    if (task.blockedAge) panel.appendChild(element('p', 'hint', 'Blocked for ' + task.blockedAge));
    var actions = element('div', 'actions');
    actions.appendChild(action('Unblock in Codex', true, function () {
      sendToHost('Clear the blocker on ' + task.identifier + ' (' + task.title + ').', 'Clear blocker');
    }));
    panel.appendChild(actions);
    return panel;
  }

  function reviewPanel(task) {
    var panel = panelFor('Needs you', 'question');
    panel.appendChild(element('p', 'prose', 'This task is waiting for review.'));
    var actions = element('div', 'actions');
    actions.appendChild(action('Approve', true, function () {
      sendToHost('Approve ' + task.identifier + ' (' + task.title + ').', 'Approve ' + task.identifier);
    }));
    actions.appendChild(action('Reject', false, function () {
      sendToHost('Reject ' + task.identifier + ' (' + task.title + ') and send it back to Backlog.', 'Reject ' + task.identifier);
    }));
    panel.appendChild(actions);
    return panel;
  }

  function factsFor(task) {
    var list = element('dl', 'facts');
    function fact(label, value) {
      if (!value) return;
      list.appendChild(element('dt', '', label));
      list.appendChild(element('dd', '', value));
    }
    fact('Status', task.statusLabel);
    if (task.priority && task.priority !== 'none') fact('Priority', task.priority);
    if (task.assignee && task.assignee.name) fact('Assignee', task.assignee.name);
    if (task.version !== null && task.version !== undefined) fact('Version', String(task.version));
    if (task.labels && task.labels.length) fact('Labels', task.labels.join(', '));
    return list;
  }

  function linksPanel(task) {
    var panel = panelFor('Links');
    var list = element('ul', 'plain');
    for (var index = 0; index < task.links.length; index += 1) {
      var link = task.links[index] || {};
      var item = element('li', 'link');
      item.appendChild(element('span', 'link-label', link.label || 'Link'));
      if (link.url) item.appendChild(element('span', 'link-url', link.url));
      list.appendChild(item);
    }
    panel.appendChild(list);
    return panel;
  }

  function commentsPanel(task) {
    var panel = panelFor('Comments');
    var list = element('ul', 'plain');
    for (var index = 0; index < task.comments.length; index += 1) {
      var comment = task.comments[index] || {};
      var item = element('li', 'comment');
      item.appendChild(element('span', 'comment-meta', comment.author + (comment.age ? ' · ' + comment.age : '')));
      item.appendChild(element('span', '', comment.body));
      list.appendChild(item);
    }
    panel.appendChild(list);
    return panel;
  }

  function renderDrawer(task) {
    clear(drawerBody);

    var head = element('div', 'drawer-task');
    head.appendChild(element('p', 'identifier', task.identifier));
    head.appendChild(element('h3', 'drawer-task-title', task.title));
    var badges = badgesFor(task);
    if (badges.childNodes.length) head.appendChild(badges);
    drawerBody.appendChild(head);

    if (task.description) {
      var description = panelFor('Description');
      description.appendChild(element('p', 'prose', task.description));
      drawerBody.appendChild(description);
    }

    if (task.question) {
      drawerBody.appendChild(questionPanel(task));
    } else if (task.attention === 'blocked') {
      drawerBody.appendChild(blockedPanel(task));
    } else if (task.attention === 'review') {
      drawerBody.appendChild(reviewPanel(task));
    }

    if (task.resolution) {
      var resolution = panelFor('Resolution');
      var summary = task.resolution.decision || 'resolved';
      if (task.resolution.optionLabel) summary += ' · ' + task.resolution.optionLabel;
      if (task.resolution.note) summary += ' — ' + task.resolution.note;
      resolution.appendChild(element('p', 'prose', summary));
      drawerBody.appendChild(resolution);
    }

    if (task.blockedReason && task.attention !== 'blocked') {
      var blocker = panelFor('Blocker', 'blocked');
      blocker.appendChild(element('p', 'prose', task.blockedReason));
      if (task.blockedAge) blocker.appendChild(element('p', 'hint', 'Blocked for ' + task.blockedAge));
      drawerBody.appendChild(blocker);
    }

    var details = panelFor('Details');
    details.appendChild(factsFor(task));
    drawerBody.appendChild(details);

    if (Array.isArray(task.links) && task.links.length) drawerBody.appendChild(linksPanel(task));
    if (Array.isArray(task.comments) && task.comments.length) drawerBody.appendChild(commentsPanel(task));

    var actionsPanel = panelFor('Actions');
    var actions = element('div', 'actions');
    actions.appendChild(action('Comment', false, function () {
      sendToHost('Add a comment to ' + task.identifier + ' (' + task.title + '): ', 'Comment on ' + task.identifier);
    }));
    if (task.status !== 'done') {
      actions.appendChild(action('Move to Done', false, function () {
        sendToHost('Move ' + task.identifier + ' (' + task.title + ') to Done.', 'Move ' + task.identifier);
      }));
    }
    actions.appendChild(action(task.blockedReason ? 'Update blocker' : 'Block', false, function () {
      sendToHost('Block ' + task.identifier + ' (' + task.title + ') because ', 'Block ' + task.identifier);
    }));
    actionsPanel.appendChild(actions);
    actionsPanel.appendChild(element('p', 'hint', 'Actions are sent back to Codex. This file never writes to the board.'));
    drawerBody.appendChild(actionsPanel);
  }

  function openDrawer(task, opener) {
    if (!drawer || !drawerBody || !drawerTitle) return;
    lastFocus = opener || document.activeElement;
    drawerTitle.textContent = (task.identifier || 'Task') + ' · ' + (task.title || '');
    renderDrawer(task);
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
    void drawer.offsetWidth;
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    if (closeButton) closeButton.focus();
  }

  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    window.setTimeout(function () {
      if (!drawer.classList.contains('open')) {
        drawer.hidden = true;
        if (backdrop) backdrop.hidden = true;
      }
    }, 200);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  }

  if (closeButton) closeButton.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer();
  });
  var printButton = document.querySelector('[data-action="print"]');
  if (printButton) {
    printButton.addEventListener('click', function () {
      window.print();
    });
  }

  renderBoard();
  window.__CODEX_KANBAN__ = { data: data, open: openDrawer, close: closeDrawer };
})();
  </script>
</body>
</html>
`
}
