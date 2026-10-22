// Every action the page can send to POST /api/action. Exported so the static
// UI test can prove the page covers the whole v0.3 vocabulary without parsing
// the inline script.
export const UI_ACTIONS = Object.freeze([
  'project.create',
  'project.update',
  'project.archive',
  'project.restore',
  'task.create',
  'task.update',
  'task.move',
  'task.block',
  'task.unblock',
  'task.ask',
  'task.answer',
  'task.approve',
  'task.reject',
  'task.comment',
  'attachment.add',
  'attachment.remove',
])

// The entire visible interface lives here. The page embeds both dictionaries,
// so every static label and every dynamic message can be switched at runtime.
export const STRINGS = Object.freeze({
  en: Object.freeze({
    'app.title': 'Codex Kanban',
    'app.loading': 'Loading…',
    'app.loadFailed': 'Could not load the board: {code}: {message}',
    'header.allProjects': 'All projects',
    'header.project': 'Project',
    'header.projects': 'Projects',
    'header.searchPlaceholder': 'Search tasks',
    'header.searchLabel': 'Search tasks',
    'header.newTask': 'New task',
    'header.refresh': 'Refresh',
    'header.langToggle': '中文',
    'header.langLabel': 'Switch to Chinese',
    'counts.tasks': '{n} tasks',
    'counts.running': '{n} running',
    'counts.needs': '{n} needs you',
    'counts.done': '{n} done',
    'counts.contextAll': 'All projects · {n} projects',
    'counts.contextProject': '{name} · {path}',
    'counts.contextProjectNoPath': '{name} · {n} tasks',
    'project.archivedSuffix': ' (archived)',
    'project.taskCount': '{n} tasks · {open} open',
    'filter.toolbar': 'Filters',
    'filter.priority': 'All priorities',
    'filter.label': 'All labels',
    'filter.assignee': 'All assignees',
    'filter.clear': 'Clear filters',
    'filter.showing': 'Showing {visible} of {total}',
    'filter.none': 'No tasks match the current filters.',
    'priority.none': 'None',
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    'columns.backlog': 'Backlog',
    'columns.running': 'Running',
    'columns.needs': 'Needs you',
    'columns.done': 'Done',
    'columns.empty.backlog': 'Not started yet.',
    'columns.empty.running': 'Work in progress appears here.',
    'columns.empty.needs': 'Nothing needs you right now.',
    'columns.empty.done': 'Shipped and closed.',
    'columns.collapse': 'Collapse {column}',
    'columns.expand': 'Expand {column}',
    'columns.notDropTarget': 'Needs you is not a drop target',
    'card.open': 'Open {id}: {title}',
    'card.version': 'v{n}',
    'card.files': '{n} files',
    'card.comments': '{n} comments',
    'card.attention.question': 'question',
    'card.attention.blocked': 'blocked',
    'card.attention.review': 'review',
    'card.unassigned': 'unassigned',
    'status.backlog': 'backlog',
    'status.todo': 'todo',
    'status.in_progress': 'in progress',
    'status.in_review': 'in review',
    'status.done': 'done',
    'status.canceled': 'canceled',
    'age.seconds': '{n}s',
    'age.minutes': '{n}m',
    'age.hours': '{n}h',
    'age.days': '{n}d',
    'toast.networkError': 'The board did not answer. Check the server and retry.',
    'toast.refreshed': 'Board refreshed',
    'toast.projectCreated': 'Project created',
    'toast.projectRenamed': 'Project renamed',
    'toast.projectArchived': 'Project archived',
    'toast.projectRestored': 'Project restored',
    'newTask.title': 'New task',
    'newTask.titleLabel': 'Title',
    'newTask.titlePlaceholder': 'What needs doing?',
    'newTask.descriptionLabel': 'Description',
    'newTask.descriptionPlaceholder': 'Context, acceptance criteria, notes…',
    'newTask.project': 'Project',
    'newTask.priority': 'Priority',
    'newTask.labels': 'Labels (comma separated)',
    'newTask.labelsPlaceholder': 'ui, docs',
    'newTask.create': 'Create task',
    'newTask.cancel': 'Cancel',
    'newTask.noActiveProject': 'Create an active project before adding tasks.',
    'newTask.created': 'Task created',
    'project.title': 'Projects',
    'project.createTitle': 'Create project',
    'project.name': 'Name',
    'project.namePlaceholder': 'Website',
    'project.prefix': 'Prefix (optional)',
    'project.prefixPlaceholder': 'WEB',
    'project.prefixHint': '2–6 uppercase letters or digits',
    'project.workspacePath': 'Workspace path (optional)',
    'project.workspacePathPlaceholder': '/path/to/repo',
    'project.create': 'Create project',
    'project.listTitle': 'Existing projects',
    'project.rename': 'Rename',
    'project.archive': 'Archive',
    'project.restore': 'Restore',
    'project.archived': 'Archived',
    'project.active': 'Active',
    'project.renamePrompt': 'New name for {name}',
    'project.archiveConfirm': 'Archive {name}? Its tasks become read-only until restored.',
    'project.close': 'Close',
    'project.readOnly': 'This project is archived. Task and attachment changes are disabled until you restore it.',
    'project.restoreSelected': 'Restore project',
    'project.none': 'No projects yet. Create one to start.',
    'shortcuts.hint': 'Press / to search, n for a new task, Esc to close.',
    'shortcuts.label': 'Keyboard shortcuts',
    'drawer.title': 'Task details',
    'drawer.close': 'Close',
    'drawer.version': 'Version {n}',
    'drawer.readOnly': 'This task belongs to an archived project and is read-only.',
    'drawer.details': 'Details',
    'drawer.titleField': 'Title',
    'drawer.description': 'Description',
    'drawer.priority': 'Priority',
    'drawer.labels': 'Labels (comma separated)',
    'drawer.labelsPlaceholder': 'ui, docs',
    'drawer.links': 'Links',
    'drawer.linksEmpty': 'No links yet.',
    'drawer.linkLabel': 'Label',
    'drawer.linkUrl': 'URL',
    'drawer.linkUrlPlaceholder': 'example.com/spec',
    'drawer.addLink': 'Add link',
    'drawer.removeLink': 'Remove link',
    'drawer.linkIncomplete': 'Every link needs a label and a URL.',
    'drawer.save': 'Save changes',
    'drawer.saved': 'Task saved',
    'drawer.activity': 'Activity',
    'drawer.activityEmpty': 'No activity yet.',
    'drawer.comments': 'Comments',
    'drawer.commentsEmpty': 'No comments yet.',
    'drawer.commentPlaceholder': 'Add a comment',
    'drawer.addComment': 'Add comment',
    'drawer.commentAdded': 'Comment added',
    'drawer.commentRequired': 'Write a comment first.',
    'drawer.attachments': 'Attachments',
    'drawer.attachmentsEmpty': 'No attachments.',
    'drawer.upload': 'Upload file',
    'drawer.attachmentHint': 'Up to 10 MB per file.',
    'drawer.attachmentTooLarge': 'This file is larger than 10 MB and was not uploaded.',
    'drawer.attachmentReadError': 'This file could not be read.',
    'drawer.attachmentUploaded': 'Attachment uploaded',
    'drawer.attachmentRemoved': 'Attachment removed',
    'drawer.removeAttachmentConfirm': 'Remove {name}?',
    'drawer.download': 'Download {name}',
    'drawer.delete': 'Delete',
    'drawer.sizeBytes': '{n} B',
    'drawer.sizeKb': '{n} KB',
    'drawer.sizeMb': '{n} MB',
    'drawer.question': 'Needs your decision',
    'drawer.ask': 'Ask a question',
    'drawer.askPrompt': 'Question for the human?',
    'drawer.askOptionsPrompt': 'Options, one per line. Use label | detail for extra context.',
    'drawer.askOptionsRequired': 'Provide at least two options.',
    'drawer.asked': 'Question posted',
    'drawer.review': 'This task is waiting for review.',
    'drawer.answerHint': 'Record an answer, then approve or reject.',
    'drawer.answerNotePlaceholder': 'Optional note',
    'drawer.answer': 'Record answer',
    'drawer.answered': 'Answer recorded',
    'drawer.answerRequired': 'Select an option first.',
    'drawer.approve': 'Approve',
    'drawer.reject': 'Reject',
    'drawer.approveConfirm': 'Approve {id} and move it to Done?',
    'drawer.rejectConfirm': 'Reject {id} back to the backlog?',
    'drawer.decisionNotePrompt': 'Optional decision note for {id}',
    'drawer.approved': 'Task approved',
    'drawer.rejected': 'Task rejected',
    'drawer.resolution': 'Resolved: {decision}{option}.',
    'drawer.resolutionOption': ' · {option}',
    'drawer.decisionApprove': 'approved',
    'drawer.decisionReject': 'rejected',
    'drawer.blocker': 'Blocker',
    'drawer.blockedSince': 'Blocked since {time}',
    'drawer.block': 'Block',
    'drawer.updateBlocker': 'Update blocker',
    'drawer.unblock': 'Unblock',
    'drawer.blockPrompt': 'What is blocking {id}?',
    'drawer.blockReasonRequired': 'A blocker reason is required.',
    'drawer.unblocked': 'Blocker cleared',
    'drawer.blocked': 'Blocker saved',
    'drawer.move': 'Move',
    'drawer.moveTo': 'Move to {column}',
    'drawer.moved': 'Moved to {column}',
    'drawer.project': 'Project',
    'drawer.assignee': 'Assignee',
    'drawer.status': 'Status: {status}',
    'drawer.created': 'Created {time}',
    'drawer.selected': 'Selected: {option}',
    'drawer.noOptions': 'No options.',
  }),
  zh: Object.freeze({
    'app.title': 'Codex Kanban',
    'app.loading': '加载中…',
    'app.loadFailed': '看板加载失败：{code}: {message}',
    'header.allProjects': '全部项目',
    'header.project': '项目',
    'header.projects': '项目管理',
    'header.searchPlaceholder': '搜索任务',
    'header.searchLabel': '搜索任务',
    'header.newTask': '新建任务',
    'header.refresh': '刷新',
    'header.langToggle': 'EN',
    'header.langLabel': '切换到英文',
    'counts.tasks': '{n} 个任务',
    'counts.running': '{n} 个进行中',
    'counts.needs': '{n} 个需要你',
    'counts.done': '{n} 个已完成',
    'counts.contextAll': '全部项目 · {n} 个项目',
    'counts.contextProject': '{name} · {path}',
    'counts.contextProjectNoPath': '{name} · {n} 个任务',
    'project.archivedSuffix': '（已归档）',
    'project.taskCount': '{n} 个任务 · {open} 个未完成',
    'filter.toolbar': '筛选',
    'filter.priority': '全部优先级',
    'filter.label': '全部标签',
    'filter.assignee': '全部负责人',
    'filter.clear': '清除筛选',
    'filter.showing': '显示 {visible} / {total}',
    'filter.none': '没有任务匹配当前筛选。',
    'priority.none': '无',
    'priority.low': '低',
    'priority.medium': '中',
    'priority.high': '高',
    'priority.urgent': '紧急',
    'columns.backlog': '待办',
    'columns.running': '进行中',
    'columns.needs': '需要你',
    'columns.done': '已完成',
    'columns.empty.backlog': '尚未开始。',
    'columns.empty.running': '进行中的工作会显示在这里。',
    'columns.empty.needs': '当前没有需要你处理的事项。',
    'columns.empty.done': '已交付并关闭。',
    'columns.collapse': '折叠{column}',
    'columns.expand': '展开{column}',
    'columns.notDropTarget': '“需要你”不是拖放目标',
    'card.open': '打开 {id}：{title}',
    'card.version': '版本 {n}',
    'card.files': '{n} 个文件',
    'card.comments': '{n} 条评论',
    'card.attention.question': '待回答',
    'card.attention.blocked': '已阻塞',
    'card.attention.review': '待审核',
    'card.unassigned': '未分配',
    'status.backlog': '待办',
    'status.todo': '待处理',
    'status.in_progress': '进行中',
    'status.in_review': '审核中',
    'status.done': '已完成',
    'status.canceled': '已取消',
    'age.seconds': '{n}秒',
    'age.minutes': '{n}分',
    'age.hours': '{n}小时',
    'age.days': '{n}天',
    'toast.networkError': '看板没有响应，请检查服务后重试。',
    'toast.refreshed': '看板已刷新',
    'toast.projectCreated': '项目已创建',
    'toast.projectRenamed': '项目已重命名',
    'toast.projectArchived': '项目已归档',
    'toast.projectRestored': '项目已恢复',
    'newTask.title': '新建任务',
    'newTask.titleLabel': '标题',
    'newTask.titlePlaceholder': '需要做什么？',
    'newTask.descriptionLabel': '描述',
    'newTask.descriptionPlaceholder': '背景、验收标准、备注…',
    'newTask.project': '项目',
    'newTask.priority': '优先级',
    'newTask.labels': '标签（逗号分隔）',
    'newTask.labelsPlaceholder': '界面, 文档',
    'newTask.create': '创建任务',
    'newTask.cancel': '取消',
    'newTask.noActiveProject': '请先创建一个活跃项目，再添加任务。',
    'newTask.created': '任务已创建',
    'project.title': '项目',
    'project.createTitle': '新建项目',
    'project.name': '名称',
    'project.namePlaceholder': '网站',
    'project.prefix': '前缀（可选）',
    'project.prefixPlaceholder': 'WEB',
    'project.prefixHint': '2–6 位大写字母或数字',
    'project.workspacePath': '工作区路径（可选）',
    'project.workspacePathPlaceholder': '/path/to/repo',
    'project.create': '新建项目',
    'project.listTitle': '现有项目',
    'project.rename': '重命名',
    'project.archive': '归档',
    'project.restore': '恢复',
    'project.archived': '已归档',
    'project.active': '活跃',
    'project.renamePrompt': '为 {name} 输入新名称',
    'project.archiveConfirm': '归档 {name}？在恢复之前，其任务将变为只读。',
    'project.close': '关闭',
    'project.readOnly': '该项目已归档。恢复之前，任务和附件修改均被禁用。',
    'project.restoreSelected': '恢复项目',
    'project.none': '还没有项目，先创建一个。',
    'shortcuts.hint': '按 / 搜索，n 新建任务，Esc 关闭。',
    'shortcuts.label': '键盘快捷键',
    'drawer.title': '任务详情',
    'drawer.close': '关闭',
    'drawer.version': '版本 {n}',
    'drawer.readOnly': '此任务属于已归档项目，为只读状态。',
    'drawer.details': '详情',
    'drawer.titleField': '标题',
    'drawer.description': '描述',
    'drawer.priority': '优先级',
    'drawer.labels': '标签（逗号分隔）',
    'drawer.labelsPlaceholder': '界面, 文档',
    'drawer.links': '链接',
    'drawer.linksEmpty': '暂无链接。',
    'drawer.linkLabel': '名称',
    'drawer.linkUrl': '网址',
    'drawer.linkUrlPlaceholder': 'example.com/spec',
    'drawer.addLink': '添加链接',
    'drawer.removeLink': '移除链接',
    'drawer.linkIncomplete': '每个链接都需要名称和网址。',
    'drawer.save': '保存更改',
    'drawer.saved': '任务已保存',
    'drawer.activity': '动态',
    'drawer.activityEmpty': '暂无动态。',
    'drawer.comments': '评论',
    'drawer.commentsEmpty': '暂无评论。',
    'drawer.commentPlaceholder': '添加评论',
    'drawer.addComment': '添加评论',
    'drawer.commentAdded': '评论已添加',
    'drawer.commentRequired': '请先填写评论。',
    'drawer.attachments': '附件',
    'drawer.attachmentsEmpty': '暂无附件。',
    'drawer.upload': '上传文件',
    'drawer.attachmentHint': '每个文件最大 10 MB。',
    'drawer.attachmentTooLarge': '文件超过 10 MB，未上传。',
    'drawer.attachmentReadError': '无法读取该文件。',
    'drawer.attachmentUploaded': '附件已上传',
    'drawer.attachmentRemoved': '附件已删除',
    'drawer.removeAttachmentConfirm': '移除 {name}？',
    'drawer.download': '下载 {name}',
    'drawer.delete': '删除',
    'drawer.sizeBytes': '{n} B',
    'drawer.sizeKb': '{n} KB',
    'drawer.sizeMb': '{n} MB',
    'drawer.question': '需要你决定',
    'drawer.ask': '提出问题',
    'drawer.askPrompt': '要向人类提出的问题？',
    'drawer.askOptionsPrompt': '选项，每行一个。使用“名称 | 说明”补充细节。',
    'drawer.askOptionsRequired': '至少需要两个选项。',
    'drawer.asked': '问题已提出',
    'drawer.review': '此任务等待审核。',
    'drawer.answerHint': '先记录答案，再批准或拒绝。',
    'drawer.answerNotePlaceholder': '可选备注',
    'drawer.answer': '记录答案',
    'drawer.answered': '答案已记录',
    'drawer.answerRequired': '请先选择一个选项。',
    'drawer.approve': '批准',
    'drawer.reject': '拒绝',
    'drawer.approveConfirm': '批准 {id} 并移动到“已完成”？',
    'drawer.rejectConfirm': '拒绝 {id} 并退回待办？',
    'drawer.decisionNotePrompt': '为 {id} 填写可选的决定备注',
    'drawer.approved': '任务已批准',
    'drawer.rejected': '任务已拒绝',
    'drawer.resolution': '处理结果：{decision}{option}。',
    'drawer.resolutionOption': ' · {option}',
    'drawer.decisionApprove': '已批准',
    'drawer.decisionReject': '已拒绝',
    'drawer.blocker': '阻塞',
    'drawer.blockedSince': '自 {time} 起阻塞',
    'drawer.block': '标记阻塞',
    'drawer.updateBlocker': '更新阻塞原因',
    'drawer.unblock': '解除阻塞',
    'drawer.blockPrompt': '是什么阻塞了 {id}？',
    'drawer.blockReasonRequired': '必须填写阻塞原因。',
    'drawer.unblocked': '阻塞已解除',
    'drawer.blocked': '阻塞已记录',
    'drawer.move': '移动',
    'drawer.moveTo': '移动到{column}',
    'drawer.moved': '已移动到{column}',
    'drawer.project': '项目',
    'drawer.assignee': '负责人',
    'drawer.status': '状态：{status}',
    'drawer.created': '创建于 {time}',
    'drawer.selected': '已选择：{option}',
    'drawer.noOptions': '没有选项。',
  }),
})

