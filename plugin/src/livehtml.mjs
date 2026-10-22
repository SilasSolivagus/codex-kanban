export function renderLiveHtml({ project = {} } = {}) {
  const name = String(project.name || 'board').replace(/[<>&]/g, '')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>Codex Kanban · ${name}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: light-dark(#f3f5f8, #0b0f15);
    --surface: light-dark(#ffffff, #141b24);
    --surface-2: light-dark(#eef1f5, #1a2330);
    --border: light-dark(#d9e0e8, #2a3646);
    --text: light-dark(#101720, #e8eef6);
    --muted: light-dark(#5b6777, #93a2b4);
    --accent: light-dark(#2a63a8, #83b6f0);
    --accent-contrast: light-dark(#ffffff, #0a1220);
    --needs: light-dark(#996000, #f2c463);
    --danger: light-dark(#a93838, #f09a9a);
    --radius: 14px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-synthesis: none;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.45; }
  .shell { max-width: 1240px; margin: 0 auto; padding: 20px 20px 60px; }
  header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 4px 2px 18px; }
  header h1 { font-size: 19px; margin: 0; letter-spacing: -0.01em; }
  header .meta { color: var(--muted); font-size: 12px; }
  header .spacer { flex: 1; }
  button {
    font: inherit; border: 1px solid var(--border); background: var(--surface);
    color: var(--text); border-radius: 9px; padding: 6px 11px; cursor: pointer;
  }
  button:hover { border-color: var(--accent); }
  button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); font-weight: 600; }
  button.danger { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 45%, var(--border)); }
  button:disabled { opacity: 0.45; cursor: default; }
  main { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  @media (max-width: 980px) { main { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 600px) { main { grid-template-columns: minmax(0, 1fr); } }
  section.column {
    background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 180px;
  }
  section.column[data-column="needs"] { outline: 1px solid color-mix(in oklab, var(--needs) 45%, transparent); }
  section.column.dragover { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, var(--surface-2)); }
  .column-head { display: flex; align-items: center; gap: 8px; padding: 2px 4px; }
  .column-head h2 { font-size: 11.5px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); margin: 0; }
  .column-head .count { margin-left: auto; font-size: 11px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 1px 8px; }
  .column-empty { color: var(--muted); font-size: 12px; padding: 12px 6px; }
  article.card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px; display: grid; gap: 6px; cursor: grab; box-shadow: 0 1px 2px light-dark(rgba(16,24,40,0.05), rgba(0,0,0,0.35));
  }
  article.card:hover { border-color: var(--accent); }
  article.card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  article.card.dragging { opacity: 0.5; }
  .card-top { display: flex; gap: 8px; align-items: center; }
  .identifier { font-size: 11px; font-weight: 650; color: var(--muted); }
  .age { margin-left: auto; font-size: 10.5px; color: var(--muted); }
  .card-title { margin: 0; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
  .badges { display: flex; flex-wrap: wrap; gap: 5px; }
  .badge { font-size: 10.5px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); background: var(--surface-2); }
  .badge.priority-high, .badge.priority-urgent { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 40%, var(--border)); }
  .badge.attention-question, .badge.attention-blocked { color: var(--needs); border-color: color-mix(in oklab, var(--needs) 45%, var(--border)); }
  .badge.attention-review { color: var(--accent); }
  .card-note { margin: 0; font-size: 12px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); opacity: 0; pointer-events: none; transition: opacity 120ms; }
  .backdrop.open { opacity: 1; pointer-events: auto; }
  aside.drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: min(460px, 100%);
    background: var(--surface); border-left: 1px solid var(--border); z-index: 10;
    transform: translateX(100%); transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1);
    display: flex; flex-direction: column;
  }
  aside.drawer.open { transform: translateX(0); }
  .drawer-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .drawer-head h2 { margin: 0; font-size: 14px; }
  .drawer-head button { margin-left: auto; border: 0; background: transparent; font-size: 18px; color: var(--muted); }
  .drawer-body { padding: 16px; overflow: auto; display: grid; gap: 14px; align-content: start; }
  .drawer-body h3 { margin: 0 0 6px; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .drawer-body p { margin: 0; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .question-box { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: var(--surface-2); display: grid; gap: 8px; }
  .option { display: flex; gap: 8px; align-items: center; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer; }
  .option.selected { border-color: var(--accent); }
  .hint { color: var(--muted); font-size: 11.5px; }
  ul.plain { margin: 0; padding-left: 16px; display: grid; gap: 4px; }
  .toast { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 8px); background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px; font-size: 12px; opacity: 0; transition: 140ms; pointer-events: none; }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
  .toast.error { background: var(--danger); color: #fff; }
</style>
</head>
<body>
<div class="shell">
  <header>
    <h1 id="project">${name}</h1>
    <span class="meta" id="meta">loading…</span>
    <span class="spacer"></span>
    <button id="new-task" class="primary" type="button">New task</button>
    <button id="refresh" type="button">Refresh</button>
  </header>
  <main id="board"></main>
</div>
<div class="backdrop" id="backdrop"></div>
<aside class="drawer" id="drawer" aria-label="Task details">
  <div class="drawer-head"><h2 id="drawer-title">Task</h2><button id="drawer-close" type="button" aria-label="Close">×</button></div>
  <div class="drawer-body" id="drawer-body"></div>
</aside>
<div class="toast" id="toast"></div>
<script>
(function () {
  var state = { data: null, selected: null, poll: null };
  var board = document.getElementById('board');
  var meta = document.getElementById('meta');
  var drawer = document.getElementById('drawer');
  var backdrop = document.getElementById('backdrop');
  var drawerBody = document.getElementById('drawer-body');
  var drawerTitle = document.getElementById('drawer-title');
  var toast = document.getElementById('toast');
  var COLUMNS = [
    { id: 'backlog', label: 'Backlog', hint: 'Not started yet.' },
    { id: 'running', label: 'Running', hint: 'Work in progress.' },
    { id: 'needs', label: 'Needs you', hint: 'Nothing needs you right now.' },
    { id: 'done', label: 'Done', hint: 'Shipped and closed.' }
  ];
  var STATUS_LABEL = { backlog: 'backlog', todo: 'todo', in_progress: 'in progress', in_review: 'in review', done: 'done', canceled: 'canceled' };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function notify(message, isError) {
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(function () { toast.className = 'toast'; }, 2600);
  }

  function age(iso) {
    if (!iso) return '';
    var seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (!isFinite(seconds)) return '';
    if (seconds < 60) return seconds + 's';
    var minutes = Math.round(seconds / 60);
    if (minutes < 60) return minutes + 'm';
    var hours = Math.round(minutes / 60);
    if (hours < 24) return hours + 'h';
    return Math.round(hours / 24) + 'd';
  }

  function request(payload) {
    return fetch('/api/action', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok || !body.ok) {
          var error = body.error || {};
          throw new Error((error.code || 'ERROR') + ': ' + (error.message || response.status));
        }
        return body;
      });
    });
  }

  function load() {
    return fetch('/api/board', { cache: 'no-store' })
      .then(function (response) { return response.json(); })
      .then(function (body) {
        state.data = body;
        meta.textContent = body.summary.total + ' tasks · ' + body.summary.counts.needs + ' needs you · ' + body.summary.counts.running + ' running';
        render();
      })
      .catch(function (error) { notify(error.message, true); });
  }

  function act(payload) {
    return request(payload)
      .then(function (body) {
        state.data = body;
        meta.textContent = body.summary.total + ' tasks · ' + body.summary.counts.needs + ' needs you · ' + body.summary.counts.running + ' running';
        render();
        if (state.selected) {
          var fresh = find(state.selected);
          if (fresh) openTask(fresh);
          else closeDrawer();
        }
        return body;
      })
      .catch(function (error) { notify(error.message, true); throw error; });
  }

  function find(identifier) {
    if (!state.data) return null;
    var columns = state.data.board.columns;
    for (var name in columns) {
      for (var i = 0; i < columns[name].length; i += 1) {
        if (columns[name][i].identifier === identifier) return columns[name][i];
      }
    }
    return null;
  }

  function card(task) {
    var node = el('article', 'card');
    node.draggable = true;
    node.tabIndex = 0;
    node.dataset.identifier = task.identifier;
    node.dataset.version = String(task.version);
    var top = el('div', 'card-top');
    top.appendChild(el('span', 'identifier', task.identifier));
    top.appendChild(el('span', 'age', age(task.statusSince)));
    node.appendChild(top);
    node.appendChild(el('p', 'card-title', task.title));
    var badges = el('div', 'badges');
    if (task.priority && task.priority !== 'none') badges.appendChild(el('span', 'badge priority-' + task.priority, task.priority));
    if (task.attention) badges.appendChild(el('span', 'badge attention-' + task.attention, task.attention));
    (task.labels || []).forEach(function (label) { badges.appendChild(el('span', 'badge', label)); });
    if (badges.childElementCount) node.appendChild(badges);
    if (task.pendingQuestion && !task.questionResolution) node.appendChild(el('p', 'card-note', task.pendingQuestion.prompt));
    else if (task.blockedReason) node.appendChild(el('p', 'card-note', 'Blocked: ' + task.blockedReason));
    else if (task.description) node.appendChild(el('p', 'card-note', task.description));
    node.addEventListener('click', function () { openTask(task); });
    node.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openTask(task); }
    });
    node.addEventListener('dragstart', function (event) {
      event.dataTransfer.setData('text/plain', JSON.stringify({ id: task.identifier, version: task.version }));
      event.dataTransfer.effectAllowed = 'move';
      node.classList.add('dragging');
    });
    node.addEventListener('dragend', function () { node.classList.remove('dragging'); });
    return node;
  }

  function render() {
    board.textContent = '';
    COLUMNS.forEach(function (column) {
      var section = el('section', 'column');
      section.dataset.column = column.id;
      var head = el('div', 'column-head');
      head.appendChild(el('h2', null, column.label));
      var tasks = (state.data && state.data.board.columns[column.id]) || [];
      head.appendChild(el('span', 'count', tasks.length));
      section.appendChild(head);
      if (!tasks.length) {
        section.appendChild(el('p', 'column-empty', column.hint));
      } else {
        tasks.forEach(function (task) { section.appendChild(card(task)); });
      }
      if (column.id !== 'needs') {
        section.addEventListener('dragover', function (event) { event.preventDefault(); section.classList.add('dragover'); });
        section.addEventListener('dragleave', function () { section.classList.remove('dragover'); });
        section.addEventListener('drop', function (event) {
          event.preventDefault();
          section.classList.remove('dragover');
          var raw = event.dataTransfer.getData('text/plain');
          if (!raw) return;
          var payload = JSON.parse(raw);
          act({ action: 'move', id: payload.id, version: payload.version, to: column.id })
            .then(function () { notify(payload.id + ' → ' + column.label); })
            .catch(function () {});
        });
      }
      board.appendChild(section);
    });
  }

  function button(label, cls, handler) {
    var node = el('button', cls, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }

  function openTask(task) {
    state.selected = task.identifier;
    drawerTitle.textContent = task.identifier + ' · ' + task.title;
    drawerBody.textContent = '';
    var badges = el('div', 'badges');
    badges.appendChild(el('span', 'badge', STATUS_LABEL[task.status] || task.status));
    if (task.priority !== 'none') badges.appendChild(el('span', 'badge', task.priority));
    if (task.attention) badges.appendChild(el('span', 'badge attention-' + task.attention, task.attention));
    drawerBody.appendChild(badges);
    if (task.description) {
      var desc = el('section');
      desc.appendChild(el('h3', null, 'Description'));
      desc.appendChild(el('p', null, task.description));
      drawerBody.appendChild(desc);
    }
    if (task.blockedReason) {
      var blocker = el('section');
      blocker.appendChild(el('h3', null, 'Blocker'));
      blocker.appendChild(el('p', null, task.blockedReason));
      blocker.appendChild(el('p', 'hint', 'Blocked for ' + age(task.blockedSince)));
      drawerBody.appendChild(blocker);
    }
    if (task.pendingQuestion && !task.questionResolution) {
      var box = el('div', 'question-box');
      box.appendChild(el('h3', null, 'Needs you'));
      box.appendChild(el('p', null, task.pendingQuestion.prompt));
      if (task.pendingQuestion.note) box.appendChild(el('p', 'hint', task.pendingQuestion.note));
      var options = el('div');
      options.style.display = 'grid';
      options.style.gap = '6px';
      task.pendingQuestion.options.forEach(function (option) {
        var row = el('div', 'option' + (task.pendingQuestion.selected === option.id ? ' selected' : ''));
        row.appendChild(el('span', null, task.pendingQuestion.selected === option.id ? '●' : '○'));
        var label = el('span');
        label.appendChild(el('span', null, option.label));
        if (option.detail) label.appendChild(el('span', 'hint', ' — ' + option.detail));
        row.appendChild(label);
        row.addEventListener('click', function () {
          act({ action: 'answer', id: task.identifier, version: task.version, option: option.id })
            .then(function () { notify('Answer recorded; approve or reject to close'); })
            .catch(function () {});
        });
        options.appendChild(row);
      });
      box.appendChild(options);
      box.appendChild(el('div', 'actions',
        button('Approve', 'primary', function () {
          if (!confirm('Approve ' + task.identifier + ' and move it to Done?')) return;
          act({ action: 'approve', id: task.identifier, version: task.version, note: 'approved in web board' })
            .then(function () { notify(task.identifier + ' approved'); });
        }),
        button('Reject', 'danger', function () {
          if (!confirm('Reject ' + task.identifier + ' back to Backlog?')) return;
          act({ action: 'reject', id: task.identifier, version: task.version, note: 'rejected in web board' })
            .then(function () { notify(task.identifier + ' rejected'); });
        })
      ));
      drawerBody.appendChild(box);
    } else if (task.attention === 'review') {
      var review = el('section');
      review.appendChild(el('h3', null, 'Needs you'));
      review.appendChild(el('p', null, 'This task is waiting for review.'));
      review.appendChild(el('div', 'actions',
        button('Approve', 'primary', function () {
          if (!confirm('Approve ' + task.identifier + ' and move it to Done?')) return;
          act({ action: 'approve', id: task.identifier, version: task.version, note: 'approved in web board' })
            .then(function () { notify(task.identifier + ' approved'); });
        }),
        button('Reject', 'danger', function () {
          if (!confirm('Reject ' + task.identifier + ' back to Backlog?')) return;
          act({ action: 'reject', id: task.identifier, version: task.version, note: 'rejected in web board' })
            .then(function () { notify(task.identifier + ' rejected'); });
        })
      ));
      drawerBody.appendChild(review);
    }
    if (task.comments && task.comments.length) {
      var comments = el('section');
      comments.appendChild(el('h3', null, 'Comments'));
      var list = el('ul', 'plain');
      task.comments.slice(-5).forEach(function (comment) {
        list.appendChild(el('li', null, comment.author.name + ': ' + comment.body));
      });
      comments.appendChild(list);
      drawerBody.appendChild(comments);
    }
    var actions = el('section');
    actions.appendChild(el('h3', null, 'Actions'));
    var row = el('div', 'actions');
    ['backlog', 'running', 'done'].forEach(function (target) {
      if (target === task.status) return;
      var labels = { backlog: 'Backlog', running: 'Running', done: 'Done' };
      row.appendChild(button('Move to ' + labels[target], '', function () {
        act({ action: 'move', id: task.identifier, version: task.version, to: target })
          .then(function () { notify(task.identifier + ' → ' + labels[target]); });
      }));
    });
    row.appendChild(button(task.blockedReason ? 'Update blocker' : 'Block', '', function () {
      var reason = prompt('What is blocking ' + task.identifier + '?');
      if (!reason) return;
      act({ action: 'block', id: task.identifier, version: task.version, reason: reason })
        .then(function () { notify('Blocked: ' + reason); });
    }));
    if (task.blockedReason) {
      row.appendChild(button('Unblock', '', function () {
        act({ action: 'unblock', id: task.identifier, version: task.version })
          .then(function () { notify('Blocker cleared'); });
      }));
    }
    row.appendChild(button('Ask', '', function () {
      var question = prompt('Question for the human?');
      if (!question) return;
      var raw = prompt('Options, comma separated (2–5)');
      if (!raw) return;
      var options = raw.split(',').map(function (value) { return value.trim(); }).filter(Boolean);
      act({ action: 'ask', id: task.identifier, version: task.version, prompt: question, options: options })
        .then(function () { notify('Question posted'); });
    }));
    row.appendChild(button('Comment', '', function () {
      var body = prompt('Comment on ' + task.identifier);
      if (!body) return;
      act({ action: 'comment', id: task.identifier, version: task.version, body: body })
        .then(function () { notify('Comment added'); });
    }));
    actions.appendChild(row);
    actions.appendChild(el('p', 'hint', 'Writes go to .kanban/board.json. Version ' + task.version + '.'));
    drawerBody.appendChild(actions);
    drawer.classList.add('open');
    backdrop.classList.add('open');
  }

  function closeDrawer() {
    state.selected = null;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }

  document.getElementById('refresh').addEventListener('click', function () { load(); });
  document.getElementById('new-task').addEventListener('click', function () {
    var title = prompt('New task title');
    if (!title) return;
    act({ action: 'create', title: title }).then(function () { notify('Task created'); });
  });
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawer(); });

  load();
  state.poll = setInterval(function () {
    if (document.hidden) return;
    if (drawer.classList.contains('open')) return;
    fetch('/api/board', { cache: 'no-store' })
      .then(function (response) { return response.json(); })
      .then(function (body) {
        state.data = body;
        meta.textContent = body.summary.total + ' tasks · ' + body.summary.counts.needs + ' needs you · ' + body.summary.counts.running + ' running';
        render();
      })
      .catch(function () {});
  }, 4000);
})();
</script>
</body>
</html>
`
}
