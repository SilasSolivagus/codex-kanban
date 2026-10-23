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
  'task.reorder',
  'task.archive',
  'task.restore',
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
    'header.searchPlaceholder': 'Search title / summary / project / label',
    'header.searchLabel': 'Search title, summary, project or label',
    'header.filter': 'Filters',
    'header.newTask': 'New task',
    'header.refresh': 'Refresh',
    'header.langToggle': '中文',
    'header.langLabel': 'Switch to Chinese',
    'counts.tasks': '{n} tasks',
    'counts.filteredTasks': '{visible} / {total} tasks',
    'counts.running': '{n} running',
    'counts.needs': '{n} needs you',
    'counts.done': '{n} done',
    'overflow.label': 'More actions',
    'counts.contextAll': 'All projects · {n} projects',
    'counts.contextAllOne': 'All projects · {n} project',
    'counts.contextProject': '{name} · {path}',
    'counts.contextProjectNoPath': '{name} · {n} tasks',
    'project.archivedSuffix': ' (archived)',
    'project.taskCount': '{n} tasks · {open} open',
    'filter.toolbar': 'Filters',
    'filter.priority': 'All priorities',
    'filter.label': 'All labels',
    'filter.assignee': 'All assignees',
    'filter.priorityAria': 'Priority',
    'filter.labelAria': 'Label',
    'filter.assigneeAria': 'Assignee',
    'filter.clear': 'Clear filters',
    'filter.showing': 'Showing {visible} of {total}',
    'filter.none': 'No tasks match the current filters. Clear the filters to see the board.',
    'filter.emptyTitle': 'No tasks match the current filters',
    'filter.clearAll': 'Clear all',
    'filter.remove': 'Remove filter {value}',
    'filter.archived': 'Show archived',
    'filter.archivedAria': 'Show archived tasks on the board',
    'filter.hideArchived': 'Hide archived',
    'filter.hideArchivedAria': 'Hide archived tasks on the board',
    'toast.reordered': '{id} moved',
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
    'columns.add': 'New card',
    'columns.addAria': 'New card in {column}',
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
    'card.updatedAgo': 'Updated {time} ago',
    'card.updatedJustNow': 'Updated just now',
    'card.dwell': '{time} ago',
    'card.dwellLabel': 'Here for {time}',
    'card.dwellJustNow': 'Just entered this status',
    'card.archived': 'Archived',
    'card.blockedPrefix': 'Blocked: ',
    'card.attachments': '{n} attachments',
    'card.links': '{n} links',
    'question.inlineTitle': 'Needs your answer',
    'question.notePlaceholder': 'Optional note…',
    'question.selectOption': 'Select an option to approve or reject.',
    'status.backlog': 'Backlog',
    'status.todo': 'Unclaimed',
    'status.in_progress': 'In progress',
    'status.in_review': 'Needs you',
    'status.done': 'Done',
    'status.canceled': 'Canceled',
    'age.justNow': 'just now',
    'age.seconds': '{n}s',
    'age.minutes': '{n}m',
    'age.hours': '{n}h',
    'age.days': '{n}d',
    'actor.you': 'You',
    'actor.codex': 'Codex',
    'actor.someone': 'Someone',
    'activity.today': 'Today',
    'activity.yesterday': 'Yesterday',
    'activity.created': '{actor} created {id} in {status}',
    'activity.question': '{actor} asked: {prompt}',
    'activity.answered': '{actor} answered “{option}”',
    'activity.answeredNote': '{actor} recorded an answer',
    'activity.approved': '{actor} approved {id}',
    'activity.rejected': '{actor} rejected {id}',
    'activity.blocked': '{actor} blocked {id}: {reason}',
    'activity.unblocked': '{actor} unblocked {id}',
    'activity.attached': '{actor} attached {name}',
    'activity.detached': '{actor} removed attachment {name}',
    'activity.commented': '{actor} commented: {body}',
    'activity.moved': '{actor} moved {id}: {from} → {to}',
    'activity.archived': '{actor} archived {id}',
    'activity.restored': '{actor} restored {id}',
    'activity.updated': '{actor} updated {fields}',
    'activity.reordered': '{actor} reordered {id}',
    'activity.field.title': 'title',
    'activity.field.description': 'description',
    'activity.field.priority': 'priority',
    'activity.field.labels': 'labels',
    'activity.field.links': 'links',
    'activity.field.status': 'status',
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
    'project.close': 'Close',
    'project.readOnly': 'This project is archived. Task and attachment changes are disabled until you restore it.',
    'project.restoreSelected': 'Restore project',
    'project.none': 'No projects yet. Create one to start.',
    'shortcuts.hint': 'Press / to search, Esc to clear or close, n for a new task.',
    'shortcuts.label': 'Keyboard shortcuts',
    'drawer.title': 'Task details',
    'drawer.close': 'Close',
    'drawer.version': 'Version {n}',
    'drawer.readOnly': 'This task belongs to an archived project and is read-only.',
    'drawer.taskArchived': 'This task is archived. Restore it to edit it again.',
    'drawer.details': 'Details',
    'drawer.collaboration': 'Collaboration',
    'drawer.attributes': 'Attributes',
    'drawer.statusLabel': 'Status',
    'drawer.updatedLabel': 'Updated',
    'drawer.createdLabel': 'Created',
    'drawer.versionLabel': 'Version',
    'drawer.archive': 'Archive',
    'drawer.restore': 'Restore',
    'drawer.archived': 'Task archived',
    'drawer.restored': 'Task restored',
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
    'drawer.unsaved': 'Unsaved',
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
    'drawer.chooseFile': 'Choose file',
    'drawer.dropHint': 'or drag a file here · up to 10 MB',
    'drawer.fileSelected': 'Selected {name}',
    'drawer.attachmentHint': 'Up to 10 MB per file.',
    'drawer.attachmentTooLarge': 'This file is larger than 10 MB and was not uploaded.',
    'drawer.attachmentReadError': 'This file could not be read.',
    'drawer.attachmentUploaded': 'Attachment uploaded',
    'drawer.attachmentRemoved': 'Attachment removed',
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
    'drawer.actions': 'Actions',
    'drawer.moveTo': 'Move to {column}',
    'drawer.moved': 'Moved to {column}',
    'drawer.project': 'Project',
    'drawer.assignee': 'Assignee',
    'drawer.status': 'Status: {status}',
    'drawer.statusChanged': 'Status changed to {status}',
    'drawer.pendingQuestionLine': 'Needs your answer: {prompt}',
    'drawer.pendingBlockedLine': 'Blocked: {reason}',
    'drawer.updatedMeta': 'Updated {time}',
    'drawer.datesLabel': 'Dates',
    'drawer.created': 'Created {time}',
    'drawer.selected': 'Selected: {option}',
    'drawer.noOptions': 'No options.',
    'drawer.tabs': 'Task sections',
    'decision.title': 'Review decision',
    'decision.target': '{id} · {title}',
    'decision.questionLabel': 'Question',
    'decision.answerLabel': 'Answer',
    'decision.noAnswer': 'Not selected',
    'decision.noteLabel': 'Decision note (optional)',
    'decision.notePlaceholder': 'Context for the record',
    'decision.cancel': 'Cancel',
    'decision.approve': 'Confirm approve',
    'decision.reject': 'Confirm reject',
    'ask.title': 'Ask a question',
    'ask.promptLabel': 'Question',
    'ask.promptPlaceholder': 'What do you need the human to decide?',
    'ask.optionsLabel': 'Options',
    'ask.optionLabel': 'Option {n}',
    'ask.optionLabelPlaceholder': 'Label',
    'ask.optionDetailPlaceholder': 'Detail (optional)',
    'ask.addOption': 'Add option',
    'ask.removeOption': 'Remove option {n}',
    'ask.optionsHint': '2–5 options. Each option needs a label.',
    'ask.cancel': 'Cancel',
    'ask.submit': 'Ask question',
    'ask.promptRequired': 'Write the question first.',
    'ask.optionsRange': 'Provide 2–5 options with labels.',
    'block.title': 'Block task',
    'block.reasonLabel': 'Blocker reason',
    'block.reasonPlaceholder': 'What is blocking this task?',
    'block.cancel': 'Cancel',
    'block.submit': 'Save blocker',
    'rename.title': 'Rename project',
    'rename.nameLabel': 'Name',
    'rename.prefixLabel': 'Prefix',
    'rename.cancel': 'Cancel',
    'rename.submit': 'Save project',
    'rename.nameRequired': 'A project name is required.',
    'rename.prefixInvalid': 'Prefix must be 2–6 uppercase letters or digits.',
    'confirm.cancel': 'Cancel',
    'confirm.archive': 'Confirm archive',
    'confirm.restore': 'Confirm restore',
    'confirm.remove': 'Confirm removal',
    'confirm.archiveTaskTitle': 'Archive task',
    'confirm.archiveTaskDetail': 'It leaves the board until restored.',
    'confirm.archiveProjectTitle': 'Archive project',
    'confirm.archiveProjectDetail': 'Its tasks become read-only until restored.',
    'confirm.restoreTaskTitle': 'Restore task',
    'confirm.restoreTaskDetail': 'It returns to the board.',
    'confirm.restoreProjectTitle': 'Restore project',
    'confirm.restoreProjectDetail': 'Its tasks become editable again.',
    'confirm.removeAttachmentTitle': 'Remove attachment',
    'confirm.removeAttachmentDetail': 'This cannot be undone.',
  }),
  zh: Object.freeze({
    'app.title': 'Codex Kanban',
    'app.loading': '加载中…',
    'app.loadFailed': '看板加载失败：{code}: {message}',
    'header.allProjects': '全部项目',
    'header.project': '项目',
    'header.projects': '项目管理',
    'header.searchPlaceholder': '搜索标题 / 摘要 / 项目 / 标签',
    'header.searchLabel': '搜索标题、摘要、项目或标签',
    'header.filter': '筛选',
    'header.newTask': '新建任务',
    'header.refresh': '刷新',
    'header.langToggle': 'EN',
    'header.langLabel': '切换到英文',
    'counts.tasks': '{n} 个任务',
    'counts.filteredTasks': '{visible} / {total} 个任务',
    'counts.running': '{n} 个运行中',
    'counts.needs': '{n} 需要你',
    'counts.done': '{n} 个已完成',
    'overflow.label': '更多操作',
    'counts.contextAll': '全部项目 · {n} 个项目',
    'counts.contextAllOne': '全部项目 · {n} 个项目',
    'counts.contextProject': '{name} · {path}',
    'counts.contextProjectNoPath': '{name} · {n} 个任务',
    'project.archivedSuffix': '（已归档）',
    'project.taskCount': '{n} 个任务 · {open} 个未完成',
    'filter.toolbar': '筛选',
    'filter.priority': '全部优先级',
    'filter.label': '全部标签',
    'filter.assignee': '全部负责人',
    'filter.priorityAria': '优先级',
    'filter.labelAria': '标签',
    'filter.assigneeAria': '负责人',
    'filter.clear': '清除筛选',
    'filter.showing': '显示 {visible} / {total}',
    'filter.none': '没有任务匹配当前筛选，清除筛选即可查看全部任务。',
    'filter.emptyTitle': '没有任务匹配当前筛选',
    'filter.clearAll': '清除全部',
    'filter.remove': '移除筛选条件 {value}',
    'filter.archived': '显示已归档',
    'filter.archivedAria': '在看板中显示已归档任务',
    'filter.hideArchived': '隐藏已归档',
    'filter.hideArchivedAria': '在看板中隐藏已归档任务',
    'toast.reordered': '{id} 已移动',
    'priority.none': '无',
    'priority.low': '低',
    'priority.medium': '中',
    'priority.high': '高',
    'priority.urgent': '紧急',
    'columns.backlog': 'Backlog',
    'columns.running': 'Running',
    'columns.needs': 'Needs you',
    'columns.done': 'Done',
    'columns.empty.backlog': '尚未开始。',
    'columns.empty.running': '进行中的工作会显示在这里。',
    'columns.empty.needs': '当前没有需要你处理的事项。',
    'columns.empty.done': '已交付并关闭。',
    'columns.add': '新建卡片',
    'columns.addAria': '在{column}新建卡片',
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
    'card.updatedAgo': '更新于 {time}前',
    'card.updatedJustNow': '刚刚更新',
    'card.dwell': '{time}前',
    'card.dwellLabel': '已停留 {time}',
    'card.dwellJustNow': '刚刚进入此状态',
    'card.archived': '已归档',
    'card.blockedPrefix': '受阻：',
    'card.attachments': '{n} 个附件',
    'card.links': '{n} 个链接',
    'question.inlineTitle': '需要你的回答',
    'question.notePlaceholder': '可选备注…',
    'question.selectOption': '选择一项后即可批准或拒绝。',
    'status.backlog': '待立项',
    'status.todo': '等待认领',
    'status.in_progress': '处理中',
    'status.in_review': '等你确认',
    'status.done': '完成',
    'status.canceled': '已取消',
    'age.justNow': '刚刚',
    'age.seconds': '{n}秒',
    'age.minutes': '{n}分钟',
    'age.hours': '{n}小时',
    'age.days': '{n}天',
    'actor.you': '你',
    'actor.codex': 'Codex',
    'actor.someone': '有人',
    'activity.today': '今天',
    'activity.yesterday': '昨天',
    'activity.created': '{actor}创建了 {id}（{status}）',
    'activity.question': '{actor}提问：{prompt}',
    'activity.answered': '{actor}回答了「{option}」',
    'activity.answeredNote': '{actor}记录了回答',
    'activity.approved': '{actor}批准了 {id}',
    'activity.rejected': '{actor}驳回了 {id}',
    'activity.blocked': '{actor}将 {id} 标记为阻塞：{reason}',
    'activity.unblocked': '{actor}解除了 {id} 的阻塞',
    'activity.attached': '{actor}添加了附件 {name}',
    'activity.detached': '{actor}移除了附件 {name}',
    'activity.commented': '{actor}评论：{body}',
    'activity.moved': '{actor}移动了 {id}：{from} → {to}',
    'activity.archived': '{actor}归档了 {id}',
    'activity.restored': '{actor}恢复了 {id}',
    'activity.updated': '{actor}更新了{fields}',
    'activity.reordered': '{actor}调整了 {id} 的顺序',
    'activity.field.title': '标题',
    'activity.field.description': '描述',
    'activity.field.priority': '优先级',
    'activity.field.labels': '标签',
    'activity.field.links': '链接',
    'activity.field.status': '状态',
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
    'project.close': '关闭',
    'project.readOnly': '该项目已归档。恢复之前，任务和附件修改均被禁用。',
    'project.restoreSelected': '恢复项目',
    'project.none': '还没有项目，先创建一个。',
    'shortcuts.hint': '按 / 搜索，Esc 清除或关闭，n 新建任务。',
    'shortcuts.label': '键盘快捷键',
    'drawer.title': '任务详情',
    'drawer.close': '关闭',
    'drawer.version': '版本 {n}',
    'drawer.readOnly': '此任务属于已归档项目，为只读状态。',
    'drawer.taskArchived': '此任务已归档，恢复后才能继续编辑。',
    'drawer.details': '详情',
    'drawer.collaboration': '协作',
    'drawer.attributes': '属性',
    'drawer.statusLabel': '状态',
    'drawer.updatedLabel': '更新时间',
    'drawer.createdLabel': '创建时间',
    'drawer.versionLabel': '版本',
    'drawer.archive': '归档',
    'drawer.restore': '恢复',
    'drawer.archived': '任务已归档',
    'drawer.restored': '任务已恢复',
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
    'drawer.unsaved': '未保存',
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
    'drawer.chooseFile': '选择文件',
    'drawer.dropHint': '或将文件拖到这里 · 最大 10 MB',
    'drawer.fileSelected': '已选择 {name}',
    'drawer.attachmentHint': '每个文件最大 10 MB。',
    'drawer.attachmentTooLarge': '文件超过 10 MB，未上传。',
    'drawer.attachmentReadError': '无法读取该文件。',
    'drawer.attachmentUploaded': '附件已上传',
    'drawer.attachmentRemoved': '附件已删除',
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
    'drawer.actions': '操作',
    'drawer.moveTo': '移动到{column}',
    'drawer.moved': '已移动到{column}',
    'drawer.project': '项目',
    'drawer.assignee': '负责人',
    'drawer.status': '状态：{status}',
    'drawer.statusChanged': '状态已改为{status}',
    'drawer.pendingQuestionLine': '需要你回答：{prompt}',
    'drawer.pendingBlockedLine': '受阻：{reason}',
    'drawer.updatedMeta': '更新于 {time}',
    'drawer.datesLabel': '日期',
    'drawer.created': '创建于 {time}',
    'drawer.selected': '已选择：{option}',
    'drawer.noOptions': '没有选项。',
    'drawer.tabs': '任务分区',
    'decision.title': '审核决定',
    'decision.target': '{id} · {title}',
    'decision.questionLabel': '问题',
    'decision.answerLabel': '回答',
    'decision.noAnswer': '尚未选择',
    'decision.noteLabel': '决定备注（可选）',
    'decision.notePlaceholder': '为记录补充背景',
    'decision.cancel': '取消',
    'decision.approve': '确认批准',
    'decision.reject': '确认驳回',
    'ask.title': '提出问题',
    'ask.promptLabel': '问题',
    'ask.promptPlaceholder': '需要人类决定什么？',
    'ask.optionsLabel': '选项',
    'ask.optionLabel': '选项 {n}',
    'ask.optionLabelPlaceholder': '名称',
    'ask.optionDetailPlaceholder': '说明（可选）',
    'ask.addOption': '添加选项',
    'ask.removeOption': '移除选项 {n}',
    'ask.optionsHint': '2–5 个选项，每个选项都需要名称。',
    'ask.cancel': '取消',
    'ask.submit': '确认提问',
    'ask.promptRequired': '请先填写问题。',
    'ask.optionsRange': '请提供 2–5 个带名称的选项。',
    'block.title': '标记阻塞',
    'block.reasonLabel': '阻塞原因',
    'block.reasonPlaceholder': '是什么阻塞了这个任务？',
    'block.cancel': '取消',
    'block.submit': '保存阻塞原因',
    'rename.title': '重命名项目',
    'rename.nameLabel': '名称',
    'rename.prefixLabel': '前缀',
    'rename.cancel': '取消',
    'rename.submit': '保存项目',
    'rename.nameRequired': '项目名称不能为空。',
    'rename.prefixInvalid': '前缀必须是 2–6 位大写字母或数字。',
    'confirm.cancel': '取消',
    'confirm.archive': '确认归档',
    'confirm.restore': '确认恢复',
    'confirm.remove': '确认移除',
    'confirm.archiveTaskTitle': '归档任务',
    'confirm.archiveTaskDetail': '恢复前它将从看板隐藏。',
    'confirm.archiveProjectTitle': '归档项目',
    'confirm.archiveProjectDetail': '恢复前，其任务将变为只读。',
    'confirm.restoreTaskTitle': '恢复任务',
    'confirm.restoreTaskDetail': '它将重新出现在看板上。',
    'confirm.restoreProjectTitle': '恢复项目',
    'confirm.restoreProjectDetail': '其任务将恢复可编辑。',
    'confirm.removeAttachmentTitle': '移除附件',
    'confirm.removeAttachmentDetail': '删除后不可恢复。',
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
<meta name="color-scheme" content="light" />
<meta name="referrer" content="no-referrer" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    color-scheme: light;
    --bg: light-dark(#f7f8fa, #0e1117);
    --surface: light-dark(#ffffff, #171b22);
    --surface-soft: light-dark(#fafbfc, #1b2029);
    --text: light-dark(#111827, #e8ecf2);
    --muted: light-dark(#6b7280, #9aa4b2);
    --muted-soft: light-dark(#9ca3af, #7d8796);
    --border: light-dark(#e5e7eb, #2a313b);
    --border-strong: light-dark(#cfd4dc, #3a4350);
    --panel-backlog: light-dark(#f3f4f6, #1a1f27);
    --panel-running: light-dark(#eff2f6, #19212d);
    --panel-needs: light-dark(#fff7e8, #2a2316);
    --panel-done: light-dark(#eef8f1, #16261d);
    --border-needs: light-dark(#f2dfb6, #4b3a1c);
    --border-done: light-dark(#d7ecdd, #21442f);
    --brand: light-dark(#111827, #f1f5f9);
    --brand-contrast: light-dark(#ffffff, #111827);
    --warn: light-dark(#b45309, #f0b45e);
    --warn-bg: light-dark(#fffaf0, #2b2314);
    --warn-border: light-dark(#f2dfb6, #54401e);
    --danger: light-dark(#b42318, #f19a92);
    --success: light-dark(#15803d, #6cd49a);
    --radius: 14px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-synthesis: none;
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-size: 14px; line-height: 1.45; -webkit-font-smoothing: antialiased;
  }
  body.drawer-open { overflow: hidden; }
  h1, h2, h3, h4 { letter-spacing: -0.01em; }
  a { color: var(--text); }
  button { font: inherit; cursor: pointer; }
  input, select, textarea { font: inherit; }
  input[type="search"] { -webkit-appearance: none; }
  input, select, textarea {
    color: var(--text); background: var(--surface);
    border: 1px solid var(--border); border-radius: 9px; padding: 8px 10px;
  }
  textarea { width: 100%; min-height: 74px; resize: vertical; }
  input:focus-visible, select:focus-visible, textarea:focus-visible,
  button:focus-visible, a:focus-visible, article.card:focus-visible {
    outline: 2px solid light-dark(#111827, #c7d2e0); outline-offset: 2px;
  }
  button:disabled { opacity: 0.5; cursor: default; }

  /* ---- top bar --------------------------------------------------------- */
  .topbar {
    width: 100%; background: var(--surface); border-bottom: 1px solid var(--border);
  }
  .topbar-inner {
    display: flex; align-items: center; gap: 10px;
    max-width: 1400px; margin: 0 auto; padding: 9px 24px; min-height: 56px;
  }
  .project-chip {
    position: relative; display: inline-flex; align-items: center; gap: 8px;
    height: 40px; flex: none; padding: 0 9px 0 11px;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface);
  }
  .project-chip:hover { border-color: var(--border-strong); }
  .project-chip .project-mark {
    width: 9px; height: 9px; flex: none; border-radius: 2px; background: var(--text);
  }
  .project-chip select {
    max-width: 230px; height: 38px; padding: 0 17px 0 0;
    border: 0; border-radius: 0; background: transparent; color: var(--text);
    font-size: 13px; font-weight: 600; cursor: pointer;
    -webkit-appearance: none; appearance: none;
  }
  .project-chip select:focus-visible { outline-offset: 1px; }
  .project-chip .chip-chevron {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    display: inline-flex; color: var(--muted); pointer-events: none;
  }
  /* ---- styled select --------------------------------------------------- */
  .select-field { position: relative; display: block; width: 100%; min-width: 0; }
  .select-field > select { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
  .select-trigger {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; height: 40px; padding: 0 11px;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface);
    color: var(--text); font-size: 13px; font-weight: 500; text-align: left;
  }
  .select-trigger:hover:not(:disabled) { border-color: var(--border-strong); }
  .select-trigger:disabled { opacity: 0.6; cursor: default; }
  .select-field.open .select-trigger { border-color: var(--border-strong); }
  .select-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .select-field .select-chevron {
    display: inline-flex; flex: none; color: var(--muted); pointer-events: none;
    transition: transform 0.14s ease;
  }
  .select-field.open .select-chevron { transform: rotate(180deg); }
  .select-menu {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50;
    display: grid; gap: 2px; max-height: 260px; overflow: auto;
    margin: 0; padding: 5px; list-style: none;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface);
    box-shadow: 0 14px 34px light-dark(rgba(16, 24, 40, 0.14), rgba(0, 0, 0, 0.55));
  }
  .select-menu[hidden] { display: none; }
  .select-option {
    padding: 7px 9px; border-radius: 7px; color: var(--text);
    font-size: 13px; line-height: 1.3; cursor: pointer; outline: none;
    overflow-wrap: anywhere;
  }
  .select-option:hover, .select-option:focus { background: var(--surface-soft); }
  .select-option.active { background: var(--surface-soft); outline: 1px solid var(--border-strong); outline-offset: -1px; }
  .select-option.selected { background: var(--surface-soft); font-weight: 600; }
  .select-option.selected::after { content: '✓'; float: right; color: var(--muted); font-weight: 500; }
  .search-wrap { position: relative; flex: 1 1 520px; max-width: 520px; min-width: 0; height: 40px; }
  .search-wrap .search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    display: inline-flex; color: var(--muted); pointer-events: none;
  }
  #search {
    width: 100%; height: 40px; padding: 0 12px 0 36px;
    border-radius: 10px; background: var(--surface); font-size: 13px;
  }
  #search::placeholder { color: var(--muted); }
  #search:hover { border-color: var(--border-strong); }
  .filters-wrap { position: relative; flex: none; }
  #filter-toggle {
    position: relative;
    display: inline-flex; align-items: center; gap: 6px; height: 40px;
    padding: 0 14px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); color: var(--text); font-size: 13px; font-weight: 600;
  }
  #filter-toggle:hover { border-color: var(--border-strong); background: var(--surface-soft); }
  #filter-toggle[aria-expanded="true"] { border-color: var(--border-strong); background: var(--surface-soft); }
  #filter-toggle.active {
    border-color: var(--text); background: var(--surface-soft); color: var(--text);
  }
  #filter-toggle.active .btn-icon { color: var(--text); }
  .filter-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 17px; height: 17px; padding: 0 4px; flex: none;
    border-radius: 999px; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827); font-size: 10.5px; font-weight: 700;
    font-variant-numeric: tabular-nums; line-height: 1;
  }
  .filter-badge[hidden] { display: none; }
  .archived-toggle {
    display: inline-flex; align-items: center; gap: 6px; height: 40px; flex: none;
    padding: 0 12px; border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); color: var(--muted); font-size: 12.5px; font-weight: 600;
  }
  .btn-label { display: inline; }
  .btn-icon { display: none; align-items: center; justify-content: center; }
  #filter-toggle, .archived-toggle, #lang-toggle, #manage-projects { white-space: nowrap; }
  .archived-toggle:hover { border-color: var(--border-strong); color: var(--text); }
  .archived-toggle[aria-pressed="true"] {
    border-color: transparent; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827);
  }
  .archived-toggle[aria-pressed="true"] .btn-icon { color: currentColor; }
  .archived-toggle .status-dot { background: var(--muted-soft); }
  .filters-popover {
    position: absolute; top: calc(100% + 8px); left: 0; z-index: 40;
    display: grid; gap: 10px; width: 300px; padding: 12px;
    border: 1px solid var(--border); border-radius: 12px; background: var(--surface);
    box-shadow: 0 14px 34px light-dark(rgba(16, 24, 40, 0.12), rgba(0, 0, 0, 0.5));
  }
  .filters-popover[hidden] { display: none; }
  .filters-popover label { display: grid; gap: 4px; color: var(--muted); font-size: 12px; }
  .filters-foot { display: flex; align-items: center; gap: 8px; padding-top: 2px; }
  #clear-filters {
    height: 30px; padding: 0 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); color: var(--text); font-size: 12px; font-weight: 600;
  }
  #clear-filters:hover { background: var(--surface-soft); }
  .filter-count { margin-left: auto; color: var(--muted); font-size: 11.5px; }
  .filter-summary {
    display: flex; align-items: center; flex-wrap: nowrap; gap: 6px;
    width: fit-content; max-width: 100%; height: 32px; min-height: 32px;
    margin: 0; padding: 0; border: 0; background: transparent;
  }
  .filter-summary[hidden] { display: none; }
  .filter-chips {
    display: flex; align-items: center; flex-wrap: nowrap; gap: 6px; min-width: 0;
    overflow-x: auto; scrollbar-width: none;
  }
  .filter-chips::-webkit-scrollbar { display: none; }
  .filter-chip {
    display: inline-flex; align-items: center; gap: 6px; max-width: 240px;
    height: 24px; padding: 0 8px 0 10px;
    border: 1px solid var(--border-strong); border-radius: 999px;
    background: var(--surface); color: var(--text);
    font-size: 12px; font-weight: 550; white-space: nowrap;
  }
  .filter-chip:hover { border-color: var(--text); background: var(--surface-soft); }
  .filter-chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .filter-chip-x { flex: none; color: var(--muted); font-size: 14px; line-height: 1; }
  .filter-chip:hover .filter-chip-x { color: var(--text); }
  #filter-clear-all {
    height: 24px; margin-left: 2px; padding: 0 6px; flex: none;
    border: 0; border-radius: 7px; background: transparent;
    color: var(--muted); font-size: 12px; font-weight: 600; white-space: nowrap;
  }
  #filter-clear-all:hover { background: var(--surface-soft); color: var(--text); }
  .topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .topbar-tools { display: contents; }
  .running-chip {
    display: inline-flex; align-items: center; gap: 7px; padding: 0 4px;
    color: var(--muted); font-size: 12.5px; white-space: nowrap;
  }
  .needs-chip {
    display: inline-flex; align-items: center; gap: 7px; padding: 0 4px;
    color: var(--warn); font-size: 12.5px; font-weight: 600; white-space: nowrap;
  }
  .needs-chip[data-empty="true"] { color: var(--muted-soft); font-weight: 500; }
  .needs-dot {
    width: 7px; height: 7px; flex: none; border-radius: 50%;
    background: var(--warn);
    box-shadow: 0 0 0 3px light-dark(#fdf1d8, rgba(240, 180, 94, 0.16));
  }
  .needs-chip[data-empty="true"] .needs-dot { background: var(--muted-soft); box-shadow: none; }
  .live-dot {
    width: 7px; height: 7px; flex: none; border-radius: 50%;
    background: light-dark(#22c55e, #4ade80);
    box-shadow: 0 0 0 3px light-dark(#dcfce7, rgba(74, 222, 128, 0.16));
  }
  /* desktop keeps the overflow children inline; the menu only exists below 720px */
  .toolbar-overflow { display: contents; }
  .overflow-toggle { display: none; }
  .overflow-menu { display: contents; }
  #lang-toggle {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 40px; min-width: 40px; padding: 0 10px; border: 1px solid var(--border);
    border-radius: 10px; background: transparent; color: var(--muted);
    font-size: 12.5px; font-weight: 600;
  }
  #lang-toggle:hover { border-color: var(--border-strong); color: var(--text); }
  .icon-button {
    display: inline-flex; align-items: center; justify-content: center; flex: none;
    width: 40px; height: 40px; padding: 0; border: 0; border-radius: 10px;
    background: transparent; color: var(--muted);
  }
  .icon-button:hover:not(:disabled) { background: var(--surface-soft); color: var(--text); }
  #manage-projects {
    display: inline-flex; align-items: center; gap: 6px; flex: none; height: 40px;
    padding: 0 10px; border: 0; border-radius: 10px; background: transparent;
    color: var(--text); font-size: 13px; font-weight: 600;
  }
  #manage-projects:hover { background: var(--surface-soft); }

  /* ---- page head ------------------------------------------------------- */
  .shell { max-width: 1400px; margin: 0 auto; padding: 0 24px 56px; }
  .board-head { padding: 10px 0 10px; }
  .board-head h1 { margin: 0; font-size: 21px; line-height: 1.2; font-weight: 650; letter-spacing: -0.02em; }
  .board-meta { display: flex; align-items: center; gap: 8px; margin: 3px 0 0; color: var(--muted); font-size: 12.5px; }
  .board-context { color: var(--muted-soft); }
  .board-context:empty { display: none; }
  .hint { color: var(--muted); font-size: 11.5px; margin: 0; }
  .error { color: var(--danger); font-size: 12px; margin: 4px 0 0; }
  .banner {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    border: 1px solid var(--warn-border); background: var(--warn-bg);
    color: var(--text); border-radius: 10px; padding: 9px 12px; margin: 0 0 14px; font-size: 12.5px;
  }
  .banner[hidden] { display: none; }
  .banner span { flex: 1; min-width: 200px; }
  .banner button {
    border: 1px solid var(--border-strong); border-radius: 8px; background: var(--surface);
    padding: 5px 10px; font-size: 12px; font-weight: 600;
  }

  /* ---- board ----------------------------------------------------------- */
  .board { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 14px; align-items: start; }
  @media (min-width: 600px) { .board { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (min-width: 980px) { .board { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .board-empty {
    grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center;
    gap: 10px; padding: 42px 20px; text-align: center;
    border: 1px dashed var(--border-strong); border-radius: var(--radius);
    background: var(--surface);
  }
  .board-empty[hidden] { display: none; }
  .board-empty p { margin: 0; color: light-dark(#4b5563, #aab4c2); font-size: 13px; }
  .board-empty button {
    height: 32px; padding: 0 14px; border: 1px solid var(--border-strong);
    border-radius: 8px; background: var(--surface); color: var(--text);
    font-size: 12.5px; font-weight: 600;
  }
  .board-empty button:hover { background: var(--surface-soft); }
  main.board.empty-filtered section.column { display: none; }
  section.column {
    display: flex; flex-direction: column; gap: 8px; min-height: 180px;
    padding: 10px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--panel-backlog);
  }
  section.column[data-column="running"] { background: var(--panel-running); }
  section.column[data-column="needs"] { background: var(--panel-needs); border-color: var(--border-needs); }
  section.column[data-column="done"] { background: var(--panel-done); border-color: var(--border-done); }
  section.column.dragover {
    border-color: var(--border-strong);
    box-shadow: 0 0 0 2px light-dark(rgba(17, 24, 39, 0.12), rgba(255, 255, 255, 0.12));
  }
  section.column[data-collapsed="true"] { min-height: 0; }
  section.column[data-collapsed="true"] .cards,
  section.column[data-collapsed="true"] .column-empty,
  section.column[data-collapsed="true"] .column-foot { display: none; }
  .column-head { display: flex; align-items: center; gap: 7px; padding: 2px 2px 0; }
  .column-icon { display: inline-flex; flex: none; color: var(--muted); }
  section.column[data-column="running"] .column-icon { color: light-dark(#2563eb, #8ab4ff); }
  section.column[data-column="needs"] .column-icon { color: var(--warn); }
  section.column[data-column="done"] .column-icon { color: var(--success); }
  .column-title {
    min-width: 0; margin: 0; font-size: 15px; font-weight: 650; line-height: 1.3;
    letter-spacing: 0; text-transform: none; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .column-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 19px; height: 18px; padding: 0 6px; flex: none;
    border-radius: 999px; background: light-dark(rgba(17, 24, 39, 0.06), rgba(255, 255, 255, 0.08));
    color: light-dark(#4b5563, #aab4c2); font-size: 11px; font-variant-numeric: tabular-nums;
  }
  .column-toggle, .column-add {
    display: inline-flex; align-items: center; justify-content: center;
    width: 24px; height: 24px; flex: none; padding: 0; border: 0; border-radius: 6px;
    background: transparent; color: var(--muted);
  }
  .column-toggle { margin-left: auto; }
  .column-toggle:hover, .column-add:hover { background: light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08)); color: var(--text); }
  .column-toggle svg { transition: transform 0.14s ease; }
  section.column[data-collapsed="true"] .column-toggle svg { transform: rotate(-90deg); }
  .cards { display: flex; flex-direction: column; gap: 12px; }
  .column-empty { color: light-dark(#4b5563, #aab4c2); font-size: 12px; padding: 12px 6px; margin: 0; text-align: center; }
  .column-empty[hidden] { display: none; }
  .column-foot { margin-top: auto; padding-top: 2px; }
  .column-new-card {
    display: flex; align-items: center; gap: 6px; width: 100%; height: 32px;
    padding: 0 7px; border: 0; border-radius: 8px; background: transparent;
    color: var(--muted); font-size: 12.5px; font-weight: 500; text-align: left;
  }
  .column-new-card:hover:not(:disabled) {
    background: light-dark(rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.06));
    color: var(--text);
  }

  /* ---- cards ----------------------------------------------------------- */
  article.card {
    display: flex; flex-direction: column; gap: 8px;
    padding: 14px; border: 1px solid var(--border); border-radius: 12px;
    background: var(--surface); box-shadow: none;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
    position: relative;
  }
  article.card:hover {
    border-color: var(--border-strong);
    box-shadow: 0 1px 2px light-dark(rgba(16, 24, 40, 0.05), rgba(0, 0, 0, 0.3));
  }
  article.card[data-column="needs"] { cursor: pointer; }
  article.card[draggable="true"] { cursor: grab; }
  article.card[draggable="true"]:active { cursor: grabbing; }
  article.card.dragging { opacity: 0.5; }
  article.card.archived { opacity: 0.58; }
  article.card.drop-before::before {
    content: ''; position: absolute; left: 0; right: 0; top: -5px; height: 2px;
    border-radius: 2px; background: light-dark(#111827, #e8ecf2); z-index: 2;
  }
  article.card.drop-after::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: -5px; height: 2px;
    border-radius: 2px; background: light-dark(#111827, #e8ecf2); z-index: 2;
  }
  .card-head { display: flex; align-items: baseline; gap: 8px; }
  .card-identifier {
    flex: none; font-size: 13px; font-weight: 600; line-height: 1.3;
    color: var(--muted); letter-spacing: 0.01em;
  }
  .card-chevron { display: inline-flex; flex: none; align-self: flex-start; margin-top: 2px; margin-left: auto; color: var(--muted-soft); }
  .card-title {
    flex: 1 1 auto; min-width: 0; margin: 0;
    font-size: 17px; line-height: 1.3; font-weight: 600; letter-spacing: -0.01em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; overflow-wrap: anywhere;
  }
  .card-desc {
    margin: 0; font-size: 12.5px; line-height: 1.4; color: var(--muted);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; overflow-wrap: anywhere;
  }
  .card-desc[hidden] { display: none; }
  .chips { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .chip {
    display: inline-flex; align-items: center; max-width: 100%; height: 22px;
    padding: 0 7px; border: 0; border-radius: 5px; background: transparent;
    color: light-dark(#4b5563, #aab4c2); font-size: 12px; font-weight: 500;
    line-height: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .chip.project { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
  .chip.tag {
    padding: 0 7px; border: 1px solid var(--border-strong); border-radius: 6px;
    background: transparent; color: var(--muted);
  }
  .chip.archived { border: 1px solid var(--border-strong); background: var(--surface-soft); color: var(--muted); }
  .chip.priority-high { background: light-dark(#fef3c7, #3a2f16); color: light-dark(#92400e, #f2c46a); }
  .chip.priority-urgent { background: light-dark(#fee2e2, #3d1d1d); color: light-dark(#b91c1c, #f19a92); }
  .chip.priority-medium { background: light-dark(#f3f4f6, #2a3039); color: light-dark(#4b5563, #b8c1cd); }
  .chip.priority-low { background: light-dark(#dbeafe, #1b2c47); color: light-dark(#1d4ed8, #8ab4ff); }
  .card-meta { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; }
  .card-meta svg { flex: none; opacity: 0.8; }
  .card-blocker {
    margin: 0; padding: 7px 9px; border: 1px solid var(--border-needs);
    border-radius: 8px; background: light-dark(#fff5dd, #332a16);
    color: light-dark(#92400e, #f2c46a); font-size: 12px; line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .card-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    margin-top: 1px; padding-top: 7px; border-top: 1px solid light-dark(#f0f1f3, #242a33);
  }
  .card-status { display: inline-flex; align-items: center; gap: 5px; min-width: 0; color: var(--muted); font-size: 12px; white-space: nowrap; }
  .card-status-label { min-width: 0; }
  .card-dwell { color: light-dark(#6b7280, #9aa4b2); font-size: 12px; }
  .card-archived { color: var(--muted); }
  .status-dot { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--muted-soft); }
  .status-backlog .status-dot { background: var(--text); }
  .status-running .status-dot { background: var(--text); }
  .status-needs .status-dot { background: var(--warn); }
  .status-done .status-dot { background: var(--success); }
  .status-canceled .status-dot { background: var(--muted-soft); }
  .status-done { color: var(--success); }
  .status-needs { color: var(--warn); }
  .card-metrics { display: flex; align-items: center; gap: 9px; flex: none; margin-left: auto; color: light-dark(#6b7280, #9aa4b2); font-size: 12px; }
  .card-metrics .metric { color: light-dark(#6b7280, #9aa4b2); font-size: 12px; }
  .metric { display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums; }
  .metric svg { flex: none; width: 12px; height: 12px; }

  /* ---- inline question panel ------------------------------------------ */
  .question-panel {
    display: flex; flex-direction: column; gap: 6px; padding: 8px;
    border: 1px solid var(--warn-border); border-radius: 10px; background: var(--warn-bg);
  }
  .question-panel-head {
    display: flex; align-items: center; gap: 5px; margin: 0;
    color: var(--warn); font-size: 12px; font-weight: 600;
  }
  .question-panel-prompt { margin: 0; color: var(--text); font-size: 12.5px; font-weight: 500; line-height: 1.45; overflow-wrap: anywhere; }
  .question-context { margin: 0; color: var(--muted); font-size: 11.5px; line-height: 1.4; }
  .question-options { display: flex; flex-direction: column; gap: 3px; }
  .question-option,
  .option {
    display: grid; grid-template-columns: 16px minmax(0, 1fr);
    align-items: start; gap: 8px; min-height: 28px;
    color: var(--text); font-size: 12px; line-height: 1.35; cursor: pointer;
  }
  .question-option { padding: 3px 6px; border-radius: 7px; }
  .question-option:hover { background: light-dark(rgba(17, 24, 39, 0.04), rgba(255, 255, 255, 0.05)); }
  .question-option:has(input:checked) {
    background: var(--surface); box-shadow: inset 0 0 0 1px var(--warn-border);
  }
  .question-option input[type="radio"],
  .option input[type="radio"] {
    width: 16px; height: 16px; margin: 0; margin-top: 2px; padding: 0;
    accent-color: light-dark(#111827, #e8ecf2);
  }
  .question-option-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .question-option-label { overflow-wrap: anywhere; }
  .question-option-detail { color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }
  .question-note {
    width: 100%; height: 28px; padding: 0 8px; border: 1px solid var(--warn-border);
    border-radius: 7px; background: var(--surface); font-size: 12px;
  }
  .question-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .question-actions button {
    height: 28px; min-width: 48px; padding: 0 12px; border: 1px solid var(--border-strong);
    border-radius: 7px; background: var(--surface); color: var(--text);
    font-size: 12px; font-weight: 600;
  }
  .question-actions button:hover:not(:disabled) { background: var(--surface-soft); }
  .question-actions .question-approve {
    border-color: transparent; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827);
  }
  .question-actions .question-approve:hover:not(:disabled) { background: light-dark(#1f2937, #ffffff); }
  .question-actions button:disabled { opacity: 0.45; }

  /* ---- drawer ---------------------------------------------------------- */
  .backdrop {
    position: fixed; inset: 0; z-index: 9; background: light-dark(rgba(16, 24, 40, 0.28), rgba(0, 0, 0, 0.5));
    opacity: 0; pointer-events: none; transition: opacity 140ms ease;
  }
  .backdrop.open { opacity: 1; pointer-events: auto; }
  aside.drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 10;
    display: flex; flex-direction: column; width: min(620px, 100%);
    background: var(--surface); border-left: 1px solid var(--border);
    transform: translateX(100%); transition: transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  aside.drawer.open { transform: translateX(0); }
  .drawer-head {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 18px 22px 14px; border-bottom: 1px solid var(--border);
  }
  .drawer-head-main { flex: 1 1 auto; min-width: 0; }
  .drawer-head-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .drawer-head h2 { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 650; overflow-wrap: anywhere; }
  .drawer-status-chip {
    display: inline-flex; align-items: center; flex: none; height: 22px; padding: 0 8px;
    border: 1px solid var(--border-strong); border-radius: 999px;
    background: var(--surface); color: var(--muted);
    font-size: 11.5px; font-weight: 600; white-space: nowrap;
  }
  .drawer-status-chip.status-needs {
    border-color: var(--warn-border); background: var(--warn-bg); color: var(--warn);
  }
  .drawer-status-chip.status-done { border-color: var(--border-done); background: var(--panel-done); color: var(--success); }
  .drawer-status-chip.status-running { color: var(--text); }
  .drawer-status-chip.status-canceled { color: var(--muted-soft); }
  .drawer-pending {
    margin: 6px 0 0; padding: 6px 9px; border-radius: 8px;
    border: 1px solid var(--warn-border); background: var(--warn-bg);
    color: light-dark(#92400e, #f2c46a); font-size: 12.5px; line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .drawer-pending.blocked {
    border-color: light-dark(#f3c5c0, #5c2a25); background: light-dark(#fef2f1, #2d1a18);
    color: var(--danger);
  }
  .drawer-sub { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 0; color: var(--muted); font-size: 12px; }
  .drawer-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 3px 0 0; color: var(--muted-soft); font-size: 11.5px; }
  #drawer-close {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; flex: none; margin-left: auto; padding: 0;
    border: 0; border-radius: 8px; background: transparent; color: var(--muted); font-size: 20px;
  }
  #drawer-close:hover { background: var(--surface-soft); color: var(--text); }
  .drawer-body { display: grid; gap: 0; flex: 1 1 auto; min-height: 0; align-content: start; padding: 0 22px 24px; overflow: auto; }
  aside.drawer.drawer-fit .drawer-body { flex: 0 0 auto; overflow: visible; padding-bottom: 16px; }
  aside.drawer.drawer-fit .drawer-footer { position: static; }
  aside.drawer.drawer-fit.drawer-overflow .drawer-body { flex: 1 1 auto; overflow: auto; padding-bottom: 24px; }
  aside.drawer.drawer-fit.drawer-overflow .drawer-footer { position: sticky; bottom: 0; }
  .drawer-tabs {
    display: flex; gap: 4px; flex: none; padding: 0 22px;
    border-bottom: 1px solid var(--border); background: var(--surface);
  }
  .drawer-tab {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    min-width: 72px; height: 44px; padding: 0 16px; border: 0; border-bottom: 2px solid transparent;
    border-radius: 0; background: transparent; color: var(--muted);
    font-size: 13px; font-weight: 600; white-space: nowrap;
  }
  .drawer-tab:hover { color: var(--text); }
  .drawer-tab[aria-selected="true"] { color: var(--text); border-bottom-color: var(--text); }
  .drawer-tab:focus-visible { outline-offset: -3px; }
  .drawer-tab-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 17px; height: 17px; padding: 0 4px; flex: none;
    border-radius: 999px; border: 1px solid var(--warn-border);
    background: var(--warn-bg); color: var(--warn);
    font-size: 10.5px; font-weight: 700; line-height: 1;
  }
  .drawer-tab-badge[hidden] { display: none; }
  .drawer-panel[hidden] { display: none !important; }
  .drawer-band > h3 {
    margin: 0; color: var(--text); font-size: 14px; font-weight: 650; letter-spacing: -0.01em;
  }
  .drawer-band .drawer-section:first-of-type { padding-top: 0; border-top: 0; }
  .drawer-actions-band { padding: 14px 0 16px; gap: 6px; }
  .drawer-actions-band > h4 { color: var(--muted); font-size: 12px; font-weight: 600; }
  .drawer-actions-band .actions button { height: 30px; font-size: 12px; }
  .drawer-footer {
    position: sticky; bottom: 0; z-index: 3; flex: none;
    display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
    padding: 12px 22px calc(12px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--border); background: var(--surface);
  }
  .drawer-footer .drawer-dirty {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--muted); font-size: 12px; white-space: nowrap;
  }
  .drawer-footer .drawer-dirty[hidden] { display: none; }
  .drawer-footer .dirty-dot {
    width: 7px; height: 7px; flex: none; border-radius: 50%;
    background: var(--warn); box-shadow: 0 0 0 3px var(--warn-bg);
  }
  .drawer-footer-actions { margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
  .drawer-footer-actions #save-task { min-width: 104px; }
  .drawer-footer-actions #save-task:disabled { opacity: 0.45; }
  .panel {
    display: grid; gap: 8px; padding: 18px 0 20px;
    border: 0; border-bottom: 1px solid var(--border); border-radius: 0; background: transparent;
  }
  .panel[hidden] { display: none; }
  .panel h3 { margin: 0 0 2px; color: var(--text); font-size: 13px; font-weight: 650; letter-spacing: 0; text-transform: none; }
  .panel h4 { margin: 4px 0 0; color: var(--muted); font-size: 12px; font-weight: 500; }
  .panel label { display: grid; gap: 4px; color: var(--muted); font-size: 12px; }
  .panel input, .panel select, .panel textarea { font-size: 13px; }
  .attr-grid {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px 14px; align-items: start;
  }
  .attr { display: grid; gap: 4px; min-width: 0; }
  .attr.full { grid-column: 1 / -1; }
  .attr-label { color: var(--muted); font-size: 12px; }
  .attr-value { color: var(--text); font-size: 13px; overflow-wrap: anywhere; }
  .attr > h4 { margin: 2px 0 0; }
  .attr-static {
    display: flex; align-items: center; min-height: 34px; padding: 0 2px;
    color: var(--text); font-size: 13px;
  }
  .attr-static .status-dot { margin-right: 6px; }
  .attr-status { display: inline-flex; align-items: center; gap: 6px; }
  .attr-dates { display: grid; gap: 2px; align-content: start; }
  .attr-date { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  .attr-date-label { flex: none; color: var(--muted); font-size: 11.5px; }
  .attr-date-value { min-width: 0; overflow-wrap: anywhere; }
  .drawer-section { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }
  .drawer-section h4 { margin: 0; color: var(--text); font-size: 13px; font-weight: 650; }
  .drawer-section[hidden] { display: none; }
  .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .actions button, .panel > button {
    display: inline-flex; align-items: center; justify-content: center;
    height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); color: var(--text); font-size: 12.5px; font-weight: 600;
  }
  .actions button:hover:not(:disabled), .panel > button:hover:not(:disabled) { background: var(--surface-soft); border-color: var(--border-strong); }
  button.primary { border-color: transparent; background: light-dark(#111827, #f1f5f9); color: light-dark(#ffffff, #111827); }
  button.primary:hover:not(:disabled) { background: light-dark(#1f2937, #ffffff); }
  button.danger { border-color: var(--border); color: var(--danger); background: transparent; }
  button.danger:hover:not(:disabled) { border-color: var(--danger); background: light-dark(rgba(180, 35, 24, 0.05), rgba(241, 154, 146, 0.08)); }
  .link-row { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr) auto; gap: 6px; align-items: center; }
  .link-row input { min-width: 0; }
  .link-row button { height: 32px; padding: 0 9px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
  .feed { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
  .feed-item { display: grid; gap: 1px; padding-left: 9px; border-left: 2px solid var(--border); }
  .feed-day {
    display: flex; align-items: center; gap: 8px; margin: 3px 0 0;
    color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.01em;
    list-style: none;
  }
  .feed-day::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .feed-summary { font-size: 12.5px; overflow-wrap: anywhere; }
  .feed-note { margin: 0; font-size: 12.5px; line-height: 1.45; overflow-wrap: anywhere; }
  .attachment { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .attachment .attachment-name { font-size: 12.5px; font-weight: 500; overflow-wrap: anywhere; }
  .attachment .hint { flex: 1; min-width: 110px; }
  .attachment button { padding: 3px 8px; font-size: 11.5px; }
  /* ---- attachment dropzone -------------------------------------------- */
  .dropzone {
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    padding: 12px; border: 1.5px dashed var(--border-strong); border-radius: 10px;
    background: var(--surface-soft);
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .dropzone.dragover {
    border-color: var(--text);
    background: light-dark(#eef2f7, #1f2733);
  }
  .dropzone.disabled { opacity: 0.55; }
  .dropzone-row { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
  .dropzone .dropzone-button {
    height: 32px; padding: 0 12px; border: 1px solid var(--border-strong);
    border-radius: 8px; background: var(--surface); color: var(--text);
    font-size: 12.5px; font-weight: 600;
  }
  .dropzone .dropzone-button:hover:not(:disabled) { border-color: var(--text); }
  .dropzone-hint { color: var(--muted); font-size: 11.5px; }
  .dropzone-file {
    display: flex; align-items: center; gap: 6px; margin: 0;
    color: var(--text); font-size: 12px; font-weight: 500; overflow-wrap: anywhere;
  }
  .dropzone-file[hidden] { display: none; }
  .dropzone-file::before { content: ''; width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--success); }
  .option {
    padding: 5px 8px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface);
  }
  .option:hover { border-color: var(--border-strong); }
  .option:has(input:checked) { border-color: var(--text); background: var(--warn-bg); }
  .option-text { display: grid; gap: 1px; min-width: 0; }
  .option-label { font-size: 12.5px; overflow-wrap: anywhere; }
  #drawer-readonly.banner { margin: 14px 0 0; }
  #question-section { border-top: 0; }

  /* ---- dialogs and toast ---------------------------------------------- */
  dialog {
    width: min(560px, calc(100vw - 28px)); max-height: calc(100vh - 40px); padding: 0;
    border: 1px solid var(--border); border-radius: 14px; background: var(--surface); color: var(--text);
  }
  dialog#project-dialog { width: min(660px, calc(100vw - 28px)); }
  dialog::backdrop { background: light-dark(rgba(16, 24, 40, 0.32), rgba(0, 0, 0, 0.55)); }
  dialog form, dialog .dialog-body { display: grid; gap: 10px; padding: 16px 18px 18px; }
  dialog label { display: grid; gap: 4px; color: var(--muted); font-size: 12px; }
  dialog h3 { margin: 4px 0 0; font-size: 13px; font-weight: 650; }
  .dialog-head { display: flex; align-items: center; gap: 8px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
  .dialog-head h2 { margin: 0; font-size: 16px; font-weight: 650; }
  .dialog-head button {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; margin-left: auto; padding: 0; border: 0; border-radius: 7px;
    background: transparent; color: var(--muted); font-size: 19px;
  }
  .dialog-head button:hover { background: var(--surface-soft); color: var(--text); }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 0 0; border-top: 1px solid var(--border); }
  .dialog-actions button {
    height: 34px; padding: 0 14px; border: 1px solid var(--border);
    border-radius: 8px; background: var(--surface); color: var(--text);
    font-size: 12.5px; font-weight: 600;
  }
  .dialog-actions button:hover:not(:disabled) { border-color: var(--border-strong); background: var(--surface-soft); }
  .dialog-actions .danger-solid {
    border-color: transparent; background: light-dark(#b42318, #d4524a); color: #ffffff;
  }
  .dialog-actions .danger-solid:hover:not(:disabled) { background: light-dark(#961a12, #d97f77); border-color: transparent; }
  .dialog-error { margin: 0; color: var(--danger); font-size: 12px; }
  .decision-summary {
    display: grid; gap: 6px; padding: 10px 12px;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface-soft);
  }
  .decision-summary-row { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 8px; align-items: baseline; }
  .decision-summary-label { color: var(--muted); font-size: 11.5px; font-weight: 600; }
  .decision-summary-question { margin: 0; color: var(--text); font-size: 12.5px; font-weight: 550; line-height: 1.4; overflow-wrap: anywhere; }
  .decision-summary-answer { margin: 0; color: var(--text); font-size: 12.5px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
  .decision-summary-answer.empty { color: var(--muted-soft); font-weight: 500; }
  #decision-dialog .dialog-actions { align-items: center; }
  #decision-dialog .dialog-actions #decision-approve,
  #decision-dialog .dialog-actions #decision-reject { min-width: 88px; }
  #decision-approve.primary {
    border-color: transparent; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827);
  }
  #decision-approve.primary:hover { background: light-dark(#1f2937, #ffffff); }
  #decision-reject.danger-solid {
    border-color: transparent; background: light-dark(#b42318, #d4524a); color: #ffffff;
  }
  #decision-reject.danger-solid:hover {
    border-color: transparent; background: light-dark(#961a12, #d97f77);
  }
  #decision-approve.outline-neutral {
    border-color: var(--border-strong); background: var(--surface); color: var(--text);
  }
  #decision-approve.outline-neutral:hover { background: var(--surface-soft); }
  #decision-reject.danger-outline {
    border-color: light-dark(#e7a9a3, #6b3733); background: transparent; color: var(--danger);
  }
  #decision-reject.danger-outline:hover {
    border-color: var(--danger); background: light-dark(rgba(180, 35, 24, 0.06), rgba(241, 154, 146, 0.1));
  }
  .ask-options { display: grid; gap: 6px; }
  .ask-options-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 10px; }
  .ask-option-row {
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto;
    gap: 6px; align-items: center;
  }
  .ask-option-row input { min-width: 0; }
  .ask-option-row button {
    width: 32px; height: 32px; padding: 0; border: 1px solid var(--border);
    border-radius: 8px; background: var(--surface); color: var(--muted); font-size: 16px;
  }
  .ask-option-row button:hover:not(:disabled) { border-color: var(--danger); color: var(--danger); }
  .project-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .project-row {
    display: grid; gap: 4px; padding: 10px 12px;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface-soft);
  }
  .project-row .project-line { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .project-row .project-name { font-size: 13px; font-weight: 600; }
  .project-row .badge { padding: 1px 7px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-size: 10.5px; }
  .project-row .actions { margin-top: 2px; }
  .project-row .actions button { height: 28px; padding: 0 9px; font-size: 11.5px; }
  /* ---- confirm sheet --------------------------------------------------- */
  .confirm-backdrop {
    position: fixed; inset: 0; z-index: 60;
    background: light-dark(rgba(16, 24, 40, 0.32), rgba(0, 0, 0, 0.55));
  }
  .confirm-sheet {
    position: fixed; left: 50%; top: 50%; z-index: 61;
    display: grid; gap: 10px; width: min(420px, calc(100vw - 32px));
    max-height: calc(100vh - 40px); overflow: auto;
    padding: 20px; transform: translate(-50%, -50%);
    border: 1px solid var(--border); border-radius: 14px; background: var(--surface);
    box-shadow: 0 24px 60px light-dark(rgba(16, 24, 40, 0.22), rgba(0, 0, 0, 0.6));
  }
  .confirm-sheet[hidden] { display: none; }
  .confirm-sheet h2 { margin: 0; font-size: 16px; font-weight: 650; }
  .confirm-target { margin: 0; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
  .confirm-detail { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.45; }
  .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
  .confirm-actions button {
    height: 34px; padding: 0 14px; border: 1px solid var(--border);
    border-radius: 8px; background: var(--surface); color: var(--text);
    font-size: 12.5px; font-weight: 600;
  }
  .confirm-actions button:hover { border-color: var(--border-strong); background: var(--surface-soft); }
  #confirm-ok.danger-solid {
    border-color: transparent; background: light-dark(#b42318, #d4524a); color: #ffffff;
  }
  #confirm-ok.danger-solid:hover { background: light-dark(#961a12, #d97f77); border-color: transparent; }
  #confirm-ok.primary {
    border-color: transparent; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827);
  }
  #confirm-ok.primary:hover { background: light-dark(#1f2937, #ffffff); }
  body.confirm-open { overflow: hidden; }
  .toast {
    position: fixed; left: 50%; bottom: 22px; z-index: 20; max-width: min(560px, calc(100vw - 32px));
    padding: 8px 14px; border-radius: 999px; background: light-dark(#111827, #f1f5f9);
    color: light-dark(#ffffff, #111827); font-size: 12px; opacity: 0;
    transform: translate(-50%, 8px); transition: 140ms ease; pointer-events: none;
  }
  .toast.show { opacity: 1; transform: translate(-50%, 0); }
  .toast.error { background: var(--danger); color: #fff; }
  .shortcuts {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 5;
    display: flex; align-items: center; justify-content: center;
    height: 24px; padding: 0 16px; margin: 0;
    border-top: 1px solid var(--border); background: var(--surface);
    color: var(--muted); font-size: 11.5px;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
  /* ---- responsive: density, footer wrap, compact toolbar --------------- */
  @media (max-width: 1120px) {
    .card-footer { flex-wrap: wrap; row-gap: 4px; }
  }
  @media (max-width: 720px) {
    .topbar-inner {
      display: grid; grid-template-columns: auto minmax(0, 1fr);
      align-items: center; gap: 8px; padding: 8px 12px; min-height: 0;
    }
    .project-chip { grid-column: 1; grid-row: 2; max-width: 46vw; min-width: 0; height: 44px; }
    .project-chip select { max-width: calc(46vw - 46px); min-width: 0; height: 42px; }
    .search-wrap {
      grid-column: 1 / -1; grid-row: 1; flex: none; width: 100%; max-width: none;
      min-width: 0; height: 44px;
    }
    #search { min-width: 0; height: 44px; }
    .topbar-tools {
      display: flex; grid-column: 2; grid-row: 2; align-items: center;
      justify-content: flex-start; gap: 8px;
    }
    .topbar-actions { display: contents; }
    .running-chip, .needs-chip { display: none; }
    #filter-toggle, #manage-projects {
      display: inline-flex; align-items: center; justify-content: center;
      width: auto; min-width: 44px; height: 44px; padding: 0 12px; gap: 6px; border-radius: 10px;
    }
    #filter-toggle .filter-badge {
      position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px;
      border: 1px solid var(--surface);
    }
    #manage-projects {
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
    }
    .overflow-toggle {
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; min-width: 44px; height: 44px; padding: 0;
      border: 1px solid var(--border); border-radius: 10px;
      background: var(--surface); color: var(--text); font-size: 18px; font-weight: 600;
    }
    .toolbar-overflow { position: relative; display: inline-flex; }
    .overflow-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 46;
      display: none; flex-direction: column; gap: 2px; min-width: 210px; padding: 6px;
      border: 1px solid var(--border); border-radius: 12px; background: var(--surface);
      box-shadow: 0 14px 34px light-dark(rgba(16, 24, 40, 0.12), rgba(0, 0, 0, 0.5));
    }
    .toolbar-overflow.open .overflow-menu { display: flex; }
    .overflow-menu #lang-toggle, .overflow-menu #refresh, .overflow-menu #archived-toggle {
      display: flex; align-items: center; justify-content: flex-start;
      width: 100%; min-width: 0; height: 44px; padding: 0 10px; gap: 8px;
      border: 1px solid transparent; border-radius: 8px;
      background: transparent; color: var(--text); font-size: 13px; font-weight: 600; text-align: left;
    }
    .overflow-menu #lang-toggle:hover, .overflow-menu #refresh:hover,
    .overflow-menu #archived-toggle:hover { border-color: var(--border); background: var(--surface-soft); }
    .overflow-menu #archived-toggle[aria-pressed="true"] {
      border-color: transparent; background: light-dark(#111827, #f1f5f9);
      color: light-dark(#ffffff, #111827);
    }
    .overflow-menu .btn-label { display: inline; }
    .overflow-menu .btn-icon { display: inline-flex; }
    .filters-popover { width: min(300px, calc(100vw - 24px)); }
    .shortcuts { display: none; }
  }
  @media (max-width: 600px) {
    aside.drawer { width: 100%; border-left: 0; }
    .drawer-head { padding: 16px 16px 14px; }
    .drawer-tabs { padding: 0 16px; }
    .drawer-body { padding: 0 16px 20px; }
    .attr-grid { grid-template-columns: minmax(0, 1fr); }
    .drawer-footer { padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px)); }
    .drawer-footer .drawer-dirty { order: 1; }
    .drawer-footer-actions { order: 2; width: 100%; margin-left: 0; justify-content: flex-end; }
    .filter-summary { align-items: center; }
    #filter-clear-all { margin-left: 2px; }
  }
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
<header class="topbar">
  <div class="topbar-inner">
    <div class="project-chip">
      <span class="project-mark" aria-hidden="true"></span>
      <label class="sr-only" for="project-select" data-i18n="header.project">Project</label>
      <select id="project-select" data-i18n-aria="header.project" aria-label="Project">
        <option value="all">All projects</option>
      </select>
      <span class="chip-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
    </div>
    <div class="search-wrap">
      <span class="search-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.2"/><path d="m15.6 15.6 4 4"/></svg></span>
      <input id="search" type="search" data-i18n-placeholder="header.searchPlaceholder" data-i18n-aria="header.searchLabel" placeholder="Search title / summary / project / label" aria-label="Search title, summary, project or label" autocomplete="off" />
    </div>
    <div class="topbar-tools">
      <div class="filters-wrap">
        <button id="filter-toggle" type="button" aria-expanded="false" aria-controls="filters-popover" data-i18n-aria="header.filter" aria-label="Filters" data-i18n-title="header.filter" title="Filters">
          <span class="btn-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6.4 7.3V19l-3.2 1.6v-8.3L4 5Z"/></svg></span>
          <span class="btn-label" data-i18n="header.filter">Filters</span>
          <span class="filter-badge" id="filter-badge" aria-hidden="true" hidden>0</span>
        </button>
        <div class="filters-popover" id="filters-popover" role="group" data-i18n-aria="filter.toolbar" aria-label="Filters" hidden>
          <label for="filter-priority"><span data-i18n="filter.priority">All priorities</span>
            <span class="select-field" data-select-field>
              <select id="filter-priority" aria-label="Priority" data-i18n-aria="filter.priorityAria" tabindex="-1" hidden>
                <option value="">All priorities</option>
              </select>
              <button class="select-trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="filter-priority-menu" aria-label="Priority">
                <span class="select-value">All priorities</span>
                <span class="select-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
              </button>
              <ul class="select-menu" id="filter-priority-menu" role="listbox" aria-label="Priority" hidden></ul>
            </span>
          </label>
          <label for="filter-label"><span data-i18n="filter.label">All labels</span>
            <span class="select-field" data-select-field>
              <select id="filter-label" aria-label="Label" data-i18n-aria="filter.labelAria" tabindex="-1" hidden>
                <option value="">All labels</option>
              </select>
              <button class="select-trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="filter-label-menu" aria-label="Label">
                <span class="select-value">All labels</span>
                <span class="select-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
              </button>
              <ul class="select-menu" id="filter-label-menu" role="listbox" aria-label="Label" hidden></ul>
            </span>
          </label>
          <label for="filter-assignee"><span data-i18n="filter.assignee">All assignees</span>
            <span class="select-field" data-select-field>
              <select id="filter-assignee" aria-label="Assignee" data-i18n-aria="filter.assigneeAria" tabindex="-1" hidden>
                <option value="">All assignees</option>
              </select>
              <button class="select-trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="filter-assignee-menu" aria-label="Assignee">
                <span class="select-value">All assignees</span>
                <span class="select-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
              </button>
              <ul class="select-menu" id="filter-assignee-menu" role="listbox" aria-label="Assignee" hidden></ul>
            </span>
          </label>
          <div class="filters-foot">
            <button id="clear-filters" type="button" data-i18n="filter.clear">Clear filters</button>
            <span class="filter-count" id="filter-count" aria-live="polite"></span>
          </div>
        </div>
      </div>
      <div class="toolbar-overflow" id="toolbar-overflow">
        <button id="overflow-toggle" class="overflow-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="toolbar-overflow-menu" data-i18n-aria="overflow.label" aria-label="More actions" data-i18n-title="overflow.label" title="More actions">⋯</button>
        <div class="overflow-menu" id="toolbar-overflow-menu" role="menu" data-i18n-aria="overflow.label" aria-label="More actions">
          <button id="lang-toggle" type="button" role="menuitem" data-i18n-aria="header.langLabel" aria-label="Switch to Chinese" data-i18n-title="header.langLabel" title="Switch to Chinese">
            <span class="btn-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5S14.3 18.2 12 20.5C9.7 18.2 8.5 15.3 8.5 12S9.7 5.8 12 3.5Z"/></svg></span>
            <span class="btn-label" data-i18n="header.langToggle">中文</span>
          </button>
          <button id="refresh" class="icon-button" type="button" role="menuitem" data-i18n-aria="header.refresh" aria-label="Refresh" data-i18n-title="header.refresh" title="Refresh">
            <span class="btn-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M5.6 9a7.5 7.5 0 0 1 12.6-2.7L20 8"/><path d="M18.4 15a7.5 7.5 0 0 1-12.6 2.7L4 16"/></svg></span>
            <span class="btn-label" data-i18n="header.refresh">Refresh</span>
          </button>
          <button id="archived-toggle" class="archived-toggle" type="button" role="menuitem" aria-pressed="false" data-i18n-aria="filter.archivedAria" aria-label="Show archived tasks on the board" data-i18n-title="filter.archived" title="Show archived">
            <span class="btn-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4.5" width="16" height="4" rx="1"/><path d="M6 8.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8.5"/><path d="M10 12.5h4"/></svg></span>
            <span class="btn-label" data-i18n="filter.archived">Show archived</span>
          </button>
        </div>
      </div>
      <div class="topbar-actions">
        <span class="running-chip"><span class="live-dot" aria-hidden="true"></span><span id="running-count">0 running</span></span>
        <span class="needs-chip" id="needs-chip" data-empty="true"><span class="needs-dot" aria-hidden="true"></span><span id="needs-count">0 needs you</span></span>
        <button id="manage-projects" type="button" data-i18n-aria="header.projects" aria-label="Projects" data-i18n-title="header.projects" title="Projects">
          <span class="btn-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z"/></svg></span>
          <span class="btn-label" data-i18n="header.projects">Projects</span>
        </button>
      </div>
    </div>
  </div>
</header>

<div class="shell">
  <div class="filter-summary" id="filter-summary" role="region" data-i18n-aria="filter.toolbar" aria-label="Filters" hidden>
    <div class="filter-chips" id="filter-chips"></div>
    <button id="filter-clear-all" type="button" data-i18n="filter.clearAll">Clear all</button>
  </div>
  <div class="board-head">
    <h1 id="board-title">Codex Kanban</h1>
    <p class="board-meta">
      <span id="counts" aria-live="polite" data-i18n="app.loading">Loading…</span>
      <span id="board-context" class="board-context"></span>
    </p>
  </div>

  <div class="banner" id="readonly-banner" role="status" hidden>
    <span data-i18n="project.readOnly">This project is archived. Task and attachment changes are disabled until you restore it.</span>
    <button id="restore-selected" type="button" data-i18n="project.restoreSelected">Restore project</button>
  </div>

  <main class="board" id="board">
    <div class="board-empty" id="board-empty" role="status" hidden>
      <p data-i18n="filter.emptyTitle">No tasks match the current filters</p>
      <button id="board-empty-clear" type="button" data-i18n="filter.clear">Clear filters</button>
    </div>
    <section class="column" data-column="backlog" data-collapsed="false">
      <div class="column-head">
        <span class="column-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 5.2 4.5h13.6L21 9.5V13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5Z"/><path d="M3 10h4l1.2 2h7.6L17 10h4"/></svg></span>
        <h2 class="column-title" data-i18n="columns.backlog">Backlog</h2>
        <span class="column-count" data-count="backlog">0</span>
        <button class="column-toggle" type="button" data-collapse="backlog" aria-expanded="true" aria-controls="cards-backlog" aria-label="Collapse Backlog">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <button class="column-add" type="button" data-create="backlog" aria-label="New card in Backlog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="cards" id="cards-backlog"></div>
      <p class="column-empty" data-empty="backlog" data-i18n="columns.empty.backlog">Not started yet.</p>
      <footer class="column-foot">
        <button class="column-new-card" type="button" data-create="backlog" aria-label="New card in Backlog">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span data-i18n="columns.add">New card</span>
        </button>
      </footer>
    </section>
    <section class="column" data-column="running" data-collapsed="false">
      <div class="column-head">
        <span class="column-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m10.2 8.8 5 3.2-5 3.2V8.8Z"/></svg></span>
        <h2 class="column-title" data-i18n="columns.running">Running</h2>
        <span class="column-count" data-count="running">0</span>
        <button class="column-toggle" type="button" data-collapse="running" aria-expanded="true" aria-controls="cards-running" aria-label="Collapse Running">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <button class="column-add" type="button" data-create="running" aria-label="New card in Running">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="cards" id="cards-running"></div>
      <p class="column-empty" data-empty="running" data-i18n="columns.empty.running">Not started yet.</p>
      <footer class="column-foot">
        <button class="column-new-card" type="button" data-create="running" aria-label="New card in Running">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span data-i18n="columns.add">New card</span>
        </button>
      </footer>
    </section>
    <section class="column" data-column="needs" data-collapsed="false">
      <div class="column-head">
        <span class="column-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3.2 19h17.6L12 4Z"/><path d="M12 9v4"/><circle cx="12" cy="16.2" r=".7" fill="currentColor" stroke="none"/></svg></span>
        <h2 class="column-title" data-i18n="columns.needs">Needs you</h2>
        <span class="column-count" data-count="needs">0</span>
        <button class="column-toggle" type="button" data-collapse="needs" aria-expanded="true" aria-controls="cards-needs" aria-label="Collapse Needs you">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <button class="column-add" type="button" data-create="needs" aria-label="New card in Needs you">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="cards" id="cards-needs"></div>
      <p class="column-empty" data-empty="needs" data-i18n="columns.empty.needs">Not started yet.</p>
      <footer class="column-foot">
        <button class="column-new-card" type="button" data-create="needs" aria-label="New card in Needs you">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span data-i18n="columns.add">New card</span>
        </button>
      </footer>
    </section>
    <section class="column" data-column="done" data-collapsed="false">
      <div class="column-head">
        <span class="column-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.5 2.5 5.1-5.1"/></svg></span>
        <h2 class="column-title" data-i18n="columns.done">Done</h2>
        <span class="column-count" data-count="done">0</span>
        <button class="column-toggle" type="button" data-collapse="done" aria-expanded="true" aria-controls="cards-done" aria-label="Collapse Done">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <button class="column-add" type="button" data-create="done" aria-label="New card in Done">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <div class="cards" id="cards-done"></div>
      <p class="column-empty" data-empty="done" data-i18n="columns.empty.done">Not started yet.</p>
      <footer class="column-foot">
        <button class="column-new-card" type="button" data-create="done" aria-label="New card in Done">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span data-i18n="columns.add">New card</span>
        </button>
      </footer>
    </section>
  </main>

  <footer class="shortcuts hint" data-i18n-aria="shortcuts.label" aria-label="Keyboard shortcuts">
    <span data-i18n="shortcuts.hint">Press / to search, n for a new task, Esc to close.</span>
  </footer>
</div>

<template id="question-panel-template">
  <div class="question-panel" data-question-panel>
    <p class="question-panel-head">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4"/><circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none"/></svg>
      <span data-i18n="question.inlineTitle" data-question-title>Needs your answer</span>
    </p>
    <p class="question-panel-prompt" data-question-prompt></p>
    <p class="question-context" data-question-context hidden></p>
    <div class="question-options" data-question-options role="radiogroup" data-i18n-aria="question.inlineTitle" aria-label="Needs your answer"></div>
    <input class="question-note" type="text" maxlength="2000" data-question-note data-i18n-placeholder="question.notePlaceholder" placeholder="Optional note…" aria-label="Optional note" />
    <div class="question-actions">
      <button class="question-reject" type="button" data-question-reject data-i18n="drawer.reject">Reject</button>
      <button class="question-approve" type="button" data-question-approve data-i18n="drawer.approve">Approve</button>
    </div>
  </div>
</template>

<div class="backdrop" id="backdrop"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-hidden="true" data-tab="details">
  <div class="drawer-head">
    <div class="drawer-head-main">
      <div class="drawer-head-title">
        <h2 id="drawer-title">Task details</h2>
        <span class="drawer-status-chip status-backlog" id="drawer-status-chip">Backlog</span>
      </div>
      <p class="drawer-pending" id="drawer-pending" hidden></p>
      <p class="drawer-sub">
        <span id="drawer-identifier"></span>
        <span id="drawer-project"></span>
      </p>
      <p class="drawer-meta">
        <span id="drawer-version">Version 1</span>
        <span id="drawer-updated-meta"></span>
      </p>
    </div>
    <button id="drawer-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <div class="drawer-tabs" role="tablist" aria-label="Task sections" data-i18n-aria="drawer.tabs">
    <button class="drawer-tab" id="drawer-tab-details" type="button" role="tab" aria-selected="true" aria-controls="drawer-panel-details" tabindex="0" data-drawer-tab="details" data-i18n="drawer.details">Details</button>
    <button class="drawer-tab" id="drawer-tab-collaboration" type="button" role="tab" aria-selected="false" aria-controls="drawer-panel-collaboration" tabindex="-1" data-drawer-tab="collaboration"><span data-i18n="drawer.collaboration">Collaboration</span><span class="drawer-tab-badge" id="drawer-tab-badge" aria-hidden="true" hidden>1</span></button>
    <button class="drawer-tab" id="drawer-tab-activity" type="button" role="tab" aria-selected="false" aria-controls="drawer-panel-activity" tabindex="-1" data-drawer-tab="activity" data-i18n="drawer.activity">Activity</button>
  </div>
  <div class="drawer-body" id="drawer-body">
    <p class="banner" id="drawer-readonly" hidden data-i18n="drawer.readOnly">This task belongs to an archived project and is read-only.</p>

    <section class="panel drawer-band drawer-panel" id="drawer-panel-details" role="tabpanel" aria-labelledby="drawer-tab-details" data-tab-panel="details">
      <div class="attr-grid">
        <div class="attr full">
          <label for="edit-title" data-i18n="drawer.titleField">Title</label>
          <input id="edit-title" type="text" maxlength="240" data-write />
        </div>
        <div class="attr">
          <label for="attr-status" data-i18n="drawer.statusLabel">Status</label>
          <span class="select-field" data-select-field>
            <select id="attr-status" data-write aria-label="Status" data-i18n-aria="drawer.statusLabel" tabindex="-1" hidden>
              <option value="backlog" data-i18n="status.backlog">Backlog</option>
              <option value="todo" data-i18n="status.todo">Unclaimed</option>
              <option value="in_progress" data-i18n="status.in_progress">In progress</option>
              <option value="in_review" data-i18n="status.in_review">Needs you</option>
              <option value="done" data-i18n="status.done">Done</option>
              <option value="canceled" data-i18n="status.canceled">Canceled</option>
            </select>
            <button class="select-trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="attr-status-menu" aria-label="Status">
              <span class="select-value">Backlog</span>
              <span class="select-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
            </button>
            <ul class="select-menu" id="attr-status-menu" role="listbox" aria-label="Status" hidden></ul>
          </span>
        </div>
        <div class="attr">
          <label for="edit-priority"><span data-i18n="drawer.priority">Priority</span>
            <span class="select-field" data-select-field>
              <select id="edit-priority" data-write aria-label="Priority" data-i18n-aria="drawer.priority" tabindex="-1" hidden>
                <option value="none" data-i18n="priority.none">None</option>
                <option value="low" data-i18n="priority.low">Low</option>
                <option value="medium" data-i18n="priority.medium">Medium</option>
                <option value="high" data-i18n="priority.high">High</option>
                <option value="urgent" data-i18n="priority.urgent">Urgent</option>
              </select>
              <button class="select-trigger" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="edit-priority-menu" aria-label="Priority">
                <span class="select-value">None</span>
                <span class="select-chevron" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/></svg></span>
              </button>
              <ul class="select-menu" id="edit-priority-menu" role="listbox" aria-label="Priority" hidden></ul>
            </span>
          </label>
        </div>
        <div class="attr">
          <span class="attr-label" data-i18n="drawer.assignee">Assignee</span>
          <span class="attr-static" id="attr-assignee"></span>
        </div>
        <div class="attr">
          <span class="attr-label" data-i18n="drawer.datesLabel">Dates</span>
          <span class="attr-static attr-dates">
            <span class="attr-date"><span class="attr-date-label" data-i18n="drawer.updatedLabel">Updated</span><span class="attr-date-value" id="attr-updated"></span></span>
            <span class="attr-date"><span class="attr-date-label" data-i18n="drawer.createdLabel">Created</span><span class="attr-date-value" id="attr-created"></span></span>
          </span>
        </div>
        <div class="attr full">
          <label for="edit-description" data-i18n="drawer.description">Description</label>
          <textarea id="edit-description" data-write></textarea>
        </div>
        <div class="attr full">
          <label for="edit-labels"><span data-i18n="drawer.labels">Labels (comma separated)</span>
            <input id="edit-labels" type="text" data-i18n-placeholder="drawer.labelsPlaceholder" placeholder="ui, docs" data-write />
          </label>
        </div>
      </div>
    </section>

    <section class="panel drawer-band drawer-panel" id="drawer-panel-collaboration" role="tabpanel" aria-labelledby="drawer-tab-collaboration" data-tab-panel="collaboration" hidden>
      <div class="drawer-section">
        <h4 data-i18n="drawer.links">Links</h4>
        <div id="edit-links" class="feed"></div>
        <div class="actions">
          <button id="add-link" type="button" data-write data-i18n="drawer.addLink">Add link</button>
        </div>
      </div>
      <div class="drawer-section" id="blocker-section" hidden>
        <h4 data-i18n="drawer.blocker">Blocker</h4>
        <p class="feed-summary" id="blocker-reason"></p>
        <p class="hint" id="blocker-since"></p>
      </div>
      <div class="drawer-section" id="question-section" hidden>
        <h4 data-i18n="drawer.question">Needs your decision</h4>
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
      </div>
      <div class="drawer-section">
        <h4 data-i18n="drawer.attachments">Attachments</h4>
        <ul id="attachment-list" class="feed"></ul>
        <p id="attachment-empty" class="hint" hidden data-i18n="drawer.attachmentsEmpty">No attachments.</p>
        <div class="dropzone" id="attachment-dropzone">
          <div class="dropzone-row">
            <button class="dropzone-button" id="attachment-browse" type="button" data-i18n="drawer.chooseFile">Choose file</button>
            <span class="dropzone-hint" data-i18n="drawer.dropHint">or drag a file here · up to 10 MB</span>
          </div>
          <p class="dropzone-file" id="attachment-filename" hidden></p>
          <input id="attachment-input" type="file" data-write hidden />
        </div>
        <p class="hint" data-i18n="drawer.attachmentHint">Up to 10 MB per file.</p>
        <p class="error" id="attachment-error" role="alert" hidden></p>
      </div>
      <div class="drawer-section">
        <h4 data-i18n="drawer.comments">Comments</h4>
        <ul id="comment-list" class="feed"></ul>
        <p id="comments-empty" class="hint" hidden data-i18n="drawer.commentsEmpty">No comments yet.</p>
        <textarea id="comment-body" data-i18n-placeholder="drawer.commentPlaceholder" placeholder="Add a comment" data-write></textarea>
        <div class="actions">
          <button id="add-comment" type="button" data-write data-i18n="drawer.addComment">Add comment</button>
        </div>
      </div>
      <div class="drawer-section drawer-actions-band" id="drawer-actions">
        <h4 data-i18n="drawer.actions">Actions</h4>
        <div id="move-actions" class="actions"></div>
        <div class="actions">
          <button id="ask-task" type="button" data-write data-i18n="drawer.ask">Ask a question</button>
          <button id="block-task" type="button" data-write data-i18n="drawer.block">Block</button>
          <button id="unblock-task" type="button" data-write data-i18n="drawer.unblock">Unblock</button>
        </div>
        <p class="hint" id="drawer-status" hidden></p>
      </div>
    </section>

    <section class="panel drawer-band drawer-panel" id="drawer-panel-activity" role="tabpanel" aria-labelledby="drawer-tab-activity" data-tab-panel="activity" hidden>
      <ol id="activity-list" class="feed"></ol>
      <p id="activity-empty" class="hint" hidden data-i18n="drawer.activityEmpty">No activity yet.</p>
    </section>
  </div>
  <footer class="drawer-footer" id="drawer-footer">
    <span class="drawer-dirty" id="drawer-dirty" aria-live="polite" hidden>
      <span class="dirty-dot" aria-hidden="true"></span>
      <span data-i18n="drawer.unsaved">Unsaved</span>
    </span>
    <div class="actions drawer-footer-actions">
      <button id="restore-task" class="primary" type="button" hidden data-i18n="drawer.restore">Restore</button>
      <button id="archive-task" class="danger" type="button" data-write data-i18n="drawer.archive">Archive</button>
      <button id="save-task" class="primary" type="button" data-write data-i18n="drawer.save" disabled>Save changes</button>
    </div>
  </footer>
</aside>

<div class="confirm-backdrop" id="confirm-backdrop" hidden></div>
<div class="confirm-sheet" id="confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-detail" hidden>
  <h2 id="confirm-title"></h2>
  <p class="confirm-target" id="confirm-target"></p>
  <p class="confirm-detail" id="confirm-detail"></p>
  <div class="confirm-actions">
    <button id="confirm-cancel" type="button" data-i18n="confirm.cancel">Cancel</button>
    <button id="confirm-ok" class="danger-solid" type="button"></button>
  </div>
</div>

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

<dialog id="decision-dialog" aria-labelledby="decision-heading">
  <div class="dialog-head">
    <h2 id="decision-heading" data-i18n="decision.title">Review decision</h2>
    <button id="decision-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <form id="decision-form">
    <p class="hint" id="decision-target"></p>
    <div class="decision-summary" id="decision-summary" data-i18n-aria="decision.title" aria-label="Review decision">
      <div class="decision-summary-row">
        <span class="decision-summary-label" data-i18n="decision.questionLabel">Question</span>
        <p class="decision-summary-question" id="decision-question"></p>
      </div>
      <div class="decision-summary-row">
        <span class="decision-summary-label" data-i18n="decision.answerLabel">Answer</span>
        <p class="decision-summary-answer" id="decision-answer"></p>
      </div>
    </div>
    <label for="decision-note"><span data-i18n="decision.noteLabel">Decision note (optional)</span>
      <textarea id="decision-note" maxlength="2000" data-i18n-placeholder="decision.notePlaceholder" placeholder="Context for the record"></textarea>
    </label>
    <div class="dialog-actions">
      <button id="decision-cancel" type="button" data-i18n="decision.cancel">Cancel</button>
      <button id="decision-approve" class="primary" type="button" data-i18n="decision.approve">Confirm approve</button>
      <button id="decision-reject" class="danger-outline" type="button" data-i18n="decision.reject">Confirm reject</button>
    </div>
  </form>
</dialog>

<dialog id="ask-dialog" aria-labelledby="ask-heading">
  <div class="dialog-head">
    <h2 id="ask-heading" data-i18n="ask.title">Ask a question</h2>
    <button id="ask-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <form id="ask-form">
    <label for="ask-prompt"><span data-i18n="ask.promptLabel">Question</span>
      <textarea id="ask-prompt" maxlength="2000" data-i18n-placeholder="ask.promptPlaceholder" placeholder="What do you need the human to decide?"></textarea>
    </label>
    <div class="ask-options-head">
      <span class="hint" data-i18n="ask.optionsLabel">Options</span>
      <span class="hint" data-i18n="ask.optionsHint">2–5 options. Each option needs a label.</span>
    </div>
    <div class="ask-options" id="ask-options"></div>
    <div class="actions">
      <button id="ask-add-option" type="button" data-i18n="ask.addOption">Add option</button>
    </div>
    <p class="dialog-error" id="ask-error" role="alert" hidden></p>
    <div class="dialog-actions">
      <button id="ask-cancel" type="button" data-i18n="ask.cancel">Cancel</button>
      <button class="primary" type="submit" data-i18n="ask.submit">Ask question</button>
    </div>
  </form>
</dialog>

<dialog id="block-dialog" aria-labelledby="block-heading">
  <div class="dialog-head">
    <h2 id="block-heading" data-i18n="block.title">Block task</h2>
    <button id="block-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <form id="block-form">
    <label for="block-reason"><span data-i18n="block.reasonLabel">Blocker reason</span>
      <textarea id="block-reason" maxlength="2000" data-i18n-placeholder="block.reasonPlaceholder" placeholder="What is blocking this task?"></textarea>
    </label>
    <p class="dialog-error" id="block-error" role="alert" hidden></p>
    <div class="dialog-actions">
      <button id="block-cancel" type="button" data-i18n="block.cancel">Cancel</button>
      <button class="primary" type="submit" data-i18n="block.submit">Save blocker</button>
    </div>
  </form>
</dialog>

<dialog id="rename-project-dialog" aria-labelledby="rename-heading">
  <div class="dialog-head">
    <h2 id="rename-heading" data-i18n="rename.title">Rename project</h2>
    <button id="rename-close" type="button" data-i18n-aria="drawer.close" aria-label="Close">×</button>
  </div>
  <form id="rename-form">
    <label for="rename-name"><span data-i18n="rename.nameLabel">Name</span>
      <input id="rename-name" type="text" maxlength="120" />
    </label>
    <label for="rename-prefix"><span data-i18n="rename.prefixLabel">Prefix</span>
      <input id="rename-prefix" type="text" maxlength="6" />
    </label>
    <p class="dialog-error" id="rename-error" role="alert" hidden></p>
    <div class="dialog-actions">
      <button id="rename-cancel" type="button" data-i18n="rename.cancel">Cancel</button>
      <button class="primary" type="submit" data-i18n="rename.submit">Save project</button>
    </div>
  </form>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  var API_BOARD = '/api/board';
  var API_ACTION = '/api/action';
  var ATTACHMENT_API = '/api/attachments/';
  var MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  var MIN_ASK_OPTIONS = 2;
  var MAX_ASK_OPTIONS = 5;
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
  var COLUMN_STATUS = {
    backlog: 'backlog',
    running: 'in_progress',
    needs: 'in_review',
    done: 'done'
  };
  var ICONS = {
    chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg>',
    comment: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-5.1A7.5 7.5 0 1 1 20 11.5Z"/></svg>',
    attachment: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.2-8.2a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.8 1.8 0 0 1-2.5-2.5l7.1-7.1"/></svg>',
    link: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg>'
  };
  var STORAGE = {
    lang: 'codex-kanban.lang',
    collapsed: 'codex-kanban.collapsed',
    project: 'codex-kanban.project',
    archived: 'codex-kanban.archived'
  };
  var I18N = ${JSON.stringify(STRINGS)};

  function readLang() {
    var value = storeGet(STORAGE.lang, '');
    if (value === 'zh' || value === 'en') return value;
    var browser = '';
    try { browser = String(window.navigator.language || '').toLowerCase(); } catch (error) { browser = ''; }
    return browser.indexOf('zh') === 0 ? 'zh' : 'en';
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

  function readArchived() {
    return storeGet(STORAGE.archived, '0') === '1';
  }

  function readTaskRef() {
    try {
      return new URLSearchParams(window.location.search).get('task') || '';
    } catch (error) {
      return '';
    }
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
    projectId: readTaskRef() ? 'all' : readProject(),
    search: '',
    priority: '',
    label: '',
    assignee: '',
    lang: readLang(),
    collapsed: readCollapsed(),
    selectedId: null,
    selectedOption: null,
    newTaskColumn: 'backlog',
    readOnly: false,
    includeArchived: readArchived() || Boolean(readTaskRef()),
    pendingTaskRef: readTaskRef(),
    dragTask: null,
    focusReturn: null,
    dirty: false,
    confirmHandler: null,
    confirmReturn: null,
    drawerTab: 'details',
    decisionKind: 'approve',
    skew: 0
  };

  var boardTitle = document.getElementById('board-title');
  var boardContext = document.getElementById('board-context');
  var counts = document.getElementById('counts');
  var runningCount = document.getElementById('running-count');
  var needsChip = document.getElementById('needs-chip');
  var needsCount = document.getElementById('needs-count');
  var toolbarOverflow = document.getElementById('toolbar-overflow');
  var overflowToggle = document.getElementById('overflow-toggle');
  var projectSelect = document.getElementById('project-select');
  var searchInput = document.getElementById('search');
  var manageProjects = document.getElementById('manage-projects');
  var refreshButton = document.getElementById('refresh');
  var filterToggle = document.getElementById('filter-toggle');
  var filtersPopover = document.getElementById('filters-popover');
  var archivedToggle = document.getElementById('archived-toggle');
  var langToggle = document.getElementById('lang-toggle');
  var readonlyBanner = document.getElementById('readonly-banner');
  var restoreSelected = document.getElementById('restore-selected');
  var filterPriority = document.getElementById('filter-priority');
  var filterLabel = document.getElementById('filter-label');
  var filterAssignee = document.getElementById('filter-assignee');
  var clearFilters = document.getElementById('clear-filters');
  var filterCount = document.getElementById('filter-count');
  var filterSummary = document.getElementById('filter-summary');
  var filterChips = document.getElementById('filter-chips');
  var filterClearAll = document.getElementById('filter-clear-all');
  var filterBadge = document.getElementById('filter-badge');
  var board = document.getElementById('board');
  var boardEmpty = document.getElementById('board-empty');
  var boardEmptyClear = document.getElementById('board-empty-clear');
  var questionTemplate = document.getElementById('question-panel-template');
  var backdrop = document.getElementById('backdrop');
  var drawer = document.getElementById('drawer');
  var drawerClose = document.getElementById('drawer-close');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerIdentifier = document.getElementById('drawer-identifier');
  var drawerVersion = document.getElementById('drawer-version');
  var drawerUpdatedMeta = document.getElementById('drawer-updated-meta');
  var drawerStatusChip = document.getElementById('drawer-status-chip');
  var drawerPendingLine = document.getElementById('drawer-pending');
  var drawerTabBadge = document.getElementById('drawer-tab-badge');
  var drawerBody = document.getElementById('drawer-body');
  var drawerProject = document.getElementById('drawer-project');
  var drawerReadonly = document.getElementById('drawer-readonly');
  var drawerFooter = document.getElementById('drawer-footer');
  var drawerDirty = document.getElementById('drawer-dirty');
  var drawerStatus = document.getElementById('drawer-status');
  var editTitle = document.getElementById('edit-title');
  var editDescription = document.getElementById('edit-description');
  var editPriority = document.getElementById('edit-priority');
  var editLabels = document.getElementById('edit-labels');
  var editLinks = document.getElementById('edit-links');
  var addLinkButton = document.getElementById('add-link');
  var saveTaskButton = document.getElementById('save-task');
  var archiveButton = document.getElementById('archive-task');
  var restoreButton = document.getElementById('restore-task');
  var attrStatus = document.getElementById('attr-status');
  var attrAssignee = document.getElementById('attr-assignee');
  var attrUpdated = document.getElementById('attr-updated');
  var attrCreated = document.getElementById('attr-created');
  var activityList = document.getElementById('activity-list');
  var activityEmpty = document.getElementById('activity-empty');
  var commentList = document.getElementById('comment-list');
  var commentsEmpty = document.getElementById('comments-empty');
  var commentBody = document.getElementById('comment-body');
  var addCommentButton = document.getElementById('add-comment');
  var attachmentList = document.getElementById('attachment-list');
  var attachmentEmpty = document.getElementById('attachment-empty');
  var attachmentInput = document.getElementById('attachment-input');
  var attachmentDropzone = document.getElementById('attachment-dropzone');
  var attachmentBrowse = document.getElementById('attachment-browse');
  var attachmentFilename = document.getElementById('attachment-filename');
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
  var confirmBackdrop = document.getElementById('confirm-backdrop');
  var confirmSheet = document.getElementById('confirm-sheet');
  var confirmTitle = document.getElementById('confirm-title');
  var confirmTarget = document.getElementById('confirm-target');
  var confirmDetail = document.getElementById('confirm-detail');
  var confirmCancel = document.getElementById('confirm-cancel');
  var confirmOk = document.getElementById('confirm-ok');
  var decisionDialog = document.getElementById('decision-dialog');
  var decisionForm = document.getElementById('decision-form');
  var decisionTarget = document.getElementById('decision-target');
  var decisionQuestion = document.getElementById('decision-question');
  var decisionAnswer = document.getElementById('decision-answer');
  var decisionNote = document.getElementById('decision-note');
  var decisionApprove = document.getElementById('decision-approve');
  var decisionReject = document.getElementById('decision-reject');
  var askDialog = document.getElementById('ask-dialog');
  var askForm = document.getElementById('ask-form');
  var askPromptInput = document.getElementById('ask-prompt');
  var askOptionsList = document.getElementById('ask-options');
  var askAddOption = document.getElementById('ask-add-option');
  var askError = document.getElementById('ask-error');
  var blockDialog = document.getElementById('block-dialog');
  var blockForm = document.getElementById('block-form');
  var blockReasonInput = document.getElementById('block-reason');
  var blockError = document.getElementById('block-error');
  var renameDialog = document.getElementById('rename-project-dialog');
  var renameForm = document.getElementById('rename-form');
  var renameNameInput = document.getElementById('rename-name');
  var renamePrefixInput = document.getElementById('rename-prefix');
  var renameError = document.getElementById('rename-error');
  var renameTarget = null;
  var drawerTabs = drawer.querySelectorAll('[data-drawer-tab]');
  var drawerPanels = drawer.querySelectorAll('[data-tab-panel]');

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

  function icon(name) {
    var node = document.createElement('span');
    node.className = 'icon';
    node.innerHTML = ICONS[name] || '';
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

  function nowMs() {
    return Date.now() - (state.skew || 0);
  }

  function applyServerTime(payload) {
    if (!payload || typeof payload.serverNow !== 'string') return;
    var parsed = Date.parse(payload.serverNow);
    if (!isFinite(parsed)) return;
    state.skew = Date.now() - parsed;
  }

  function ageParts(iso) {
    if (!iso) return null;
    var then = new Date(iso).getTime();
    if (!isFinite(then)) return null;
    var seconds = Math.max(0, Math.round((nowMs() - then) / 1000));
    if (seconds < 60) return { justNow: true, value: '' };
    var minutes = Math.round(seconds / 60);
    if (minutes < 60) return { justNow: false, value: t('age.minutes', { n: minutes }) };
    var hours = Math.round(minutes / 60);
    if (hours < 24) return { justNow: false, value: t('age.hours', { n: hours }) };
    return { justNow: false, value: t('age.days', { n: Math.round(hours / 24) }) };
  }

  function agoText(iso) {
    var parts = ageParts(iso);
    if (!parts) return '';
    return parts.justNow ? t('age.justNow') : t('card.dwell', { time: parts.value });
  }

  function updatedText(iso) {
    var parts = ageParts(iso);
    if (!parts) return '';
    return parts.justNow ? t('card.updatedJustNow') : t('card.updatedAgo', { time: parts.value });
  }

  function dwellText(iso) {
    var parts = ageParts(iso);
    if (!parts) return '';
    return parts.justNow ? t('card.dwellJustNow') : t('card.dwellLabel', { time: parts.value });
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
    var titles = document.querySelectorAll('[data-i18n-title]');
    for (var m = 0; m < titles.length; m += 1) {
      titles[m].setAttribute('title', t(titles[m].getAttribute('data-i18n-title')));
    }
    var langLabel = langToggle.querySelector('.btn-label');
    if (langLabel) langLabel.textContent = t('header.langToggle');
    else langToggle.textContent = t('header.langToggle');
    langToggle.setAttribute('aria-label', t('header.langLabel'));
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
    if (task && task.archivedAt) return false;
    if (task && projectArchived(task.projectId)) return false;
    return true;
  }

  function cardForTask(id) {
    var cards = document.querySelectorAll('article.card');
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].getAttribute('data-task-id') === id) return cards[i];
    }
    return null;
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
    var name = project
      ? project.name + (project.archivedAt ? t('project.archivedSuffix') : '')
      : t('header.allProjects');
    document.title = t('app.title') + ' · ' + name;
    boardTitle.textContent = name;
    if (!data) {
      counts.textContent = t('app.loading');
      return;
    }
    var summary = data.summary || {};
    var columnCounts = summary.counts || {};
    var running = columnCounts.running || 0;
    var needs = columnCounts.needs || 0;
    runningCount.textContent = t('counts.running', { n: running });
    needsCount.textContent = t('counts.needs', { n: needs });
    needsChip.setAttribute('data-empty', needs === 0 ? 'true' : 'false');
    boardContext.textContent = '';
    readonlyBanner.hidden = !state.readOnly;
    archivedToggle.setAttribute('aria-pressed', state.includeArchived ? 'true' : 'false');
    var createButtons = document.querySelectorAll('[data-create]');
    for (var i = 0; i < createButtons.length; i += 1) {
      createButtons[i].disabled = state.readOnly;
    }
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
    syncSelectFields();
  }

  function hasFilters() {
    return Boolean(state.search.trim() || state.priority || state.label || state.assignee);
  }

  function activeFilterCount() {
    var count = 0;
    if (state.search.trim()) count += 1;
    if (state.priority) count += 1;
    if (state.label) count += 1;
    if (state.assignee) count += 1;
    return count;
  }

  function addFilterChip(kind, value, label) {
    var chip = el('button', 'filter-chip');
    chip.type = 'button';
    chip.setAttribute('data-filter', kind);
    chip.setAttribute('data-filter-value', value);
    chip.setAttribute('aria-label', t('filter.remove', { value: label }));
    chip.title = t('filter.remove', { value: label });
    chip.appendChild(el('span', 'filter-chip-label', label));
    chip.appendChild(el('span', 'filter-chip-x', '×'));
    chip.addEventListener('click', function () { removeFilter(kind); });
    filterChips.appendChild(chip);
  }

  function renderFilterSummary() {
    filterChips.textContent = '';
    if (state.search.trim()) addFilterChip('search', state.search.trim(), state.search.trim());
    if (state.priority) addFilterChip('priority', state.priority, t('priority.' + state.priority));
    if (state.label) addFilterChip('label', state.label, state.label);
    if (state.assignee) addFilterChip('assignee', state.assignee, state.assignee);
    var count = activeFilterCount();
    filterSummary.hidden = count === 0;
    filterBadge.hidden = count === 0;
    filterBadge.textContent = String(count);
    filterToggle.classList.toggle('active', count > 0);
    filterToggle.setAttribute('data-active', count > 0 ? 'true' : 'false');
    filterToggle.setAttribute('aria-label', count > 0 ? t('header.filter') + ' · ' + count : t('header.filter'));
  }

  function removeFilter(kind) {
    if (kind === 'search') { state.search = ''; searchInput.value = ''; }
    if (kind === 'priority') state.priority = '';
    if (kind === 'label') state.label = '';
    if (kind === 'assignee') state.assignee = '';
    renderFilters();
    renderBoard();
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
    var filtered = hasFilters();
    var totals = { visible: 0, total: 0 };
    var visibleByColumn = {};
    for (var i = 0; i < COLUMNS.length; i += 1) {
      var id = COLUMNS[i];
      var all = columns[id] || [];
      var visible = [];
      for (var j = 0; j < all.length; j += 1) {
        if (matchesFilters(all[j])) visible.push(all[j]);
      }
      visibleByColumn[id] = visible;
      totals.visible += visible.length;
      totals.total += all.length;
    }
    var emptyFiltered = filtered && totals.visible === 0;
    boardEmpty.hidden = !emptyFiltered;
    board.classList.toggle('empty-filtered', emptyFiltered);
    for (var n = 0; n < COLUMNS.length; n += 1) {
      var columnId = COLUMNS[n];
      var section = document.querySelector('[data-column="' + columnId + '"]');
      var list = section.querySelector('.cards');
      var columnTasks = visibleByColumn[columnId];
      list.textContent = '';
      for (var k = 0; k < columnTasks.length; k += 1) {
        list.appendChild(renderCard(columnTasks[k], columnId));
      }
      section.querySelector('[data-count]').textContent = String(columnTasks.length);
      var empty = section.querySelector('[data-empty]');
      empty.hidden = columnTasks.length > 0 || emptyFiltered;
      empty.textContent = filtered ? t('filter.none') : t('columns.empty.' + columnId);
      var collapsed = state.collapsed.indexOf(columnId) !== -1;
      section.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
      var collapse = section.querySelector('[data-collapse]');
      collapse.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      collapse.setAttribute('aria-label', t(collapsed ? 'columns.expand' : 'columns.collapse', {
        column: t('columns.' + columnId)
      }));
      var creates = section.querySelectorAll('[data-create]');
      for (var c = 0; c < creates.length; c += 1) {
        creates[c].setAttribute('aria-label', t('columns.addAria', {
          column: t('columns.' + columnId)
        }));
        creates[c].hidden = filtered;
      }
      var foot = section.querySelector('.column-foot');
      if (foot) foot.hidden = filtered;
    }
    counts.textContent = filtered
      ? t('counts.filteredTasks', { visible: totals.visible, total: totals.total })
      : t('counts.tasks', { n: totals.total });
    filterCount.textContent = t('filter.showing', { visible: totals.visible, total: totals.total });
    renderFilterSummary();
  }

  function statusClass(task) {
    var status = task.status || 'backlog';
    if (status === 'in_progress') return 'status-running';
    if (status === 'in_review') return 'status-needs';
    if (status === 'done') return 'status-done';
    if (status === 'canceled') return 'status-canceled';
    return 'status-backlog';
  }

  function attentionOf(task) {
    if (!task || task.archivedAt) return null;
    if (task.pendingQuestion && !task.questionResolution) return 'question';
    if (task.blockedReason) return 'blocked';
    if (task.status === 'in_review') return 'review';
    return null;
  }

  function taskStatusLabel(task) {
    var attention = attentionOf(task);
    if (attention) return t('card.attention.' + attention);
    return t('status.' + (task.status || 'backlog'));
  }

  function taskElapsed(task) {
    var attention = attentionOf(task);
    var since = task.attentionSince;
    if (!since) {
      if (attention === 'question') since = task.pendingQuestion && task.pendingQuestion.createdAt;
      else if (attention === 'blocked') since = task.blockedSince || task.statusSince;
      else since = task.statusSince;
    }
    return since;
  }

  function metric(name, count, label) {
    var node = el('span', 'metric');
    node.setAttribute('title', label);
    node.setAttribute('aria-label', label);
    node.appendChild(icon(name));
    node.appendChild(el('span', '', String(count)));
    return node;
  }

  function buildQuestionPanel(task) {
    var panel = questionTemplate.content.querySelector('[data-question-panel]').cloneNode(true);
    var question = task.pendingQuestion || {};
    panel.addEventListener('click', function (event) { event.stopPropagation(); });
    panel.addEventListener('keydown', function (event) { event.stopPropagation(); });
    panel.querySelector('[data-question-title]').textContent = t('question.inlineTitle');
    panel.querySelector('[data-question-prompt]').textContent = question.prompt || '';
    var context = panel.querySelector('[data-question-context]');
    if (question.note) {
      context.hidden = false;
      context.textContent = question.note;
    } else {
      context.hidden = true;
    }
    var box = panel.querySelector('[data-question-options]');
    box.textContent = '';
    box.setAttribute('aria-label', t('question.inlineTitle'));
    var options = Array.isArray(question.options) ? question.options : [];
    var radioName = 'question-option-' + (task.id || task.identifier || 'task');
    for (var i = 0; i < options.length; i += 1) {
      (function (option) {
        var label = el('label', 'question-option');
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = radioName;
        radio.value = option.id || option.label || '';
        radio.checked = question.selected === option.id;
        label.appendChild(radio);
        var text = el('span', 'question-option-text');
        text.appendChild(el('span', 'question-option-label', option.label || option.id || ''));
        if (option.detail) text.appendChild(el('span', 'question-option-detail', option.detail));
        label.appendChild(text);
        box.appendChild(label);
      })(options[i]);
    }
    var note = panel.querySelector('[data-question-note]');
    if (question.answerNote) note.value = question.answerNote;
    note.placeholder = t('question.notePlaceholder');
    note.setAttribute('aria-label', t('question.notePlaceholder'));
    var approve = panel.querySelector('[data-question-approve]');
    var reject = panel.querySelector('[data-question-reject]');
    approve.textContent = t('drawer.approve');
    reject.textContent = t('drawer.reject');
    function sync() {
      var checked = box.querySelector('input[type="radio"]:checked');
      approve.disabled = !checked;
      reject.disabled = !checked;
    }
    var radios = box.querySelectorAll('input[type="radio"]');
    for (var j = 0; j < radios.length; j += 1) radios[j].addEventListener('change', sync);
    approve.addEventListener('click', function () { inlineDecide(task, 'approve', panel); });
    reject.addEventListener('click', function () { inlineDecide(task, 'reject', panel); });
    sync();
    return panel;
  }

  function inlineDecide(task, decision, panel) {
    if (!isWritable(task)) return;
    var checked = panel.querySelector('.question-options input[type="radio"]:checked');
    var noteInput = panel.querySelector('[data-question-note]');
    var note = noteInput ? noteInput.value : '';
    if (!checked) {
      notify(t('question.selectOption'), true);
      return;
    }
    var approve = panel.querySelector('[data-question-approve]');
    var reject = panel.querySelector('[data-question-reject]');
    approve.disabled = true;
    reject.disabled = true;
    act('task.answer', {
      id: task.id,
      version: task.version,
      option: checked.value,
      note: note
    }).then(function (body) {
      if (!body) return null;
      var fresh = findTask(task.id);
      if (!fresh) return null;
      return act(decision === 'approve' ? 'task.approve' : 'task.reject', {
        id: fresh.id,
        version: fresh.version,
        note: note
      });
    }).then(function (body) {
      if (body) notify(t(decision === 'approve' ? 'drawer.approved' : 'drawer.rejected'));
    });
  }

  function renderCard(task, columnId) {
    var archived = Boolean(task.archivedAt);
    var card = el('article', 'card');
    if (archived) card.classList.add('archived');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', t('card.open', { id: task.identifier, title: task.title }));
    card.setAttribute('data-column', columnId);
    card.setAttribute('data-task-id', task.id || '');
    card.setAttribute('data-identifier', task.identifier || '');
    card.setAttribute('data-version', String(task.version));
    card.setAttribute('data-archived', archived ? 'true' : 'false');
    var draggable = DRAG_COLUMNS.indexOf(columnId) !== -1 && isWritable(task);
    card.draggable = draggable;

    var head = el('div', 'card-head');
    head.appendChild(el('span', 'card-identifier', task.identifier));
    head.appendChild(el('h3', 'card-title', task.title));
    var open = icon('chevron');
    open.className = 'card-chevron';
    head.appendChild(open);
    card.appendChild(head);

    var description = el('p', 'card-desc', task.description || '');
    description.hidden = !task.description;
    card.appendChild(description);

    var chips = el('div', 'chips');
    if (task.projectName) chips.appendChild(el('span', 'chip project', task.projectName));
    if (task.priority && task.priority !== 'none') {
      chips.appendChild(el('span', 'chip priority-' + task.priority, t('priority.' + task.priority)));
    }
    var labels = Array.isArray(task.labels) ? task.labels : [];
    for (var i = 0; i < labels.length; i += 1) chips.appendChild(el('span', 'chip tag', labels[i]));
    if (archived) chips.appendChild(el('span', 'chip archived', t('card.archived')));
    if (chips.childElementCount) card.appendChild(chips);

    var updated = updatedText(task.updatedAt || task.statusSince);
    if (updated) {
      var meta = el('div', 'card-meta');
      meta.appendChild(icon('clock'));
      meta.appendChild(el('span', '', updated));
      card.appendChild(meta);
    }

    if (task.blockedReason) {
      card.appendChild(el('p', 'card-blocker', t('card.blockedPrefix') + task.blockedReason));
    } else if (task.pendingQuestion && !task.questionResolution) {
      card.appendChild(buildQuestionPanel(task));
    }

    var footer = el('div', 'card-footer');
    var status = el('span', 'card-status ' + statusClass(task));
    status.appendChild(el('span', 'status-dot'));
    status.appendChild(el('span', 'card-status-label', taskStatusLabel(task)));
    var elapsed = taskElapsed(task);
    if (elapsed) status.appendChild(el('span', 'card-dwell', ' · ' + dwellText(elapsed)));
    footer.appendChild(status);
    var metrics = el('span', 'card-metrics');
    var comments = Array.isArray(task.comments) ? task.comments.length : (task.commentCount || 0);
    var attachments = Array.isArray(task.attachments) ? task.attachments.length : (task.attachmentCount || 0);
    var links = Array.isArray(task.links) ? task.links.length : (task.linkCount || 0);
    function addMetric(name, count, key) {
      if (count > 0) metrics.appendChild(metric(name, count, t(key, { n: count })));
    }
    addMetric('comment', comments, 'card.comments');
    addMetric('attachment', attachments, 'card.attachments');
    addMetric('link', links, 'card.links');
    if (metrics.childElementCount) footer.appendChild(metrics);
    card.appendChild(footer);

    card.addEventListener('click', function () { openTask(task.id); });
    card.addEventListener('keydown', function (event) {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openTask(task.id);
        return;
      }
      if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown') && DRAG_COLUMNS.indexOf(columnId) !== -1) {
        var columnTasks = (state.data && state.data.board.columns[columnId]) || [];
        var position = columnTasks.findIndex(function (entry) { return entry.id === task.id; });
        var target = position + (event.key === 'ArrowUp' ? -1 : 1);
        if (position >= 0 && target >= 0 && target < columnTasks.length) {
          event.preventDefault();
          act({
            action: 'task.reorder',
            id: task.id,
            version: task.version,
            ...(event.key === 'ArrowUp'
              ? { beforeId: columnTasks[target].id }
              : { afterId: columnTasks[target].id })
          }).then(function () {
            notify(t('toast.reordered', { id: task.identifier }));
          }).catch(function () {});
        }
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
        state.dragTask = { id: task.id, version: task.version, column: columnId };
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('dragging');
        state.dragTask = null;
        clearDropMarkers();
      });
    }
    if (!archived && DRAG_COLUMNS.indexOf(columnId) !== -1) {
      card.addEventListener('dragover', function (event) {
        if (!state.dragTask || state.dragTask.column !== columnId) return;
        if (state.dragTask.id === task.id) return;
        event.preventDefault();
        event.stopPropagation();
        clearDropMarkers();
        card.classList.add('drop-before');
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      });
      card.addEventListener('dragleave', function (event) {
        if (event.relatedTarget && card.contains(event.relatedTarget)) return;
        card.classList.remove('drop-before');
      });
      card.addEventListener('drop', function (event) {
        if (!state.dragTask || state.dragTask.column !== columnId) return;
        if (state.dragTask.id === task.id) return;
        event.preventDefault();
        event.stopPropagation();
        var dragged = state.dragTask;
        state.dragTask = null;
        clearDropMarkers();
        reorderTask(dragged, task.id);
      });
    }
    return card;
  }

  function clearDropMarkers() {
    var marked = document.querySelectorAll('article.card.drop-before');
    for (var i = 0; i < marked.length; i += 1) marked[i].classList.remove('drop-before');
  }

  function reorderTask(dragged, beforeId) {
    var task = findTask(dragged.id);
    if (task && !isWritable(task)) {
      notify(t('project.readOnly'), true);
      return;
    }
    act('task.reorder', {
      id: dragged.id,
      version: dragged.version,
      beforeId: beforeId || undefined
    });
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
    state.dragTask = null;
    clearDropMarkers();
    if (task && !isWritable(task)) {
      notify(t('project.readOnly'), true);
      return;
    }
    if (task && task.column === columnId) {
      // Same column, empty space: append the card.
      act('task.reorder', { id: payload.id, version: payload.version });
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
    applyServerTime(payload);
    state.data = payload;
    state.readOnly = Boolean(payload.board && payload.board.project && payload.board.project.archivedAt);
    renderAll();
    openDeepLink();
  }

  function apiQuery() {
    return '?project=' + encodeURIComponent(state.projectId)
      + (state.includeArchived ? '&include_archived=1' : '');
  }

  function openDeepLink() {
    if (!state.pendingTaskRef || state.selectedId) return;
    var task = findTask(state.pendingTaskRef);
    if (!task) return;
    state.pendingTaskRef = null;
    openTask(task.id);
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
    return fetch(API_ACTION + apiQuery(), {
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
    } else if (code === 'TASK_VERSION_CONFLICT' || code === 'PROJECT_ARCHIVED' || code === 'TASK_ARCHIVED') {
      load(false);
    }
    return null;
  }

  function load(showToast) {
    return fetch(API_BOARD + apiQuery(), {
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

  function syncArchivedToggle() {
    var key = state.includeArchived ? 'filter.hideArchived' : 'filter.archived';
    var ariaKey = state.includeArchived ? 'filter.hideArchivedAria' : 'filter.archivedAria';
    var label = archivedToggle.querySelector('.btn-label');
    if (label) {
      label.setAttribute('data-i18n', key);
      label.textContent = t(key);
    } else {
      archivedToggle.textContent = t(key);
    }
    archivedToggle.setAttribute('aria-pressed', state.includeArchived ? 'true' : 'false');
    archivedToggle.setAttribute('aria-label', t(ariaKey));
    archivedToggle.setAttribute('data-i18n-title', key);
    archivedToggle.title = t(key);
  }

  function trapFocus(container, event) {
    var nodes = container.querySelectorAll('button, [href], input, select:not([tabindex="-1"]), textarea, [tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(nodes, function (node) {
      return !node.disabled && node.offsetParent !== null;
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectFields() {
    return document.querySelectorAll('[data-select-field]');
  }

  function syncSelectField(field) {
    if (!field) return;
    var select = field.querySelector('select');
    var trigger = field.querySelector('.select-trigger');
    var valueEl = field.querySelector('.select-value');
    var menu = field.querySelector('.select-menu');
    if (!select || !trigger || !menu) return;
    var wasOpen = field.classList.contains('open');
    var active = Number(field.getAttribute('data-active-index'));
    var selected = select.options[select.selectedIndex];
    if (valueEl) valueEl.textContent = selected ? selected.textContent : '';
    trigger.title = selected ? selected.textContent : '';
    trigger.disabled = Boolean(select.disabled);
    trigger.setAttribute('aria-expanded', wasOpen ? 'true' : 'false');
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || trigger.textContent.trim());
    menu.textContent = '';
    for (var i = 0; i < select.options.length; i += 1) {
      var option = select.options[i];
      var item = el('li', 'select-option', option.textContent);
      item.id = (select.id || 'select') + '-option-' + i;
      item.setAttribute('role', 'option');
      item.setAttribute('data-value', option.value);
      item.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false');
      item.classList.toggle('selected', option.value === select.value);
      item.tabIndex = -1;
      menu.appendChild(item);
    }
    if (wasOpen) {
      if (!isFinite(active)) active = select.selectedIndex >= 0 ? select.selectedIndex : 0;
      setActiveSelectOption(field, active, false);
    } else {
      field.removeAttribute('data-active-index');
      trigger.removeAttribute('aria-activedescendant');
    }
  }

  function syncSelectFields() {
    var fields = selectFields();
    for (var i = 0; i < fields.length; i += 1) syncSelectField(fields[i]);
  }

  function selectOptions(field) {
    var menu = field ? field.querySelector('.select-menu') : null;
    return menu ? Array.prototype.slice.call(menu.querySelectorAll('.select-option')) : [];
  }

  function activeSelectIndex(field) {
    var index = Number(field.getAttribute('data-active-index'));
    return isFinite(index) ? index : 0;
  }

  function setActiveSelectOption(field, index, scroll) {
    var options = selectOptions(field);
    if (!options.length) return;
    if (!isFinite(index)) index = 0;
    index = ((index % options.length) + options.length) % options.length;
    field.setAttribute('data-active-index', String(index));
    for (var i = 0; i < options.length; i += 1) {
      options[i].classList.toggle('active', i === index);
      options[i].setAttribute('aria-current', i === index ? 'true' : 'false');
    }
    var trigger = field.querySelector('.select-trigger');
    if (trigger) trigger.setAttribute('aria-activedescendant', options[index].id);
    if (scroll && options[index].scrollIntoView) {
      options[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function closeSelectField(field, restoreFocus) {
    if (!field) return;
    field.classList.remove('open');
    field.removeAttribute('data-active-index');
    field._typeBuffer = '';
    if (field._typeTimer) clearTimeout(field._typeTimer);
    var menu = field.querySelector('.select-menu');
    if (menu) menu.hidden = true;
    var trigger = field.querySelector('.select-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    var options = selectOptions(field);
    for (var i = 0; i < options.length; i += 1) {
      options[i].classList.remove('active');
      options[i].removeAttribute('aria-current');
    }
  }

  function closeSelectFields(except) {
    var fields = selectFields();
    for (var i = 0; i < fields.length; i += 1) {
      if (fields[i] === except) continue;
      if (fields[i].classList.contains('open')) closeSelectField(fields[i], false);
    }
  }

  function activeSelectField() {
    return document.querySelector('[data-select-field].open');
  }

  function openSelectField(field) {
    var select = field.querySelector('select');
    if (!select || select.disabled) return;
    closeSelectFields(field);
    field.classList.add('open');
    var menu = field.querySelector('.select-menu');
    menu.hidden = false;
    var trigger = field.querySelector('.select-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
      trigger.focus({ preventScroll: true });
    }
    var selected = select.selectedIndex >= 0 ? select.selectedIndex : 0;
    setActiveSelectOption(field, selected, true);
  }

  function chooseSelectOption(field, value) {
    var select = field.querySelector('select');
    if (!select) return;
    if (select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncSelectField(field);
    }
    closeSelectField(field, true);
  }

  function typeAheadSelect(field, char) {
    if (!field.classList.contains('open')) openSelectField(field);
    var buffer = String(field._typeBuffer || '') + char.toLowerCase();
    field._typeBuffer = buffer;
    if (field._typeTimer) clearTimeout(field._typeTimer);
    field._typeTimer = setTimeout(function () { field._typeBuffer = ''; }, 700);
    var options = selectOptions(field);
    if (!options.length) return;
    var active = activeSelectIndex(field);
    var start = buffer.length === 1 ? active + 1 : 0;
    var match = -1;
    for (var i = 0; i < options.length; i += 1) {
      var index = (start + i) % options.length;
      var label = String(options[index].textContent || '').toLowerCase();
      var value = String(options[index].getAttribute('data-value') || '').toLowerCase();
      if (label.indexOf(buffer) === 0 || value.indexOf(buffer) === 0) {
        match = index;
        break;
      }
    }
    // A dead multi-character buffer restarts from the latest keystroke.
    if (match === -1 && buffer.length > 1) {
      field._typeBuffer = char.toLowerCase();
      for (var j = 0; j < options.length; j += 1) {
        var text = String(options[j].textContent || '').toLowerCase();
        var optionValue = String(options[j].getAttribute('data-value') || '').toLowerCase();
        if (text.indexOf(field._typeBuffer) === 0 || optionValue.indexOf(field._typeBuffer) === 0) {
          match = j;
          break;
        }
      }
    }
    if (match !== -1) setActiveSelectOption(field, match, true);
  }

  function handleSelectKeydown(event, field) {
    var open = field.classList.contains('open');
    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      closeSelectField(field, true);
      return;
    }
    if (event.key === 'Tab') {
      if (open) closeSelectField(field, false);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openSelectField(field);
        return;
      }
      setActiveSelectOption(field, activeSelectIndex(field) + (event.key === 'ArrowDown' ? 1 : -1), true);
      return;
    }
    if (open && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveSelectOption(field, event.key === 'Home' ? 0 : selectOptions(field).length - 1, true);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!open) {
        openSelectField(field);
        return;
      }
      var options = selectOptions(field);
      var active = options[activeSelectIndex(field)];
      if (active) chooseSelectOption(field, active.getAttribute('data-value'));
      return;
    }
    if (event.key === ' ' && !open) {
      event.preventDefault();
      openSelectField(field);
      return;
    }
    if (event.key.length === 1) {
      event.preventDefault();
      typeAheadSelect(field, event.key);
    }
  }

  function setupSelectFields() {
    var fields = selectFields();
    for (var i = 0; i < fields.length; i += 1) {
      (function (field) {
        var select = field.querySelector('select');
        var trigger = field.querySelector('.select-trigger');
        var menu = field.querySelector('.select-menu');
        if (!select || !trigger || !menu) return;
        trigger.setAttribute('aria-autocomplete', 'list');
        trigger.addEventListener('click', function () {
          if (field.classList.contains('open')) closeSelectField(field, true);
          else openSelectField(field);
        });
        trigger.addEventListener('keydown', function (event) {
          handleSelectKeydown(event, field);
        });
        menu.addEventListener('keydown', function (event) {
          handleSelectKeydown(event, field);
        });
        menu.addEventListener('click', function (event) {
          var option = event.target && event.target.closest
            ? event.target.closest('.select-option')
            : null;
          if (!option) return;
          chooseSelectOption(field, option.getAttribute('data-value'));
        });
        select.addEventListener('change', function () {
          syncSelectField(field);
        });
        syncSelectField(field);
      })(fields[i]);
    }
  }

  function openConfirm(options) {
    state.confirmReturn = document.activeElement && document.activeElement.focus
      ? document.activeElement
      : null;
    state.confirmHandler = options && typeof options.onConfirm === 'function' ? options.onConfirm : null;
    confirmTitle.textContent = (options && options.title) || '';
    confirmTarget.textContent = (options && options.target) || '';
    confirmTarget.hidden = !confirmTarget.textContent;
    confirmDetail.textContent = (options && options.detail) || '';
    confirmOk.textContent = (options && options.confirmLabel) || t('confirm.archive');
    confirmOk.className = options && options.destructive === false ? 'primary' : 'danger-solid';
    confirmBackdrop.hidden = false;
    confirmSheet.hidden = false;
    document.body.classList.add('confirm-open');
    confirmCancel.focus({ preventScroll: true });
  }

  function closeConfirm() {
    if (confirmSheet.hidden) return;
    confirmSheet.hidden = true;
    confirmBackdrop.hidden = true;
    document.body.classList.remove('confirm-open');
    state.confirmHandler = null;
    var target = state.confirmReturn;
    state.confirmReturn = null;
    if (target && document.contains(target) && typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }
  }

  function confirmAccept() {
    var handler = state.confirmHandler;
    closeConfirm();
    if (typeof handler === 'function') handler();
  }

  drawer.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab' || !drawer.classList.contains('open')) return;
    trapFocus(drawer, event);
  });

  function openTask(ref) {
    var task = findTask(ref);
    if (!task) return;
    state.focusReturn = document.activeElement && document.activeElement.focus ? document.activeElement : null;
    state.selectedId = task.id;
    state.selectedOption = null;
    // A pending decision is the reason the drawer was opened; surface it first.
    var needsDecision = Boolean((task.pendingQuestion && !task.questionResolution) || task.blockedReason);
    state.drawerTab = needsDecision ? 'collaboration' : 'details';
    renderDrawer(task);
    setDrawerTab(state.drawerTab, false);
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('open');
    document.body.classList.add('drawer-open');
    syncDrawerLayout();
    drawerClose.focus({ preventScroll: prefersReducedMotion ? false : true });
  }

  function closeDrawer() {
    var taskId = state.selectedId;
    var focusReturn = state.focusReturn;
    state.selectedId = null;
    state.selectedOption = null;
    state.focusReturn = null;
    state.dirty = false;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    var target = taskId ? cardForTask(taskId) : null;
    if (!target && focusReturn && document.contains(focusReturn)) target = focusReturn;
    if (target && typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }
  }

  function setDrawerTab(name, focusTab) {
    if (name !== 'details' && name !== 'collaboration' && name !== 'activity') name = 'details';
    state.drawerTab = name;
    drawer.setAttribute('data-tab', name);
    for (var i = 0; i < drawerTabs.length; i += 1) {
      var tab = drawerTabs[i];
      var selected = tab.getAttribute('data-drawer-tab') === name;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) tab.focus({ preventScroll: true });
    }
    for (var j = 0; j < drawerPanels.length; j += 1) {
      drawerPanels[j].hidden = drawerPanels[j].getAttribute('data-tab-panel') !== name;
    }
    syncDrawerLayout();
  }

  function syncDrawerLayout() {
    if (!drawerBody) return;
    var details = state.drawerTab === 'details';
    drawer.classList.toggle('drawer-fit', details);
    drawer.classList.remove('drawer-overflow');
    if (!details || !drawer.classList.contains('open')) return;
    var head = drawer.querySelector('.drawer-head');
    var tabs = drawer.querySelector('.drawer-tabs');
    var available = drawer.clientHeight
      - (head ? head.offsetHeight : 0)
      - (tabs ? tabs.offsetHeight : 0)
      - drawerFooter.offsetHeight;
    if (drawerBody.scrollHeight > available + 1) drawer.classList.add('drawer-overflow');
  }

  function handleDrawerTabKey(event) {
    var tab = event.target && event.target.closest
      ? event.target.closest('[data-drawer-tab]')
      : null;
    if (!tab) return;
    var order = ['details', 'collaboration', 'activity'];
    var index = order.indexOf(tab.getAttribute('data-drawer-tab'));
    if (index === -1) return;
    var next = null;
    if (event.key === 'ArrowLeft') next = index === 0 ? order.length - 1 : index - 1;
    else if (event.key === 'ArrowRight') next = index === order.length - 1 ? 0 : index + 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = order.length - 1;
    if (next === null) return;
    event.preventDefault();
    setDrawerTab(order[next], true);
  }

  function renderDrawer(task) {
    if (!task) {
      closeDrawer();
      return;
    }
    var readOnly = !isWritable(task);
    var archived = Boolean(task.archivedAt);
    var pendingQuestion = task.pendingQuestion && !task.questionResolution;
    drawerTitle.textContent = task.title || t('drawer.title');
    drawerIdentifier.textContent = task.identifier || '';
    drawerVersion.textContent = t('drawer.version', { n: task.version });
    drawerUpdatedMeta.textContent = t('drawer.updatedMeta', { time: formatTime(task.updatedAt) });
    drawerProject.textContent = task.projectName ? t('drawer.project') + ': ' + task.projectName : '';
    drawerStatusChip.textContent = t('status.' + (task.status || 'backlog'));
    drawerStatusChip.className = 'drawer-status-chip ' + statusClass(task);
    syncDrawerAttention(task, pendingQuestion);
    drawerReadonly.hidden = !readOnly;
    drawerReadonly.textContent = t(archived ? 'drawer.taskArchived' : 'drawer.readOnly');
    editTitle.value = task.title || '';
    editDescription.value = task.description || '';
    editPriority.value = task.priority || 'none';
    editLabels.value = (Array.isArray(task.labels) ? task.labels : []).join(', ');
    attrStatus.value = task.status || 'backlog';
    attrAssignee.textContent = (task.assignee && task.assignee.name) || t('card.unassigned');
    attrUpdated.textContent = formatTime(task.updatedAt);
    attrCreated.textContent = formatTime(task.createdAt);
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
    archiveButton.hidden = archived;
    restoreButton.hidden = !archived;
    archiveButton.disabled = readOnly;
    restoreButton.disabled = projectArchived(task.projectId);
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
    syncSelectFields();
    syncDirty();
    syncDrawerLayout();
  }

  function syncDrawerAttention(task, pendingQuestion) {
    var pending = pendingQuestion === undefined
      ? Boolean(task.pendingQuestion && !task.questionResolution)
      : Boolean(pendingQuestion);
    var needsDecision = pending || Boolean(task.blockedReason);
    drawerTabBadge.hidden = !needsDecision;
    drawerTabBadge.textContent = '1';
    if (pending) {
      drawerPendingLine.hidden = false;
      drawerPendingLine.className = 'drawer-pending';
      drawerPendingLine.textContent = t('drawer.pendingQuestionLine', {
        prompt: (task.pendingQuestion && task.pendingQuestion.prompt) || ''
      });
    } else if (task.blockedReason) {
      drawerPendingLine.hidden = false;
      drawerPendingLine.className = 'drawer-pending blocked';
      drawerPendingLine.textContent = t('drawer.pendingBlockedLine', { reason: task.blockedReason });
    } else {
      drawerPendingLine.hidden = true;
      drawerPendingLine.textContent = '';
    }
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
      syncDirty();
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

  function actorName(actor) {
    var name = actor && actor.name ? String(actor.name) : '';
    if (!name) return '';
    var lower = name.toLowerCase();
    if (lower === 'you') return t('actor.you');
    if (lower === 'codex') return t('actor.codex');
    return name;
  }

  function activityFieldLabel(field) {
    var key = 'activity.field.' + field;
    if (I18N.en && typeof I18N.en[key] === 'string') return t(key);
    return field;
  }

  function statusName(value) {
    return value ? t('status.' + value) : '';
  }

  function activityText(entry, task) {
    var kind = entry.kind || '';
    var data = entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data)
      ? entry.data
      : null;
    var id = (task && task.identifier) || '';
    var actor = actorName(entry.actor) || t('actor.someone');
    // Legacy entries predate structured data: keep their stored summary verbatim.
    if (!data) return entry.summary || kind;
    if (kind === 'created') {
      return t('activity.created', { actor: actor, id: id, status: statusName(data.status) });
    }
    if (kind === 'moved') {
      return t('activity.moved', {
        actor: actor,
        id: id,
        from: statusName(data.from),
        to: statusName(data.to)
      });
    }
    if (kind === 'blocked') {
      return t('activity.blocked', { actor: actor, id: id, reason: data.reason || '' });
    }
    if (kind === 'unblocked') return t('activity.unblocked', { actor: actor, id: id });
    if (kind === 'question') {
      return t('activity.question', { actor: actor, prompt: data.prompt || '' });
    }
    if (kind === 'answered') {
      return data.optionLabel
        ? t('activity.answered', { actor: actor, option: data.optionLabel })
        : t('activity.answeredNote', { actor: actor });
    }
    if (kind === 'approved') return t('activity.approved', { actor: actor, id: id });
    if (kind === 'rejected') {
      return t('activity.rejected', { actor: actor, id: id })
        + (data.note ? ' · ' + data.note : '');
    }
    if (kind === 'commented') {
      return t('activity.commented', { actor: actor, body: data.preview || '' });
    }
    if (kind === 'attached') {
      return t('activity.attached', { actor: actor, name: data.filename || '' });
    }
    if (kind === 'detached') {
      return t('activity.detached', { actor: actor, name: data.filename || '' });
    }
    if (kind === 'reordered') return t('activity.reordered', { actor: actor, id: id });
    if (kind === 'archived') return t('activity.archived', { actor: actor, id: id });
    if (kind === 'restored') return t('activity.restored', { actor: actor, id: id });
    if (kind === 'updated') {
      var fields = Array.isArray(data.fields) ? data.fields : [];
      return t('activity.updated', {
        actor: actor,
        fields: fields.map(activityFieldLabel).join(state.lang === 'zh' ? '、' : ', ')
      });
    }
    return entry.summary || kind;
  }

  function dayKey(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }

  function dayLabel(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    var now = new Date(nowMs());
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    var day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (day === today) return t('activity.today');
    if (day === yesterday) return t('activity.yesterday');
    try {
      return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
      }).format(date);
    } catch (error) {
      return date.toDateString();
    }
  }

  function renderActivity(task) {
    activityList.textContent = '';
    var activity = Array.isArray(task.activity) ? task.activity : [];
    var latest = activity.slice(-12);
    activityEmpty.hidden = latest.length > 0;
    var lastDay = '';
    for (var i = latest.length - 1; i >= 0; i -= 1) {
      var entry = latest[i] || {};
      var day = dayKey(entry.at);
      if (day && day !== lastDay) {
        lastDay = day;
        var head = el('li', 'feed-day', dayLabel(entry.at));
        head.setAttribute('role', 'presentation');
        activityList.appendChild(head);
      }
      var item = el('li', 'feed-item');
      item.appendChild(el('span', 'feed-summary', activityText(entry, task)));
      var meta = el('span', 'hint');
      var when = agoText(entry.at);
      var metaText = when;
      if (!entry.data) {
        var legacyActor = actorName(entry.actor);
        if (legacyActor) metaText = legacyActor + (when ? ' · ' + when : '');
      }
      meta.textContent = metaText;
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
      var author = actorName(comment.author);
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
    var writable = isWritable(task);
    attachmentInput.disabled = !writable;
    attachmentBrowse.disabled = !writable;
    attachmentDropzone.classList.toggle('disabled', !writable);
    attachmentDropzone.setAttribute('aria-disabled', writable ? 'false' : 'true');
    if (!attachmentInput.files || !attachmentInput.files.length) setAttachmentFilename('');
  }

  function setAttachmentFilename(name) {
    if (!attachmentFilename) return;
    attachmentFilename.hidden = !name;
    attachmentFilename.textContent = name ? t('drawer.fileSelected', { name: name }) : '';
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

  function changeStatus() {
    var task = currentTask();
    if (!task) return;
    var next = attrStatus.value;
    var previous = task.status || 'backlog';
    if (!next || next === previous) return;
    if (!isWritable(task)) {
      attrStatus.value = previous;
      return;
    }
    act('task.move', { id: task.id, version: task.version, to: next }).then(function (body) {
      if (body) {
        notify(t('drawer.statusChanged', { status: t('status.' + next) }));
      } else {
        var fresh = currentTask();
        if (fresh) renderDrawer(fresh);
        else attrStatus.value = previous;
      }
    });
  }

  function linkRowsSnapshot() {
    var rows = editLinks.querySelectorAll('[data-link-row]');
    var parts = [];
    for (var i = 0; i < rows.length; i += 1) {
      var label = rows[i].querySelector('.link-label').value.trim();
      var url = rows[i].querySelector('.link-url').value.trim();
      if (!label && !url) continue;
      parts.push(label + '\u0000' + url);
    }
    return parts.join('\u0001');
  }

  function taskLinksSnapshot(task) {
    var links = Array.isArray(task.links) ? task.links : [];
    var parts = [];
    for (var i = 0; i < links.length; i += 1) {
      parts.push((links[i].label || '') + '\u0000' + (links[i].url || ''));
    }
    return parts.join('\u0001');
  }

  function isDrawerDirty(task) {
    if (!task) return false;
    if (editTitle.value !== (task.title || '')) return true;
    if (editDescription.value !== (task.description || '')) return true;
    if (editPriority.value !== (task.priority || 'none')) return true;
    var labels = Array.isArray(task.labels) ? task.labels : [];
    if (editLabels.value !== labels.join(', ')) return true;
    return linkRowsSnapshot() !== taskLinksSnapshot(task);
  }

  function syncDirty() {
    var task = currentTask();
    var dirty = Boolean(task) && isDrawerDirty(task);
    state.dirty = dirty;
    saveTaskButton.disabled = !task || !dirty || !isWritable(task);
    drawerDirty.hidden = !dirty;
    drawerFooter.classList.toggle('dirty', dirty);
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

  function archiveCurrentTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    openConfirm({
      title: t('confirm.archiveTaskTitle'),
      target: task.identifier + ' · ' + task.title,
      detail: t('confirm.archiveTaskDetail'),
      confirmLabel: t('confirm.archive'),
      destructive: true,
      onConfirm: function () {
        var fresh = findTask(task.id) || task;
        act('task.archive', { id: fresh.id, version: fresh.version }).then(function (body) {
          if (body) notify(t('drawer.archived'));
        });
      }
    });
  }

  function restoreCurrentTask() {
    var task = currentTask();
    if (!task || !task.archivedAt) return;
    openConfirm({
      title: t('confirm.restoreTaskTitle'),
      target: task.identifier + ' · ' + task.title,
      detail: t('confirm.restoreTaskDetail'),
      confirmLabel: t('confirm.restore'),
      destructive: false,
      onConfirm: function () {
        var fresh = findTask(task.id) || task;
        act('task.restore', { id: fresh.id, version: fresh.version }).then(function (body) {
          if (body) notify(t('drawer.restored'));
        });
      }
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
        if (body) {
          setAttachmentFilename('');
          notify(t('drawer.attachmentUploaded'));
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function removeAttachment(task, attachment) {
    if (!isWritable(task)) return;
    openConfirm({
      title: t('confirm.removeAttachmentTitle'),
      target: attachment.filename,
      detail: t('confirm.removeAttachmentDetail'),
      confirmLabel: t('confirm.remove'),
      destructive: true,
      onConfirm: function () {
        act('attachment.remove', {
          id: task.id,
          version: task.version,
          attachmentId: attachment.id
        }).then(function (body) {
          if (body) notify(t('drawer.attachmentRemoved'));
        });
      }
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

  function pendingOptionLabel(task, id) {
    var pending = task && task.pendingQuestion ? task.pendingQuestion : {};
    var options = Array.isArray(pending.options) ? pending.options : [];
    for (var i = 0; i < options.length; i += 1) {
      if (options[i].id === id) return options[i].label || options[i].id || '';
    }
    return '';
  }

  function decisionAnswerText(task) {
    var pending = task && task.pendingQuestion ? task.pendingQuestion : {};
    var selected = state.selectedOption || pending.selected || '';
    var label = pendingOptionLabel(task, selected);
    if (label) return label;
    if (task && task.questionResolution && task.questionResolution.optionLabel) {
      return task.questionResolution.optionLabel;
    }
    return '';
  }

  function applyDecisionEmphasis(kind) {
    state.decisionKind = kind === 'reject' ? 'reject' : 'approve';
    if (state.decisionKind === 'reject') {
      decisionApprove.className = 'outline-neutral';
      decisionReject.className = 'danger-solid';
    } else {
      decisionApprove.className = 'primary';
      decisionReject.className = 'danger-outline';
    }
  }

  function decide(kind) {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    decisionTarget.textContent = t('decision.target', {
      id: task.identifier,
      title: task.title
    });
    var pending = task.pendingQuestion || {};
    decisionQuestion.textContent = pending.prompt || t('drawer.review');
    var answer = decisionAnswerText(task);
    decisionAnswer.textContent = answer || t('decision.noAnswer');
    decisionAnswer.classList.toggle('empty', !answer);
    applyDecisionEmphasis(kind);
    decisionNote.value = (task.pendingQuestion && task.pendingQuestion.answerNote) || '';
    if (!decisionDialog.open) decisionDialog.showModal();
    decisionNote.focus();
  }

  function submitDecision(kind) {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var action = kind === 'approve' ? 'task.approve' : 'task.reject';
    var doneKey = kind === 'approve' ? 'drawer.approved' : 'drawer.rejected';
    act(action, {
      id: task.id,
      version: task.version,
      note: decisionNote.value
    }).then(function (body) {
      if (!body) return;
      decisionDialog.close();
      notify(t(doneKey));
    });
  }

  function blockTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    blockReasonInput.value = task.blockedReason || '';
    blockError.hidden = true;
    blockError.textContent = '';
    if (!blockDialog.open) blockDialog.showModal();
    blockReasonInput.focus();
  }

  function submitBlock() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var reason = blockReasonInput.value.trim();
    if (!reason) {
      blockError.textContent = t('drawer.blockReasonRequired');
      blockError.hidden = false;
      blockReasonInput.focus();
      return;
    }
    blockError.hidden = true;
    act('task.block', { id: task.id, version: task.version, reason: reason }).then(function (body) {
      if (!body) return;
      blockDialog.close();
      notify(t('drawer.blocked'));
    });
  }

  function unblockTask() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    act('task.unblock', { id: task.id, version: task.version }).then(function (body) {
      if (body) notify(t('drawer.unblocked'));
    });
  }

  function askOptionRows() {
    return Array.prototype.slice.call(askOptionsList.querySelectorAll('[data-ask-option]'));
  }

  function refreshAskControls() {
    var rows = askOptionRows();
    for (var i = 0; i < rows.length; i += 1) {
      var remove = rows[i].querySelector('.ask-option-remove');
      if (remove) {
        remove.disabled = rows.length <= MIN_ASK_OPTIONS;
        remove.setAttribute('aria-label', t('ask.removeOption', { n: i + 1 }));
      }
      var label = rows[i].querySelector('.ask-option-label');
      if (label) label.setAttribute('aria-label', t('ask.optionLabel', { n: i + 1 }));
    }
    askAddOption.disabled = rows.length >= MAX_ASK_OPTIONS;
  }

  function appendAskOption(option, focus) {
    if (askOptionRows().length >= MAX_ASK_OPTIONS) return;
    var row = el('div', 'ask-option-row');
    row.setAttribute('data-ask-option', 'true');
    var label = document.createElement('input');
    label.type = 'text';
    label.className = 'ask-option-label';
    label.maxLength = 200;
    label.value = option && option.label ? option.label : '';
    label.setAttribute('placeholder', t('ask.optionLabelPlaceholder'));
    var detail = document.createElement('input');
    detail.type = 'text';
    detail.className = 'ask-option-detail';
    detail.maxLength = 1000;
    detail.value = option && option.detail ? option.detail : '';
    detail.setAttribute('placeholder', t('ask.optionDetailPlaceholder'));
    var remove = button('×', 'ask-option-remove', function () {
      if (askOptionRows().length <= MIN_ASK_OPTIONS) return;
      if (row.parentNode) row.parentNode.removeChild(row);
      refreshAskControls();
    });
    remove.type = 'button';
    row.appendChild(label);
    row.appendChild(detail);
    row.appendChild(remove);
    askOptionsList.appendChild(row);
    refreshAskControls();
    if (focus) label.focus();
  }

  function renderAskOptions(options) {
    askOptionsList.textContent = '';
    var list = Array.isArray(options) && options.length ? options : [{}, {}];
    for (var i = 0; i < list.length && i < MAX_ASK_OPTIONS; i += 1) {
      appendAskOption(list[i], false);
    }
    while (askOptionRows().length < MIN_ASK_OPTIONS) appendAskOption({}, false);
    refreshAskControls();
  }

  function askQuestion() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    askPromptInput.value = '';
    askError.hidden = true;
    askError.textContent = '';
    renderAskOptions([{}, {}]);
    if (!askDialog.open) askDialog.showModal();
    askPromptInput.focus();
  }

  function submitAsk() {
    var task = currentTask();
    if (!task || !isWritable(task)) return;
    var prompt = askPromptInput.value.trim();
    if (!prompt) {
      askError.textContent = t('ask.promptRequired');
      askError.hidden = false;
      askPromptInput.focus();
      return;
    }
    var rows = askOptionRows();
    var options = [];
    for (var i = 0; i < rows.length; i += 1) {
      var label = rows[i].querySelector('.ask-option-label').value.trim();
      var detail = rows[i].querySelector('.ask-option-detail').value.trim();
      if (!label && !detail) continue;
      if (!label) {
        askError.textContent = t('ask.optionsRange');
        askError.hidden = false;
        rows[i].querySelector('.ask-option-label').focus();
        return;
      }
      options.push(detail ? { label: label, detail: detail } : { label: label });
    }
    if (options.length < MIN_ASK_OPTIONS || options.length > MAX_ASK_OPTIONS) {
      askError.textContent = t('ask.optionsRange');
      askError.hidden = false;
      return;
    }
    askError.hidden = true;
    act('task.ask', {
      id: task.id,
      version: task.version,
      prompt: prompt,
      options: options
    }).then(function (body) {
      if (!body) return;
      askDialog.close();
      notify(t('drawer.asked'));
    });
  }

  function openNewTask(columnId) {
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
    state.newTaskColumn = COLUMN_STATUS[columnId] ? columnId : 'backlog';
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
    if (!project) return;
    renameTarget = project;
    renameNameInput.value = project.name || '';
    renamePrefixInput.value = project.prefix || '';
    renameError.hidden = true;
    renameError.textContent = '';
    if (!renameDialog.open) renameDialog.showModal();
    renameNameInput.focus();
  }

  function submitRename() {
    var project = renameTarget;
    if (!project) return;
    var name = renameNameInput.value.trim();
    if (!name) {
      renameError.textContent = t('rename.nameRequired');
      renameError.hidden = false;
      renameNameInput.focus();
      return;
    }
    var prefix = renamePrefixInput.value.trim();
    if (prefix && !/^[A-Z0-9]{2,6}$/.test(prefix)) {
      renameError.textContent = t('rename.prefixInvalid');
      renameError.hidden = false;
      renamePrefixInput.focus();
      return;
    }
    var payload = { id: project.id, name: name };
    if (prefix && prefix !== project.prefix) payload.prefix = prefix;
    renameError.hidden = true;
    act('project.update', payload).then(function (body) {
      if (!body) return;
      renameDialog.close();
      notify(t('toast.projectRenamed'));
    });
  }

  function archiveProject(project) {
    openConfirm({
      title: t('confirm.archiveProjectTitle'),
      target: project.name,
      detail: t('confirm.archiveProjectDetail'),
      confirmLabel: t('confirm.archive'),
      destructive: true,
      onConfirm: function () {
        act('project.archive', { id: project.id }).then(function (body) {
          if (body) notify(t('toast.projectArchived'));
        });
      }
    });
  }

  function restoreProject(project) {
    openConfirm({
      title: t('confirm.restoreProjectTitle'),
      target: project.name,
      detail: t('confirm.restoreProjectDetail'),
      confirmLabel: t('confirm.restore'),
      destructive: false,
      onConfirm: function () {
        act('project.restore', { id: project.id }).then(function (body) {
          if (body) notify(t('toast.projectRestored'));
        });
      }
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
      labels: splitLabels(newTaskLabels.value),
      status: COLUMN_STATUS[state.newTaskColumn] || 'backlog'
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

  function closeOverflow() {
    if (!toolbarOverflow) return;
    toolbarOverflow.classList.remove('open');
    overflowToggle.setAttribute('aria-expanded', 'false');
  }

  function bindEvents() {
    setupSelectFields();
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
    filterClearAll.addEventListener('click', clearAllFilters);
    boardEmptyClear.addEventListener('click', clearAllFilters);
    archivedToggle.addEventListener('click', function () {
      closeOverflow();
      state.includeArchived = !state.includeArchived;
      storeSet(STORAGE.archived, state.includeArchived ? '1' : '0');
      syncArchivedToggle();
      load(false);
    });
    refreshButton.addEventListener('click', function () {
      closeOverflow();
      load(true);
    });
    overflowToggle.addEventListener('click', function () {
      var open = !toolbarOverflow.classList.contains('open');
      toolbarOverflow.classList.toggle('open', open);
      overflowToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    filterToggle.addEventListener('click', function () {
      var open = filtersPopover.hidden;
      filtersPopover.hidden = !open;
      filterToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (event) {
      var field = event.target && event.target.closest
        ? event.target.closest('[data-select-field]')
        : null;
      if (!field) closeSelectFields();
      if (toolbarOverflow && !toolbarOverflow.contains(event.target)) closeOverflow();
      if (filtersPopover.hidden) return;
      var wrap = filtersPopover.parentNode;
      if (wrap && wrap.contains(event.target)) return;
      filtersPopover.hidden = true;
      filterToggle.setAttribute('aria-expanded', 'false');
    });
    var createButtons = document.querySelectorAll('[data-create]');
    for (var c = 0; c < createButtons.length; c += 1) {
      createButtons[c].addEventListener('click', function () {
        openNewTask(this.getAttribute('data-create'));
      });
    }
    manageProjects.addEventListener('click', openProjectDialog);
    restoreSelected.addEventListener('click', function () {
      var project = state.data && state.data.board ? state.data.board.project : null;
      if (project) restoreProject(project);
    });
    langToggle.addEventListener('click', function () {
      closeOverflow();
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      storeSet(STORAGE.lang, state.lang);
      applyI18n();
      renderAll();
    });
    drawerClose.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    window.addEventListener('resize', function () {
      if (drawer.classList.contains('open')) syncDrawerLayout();
    });
    drawer.addEventListener('input', syncDirty);
    drawer.addEventListener('change', syncDirty);
    attrStatus.addEventListener('change', changeStatus);
    saveTaskButton.addEventListener('click', saveTask);
    archiveButton.addEventListener('click', archiveCurrentTask);
    restoreButton.addEventListener('click', restoreCurrentTask);
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
      if (file) {
        setAttachmentFilename(file.name);
        uploadAttachment(file);
      }
    });
    attachmentBrowse.addEventListener('click', function () {
      if (!attachmentInput.disabled) attachmentInput.click();
    });
    attachmentDropzone.addEventListener('dragover', function (event) {
      if (attachmentInput.disabled) return;
      event.preventDefault();
      attachmentDropzone.classList.add('dragover');
    });
    attachmentDropzone.addEventListener('dragleave', function (event) {
      if (event.relatedTarget && attachmentDropzone.contains(event.relatedTarget)) return;
      attachmentDropzone.classList.remove('dragover');
    });
    attachmentDropzone.addEventListener('drop', function (event) {
      event.preventDefault();
      attachmentDropzone.classList.remove('dragover');
      if (attachmentInput.disabled) return;
      var dropped = event.dataTransfer && event.dataTransfer.files
        ? event.dataTransfer.files[0]
        : null;
      if (!dropped) return;
      setAttachmentFilename(dropped.name);
      uploadAttachment(dropped);
    });
    confirmCancel.addEventListener('click', closeConfirm);
    confirmOk.addEventListener('click', confirmAccept);
    confirmBackdrop.addEventListener('click', closeConfirm);
    for (var tabIndex = 0; tabIndex < drawerTabs.length; tabIndex += 1) {
      (function (tab) {
        tab.addEventListener('click', function () {
          setDrawerTab(tab.getAttribute('data-drawer-tab'), false);
        });
      })(drawerTabs[tabIndex]);
    }
    drawer.querySelector('.drawer-tabs').addEventListener('keydown', handleDrawerTabKey);
    document.getElementById('decision-close').addEventListener('click', function () { decisionDialog.close(); });
    document.getElementById('decision-cancel').addEventListener('click', function () { decisionDialog.close(); });
    decisionApprove.addEventListener('click', function () { submitDecision('approve'); });
    decisionReject.addEventListener('click', function () { submitDecision('reject'); });
    document.getElementById('ask-close').addEventListener('click', function () { askDialog.close(); });
    document.getElementById('ask-cancel').addEventListener('click', function () { askDialog.close(); });
    askAddOption.addEventListener('click', function () { appendAskOption({}, true); });
    askForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitAsk();
    });
    document.getElementById('block-close').addEventListener('click', function () { blockDialog.close(); });
    document.getElementById('block-cancel').addEventListener('click', function () { blockDialog.close(); });
    blockForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitBlock();
    });
    document.getElementById('rename-close').addEventListener('click', function () { renameDialog.close(); });
    document.getElementById('rename-cancel').addEventListener('click', function () { renameDialog.close(); });
    renameForm.addEventListener('submit', function (event) {
      event.preventDefault();
      submitRename();
    });
    confirmSheet.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeConfirm();
        return;
      }
      if (event.key === 'Tab') trapFocus(confirmSheet, event);
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
        if (decisionDialog.open) {
          decisionDialog.close();
          event.preventDefault();
          return;
        }
        if (askDialog.open) {
          askDialog.close();
          event.preventDefault();
          return;
        }
        if (blockDialog.open) {
          blockDialog.close();
          event.preventDefault();
          return;
        }
        if (renameDialog.open) {
          renameDialog.close();
          event.preventDefault();
          return;
        }
        if (!confirmSheet.hidden) {
          closeConfirm();
          event.preventDefault();
          return;
        }
        var openSelect = activeSelectField();
        if (openSelect) {
          closeSelectField(openSelect, true);
          event.preventDefault();
          return;
        }
        if (toolbarOverflow && toolbarOverflow.classList.contains('open')) {
          closeOverflow();
          event.preventDefault();
          return;
        }
        if (document.activeElement === searchInput) {
          if (searchInput.value) {
            state.search = '';
            searchInput.value = '';
            renderBoard();
            event.preventDefault();
            return;
          }
          searchInput.blur();
          event.preventDefault();
          return;
        }
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
        if (!filtersPopover.hidden) {
          filtersPopover.hidden = true;
          filterToggle.setAttribute('aria-expanded', 'false');
          event.preventDefault();
          return;
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (!confirmSheet.hidden || activeSelectField()) return;
      if (decisionDialog.open || askDialog.open || blockDialog.open || renameDialog.open) return;
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
