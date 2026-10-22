import { COLUMNS, attentionReason, columnForTask, sortTasks } from './rules.mjs'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
}

function age(iso, now) {
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

function cardModel(task, now) {
  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    labels: task.labels || [],
    attention: attentionReason(task),
    blockedReason: task.blockedReason || '',
    blockedAge: task.blockedSince ? age(task.blockedSince, now) : '',
    question: task.pendingQuestion
      ? {
        prompt: task.pendingQuestion.prompt,
        note: task.pendingQuestion.note || '',
        selected: task.pendingQuestion.selected || null,
        options: task.pendingQuestion.options,
        age: age(task.pendingQuestion.createdAt, now),
      }
      : null,
    resolution: task.questionResolution
      ? { decision: task.questionResolution.decision, note: task.questionResolution.note || '' }
      : null,
    version: task.version,
    comments: (task.comments || []).slice(-5).map((comment) => ({
      author: comment.author?.name || 'someone',
      body: comment.body,
    })),
    links: (task.links || []).map((link) => ({ label: link.label, url: link.url })),
  }
}

export function boardPayload(board, { now = Date.now() } = {}) {
  const columns = COLUMNS.map((column) => ({
    id: column.id,
    label: column.label,
    tasks: board.tasks
      .filter((task) => columnForTask(task) === column.id)
      .sort(sortTasks)
      .map((task) => cardModel(task, now)),
  }))
  return {
    project: board.project,
    generatedAt: new Date(now).toISOString(),
    columns,
  }
}