export const I18N_KEYS = Object.freeze(Object.keys(STRINGS.en))

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;'
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '"') return '&quot;'
    return '&#39;'
  })
}

export function renderLiveHtml({ project = {} } = {}) {
  const projectName = typeof project?.name === 'string' ? project.name : ''
  const title = projectName ? `Codex Kanban · ${projectName}` : 'Codex Kanban'
  const initialContext = projectName ? escapeHtml(projectName) : 'All projects'
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="referrer" content="no-referrer" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: light-dark(#f3f5f8, #0b0f15);
    --surface: light-dark(#ffffff, #141b24);
    --surface-2: light-dark(#eef1f5, #1a2330);
    --surface-3: light-dark(#e4e9ef, #202b3a);
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
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.45; }
  body.drawer-open { overflow: hidden; }
  .shell { max-width: 1320px; margin: 0 auto; padding: 20px 20px 60px; }
  h1, h2, h3, h4 { letter-spacing: -0.01em; }
  .shell > header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 4px 2px 12px; }
  .brand h1 { font-size: 19px; margin: 0; }
  .brand .meta { color: var(--muted); font-size: 12px; margin: 2px 0 0; overflow-wrap: anywhere; }
  .header-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto; }
  .header-controls input[type="search"] { width: min(240px, 42vw); }
  .counts { color: var(--muted); font-size: 12px; padding: 0 2px 12px; }
  input, select, textarea {
    font: inherit; color: var(--text); background: var(--surface);
    border: 1px solid var(--border); border-radius: 9px; padding: 6px 9px;
  }
  input[type="search"] { -webkit-appearance: none; }
  textarea { width: 100%; min-height: 68px; resize: vertical; }
  input:focus-visible, select:focus-visible, textarea:focus-visible,
  button:focus-visible, a:focus-visible, article.card:focus-visible {
    outline: 2px solid var(--accent); outline-offset: 2px;
  }
  button {
    font: inherit; border: 1px solid var(--border); background: var(--surface);
    color: var(--text); border-radius: 9px; padding: 6px 11px; cursor: pointer;
  }
  button:hover:not(:disabled) { border-color: var(--accent); }
  button.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-contrast); font-weight: 600; }
  button.danger { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 45%, var(--border)); }
  button:disabled { opacity: 0.45; cursor: default; }
  a { color: var(--accent); }
  .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 2px 14px; }
  .toolbar select { max-width: 200px; }
  .toolbar .spacer { flex: 1; }
  .spacer { flex: 1; }
  .hint { color: var(--muted); font-size: 11.5px; margin: 0; }
  .error { color: var(--danger); font-size: 12px; margin: 4px 0 0; }
  .banner {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    border: 1px solid color-mix(in oklab, var(--needs) 55%, var(--border));
    background: color-mix(in oklab, var(--needs) 10%, var(--surface));
    color: var(--text); border-radius: 10px; padding: 9px 12px; margin: 0 2px 14px; font-size: 12.5px;
  }
  .banner[hidden] { display: none; }
  .banner span { flex: 1; min-width: 200px; }
  .board { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 14px; }
  @media (min-width: 600px) { .board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (min-width: 980px) { .board { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  section.column {
    background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 180px;
  }
  section.column[data-column="needs"] { outline: 1px solid color-mix(in oklab, var(--needs) 45%, transparent); }
  section.column.dragover { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, var(--surface-2)); }
  section.column[data-collapsed="true"] { min-height: 0; align-self: start; }
  section.column[data-collapsed="true"] .cards,
  section.column[data-collapsed="true"] .column-empty { display: none; }
  .column-head { display: flex; align-items: center; gap: 8px; padding: 2px 4px; }
  .column-head h2 { font-size: 11.5px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--muted); margin: 0; }
  .column-head button.collapse { border: 0; background: transparent; color: var(--muted); padding: 2px 4px; font-size: 12px; }
  .column-head .count { margin-left: auto; font-size: 11px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 1px 8px; }
  .cards { display: flex; flex-direction: column; gap: 8px; }
  .column-empty { color: var(--muted); font-size: 12px; padding: 12px 6px; margin: 0; }
  .column-empty[hidden] { display: none; }
  article.card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px; display: grid; gap: 6px; cursor: grab;
    box-shadow: 0 1px 2px light-dark(rgba(16,24,40,0.05), rgba(0,0,0,0.35));
  }
  article.card[data-column="needs"] { cursor: pointer; }
  article.card[draggable="true"]:active { cursor: grabbing; }
  article.card:hover { border-color: var(--accent); }
  article.card.dragging { opacity: 0.5; }
  .card-top { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .identifier { font-size: 11px; font-weight: 650; color: var(--muted); }
  .age, .version { font-size: 10.5px; color: var(--muted); }
  .version { margin-left: auto; border: 1px solid var(--border); border-radius: 999px; padding: 0 6px; }
  .card-title { margin: 0; font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
  .badges { display: flex; flex-wrap: wrap; gap: 5px; }
  .badge {
    font-size: 10.5px; padding: 1px 7px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--muted); background: var(--surface-2);
  }
  .badge.priority-high, .badge.priority-urgent { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 40%, var(--border)); }
  .badge.attention-question, .badge.attention-blocked { color: var(--needs); border-color: color-mix(in oklab, var(--needs) 45%, var(--border)); }
  .badge.attention-review { color: var(--accent); }
  .badge.project { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-note { margin: 0; font-size: 12px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.35); opacity: 0; pointer-events: none;
    transition: opacity 120ms; z-index: 9;
  }
  .backdrop.open { opacity: 1; pointer-events: auto; }
  aside.drawer {
    position: fixed; top: 0; right: 0; bottom: 0; width: min(520px, 100%);
    background: var(--surface); border-left: 1px solid var(--border); z-index: 10;
    transform: translateX(100%); transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1);
    display: flex; flex-direction: column;
  }
  aside.drawer.open { transform: translateX(0); }
  .drawer-head { display: flex; align-items: flex-start; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .drawer-head h2 { margin: 0; font-size: 15px; overflow-wrap: anywhere; }
  .drawer-sub { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 0; color: var(--muted); font-size: 11.5px; }
  .drawer-head #drawer-close { margin-left: auto; border: 0; background: transparent; font-size: 18px; color: var(--muted); }
  .drawer-body { padding: 14px 16px 40px; overflow: auto; display: grid; gap: 14px; align-content: start; }
  .panel { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: var(--surface-2); display: grid; gap: 8px; }
  .panel[hidden] { display: none; }
  .panel h3 { margin: 0; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .panel h4 { margin: 2px 0 0; font-size: 11.5px; color: var(--muted); }
  .panel label { font-size: 11.5px; color: var(--muted); display: grid; gap: 3px; }
  .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .link-row { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr) auto; gap: 6px; align-items: center; }
  .link-row input { min-width: 0; }
  .feed { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .feed-item { display: grid; gap: 1px; border-left: 2px solid var(--border); padding-left: 8px; }
  .feed-summary { font-size: 12px; overflow-wrap: anywhere; }
  .feed-note { font-size: 12px; margin: 2px 0 0; overflow-wrap: anywhere; }
  .attachment { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .attachment .attachment-name { font-size: 12px; overflow-wrap: anywhere; }
  .attachment .hint { flex: 1; min-width: 110px; }
  .attachment button { padding: 3px 8px; font-size: 11.5px; }
  .option {
    display: flex; gap: 8px; align-items: flex-start; padding: 7px 9px;
    border: 1px solid var(--border); border-radius: 8px; background: var(--surface); cursor: pointer;
  }
  .option:has(input:checked) { border-color: var(--accent); }
  .option-text { display: grid; gap: 1px; }
  .option-label { font-size: 12.5px; }
  dialog {
    border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);
    color: var(--text); padding: 0; width: min(560px, calc(100vw - 28px)); max-height: calc(100vh - 40px);
  }
  dialog#project-dialog { width: min(660px, calc(100vw - 28px)); }
  dialog::backdrop { background: rgba(0,0,0,0.45); }
  dialog form, dialog .dialog-body { padding: 16px; display: grid; gap: 10px; }
  .dialog-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
  .dialog-head h2 { margin: 0; font-size: 16px; }
  .dialog-head button { margin-left: auto; border: 0; background: transparent; color: var(--muted); font-size: 18px; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
  .project-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .project-row { border: 1px solid var(--border); border-radius: 10px; padding: 9px 10px; display: grid; gap: 4px; background: var(--surface-2); }
  .project-row .project-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .project-row .project-name { font-weight: 600; font-size: 13px; }
  .project-row .actions { margin-top: 2px; }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }
  .toast {
    position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 8px);
    background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 999px;
    font-size: 12px; opacity: 0; transition: 140ms; pointer-events: none; z-index: 20;
    max-width: min(560px, calc(100vw - 32px));
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
  .toast.error { background: var(--danger); color: #fff; }
  .shortcuts { padding: 16px 2px 0; }
  .readonly article.card { cursor: pointer; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
  .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after {
    transition: none !important; animation: none !important;
  }
</style>
</head>
<body>
<div class="shell">
  <header>
    <div class="brand">
      <h1 id="board-title">Codex Kanban</h1>
      <p class="meta" id="board-context">${initialContext}</p>
    </div>
    <div class="header-controls">
      <label class="sr-only" for="project-select" data-i18n="header.project">Project</label>
      <select id="project-select" data-i18n-aria="header.project" aria-label="Project">
        <option value="all">All projects</option>
      </select>
      <input id="search" type="search" data-i18n-placeholder="header.searchPlaceholder" data-i18n-aria="header.searchLabel" placeholder="Search tasks" aria-label="Search tasks" autocomplete="off" />
      <button id="manage-projects" type="button" data-i18n="header.projects">Projects</button>
      <button id="new-task" class="primary" type="button" data-i18n="header.newTask">New task</button>
      <button id="refresh" type="button" data-i18n="header.refresh">Refresh</button>
      <button id="lang-toggle" type="button" data-i18n="header.langToggle" data-i18n-aria="header.langLabel" aria-label="Switch to Chinese">中文</button>
    </div>
  </header>

  <div class="counts" id="counts" aria-live="polite" data-i18n="app.loading">Loading…</div>

  <div class="banner" id="readonly-banner" role="status" hidden>
    <span data-i18n="project.readOnly">This project is archived. Task and attachment changes are disabled until you restore it.</span>
    <button id="restore-selected" type="button" data-i18n="project.restoreSelected">Restore project</button>
  </div>

  <div class="toolbar" role="toolbar" data-i18n-aria="filter.toolbar" aria-label="Filters">
    <label class="sr-only" for="filter-priority" data-i18n="filter.priority">All priorities</label>
    <select id="filter-priority" aria-label="Priority">
      <option value="">All priorities</option>
    </select>
    <label class="sr-only" for="filter-label" data-i18n="filter.label">All labels</label>
    <select id="filter-label" aria-label="Label">
      <option value="">All labels</option>
    </select>
    <label class="sr-only" for="filter-assignee" data-i18n="filter.assignee">All assignees</label>
    <select id="filter-assignee" aria-label="Assignee">
      <option value="">All assignees</option>
    </select>
    <button id="clear-filters" type="button" data-i18n="filter.clear">Clear filters</button>
    <span class="spacer"></span>
    <span class="hint" id="filter-count" aria-live="polite"></span>
  </div>

  <main class="board" id="board">
    <section class="column" data-column="backlog" data-collapsed="false">
      <div class="column-head">
        <button class="collapse" type="button" data-collapse="backlog" aria-expanded="true" aria-controls="cards-backlog" aria-label="Collapse Backlog">▾</button>
        <h2 data-i18n="columns.backlog">Backlog</h2>
        <span class="count" data-count="backlog">0</span>
      </div>
      <div class="cards" id="cards-backlog"></div>
      <p class="column-empty" data-empty="backlog" data-i18n="columns.empty.backlog">Not started yet.</p>
    </section>
    <section class="column" data-column="running" data-collapsed="false">
      <div class="column-head">
        <button class="collapse" type="button" data-collapse="running" aria-expanded="true" aria-controls="cards-running" aria-label="Collapse Running">▾</button>
        <h2 data-i18n="columns.running">Running</h2>
        <span class="count" data-count="running">0</span>
      </div>
      <div class="cards" id="cards-running"></div>
      <p class="column-empty" data-empty="running" data-i18n="columns.empty.running">Work in progress appears here.</p>
    </section>
    <section class="column" data-column="needs" data-collapsed="false">
      <div class="column-head">
        <button class="collapse" type="button" data-collapse="needs" aria-expanded="true" aria-controls="cards-needs" aria-label="Collapse Needs you">▾</button>
        <h2 data-i18n="columns.needs">Needs you</h2>
        <span class="count" data-count="needs">0</span>
      </div>
      <div class="cards" id="cards-needs"></div>
      <p class="column-empty" data-empty="needs" data-i18n="columns.empty.needs">Nothing needs you right now.</p>
    </section>
    <section class="column" data-column="done" data-collapsed="false">
      <div class="column-head">
        <button class="collapse" type="button" data-collapse="done" aria-expanded="true" aria-controls="cards-done" aria-label="Collapse Done">▾</button>
        <h2 data-i18n="columns.done">Done</h2>
        <span class="count" data-count="done">0</span>
      </div>
      <div class="cards" id="cards-done"></div>
      <p class="column-empty" data-empty="done" data-i18n="columns.empty.done">Shipped and closed.</p>
    </section>
  </main>

  <footer class="shortcuts hint" data-i18n-aria="shortcuts.label" aria-label="Keyboard shortcuts">
    <span data-i18n="shortcuts.hint">Press / to search, n for a new task, Esc to close.</span>
  </footer>
</div>

<div class="backdrop" id="backdrop"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true">
  <div class="drawer-head">
    <div>
      <h2 id="drawer-title">Task details</h2>
      <p class="drawer-sub">
        <span id="drawer-identifier"></span>
        <span id="drawer-version">Version 1</span>
        <span id="drawer-project"></span>
      </p>
    </div>
    <button id="drawer-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <div class="drawer-body">
    <p class="banner" id="drawer-readonly" hidden data-i18n="drawer.readOnly">This task belongs to an archived project and is read-only.</p>

    <section class="panel">
      <h3 data-i18n="drawer.details">Details</h3>
      <label for="edit-title" data-i18n="drawer.titleField">Title</label>
      <input id="edit-title" type="text" maxlength="240" data-write />
      <label for="edit-description" data-i18n="drawer.description">Description</label>
      <textarea id="edit-description" data-write></textarea>
      <div class="row">
        <label for="edit-priority"><span data-i18n="drawer.priority">Priority</span>
          <select id="edit-priority" data-write>
            <option value="none" data-i18n="priority.none">None</option>
            <option value="low" data-i18n="priority.low">Low</option>
            <option value="medium" data-i18n="priority.medium">Medium</option>
            <option value="high" data-i18n="priority.high">High</option>
            <option value="urgent" data-i18n="priority.urgent">Urgent</option>
          </select>
        </label>
        <label for="edit-labels"><span data-i18n="drawer.labels">Labels (comma separated)</span>
          <input id="edit-labels" type="text" data-i18n-placeholder="drawer.labelsPlaceholder" placeholder="ui, docs" data-write />
        </label>
      </div>
      <h4 data-i18n="drawer.links">Links</h4>
      <div id="edit-links" class="feed"></div>
      <div class="actions">
        <button id="add-link" type="button" data-write data-i18n="drawer.addLink">Add link</button>
        <button id="save-task" class="primary" type="button" data-write data-i18n="drawer.save">Save changes</button>
      </div>
    </section>

    <section class="panel">
      <h3 data-i18n="drawer.activity">Activity</h3>
      <ol id="activity-list" class="feed"></ol>
      <p id="activity-empty" class="hint" hidden data-i18n="drawer.activityEmpty">No activity yet.</p>
    </section>

    <section class="panel">
      <h3 data-i18n="drawer.comments">Comments</h3>
      <ul id="comment-list" class="feed"></ul>
      <p id="comments-empty" class="hint" hidden data-i18n="drawer.commentsEmpty">No comments yet.</p>
      <textarea id="comment-body" data-i18n-placeholder="drawer.commentPlaceholder" placeholder="Add a comment" data-write></textarea>
      <div class="actions">
        <button id="add-comment" type="button" data-write data-i18n="drawer.addComment">Add comment</button>
      </div>
    </section>

    <section class="panel">
      <h3 data-i18n="drawer.attachments">Attachments</h3>
      <ul id="attachment-list" class="feed"></ul>
      <p id="attachment-empty" class="hint" hidden data-i18n="drawer.attachmentsEmpty">No attachments.</p>
      <label for="attachment-input" data-i18n="drawer.upload">Upload file</label>
      <input id="attachment-input" type="file" data-write />
      <p class="hint" data-i18n="drawer.attachmentHint">Up to 10 MB per file.</p>
      <p class="error" id="attachment-error" role="alert" hidden></p>
    </section>

    <section class="panel" id="question-section" hidden>
      <h3 data-i18n="drawer.question">Needs your decision</h3>
      <p class="feed-summary" id="question-prompt"></p>
      <p class="hint" id="question-note" hidden></p>
      <div id="question-options" class="feed" role="radiogroup" data-i18n-aria="drawer.question" aria-label="Needs your decision"></div>
      <textarea id="answer-note" data-i18n-placeholder="drawer.answerNotePlaceholder" placeholder="Optional note" data-write></textarea>
      <p class="hint" id="answer-hint" data-i18n="drawer.answerHint">Record an answer, then approve or reject.</p>
      <p class="hint" id="resolution" hidden></p>
      <div class="actions">
        <button id="answer-question" type="button" data-write data-i18n="drawer.answer">Record answer</button>
        <button id="approve" class="primary" type="button" data-write data-i18n="drawer.approve">Approve</button>
        <button id="reject" class="danger" type="button" data-write data-i18n="drawer.reject">Reject</button>
      </div>
    </section>

    <section class="panel" id="blocker-section" hidden>
      <h3 data-i18n="drawer.blocker">Blocker</h3>
      <p class="feed-summary" id="blocker-reason"></p>
      <p class="hint" id="blocker-since"></p>
    </section>

    <section class="panel">
      <h3 data-i18n="drawer.move">Move</h3>
      <div id="move-actions" class="actions"></div>
      <div class="actions">
        <button id="ask-task" type="button" data-write data-i18n="drawer.ask">Ask a question</button>
        <button id="block-task" type="button" data-write data-i18n="drawer.block">Block</button>
        <button id="unblock-task" type="button" data-write data-i18n="drawer.unblock">Unblock</button>
      </div>
      <p class="hint" id="drawer-status"></p>
    </section>
  </div>
</aside>

<dialog id="new-task-dialog" aria-labelledby="new-task-heading">
  <div class="dialog-head">
    <h2 id="new-task-heading" data-i18n="newTask.title">New task</h2>
    <button id="new-task-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <form id="new-task-form">
    <label for="new-task-title"><span data-i18n="newTask.titleLabel">Title</span>
      <input id="new-task-title" type="text" maxlength="240" required data-i18n-placeholder="newTask.titlePlaceholder" placeholder="What needs doing?" />
    </label>
    <label for="new-task-description"><span data-i18n="newTask.descriptionLabel">Description</span>
      <textarea id="new-task-description" data-i18n-placeholder="newTask.descriptionPlaceholder" placeholder="Context, acceptance criteria, notes…"></textarea>
    </label>
    <div class="row">
      <label for="new-task-project"><span data-i18n="newTask.project">Project</span>
        <select id="new-task-project"></select>
      </label>
      <label for="new-task-priority"><span data-i18n="newTask.priority">Priority</span>
        <select id="new-task-priority">
          <option value="none" data-i18n="priority.none">None</option>
          <option value="low" data-i18n="priority.low">Low</option>
          <option value="medium" data-i18n="priority.medium">Medium</option>
          <option value="high" data-i18n="priority.high">High</option>
          <option value="urgent" data-i18n="priority.urgent">Urgent</option>
        </select>
      </label>
    </div>
    <label for="new-task-labels"><span data-i18n="newTask.labels">Labels (comma separated)</span>
      <input id="new-task-labels" type="text" data-i18n-placeholder="newTask.labelsPlaceholder" placeholder="ui, docs" />
    </label>
    <div class="dialog-actions">
      <button id="new-task-cancel" type="button" data-i18n="newTask.cancel">Cancel</button>
      <button class="primary" type="submit" data-i18n="newTask.create">Create task</button>
    </div>
  </form>
</dialog>

<dialog id="project-dialog" aria-labelledby="project-heading">
  <div class="dialog-head">
    <h2 id="project-heading" data-i18n="project.title">Projects</h2>
    <button id="project-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <div class="dialog-body">
    <form id="project-form">
      <h3 data-i18n="project.createTitle">Create project</h3>
      <label for="project-name"><span data-i18n="project.name">Name</span>
        <input id="project-name" type="text" maxlength="120" required data-i18n-placeholder="project.namePlaceholder" placeholder="Website" />
      </label>
      <div class="row">
        <label for="project-prefix"><span data-i18n="project.prefix">Prefix (optional)</span>
          <input id="project-prefix" type="text" maxlength="6" data-i18n-placeholder="project.prefixPlaceholder" placeholder="WEB" />
        </label>
        <label for="project-workspace"><span data-i18n="project.workspacePath">Workspace path (optional)</span>
          <input id="project-workspace" type="text" data-i18n-placeholder="project.workspacePathPlaceholder" placeholder="/path/to/repo" />
        </label>
      </div>
      <p class="hint" data-i18n="project.prefixHint">2–6 uppercase letters or digits</p>
      <div class="actions">
        <button class="primary" type="submit" data-i18n="project.create">Create project</button>
      </div>
    </form>
    <h3 data-i18n="project.listTitle">Existing projects</h3>
    <ul id="project-list" class="project-list"></ul>
  </div>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  var API_BOARD = '/api/board';
  var API_ACTION = '/api/action';
  var ATTACHMENT_API = '/api/attachments/';
  var MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  var COLUMNS = ['backlog', 'running', 'needs', 'done'];
  var DRAG_COLUMNS = ['backlog', 'running', 'done'];
  var PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];
  var STATUS_COLUMN = {
    backlog: 'backlog',
    todo: 'backlog',
    in_progress: 'running',
    in_review: 'needs',
    done: 'done',
    canceled: null
  };
  var STORAGE = {
    lang: 'codex-kanban.lang',
    collapsed: 'codex-kanban.collapsed',
    project: 'codex-kanban.project'
  };
  var I18N = ${JSON.stringify(STRINGS)};

  function readLang() {
    var value = storeGet(STORAGE.lang, 'en');
    return value === 'zh' ? 'zh' : 'en';
  }

  function readCollapsed() {
    var raw = storeGet(STORAGE.collapsed, '[]');
    var parsed = [];
    try { parsed = JSON.parse(raw); } catch (error) { parsed = []; }
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (id) { return COLUMNS.indexOf(id) !== -1; });
  }

  function readProject() {
    var value = storeGet(STORAGE.project, 'all');
    return value || 'all';
  }

  function storeGet(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function storeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* storage is optional */ }
  }

  var state = {
    data: null,
    projectId: readProject(),
    search: '',
    priority: '',
    label: '',
    assignee: '',
    lang: readLang(),
    collapsed: readCollapsed(),
    selectedId: null,
    selectedOption: null,
    readOnly: false
  };

  var boardTitle = document.getElementById('board-title');
  var boardContext = document.getElementById('board-context');
  var counts = document.getElementById('counts');
  var projectSelect = document.getElementById('project-select');
  var searchInput = document.getElementById('search');
  var manageProjects = document.getElementById('manage-projects');
  var newTaskButton = document.getElementById('new-task');
  var refreshButton = document.getElementById('refresh');
  var langToggle = document.getElementById('lang-toggle');
  var readonlyBanner = document.getElementById('readonly-banner');
  var restoreSelected = document.getElementById('restore-selected');
  var filterPriority = document.getElementById('filter-priority');
  var filterLabel = document.getElementById('filter-label');
  var filterAssignee = document.getElementById('filter-assignee');
  var clearFilters = document.getElementById('clear-filters');
  var filterCount = document.getElementById('filter-count');
  var backdrop = document.getElementById('backdrop');
  var drawer = document.getElementById('drawer');
  var drawerClose = document.getElementById('drawer-close');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerIdentifier = document.getElementById('drawer-identifier');
  var drawerVersion = document.getElementById('drawer-version');
  var drawerProject = document.getElementById('drawer-project');
  var drawerReadonly = document.getElementById('drawer-readonly');
  var drawerStatus = document.getElementById('drawer-status');
  var editTitle = document.getElementById('edit-title');
  var editDescription = document.getElementById('edit-description');
  var editPriority = document.getElementById('edit-priority');
  var editLabels = document.getElementById('edit-labels');
  var editLinks = document.getElementById('edit-links');
  var addLinkButton = document.getElementById('add-link');
  var saveTaskButton = document.getElementById('save-task');
  var activityList = document.getElementById('activity-list');
  var activityEmpty = document.getElementById('activity-empty');
  var commentList = document.getElementById('comment-list');
  var commentsEmpty = document.getElementById('comments-empty');
  var commentBody = document.getElementById('comment-body');
  var addCommentButton = document.getElementById('add-comment');
  var attachmentList = document.getElementById('attachment-list');
  var attachmentEmpty = document.getElementById('attachment-empty');
  var attachmentInput = document.getElementById('attachment-input');
  var attachmentError = document.getElementById('attachment-error');
  var questionSection = document.getElementById('question-section');
  var questionPrompt = document.getElementById('question-prompt');
  var questionNote = document.getElementById('question-note');
  var questionOptions = document.getElementById('question-options');
  var answerNote = document.getElementById('answer-note');
  var answerButton = document.getElementById('answer-question');
  var answerHint = document.getElementById('answer-hint');
  var resolutionText = document.getElementById('resolution');
  var approveButton = document.getElementById('approve');
  var rejectButton = document.getElementById('reject');
  var blockerSection = document.getElementById('blocker-section');
  var blockerReason = document.getElementById('blocker-reason');
  var blockerSince = document.getElementById('blocker-since');
  var moveActions = document.getElementById('move-actions');
  var askButton = document.getElementById('ask-task');
  var blockButton = document.getElementById('block-task');
  var unblockButton = document.getElementById('unblock-task');
  var toast = document.getElementById('toast');
  var newTaskDialog = document.getElementById('new-task-dialog');
  var newTaskForm = document.getElementById('new-task-form');
  var newTaskTitle = document.getElementById('new-task-title');
  var newTaskDescription = document.getElementById('new-task-description');
  var newTaskProject = document.getElementById('new-task-project');
  var newTaskPriority = document.getElementById('new-task-priority');
  var newTaskLabels = document.getElementById('new-task-labels');
  var projectDialog = document.getElementById('project-dialog');
  var projectForm = document.getElementById('project-form');
  var projectNameInput = document.getElementById('project-name');
  var projectPrefixInput = document.getElementById('project-prefix');
  var projectWorkspaceInput = document.getElementById('project-workspace');
  var projectList = document.getElementById('project-list');

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    prefersReducedMotion = false;
  }
  if (prefersReducedMotion) document.documentElement.classList.add('reduced-motion');

  function t(key, vars) {
    var dictionary = I18N[state.lang] || I18N.en;
    var value = typeof dictionary[key] === 'string' ? dictionary[key] : I18N.en[key];
    if (typeof value !== 'string') value = key;
    if (vars) {
      for (var name in vars) {
        if (!Object.prototype.hasOwnProperty.call(vars, name)) continue;
        value = value.split('{' + name + '}').join(String(vars[name]));
      }
    }
    return value;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function button(label, className, handler) {
    var node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }

  function formatTime(iso) {
    if (!iso) return '';
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-CN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  function age(iso) {
    if (!iso) return '';
    var then = new Date(iso).getTime();
    if (!isFinite(then)) return '';
    var seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (seconds < 60) return t('age.seconds', { n: seconds });
    var minutes = Math.round(seconds / 60);
    if (minutes < 60) return t('age.minutes', { n: minutes });
    var hours = Math.round(minutes / 60);
    if (hours < 24) return t('age.hours', { n: hours });
    return t('age.days', { n: Math.round(hours / 24) });
  }

  function formatSize(bytes) {
    var size = Number(bytes) || 0;
    if (size >= 1024 * 1024) return t('drawer.sizeMb', { n: Math.round((size / (1024 * 1024)) * 10) / 10 });
    if (size >= 1024) return t('drawer.sizeKb', { n: Math.round(size / 1024) });
    return t('drawer.sizeBytes', { n: size });
  }

  function splitLabels(value) {
    return String(value || '').split(',').map(function (part) {
      return part.trim();
    }).filter(function (part) {
      return part.length > 0;
    });
  }

  function normalizeUrl(value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if (url.indexOf('://') === -1) url = 'http' + 's://' + url;
    return url;
  }

  function notify(message, isError) {
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    toast.setAttribute('role', isError ? 'alert' : 'status');
    if (notify.timer) clearTimeout(notify.timer);
    notify.timer = setTimeout(function () { toast.className = 'toast'; }, 3200);
  }

  function errorText(error) {
    var code = error && error.code ? error.code : 'ERROR';
    var message = error && error.message ? error.message : t('toast.networkError');
    return code + ': ' + message;
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholders.length; j += 1) {
      placeholders[j].setAttribute('placeholder', t(placeholders[j].getAttribute('data-i18n-placeholder')));
    }
    var labels = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < labels.length; k += 1) {
      labels[k].setAttribute('aria-label', t(labels[k].getAttribute('data-i18n-aria')));
    }
    langToggle.textContent = t('header.langToggle');
    langToggle.setAttribute('aria-label', t('header.langLabel'));
    boardTitle.textContent = t('app.title');
  }

  function projectById(id) {
    if (!state.data || !Array.isArray(state.data.projects)) return null;
    for (var i = 0; i < state.data.projects.length; i += 1) {
      if (state.data.projects[i].id === id) return state.data.projects[i];
    }
    return null;
  }

  function projectArchived(id) {
    var project = projectById(id);
    return Boolean(project && project.archivedAt);
  }

  function isWritable(task) {
    if (state.readOnly) return false;
    if (task && projectArchived(task.projectId)) return false;
    return true;
  }

  function currentTask() {
    if (!state.selectedId) return null;
    return findTask(state.selectedId);
  }

  function findTask(ref) {
    if (!state.data || !state.data.board || !ref) return null;
    var columns = state.data.board.columns || {};
    for (var i = 0; i < COLUMNS.length; i += 1) {
      var list = columns[COLUMNS[i]] || [];
      for (var j = 0; j < list.length; j += 1) {
        if (list[j].id === ref || list[j].identifier === ref) return list[j];
      }
    }
    return null;
  }

  function renderHeader() {
    var data = state.data;
    var project = data && data.board ? data.board.project : null;
    var name = project ? project.name : t('header.allProjects');
    document.title = t('app.title') + ' · ' + name;
    if (!data) {
      counts.textContent = t('app.loading');
      return;
    }
    var summary = data.summary || {};
    var columnCounts = summary.counts || {};
    counts.textContent = [
      t('counts.tasks', { n: summary.total || 0 }),
      t('counts.running', { n: columnCounts.running || 0 }),
      t('counts.needs', { n: columnCounts.needs || 0 }),
      t('counts.done', { n: columnCounts.done || 0 })
    ].join(' · ');
    boardContext.textContent = project
      ? (project.workspacePath
        ? t('counts.contextProject', { name: project.name, path: project.workspacePath })
        : t('counts.contextProjectNoPath', { name: project.name, n: summary.total || 0 }))
      : t('counts.contextAll', { n: (data.projects || []).length });
    readonlyBanner.hidden = !state.readOnly;
    newTaskButton.disabled = state.readOnly;
    document.body.classList.toggle('readonly', state.readOnly);
  }

  function renderProjectOptions() {
    var selected = state.projectId;
    var projects = (state.data && state.data.projects) || [];
    projectSelect.textContent = '';
    projectSelect.appendChild(new Option(t('header.allProjects'), 'all'));
    for (var i = 0; i < projects.length; i += 1) {
      var project = projects[i];
      var label = project.name + (project.archivedAt ? t('project.archivedSuffix') : '') + ' · ' + project.prefix;
      projectSelect.appendChild(new Option(label, project.id));
    }
    projectSelect.value = selected;
    if (projectSelect.value !== selected) {
      state.projectId = 'all';
      storeSet(STORAGE.project, 'all');
      projectSelect.value = 'all';
    }
  }

  function fillFilter(select, allLabel, values, current, labelOf) {
    select.textContent = '';
    select.appendChild(new Option(allLabel, ''));
    var keep = '';
    for (var i = 0; i < values.length; i += 1) {
      var value = values[i];
      select.appendChild(new Option(labelOf(value), value));
      if (value === current) keep = value;
    }
    select.value = keep;
    return keep;
  }

  function renderFilters() {
    var filters = (state.data && state.data.filters) || { labels: [], priorities: [], assignees: [] };
    state.priority = fillFilter(filterPriority, t('filter.priority'), filters.priorities || [], state.priority, function (value) {
      return t('priority.' + value);
    });
    state.label = fillFilter(filterLabel, t('filter.label'), filters.labels || [], state.label, function (value) {
      return value;
    });
    state.assignee = fillFilter(filterAssignee, t('filter.assignee'), filters.assignees || [], state.assignee, function (value) {
      return value;
    });
  }

  function hasFilters() {
    return Boolean(state.search.trim() || state.priority || state.label || state.assignee);
  }

  function matchesFilters(task) {
    if (state.priority && (task.priority || 'none') !== state.priority) return false;
    if (state.label) {
      var labels = Array.isArray(task.labels) ? task.labels : [];
      if (labels.indexOf(state.label) === -1) return false;
    }
    if (state.assignee) {
      var assignee = task.assignee && task.assignee.name ? task.assignee.name : '';
      if (assignee !== state.assignee) return false;
    }
    var search = state.search.trim().toLowerCase();
    if (!search) return true;
    var haystack = [
      task.identifier || '',
      task.title || '',
      task.description || '',
      (Array.isArray(task.labels) ? task.labels : []).join(' '),
      task.projectName || '',
      task.assignee && task.assignee.name ? task.assignee.name : ''
    ].join(' ').toLowerCase();
    return haystack.indexOf(search) !== -1;
  }

  function renderBoard() {
    var columns = (state.data && state.data.board && state.data.board.columns) || {};
    var totals = { visible: 0, total: 0 };
    for (var i = 0; i < COLUMNS.length; i += 1) {
      var id = COLUMNS[i];
      var section = document.querySelector('[data-column="' + id + '"]');
      var list = section.querySelector('.cards');
      var all = columns[id] || [];
      var visible = [];
      for (var j = 0; j < all.length; j += 1) {
        if (matchesFilters(all[j])) visible.push(all[j]);
      }
      totals.visible += visible.length;
      totals.total += all.length;
      list.textContent = '';
      for (var k = 0; k < visible.length; k += 1) {
        list.appendChild(renderCard(visible[k], id));
      }
      section.querySelector('[data-count]').textContent = String(visible.length);
      var empty = section.querySelector('[data-empty]');
      empty.hidden = visible.length > 0;
      empty.textContent = hasFilters() ? t('filter.none') : t('columns.empty.' + id);
      var collapsed = state.collapsed.indexOf(id) !== -1;
      section.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
      var collapse = section.querySelector('[data-collapse]');
      collapse.textContent = collapsed ? '▸' : '▾';
      collapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      collapse.setAttribute('aria-label', t(collapsed ? 'columns.expand' : 'columns.collapse', {
        column: t('columns.' + id)
      }));
    }
    filterCount.textContent = t('filter.showing', { visible: totals.visible, total: totals.total });
  }

  function renderCard(task, columnId) {
    var card = el('article', 'card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', t('card.open', { id: task.identifier, title: task.title }));
    card.setAttribute('data-column', columnId);
    card.setAttribute('data-task-id', task.id || '');
    card.setAttribute('data-identifier', task.identifier || '');
    card.setAttribute('data-version', String(task.version));
    var draggable = DRAG_COLUMNS.indexOf(columnId) !== -1 && isWritable(task);
    card.draggable = draggable;

    var top = el('div', 'card-top');
    top.appendChild(el('span', 'identifier', task.identifier));
    if (state.projectId === 'all' && task.projectName) {
      top.appendChild(el('span', 'badge project', task.projectName));
    }
    top.appendChild(el('span', 'age', age(task.statusSince || task.updatedAt)));
    top.appendChild(el('span', 'version', t('card.version', { n: task.version })));
    card.appendChild(top);
    card.appendChild(el('h3', 'card-title', task.title));

    var badges = el('div', 'badges');
    if (task.priority && task.priority !== 'none') {
      badges.appendChild(el('span', 'badge priority-' + task.priority, t('priority.' + task.priority)));
    }
    if (task.attention) {
      badges.appendChild(el('span', 'badge attention-' + task.attention, t('card.attention.' + task.attention)));
    }
    var labels = Array.isArray(task.labels) ? task.labels : [];
    for (var i = 0; i < labels.length; i += 1) badges.appendChild(el('span', 'badge', labels[i]));
    if (task.assignee && task.assignee.name) {
      badges.appendChild(el('span', 'badge', task.assignee.name));
    }
    if (Array.isArray(task.attachments) && task.attachments.length) {
      badges.appendChild(el('span', 'badge', t('card.files', { n: task.attachments.length })));
    }
    if (Array.isArray(task.comments) && task.comments.length) {
      badges.appendChild(el('span', 'badge', t('card.comments', { n: task.comments.length })));
    }
    if (badges.childElementCount) card.appendChild(badges);

    if (task.pendingQuestion && !task.questionResolution) {
      card.appendChild(el('p', 'card-note', task.pendingQuestion.prompt));
    } else if (task.blockedReason) {
      card.appendChild(el('p', 'card-note', task.blockedReason));
    } else if (task.description) {
      card.appendChild(el('p', 'card-note', task.description));
    }

    card.addEventListener('click', function () { openTask(task.id); });
    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTask(task.id);
        return;
      }
      if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
        && DRAG_COLUMNS.indexOf(columnId) !== -1) {
        var index = DRAG_COLUMNS.indexOf(columnId) + (event.key === 'ArrowRight' ? 1 : -1);
        if (index >= 0 && index < DRAG_COLUMNS.length) {
          event.preventDefault();
          moveTaskTo(task, DRAG_COLUMNS[index]);
        }
      }
    });
    if (draggable) {
      card.addEventListener('dragstart', function (event) {
        try {
          event.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, version: task.version }));
          event.dataTransfer.effectAllowed = 'move';
        } catch (error) { /* drag payload is best effort */ }
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () { card.classList.remove('dragging'); });
    }
    return card;
  }

  function bindDropTargets() {
    for (var i = 0; i < DRAG_COLUMNS.length; i += 1) {
      (function (columnId) {
        var section = document.querySelector('[data-column="' + columnId + '"]');
        section.addEventListener('dragover', function (event) {
          if (state.readOnly) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
          section.classList.add('dragover');
        });
        section.addEventListener('dragleave', function (event) {
          if (event.target === section) section.classList.remove('dragover');
        });
        section.addEventListener('drop', function (event) {
          event.preventDefault();
          section.classList.remove('dragover');
          dropOnColumn(columnId, event);
        });
      })(DRAG_COLUMNS[i]);
    }
  }

  function dropOnColumn(columnId, event) {
    var raw = '';
    try { raw = event.dataTransfer.getData('text/plain'); } catch (error) { return; }
    if (!raw) return;
    var payload = null;
    try { payload = JSON.parse(raw); } catch (error) { return; }
    if (!payload || !payload.id) return;
    var task = findTask(payload.id);
    if (task && !isWritable(task)) {
      notify(t('project.readOnly'), true);
      return;
    }
    act('task.move', { id: payload.id, version: payload.version, to: columnId }).then(function (body) {
      if (body) notify(t('drawer.moved', { column: t('columns.' + columnId) }));
    });
  }

  function renderAll() {
    renderHeader();
    renderProjectOptions();
    renderFilters();
    renderBoard();
    if (state.selectedId) {
      var task = currentTask();
      if (task) renderDrawer(task);
      else closeDrawer();
    }
    if (projectDialog.open) renderProjectList();
  }

  function applyPayload(payload) {
    if (!payload || payload.ok !== true) return;
    state.data = payload;
    state.readOnly = Boolean(payload.board && payload.board.project && payload.board.project.archivedAt);
    renderAll();
  }

  function act(action, payload) {
    if (state.readOnly && action.indexOf('project.') !== 0) {
      notify(errorText({ code: 'PROJECT_ARCHIVED', message: t('project.readOnly') }), true);
      return Promise.resolve(null);
    }
    var body = { action: action };
    if (payload) {
      for (var key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) body[key] = payload[key];
      }
    }
    return fetch(API_ACTION + '?project=' + encodeURIComponent(state.projectId), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (response) {
      return response.json().then(function (json) {
        if (!response.ok || !json.ok) {
          var error = new Error((json.error && json.error.message) || ('HTTP ' + response.status));
          error.code = (json.error && json.error.code) || ('HTTP_' + response.status);
          throw error;
        }
        return json;
      });
    }).then(function (json) {
      applyPayload(json);
      return json;
    }).catch(function (error) {
      handleError(error);
      return null;
    });
  }

  function handleError(error) {
    var code = error && error.code ? error.code : '';
    notify(errorText(error), true);
    if (code === 'PROJECT_NOT_FOUND' && state.projectId !== 'all') {
      state.projectId = 'all';
      storeSet(STORAGE.project, 'all');
      load(false);
    } else if (code === 'TASK_VERSION_CONFLICT' || code === 'PROJECT_ARCHIVED') {
      load(false);
    }
    return null;
  }

  function load(showToast) {
    return fetch(API_BOARD + '?project=' + encodeURIComponent(state.projectId), {
      cache: 'no-store',
      headers: { accept: 'application/json' }
    }).then(function (response) {
      return response.json().then(function (json) {
        if (!response.ok || !json.ok) {
          var error = new Error((json.error && json.error.message) || ('HTTP ' + response.status));
          error.code = (json.error && json.error.code) || ('HTTP_' + response.status);
          throw error;
        }
        return json;
      });
    }).then(function (json) {
      applyPayload(json);
      if (showToast) notify(t('toast.refreshed'));
    }).catch(handleError);
  }

  function openTask(ref) {
    var task = findTask(ref);
    if (!task) return;
    state.selectedId = task.id;
    state.selectedOption = null;
    renderDrawer(task);
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('open');
    document.body.classList.add('drawer-open');
    drawerClose.focus({ preventScroll: prefersReducedMotion ? false : true });
  }

  function closeDrawer() {
    state.selectedId = null;
    state.selectedOption = null;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
  }

  function renderDrawer(task) {
    if (!task) {
      closeDrawer();
      return;
    }
    var readOnly = !isWritable(task);
    var pendingQuestion = task.pendingQuestion && !task.questionResolution;
    drawerTitle.textContent = task.title || t('drawer.title');
    drawerIdentifier.textContent = task.identifier || '';
    drawerVersion.textContent = t('drawer.version', { n: task.version });
    drawerProject.textContent = task.projectName ? t('drawer.project') + ': ' + task.projectName : '';
    drawerReadonly.hidden = !readOnly;
    editTitle.value = task.title || '';
    editDescription.value = task.description || '';
    editPriority.value = task.priority || 'none';
    editLabels.value = (Array.isArray(task.labels) ? task.labels : []).join(', ');
    renderLinks(task);
    renderActivity(task);
    renderComments(task);
    renderAttachments(task);
    renderQuestion(task);
    renderBlocker(task);
    renderMoveActions(task);
    drawerStatus.textContent = t('drawer.status', {
      status: t('status.' + (task.status || 'backlog'))
    }) + ' · ' + t('drawer.assignee') + ': '
      + ((task.assignee && task.assignee.name) || t('card.unassigned'))
      + ' · ' + t('drawer.created', { time: formatTime(task.createdAt) });
    var writes = drawer.querySelectorAll('[data-write]');
    for (var i = 0; i < writes.length; i += 1) writes[i].disabled = readOnly;
    if (readOnly) {
      approveButton.disabled = true;
      rejectButton.disabled = true;
      answerButton.disabled = true;
    } else {
      updateQuestionButtons();
    }
    attachmentError.hidden = true;
  }

  function renderLinks(task) {
    editLinks.textContent = '';
    var links = Array.isArray(task.links) ? task.links : [];
    if (!links.length) {
      editLinks.appendChild(el('p', 'hint', t('drawer.linksEmpty')));
      return;
    }
    for (var i = 0; i < links.length; i += 1) editLinks.appendChild(linkRow(links[i]));
  }

  function linkRow(link) {
    var row = el('div', 'link-row');
    row.setAttribute('data-link-row', 'true');
    var label = document.createElement('input');
    label.type = 'text';
    label.className = 'link-label';
    label.value = link && link.label ? link.label : '';
    label.setAttribute('aria-label', t('drawer.linkLabel'));
    label.setAttribute('placeholder', t('drawer.linkLabel'));
    var url = document.createElement('input');
    url.type = 'text';
    url.className = 'link-url';
    url.value = link && link.url ? link.url : '';
    url.setAttribute('aria-label', t('drawer.linkUrl'));
    url.setAttribute('placeholder', t('drawer.linkUrlPlaceholder'));
    var remove = button('×', 'danger', function () {
      if (row.parentNode) row.parentNode.removeChild(row);
    });
    remove.setAttribute('aria-label', t('drawer.removeLink'));
    remove.title = t('drawer.removeLink');
    row.appendChild(label);
    row.appendChild(url);
    row.appendChild(remove);
    return row;
  }

  function addLink() {
    var empty = editLinks.querySelector('p.hint');
    if (empty) editLinks.removeChild(empty);
    var row = linkRow({ label: '', url: '' });
    editLinks.appendChild(row);
    var label = row.querySelector('.link-label');
    if (label) label.focus();
  }

  function renderActivity(task) {
    activityList.textContent = '';
    var activity = Array.isArray(task.activity) ? task.activity : [];
    var latest = activity.slice(-12);
    activityEmpty.hidden = latest.length > 0;
    for (var i = latest.length - 1; i >= 0; i -= 1) {
      var entry = latest[i] || {};
      var item = el('li', 'feed-item');
      item.appendChild(el('span', 'feed-summary', entry.summary || entry.kind || ''));
      var meta = el('span', 'hint');
      var actor = entry.actor && entry.actor.name ? entry.actor.name : '';
      meta.textContent = (actor ? actor + ' · ' : '') + formatTime(entry.at);
      item.appendChild(meta);
      activityList.appendChild(item);
    }
  }

  function renderComments(task) {
    commentList.textContent = '';
    var comments = Array.isArray(task.comments) ? task.comments : [];
    commentsEmpty.hidden = comments.length > 0;
    for (var i = 0; i < comments.length; i += 1) {
      var comment = comments[i] || {};
      var item = el('li', 'feed-item');
      item.appendChild(el('p', 'feed-note', comment.body || ''));
      var meta = el('span', 'hint');
      var author = comment.author && comment.author.name ? comment.author.name : '';
      meta.textContent = (author ? author + ' · ' : '') + formatTime(comment.createdAt);
      item.appendChild(meta);
      commentList.appendChild(item);
    }
    commentBody.value = '';
  }

  function renderAttachments(task) {
    attachmentList.textContent = '';
    var attachments = Array.isArray(task.attachments) ? task.attachments : [];
    attachmentEmpty.hidden = attachments.length > 0;
    for (var i = 0; i < attachments.length; i += 1) {
      (function (attachment) {
        var item = el('li', 'attachment');
        var link = el('a', 'attachment-name', attachment.filename);
        link.href = ATTACHMENT_API + encodeURIComponent(attachment.id);
        link.download = attachment.filename || '';
        link.setAttribute('aria-label', t('drawer.download', { name: attachment.filename }));
        item.appendChild(link);
        item.appendChild(el('span', 'hint', formatSize(attachment.size) + ' · ' + formatTime(attachment.createdAt)));
        var remove = button(t('drawer.delete'), 'danger', function () {
          removeAttachment(task, attachment);
        });
        remove.disabled = !isWritable(task);
        item.appendChild(remove);
        attachmentList.appendChild(item);
      })(attachments[i]);
    }
    attachmentInput.disabled = !isWritable(task);
  }

  function renderQuestion(task) {
    var pending = task.pendingQuestion && !task.questionResolution ? task.pendingQuestion : null;
    var resolution = task.questionResolution || null;
    var review = !pending && !resolution && task.attention === 'review';
    var show = Boolean(pending) || Boolean(resolution) || review;
    questionSection.hidden = !show;
    if (!show) return;
    questionPrompt.textContent = pending ? pending.prompt : (review ? t('drawer.review') : '');
    questionPrompt.hidden = !questionPrompt.textContent;
    var note = pending && pending.note ? pending.note : '';
    questionNote.hidden = !note;
    questionNote.textContent = note;
    questionOptions.textContent = '';
    state.selectedOption = pending && pending.selected ? pending.selected : null;
    if (pending) {
      var options = Array.isArray(pending.options) ? pending.options : [];
      for (var i = 0; i < options.length; i += 1) {
        (function (option) {
          var label = el('label', 'option');
          var radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'question-option';
          radio.value = option.id;
          radio.checked = pending.selected === option.id;
          radio.addEventListener('change', function () {
            state.selectedOption = option.id;
            updateQuestionButtons();
          });
          label.appendChild(radio);
          var text = el('span', 'option-text');
          text.appendChild(el('span', 'option-label', option.label));
          if (option.detail) text.appendChild(el('span', 'hint', option.detail));
          label.appendChild(text);
          questionOptions.appendChild(label);
        })(options[i]);
      }
    }
    if (resolution) {
      var decision = resolution.decision === 'approve' ? t('drawer.decisionApprove') : t('drawer.decisionReject');
      var optionLabel = resolution.optionLabel ? t('drawer.resolutionOption', { option: resolution.optionLabel }) : '';
      resolutionText.hidden = false;
      resolutionText.textContent = t('drawer.resolution', { decision: decision, option: optionLabel })
        + (resolution.note ? ' ' + resolution.note : '');
    } else {
      resolutionText.hidden = true;
    }
    var showDecision = !resolution;
    approveButton.hidden = !showDecision;
    rejectButton.hidden = !showDecision;
    approveButton.textContent = t('drawer.approve');
    rejectButton.textContent = t('drawer.reject');
    answerNote.hidden = !pending;
    answerButton.hidden = !pending;
    answerHint.hidden = !pending;
    if (pending && pending.answerNote) answerNote.value = pending.answerNote;
  }

  function updateQuestionButtons() {
    var task = currentTask();
    if (!task) return;
    var readOnly = !isWritable(task);
    var pending = Boolean(task.pendingQuestion && !task.questionResolution);
    var selected = state.selectedOption;
    if (readOnly) {
      answerButton.disabled = true;
      approveButton.disabled = true;
      rejectButton.disabled = true;
      return;
    }
    answerButton.disabled = !pending || !selected;
    approveButton.disabled = pending && !task.pendingQuestion.selected;
    rejectButton.disabled = false;
  }

  function renderBlocker(task) {
    var blocked = Boolean(task.blockedReason);
    blockerSection.hidden = !blocked;
    blockerReason.textContent = task.blockedReason || '';
    blockerSince.textContent = blocked && task.blockedSince
      ? t('drawer.blockedSince', { time: formatTime(task.blockedSince) })
      : '';
    unblockButton.hidden = !blocked;
    blockButton.textContent = blocked ? t('drawer.updateBlocker') : t('drawer.block');
  }

  function baseColumn(task) {
    if (!task) return null;
    return typeof STATUS_COLUMN[task.status] === 'string' ? STATUS_COLUMN[task.status] : null;
  }

  function renderMoveActions(task) {
    moveActions.textContent = '';
    var blockedAttention = Boolean(task.blockedReason) || Boolean(task.pendingQuestion && !task.questionResolution);
    var current = baseColumn(task);
    for (var i = 0; i < DRAG_COLUMNS.length; i += 1) {
      var target = DRAG_COLUMNS[i];
      if (target === current) continue;
      if (blockedAttention && target !== 'backlog') continue;
      (function (columnId) {
        moveActions.appendChild(button(t('drawer.moveTo', { column: t('columns.' + columnId) }), '', function () {
          moveTaskTo(task, columnId);
        }));
      })(target);
    }
    if (!moveActions.childElementCount) moveActions.appendChild(el('p', 'hint', t('drawer.noOptions')));
    askButton.hidden = Boolean(task.pendingQuestion && !task.questionResolution) || Boolean(task.questionResolution);
  }

  function moveTaskTo(task, columnId) {
    if (!isWritable(task)) return;
    act('task.move', { id: task.id, version: task.version, to: columnId }).then(function (body) {
      if (body) notify(t('drawer.moved', { column: t('columns.' + columnId) }));
    });
  }

  function saveTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var links = [];
    var rows = editLinks.querySelectorAll('[data-link-row]');
    for (var i = 0; i < rows.length; i += 1) {
      var label = rows[i].querySelector('.link-label').value.trim();
      var url = rows[i].querySelector('.link-url').value.trim();
      if (!label && !url) continue;
      if (!label || !url) {
        notify(t('drawer.linkIncomplete'), true);
        return;
      }
      links.push({ label: label, url: normalizeUrl(url) });
    }
    act('task.update', {
      id: task.id,
      version: task.version,
      title: editTitle.value,
      description: editDescription.value,
      priority: editPriority.value,
      labels: splitLabels(editLabels.value),
      links: links
    }).then(function (body) {
      if (body) notify(t('drawer.saved'));
    });
  }

  function addComment() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var body = commentBody.value.trim();
    if (!body) {
      notify(t('drawer.commentRequired'), true);
      return;
    }
    act('task.comment', { id: task.id, version: task.version, body: body }).then(function (response) {
      if (response) notify(t('drawer.commentAdded'));
    });
  }

  function uploadAttachment(file) {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      attachmentError.hidden = false;
      attachmentError.textContent = t('drawer.attachmentTooLarge');
      attachmentInput.value = '';
      return;
    }
    attachmentError.hidden = true;
    var reader = new FileReader();
    reader.onerror = function () {
      attachmentError.hidden = false;
      attachmentError.textContent = t('drawer.attachmentReadError');
      attachmentInput.value = '';
    };
    reader.onload = function () {
      var raw = String(reader.result || '');
      var comma = raw.indexOf(',');
      var data = comma >= 0 ? raw.slice(comma + 1) : '';
      if (!data) {
        attachmentError.hidden = false;
        attachmentError.textContent = t('drawer.attachmentReadError');
        attachmentInput.value = '';
        return;
      }
      var active = currentTask();
      if (!active || !isWritable(active)) {
        attachmentInput.value = '';
        return;
      }
      act('attachment.add', {
        id: active.id,
        version: active.version,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        data: data
      }).then(function (body) {
        attachmentInput.value = '';
        if (body) notify(t('drawer.attachmentUploaded'));
      });
    };
    reader.readAsDataURL(file);
  }

  function removeAttachment(task, attachment) {
    if (!isWritable(task)) return;
    if (!window.confirm(t('drawer.removeAttachmentConfirm', { name: attachment.filename }))) return;
    act('attachment.remove', {
      id: task.id,
      version: task.version,
      attachmentId: attachment.id
    }).then(function (body) {
      if (body) notify(t('drawer.attachmentRemoved'));
    });
  }

  function answerQuestion() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    if (!state.selectedOption) {
      notify(t('drawer.answerRequired'), true);
      return;
    }
    act('task.answer', {
      id: task.id,
      version: task.version,
      option: state.selectedOption,
      note: answerNote.value
    }).then(function (body) {
      if (body) notify(t('drawer.answered'));
    });
  }

  function decide(kind) {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var note = window.prompt(
      t('drawer.decisionNotePrompt', { id: task.identifier }),
      (task.pendingQuestion && task.pendingQuestion.answerNote) || ''
    );
    if (note === null) return;
    var confirmKey = kind === 'approve' ? 'drawer.approveConfirm' : 'drawer.rejectConfirm';
    if (!window.confirm(t(confirmKey, { id: task.identifier }))) return;
    var action = kind === 'approve' ? 'task.approve' : 'task.reject';
    var doneKey = kind === 'approve' ? 'drawer.approved' : 'drawer.rejected';
    act(action, { id: task.id, version: task.version, note: note }).then(function (body) {
      if (body) notify(t(doneKey));
    });
  }

  function blockTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var reason = window.prompt(
      t('drawer.blockPrompt', { id: task.identifier }),
      task.blockedReason || ''
    );
    if (reason === null) return;
    reason = reason.trim();
    if (!reason) {
      notify(t('drawer.blockReasonRequired'), true);
      return;
    }
    act('task.block', { id: task.id, version: task.version, reason: reason }).then(function (body) {
      if (body) notify(t('drawer.blocked'));
    });
  }

  function unblockTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    act('task.unblock', { id: task.id, version: task.version }).then(function (body) {
      if (body) notify(t('drawer.unblocked'));
    });
  }

  function askQuestion() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var promptText = window.prompt(t('drawer.askPrompt'), '');
    if (promptText === null) return;
    promptText = promptText.trim();
    if (!promptText) return;
    var raw = window.prompt(t('drawer.askOptionsPrompt'), '');
    if (raw === null) return;
    var lines = raw.split(String.fromCharCode(10));
    var options = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      var pipe = line.indexOf('|');
      if (pipe === -1) options.push({ label: line });
      else options.push({ label: line.slice(0, pipe).trim(), detail: line.slice(pipe + 1).trim() });
    }
    if (options.length < 2) {
      notify(t('drawer.askOptionsRequired'), true);
      return;
    }
    act('task.ask', {
      id: task.id,
      version: task.version,
      prompt: promptText,
      options: options
    }).then(function (body) {
      if (body) notify(t('drawer.asked'));
    });
  }

  function openNewTask() {
    if (state.readOnly) {
      notify(errorText({ code: 'PROJECT_ARCHIVED', message: t('project.readOnly') }), true);
      return;
    }
    var projects = (state.data && state.data.projects) || [];
    var active = [];
    for (var i = 0; i < projects.length; i += 1) {
      if (!projects[i].archivedAt) active.push(projects[i]);
    }
    if (!active.length) {
      notify(t('newTask.noActiveProject'), true);
      return;
    }
    newTaskProject.textContent = '';
    var selected = active[0].id;
    for (var j = 0; j < active.length; j += 1) {
      newTaskProject.appendChild(new Option(active[j].name, active[j].id));
      if (active[j].id === state.projectId) selected = active[j].id;
    }
    newTaskProject.value = selected;
    newTaskTitle.value = '';
    newTaskDescription.value = '';
    newTaskPriority.value = 'none';
    newTaskLabels.value = '';
    if (!newTaskDialog.open) newTaskDialog.showModal();
    newTaskTitle.focus();
  }

  function renderProjectList() {
    projectList.textContent = '';
    var projects = (state.data && state.data.projects) || [];
    if (!projects.length) {
      projectList.appendChild(el('li', 'hint', t('project.none')));
      return;
    }
    for (var i = 0; i < projects.length; i += 1) {
      (function (project) {
        var item = el('li', 'project-row');
        var line = el('div', 'project-line');
        line.appendChild(el('span', 'project-name', project.name));
        line.appendChild(el('span', 'badge', project.prefix));
        if (project.archivedAt) line.appendChild(el('span', 'badge attention-blocked', t('project.archived')));
        else line.appendChild(el('span', 'badge', t('project.active')));
        item.appendChild(line);
        if (project.workspacePath) item.appendChild(el('p', 'hint', project.workspacePath));
        item.appendChild(el('p', 'hint', t('project.taskCount', {
          n: project.taskCount || 0,
          open: project.openCount || 0
        })));
        var actions = el('div', 'actions');
        actions.appendChild(button(t('project.rename'), '', function () { renameProject(project); }));
        if (project.archivedAt) {
          actions.appendChild(button(t('project.restore'), 'primary', function () { restoreProject(project); }));
        } else {
          actions.appendChild(button(t('project.archive'), 'danger', function () { archiveProject(project); }));
        }
        item.appendChild(actions);
        projectList.appendChild(item);
      })(projects[i]);
    }
  }

  function openProjectDialog() {
    renderProjectList();
    if (!projectDialog.open) projectDialog.showModal();
  }

  function renameProject(project) {
    var name = window.prompt(t('project.renamePrompt', { name: project.name }), project.name);
    if (name === null) return;
    name = name.trim();
    if (!name || name === project.name) return;
    act('project.update', { id: project.id, name: name }).then(function (body) {
      if (body) notify(t('toast.projectRenamed'));
    });
  }

  function archiveProject(project) {
    if (!window.confirm(t('project.archiveConfirm', { name: project.name }))) return;
    act('project.archive', { id: project.id }).then(function (body) {
      if (body) notify(t('toast.projectArchived'));
    });
  }

  function restoreProject(project) {
    act('project.restore', { id: project.id }).then(function (body) {
      if (body) notify(t('toast.projectRestored'));
    });
  }

  function createProject() {
    var name = projectNameInput.value.trim();
    if (!name) {
      projectNameInput.focus();
      return;
    }
    var payload = { name: name };
    var prefix = projectPrefixInput.value.trim();
    if (prefix) payload.prefix = prefix;
    var workspacePath = projectWorkspaceInput.value.trim();
    if (workspacePath) payload.workspacePath = workspacePath;
    act('project.create', payload).then(function (body) {
      if (!body) return;
      projectForm.reset();
      notify(t('toast.projectCreated'));
    });
  }

  function createTask() {
    var title = newTaskTitle.value.trim();
    if (!title) {
      newTaskTitle.focus();
      return;
    }
    act('task.create', {
      projectId: newTaskProject.value,
      title: title,
      description: newTaskDescription.value,
      priority: newTaskPriority.value,
      labels: splitLabels(newTaskLabels.value)
    }).then(function (body) {
      if (!body) return;
      newTaskForm.reset();
      newTaskDialog.close();
      notify(t('newTask.created'));
    });
  }

  function toggleCollapse(columnId) {
    var index = state.collapsed.indexOf(columnId);
    if (index === -1) state.collapsed.push(columnId);
    else state.collapsed.splice(index, 1);
    storeSet(STORAGE.collapsed, JSON.stringify(state.collapsed));
    renderBoard();
  }

  function clearAllFilters() {
    state.search = '';
    state.priority = '';
    state.label = '';
    state.assignee = '';
    searchInput.value = '';
    renderFilters();
    renderBoard();
  }

  function bindEvents() {
    projectSelect.addEventListener('change', function () {
      state.projectId = projectSelect.value || 'all';
      storeSet(STORAGE.project, state.projectId);
      load(false);
    });
    searchInput.addEventListener('input', function () {
      state.search = searchInput.value;
      renderBoard();
    });
    filterPriority.addEventListener('change', function () {
      state.priority = filterPriority.value;
      renderBoard();
    });
    filterLabel.addEventListener('change', function () {
      state.label = filterLabel.value;
      renderBoard();
    });
    filterAssignee.addEventListener('change', function () {
      state.assignee = filterAssignee.value;
      renderBoard();
    });
    clearFilters.addEventListener('click', clearAllFilters);
    refreshButton.addEventListener('click', function () { load(true); });
    newTaskButton.addEventListener('click', openNewTask);
    manageProjects.addEventListener('click', openProjectDialog);
    restoreSelected.addEventListener('click', function () {
      var project = state.data && state.data.board ? state.data.board.project : null;
      if (project) restoreProject(project);
    });
    langToggle.addEventListener('click', function () {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      storeSet(STORAGE.lang, state.lang);
      applyI18n();
      renderAll();
    });
    drawerClose.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    saveTaskButton.addEventListener('click', saveTask);
    addLinkButton.addEventListener('click', addLink);
    addCommentButton.addEventListener('click', addComment);
    answerButton.addEventListener('click', answerQuestion);
    approveButton.addEventListener('click', function () { decide('approve'); });
    rejectButton.addEventListener('click', function () { decide('reject'); });
    blockButton.addEventListener('click', blockTask);
    unblockButton.addEventListener('click', unblockTask);
    askButton.addEventListener('click', askQuestion);
    attachmentInput.addEventListener('change', function () {
      var file = attachmentInput.files && attachmentInput.files[0];
      if (file) uploadAttachment(file);
    });
    document.getElementById('new-task-close').addEventListener('click', function () { newTaskDialog.close(); });
    document.getElementById('new-task-cancel').addEventListener('click', function () { newTaskDialog.close(); });
    newTaskForm.addEventListener('submit', function (event) {
      event.preventDefault();
      createTask();
    });
    document.getElementById('project-close').addEventListener('click', function () { projectDialog.close(); });
    projectForm.addEventListener('submit', function (event) {
      event.preventDefault();
      createProject();
    });
    var collapses = document.querySelectorAll('[data-collapse]');
    for (var i = 0; i < collapses.length; i += 1) {
      collapses[i].addEventListener('click', function () {
        toggleCollapse(this.getAttribute('data-collapse'));
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        if (drawer.classList.contains('open')) {
          closeDrawer();
          event.preventDefault();
          return;
        }
        if (newTaskDialog.open) {
          newTaskDialog.close();
          event.preventDefault();
          return;
        }
        if (projectDialog.open) {
          projectDialog.close();
          event.preventDefault();
          return;
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      var target = event.target;
      var tag = target && target.tagName ? target.tagName : '';
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable);
      if (typing) return;
      if (event.key === '/') {
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
        return;
      }
      if (event.key === 'n' || event.key === 'N') {
        if (drawer.classList.contains('open') || newTaskDialog.open || projectDialog.open) return;
        event.preventDefault();
        openNewTask();
      }
    });
  }

  applyI18n();
  bindEvents();
  bindDropTargets();
  renderAll();
  load(false);
})();
</script>
</body>
</html>
`
}