export function renderHtml(board, { now = Date.now() } = {}) {
  const payload = boardPayload(board, { now })
  const data = safeJson(payload)
  const total = payload.columns.reduce((sum, column) => sum + column.tasks.length, 0)
  const title = `Codex Kanban · ${payload.project.name}`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: light-dark(#f6f7f9, #0d1017);
    --surface: light-dark(#ffffff, #161b23);
    --surface-2: light-dark(#f0f2f5, #1d242e);
    --border: light-dark(#e2e5ea, #2a3340);
    --text: light-dark(#12161c, #e8edf4);
    --muted: light-dark(#5b6573, #95a2b3);
    --accent: light-dark(#2f6fb2, #74a9e8);
    --danger: light-dark(#b23b3b, #e88989);
    --warn: light-dark(#9a6400, #e3b341);
    --ok: light-dark(#2f7d4f, #6fd39b);
    --radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    line-height: 1.45;
  }
  .shell { max-width: 1180px; margin: 0 auto; padding: 18px 18px 40px; }
  header.board-head {
    display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
    padding: 6px 2px 16px;
  }
  .board-head h1 { font-size: 18px; font-weight: 650; margin: 0; letter-spacing: -0.01em; }
  .board-head .meta { color: var(--muted); font-size: 12px; }
  .board-head .spacer { flex: 1; }
  .board-head button.ghost {
    background: transparent; color: var(--muted); border: 1px solid var(--border);
    border-radius: 999px; padding: 5px 12px; font-size: 12px; cursor: pointer;
  }
  main.board {
    display: grid; gap: 14px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (max-width: 900px) { main.board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { main.board { grid-template-columns: minmax(0, 1fr); } }
  section.column {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px;
    min-height: 160px;
    display: flex; flex-direction: column; gap: 8px;
  }
  section.column[data-column="needs"] { outline: 1px solid color-mix(in oklab, var(--warn) 45%, transparent); }
  .column-head { display: flex; align-items: center; gap: 8px; padding: 2px 4px 4px; }
  .column-head h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0; font-weight: 600; }
  .column-head .count {
    margin-left: auto; font-size: 11px; color: var(--muted);
    background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 1px 8px;
  }
  .column-empty { color: var(--muted); font-size: 12px; padding: 10px 6px; }
  article.card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 11px; cursor: pointer; display: grid; gap: 6px;
    transition: border-color 120ms ease, transform 120ms ease;
  }
  article.card:hover { border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); }
  article.card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .card-top { display: flex; align-items: center; gap: 8px; }
  .identifier { font-size: 11px; font-weight: 650; color: var(--muted); letter-spacing: 0.02em; }
  .card-title { font-size: 13px; font-weight: 600; margin: 0; overflow-wrap: anywhere; }
  .badges { display: flex; flex-wrap: wrap; gap: 5px; }
  .badge {
    font-size: 10.5px; padding: 1px 7px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--muted); background: var(--surface-2);
  }
  .badge.priority-high, .badge.priority-urgent { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 40%, var(--border)); }
  .badge.attention-question, .badge.attention-blocked { color: var(--warn); border-color: color-mix(in oklab, var(--warn) 45%, var(--border)); }
  .badge.attention-review { color: var(--accent); }
  .card-note { font-size: 12px; color: var(--muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .drawer-backdrop {
    position: fixed; inset: 0; background: light-dark(rgba(16, 20, 27, 0.28), rgba(0, 0, 0, 0.5));
    opacity: 0; pointer-events: none; transition: opacity 140ms ease;
  }
  .drawer-backdrop.open { opacity: 1; pointer-events: auto; }
  aside.drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 100%);
    background: var(--surface); border-left: 1px solid var(--border);
    transform: translateX(100%); transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
    display: flex; flex-direction: column; z-index: 10;
  }
  aside.drawer.open { transform: translateX(0); }
  .drawer-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .drawer-head h2 { font-size: 14px; margin: 0; }
  .drawer-head button { margin-left: auto; background: transparent; border: 0; color: var(--muted); font-size: 18px; cursor: pointer; }
  .drawer-body { padding: 14px 16px 30px; overflow: auto; display: grid; gap: 14px; align-content: start; }
  .drawer-body h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 0 0 6px; }
  .drawer-body p { margin: 0; }
  .question { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: var(--surface-2); }
  .options { display: grid; gap: 6px; margin-top: 8px; }
  .option { display: flex; gap: 8px; align-items: flex-start; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
  .option.selected { border-color: var(--accent); }
  .option .label { font-weight: 550; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .actions button {
    border: 1px solid var(--border); background: var(--surface-2); color: var(--text);
    border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer;
  }
  .actions button.primary { background: var(--accent); border-color: var(--accent); color: light-dark(#fff, #0b1220); font-weight: 600; }
  .actions button:disabled { opacity: 0.45; cursor: default; }
  .hint { color: var(--muted); font-size: 11.5px; }
  ul.plain { margin: 0; padding-left: 16px; display: grid; gap: 4px; }
  ul.plain li { overflow-wrap: anywhere; }
  .toast {
    position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 8px);
    background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px;
    font-size: 12px; opacity: 0; transition: opacity 140ms ease, transform 140ms ease; pointer-events: none;
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
</style>
</head>
<body>
<div class="shell">
  <header class="board-head">
    <h1>${escapeHtml(payload.project.name)}</h1>
    <span class="meta">${total} task${total === 1 ? '' : 's'} · updated ${escapeHtml(payload.generatedAt)}</span>
    <span class="spacer"></span>
    <button class="ghost" type="button" data-action="print">Print</button>
  </header>
  <main class="board" id="board"></main>
</div>
<div class="drawer-backdrop" id="backdrop"></div>
<aside class="drawer" id="drawer" aria-label="Task details">
  <div class="drawer-head"><h2 id="drawer-title">Task</h2><button type="button" id="drawer-close" aria-label="Close">×</button></div>
  <div class="drawer-body" id="drawer-body"></div>
</aside>
<div class="toast" id="toast"></div>
<script type="application/json" id="board-data">${data}</script>
<script>
(function () {
  const data = JSON.parse(document.getElementById('board-data').textContent);
  const COLUMN_HINTS = {
    needs: 'Questions, blockers and reviews land here.',
    running: 'Work in progress.',
    backlog: 'Not started yet.',
    done: 'Shipped and closed.',
  };
  const board = document.getElementById('board');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('backdrop');
  const body = document.getElementById('drawer-body');
  const title = document.getElementById('drawer-title');
  const toast = document.getElementById('toast');

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === undefined || value === null) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children) {
      if (child === null || child === undefined) continue;
      node.append(child);
    }
    return node;
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function askAgent(prompt, heading) {
    const host = window.openai;
    if (host && typeof host.sendFollowUpMessage === 'function') {
      host.sendFollowUpMessage({ prompt: prompt, title: heading });
      notify('Sent to Codex');
      return true;
    }
    notify('Open this board inside Codex to send actions');
    return false;
  }

  function badge(text, cls) { return el('span', { class: 'badge ' + (cls || ''), text: text }); }

  function card(task) {
    const node = el('article', { class: 'card', tabindex: '0', role: 'button', 'data-task': task.id, 'aria-label': task.identifier + ' ' + task.title });
    node.append(el('div', { class: 'card-top' }, el('span', { class: 'identifier', text: task.identifier })));
    node.append(el('p', { class: 'card-title', text: task.title }));
    const badges = el('div', { class: 'badges' });
    if (task.priority !== 'none') badges.append(badge(task.priority, 'priority-' + task.priority));
    if (task.attention) badges.append(badge(task.attention, 'attention-' + task.attention));
    for (const label of task.labels) badges.append(badge(label));
    if (badges.childElementCount) node.append(badges);
    if (task.question) node.append(el('p', { class: 'card-note', text: task.question.prompt }));
    else if (task.blockedReason) node.append(el('p', { class: 'card-note', text: 'Blocked: ' + task.blockedReason }));
    else if (task.description) node.append(el('p', { class: 'card-note', text: task.description }));
    node.addEventListener('click', function () { open(task); });
    node.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(task); }
    });
    return node;
  }

  function render() {
    board.textContent = '';
    for (const column of data.columns) {
      const section = el('section', { class: 'column', 'data-column': column.id });
      const head = el('div', { class: 'column-head' },
        el('h2', { text: column.label }),
        el('span', { class: 'count', text: String(column.tasks.length) }));
      section.append(head);
      if (!column.tasks.length) {
        section.append(el('p', { class: 'column-empty', text: COLUMN_HINTS[column.id] || 'Empty.' }));
      } else {
        for (const task of column.tasks) section.append(card(task));
      }
      board.append(section);
    }
  }

  function findTask(id) {
    for (const column of data.columns) {
      for (const task of column.tasks) if (task.id === id) return task;
    }
    return null;
  }

  function open(task) {
    title.textContent = task.identifier;
    body.textContent = '';
    body.append(el('p', { text: task.title }));
    const meta = el('div', { class: 'badges' });
    meta.append(badge(task.status));
    if (task.priority !== 'none') meta.append(badge(task.priority));
    if (task.attention) meta.append(badge(task.attention, 'attention-' + task.attention));
    body.append(meta);
    if (task.description) {
      body.append(el('section', null, el('h3', { text: 'Description' }), el('p', { text: task.description })));
    }
    if (task.blockedReason) {
      body.append(el('section', null,
        el('h3', { text: 'Blocker' }),
        el('p', { text: task.blockedReason + (task.blockedAge ? ' · ' + task.blockedAge : '') }),
        el('div', { class: 'actions' }, button('Clear blocker', 'primary', function () {
          askAgent('Clear the blocker on ' + task.identifier + ' (' + task.title + ').', 'Clear blocker');
        }))));
    }
    if (task.question) {
      const options = el('div', { class: 'options' });
      for (const option of task.question.options) {
        const row = el('div', { class: 'option' + (task.question.selected === option.id ? ' selected' : '') });
        row.append(el('span', { text: task.question.selected === option.id ? '●' : '○' }));
        const text = el('span', null, el('span', { class: 'label', text: option.label }));
        if (option.detail) text.append(el('span', { class: 'hint', text: ' — ' + option.detail }));
        row.append(text);
        options.append(row);
      }
      const question = el('section', { class: 'question' },
        el('h3', { text: 'Needs you' }),
        el('p', { text: task.question.prompt }),
        task.question.note ? el('p', { class: 'hint', text: task.question.note }) : null,
        options);
      const chosen = task.question.selected;
      question.append(el('div', { class: 'actions' },
        button('Answer in Codex', '', function () {
          const prompt = 'Answer ' + task.identifier + ' "' + task.question.prompt + '". My note: ';
          askAgent(prompt, 'Answer ' + task.identifier);
        }),
        button('Approve', 'primary', function () {
          askAgent('Approve ' + task.identifier + ' (' + task.title + ')' + (chosen ? ' with the selected option' : '') + '.', 'Approve ' + task.identifier);
        }),
        button('Reject', '', function () {
          askAgent('Reject ' + task.identifier + ' (' + task.title + ') and send it back to Backlog.', 'Reject ' + task.identifier);
        })));
      body.append(question);
    } else if (task.attention === 'review') {
      body.append(el('section', null,
        el('h3', { text: 'Needs you' }),
        el('p', { text: 'This task is waiting for review.' }),
        el('div', { class: 'actions' },
          button('Approve', 'primary', function () { askAgent('Approve ' + task.identifier + ' (' + task.title + ').', 'Approve ' + task.identifier); }),
          button('Reject', '', function () { askAgent('Reject ' + task.identifier + ' (' + task.title + ').', 'Reject ' + task.identifier); }))));
    }
    if (task.links.length) {
      const list = el('ul', { class: 'plain' });
      for (const link of task.links) list.append(el('li', null, el('a', { href: link.url, target: '_blank', rel: 'noreferrer', text: link.label })));
      body.append(el('section', null, el('h3', { text: 'Links' }), list));
    }
    if (task.comments.length) {
      const list = el('ul', { class: 'plain' });
      for (const comment of task.comments) list.append(el('li', { text: comment.author + ': ' + comment.body }));
      body.append(el('section', null, el('h3', { text: 'Comments' }), list));
    }
    const move = el('section', null, el('h3', { text: 'Actions' }));
    const row = el('div', { class: 'actions' });
    row.append(button('Comment', '', function () {
      askAgent('Add a comment to ' + task.identifier + ' (' + task.title + '): ', 'Comment on ' + task.identifier);
    }));
    if (task.status !== 'done') row.append(button('Move to Done', '', function () {
      askAgent('Move ' + task.identifier + ' (' + task.title + ') to Done.', 'Move ' + task.identifier);
    }));
    row.append(button('Block', '', function () {
      askAgent('Block ' + task.identifier + ' (' + task.title + ') because ', 'Block ' + task.identifier);
    }));
    move.append(row, el('p', { class: 'hint', text: 'Version ' + task.version + ' · actions run through Codex so the store stays the source of truth.' }));
    body.append(move);
    drawer.classList.add('open');
    backdrop.classList.add('open');
    body.querySelector('button')?.focus();
  }

  function button(label, cls, handler) {
    const node = el('button', { type: 'button', class: cls, text: label });
    node.addEventListener('click', handler);
    return node;
  }

  function close() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }

  document.getElementById('drawer-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
  document.addEventListener('click', function (event) {
    const action = event.target.closest('[data-action="print"]');
    if (action) window.print();
  });

  render();
  window.__KANBAN__ = { data: data, open: open };
})();
</script>
</body>
</html>
`
}

export function writeBoardHtml(store, board, { now = Date.now() } = {}) {
  const target = `${store.path.replace(/board\.json$/, '')}board.html`
  const html = renderHtml(board, { now })
  return { path: target, html }
}
