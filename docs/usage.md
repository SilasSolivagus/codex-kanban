# Codex Kanban 使用指南

本文面向使用看板的人，讲清楚这些事：怎么开始、怎么建任务、怎么提问和回答、怎么审批、
怎么处理阻塞、怎么看 HTML 看板，以及常见错误怎么恢复。工具参数见
[README](../README.zh-CN.md)，智能体侧的工作规则见
[`plugin/skills/kanban/SKILL.md`](../plugin/skills/kanban/SKILL.md)。

## 开始之前

- 先安装插件，见[安装](../README.zh-CN.md#安装)。
- 看板属于某个仓库。请在对应仓库里打开 Codex，或者给 CLI 传
  `--root /path/to/repo`。
- 空仓库不需要初始化：读取一块空看板不会报错，第一次写入时才会生成
  `.kanban/board.json`。

## 第一块看板

在仓库里打开 Codex，直接问：

> “看一下看板。”

新仓库会得到“看板是空的”。这是正常现象，只读不会创建文件。接着建第一个任务：

> “建一个任务：写 v0.1 发布说明。中优先级，加 `docs` 标签。”

Codex 会把任务放进 Backlog，并返回标识，例如 `MYAPP-1`。这时文件才出现：

```
<repo>/.kanban/board.json
```

也可以直接用 CLI：

```bash
node plugin/bin/codex-kanban.mjs add "写 v0.1 发布说明" \
  --description "覆盖安装、13 个工具和人类审批边界。" \
  --priority medium --label docs
```

把 `.kanban/board.json` 和对应的代码一起提交。`.kanban/board.html` 和
`.kanban/board.lock` 是生成物，不要提交。

## 新建任务

在 Codex 里说：

> “记录一下登录跳转的 bug：SSO 登录后总是落在 `/`，应该回到进入登录前的页面。
> 高优先级，加 `auth` 标签。”

Codex 调用 `kanban_task_create`，返回新任务的标识。任务常用字段：

| 字段 | 取值 |
| --- | --- |
| 状态 | `backlog`（默认）、`todo`、`in_progress`、`in_review`、`done`、`canceled` |
| 优先级 | `none`（默认）、`low`、`medium`、`high`、`urgent` |
| 标签 | 最多 20 个短字符串 |
| 链接 | 最多 50 个 `{ "label": "...", "url": "https://..." }` |

任务最好按“可交付的一件事”来切，而不是按步骤列清单。跨会话的工作、需要人拍板的工作、
不能丢的结论，都值得建任务；每次工具调用都建一条只会产生噪音。

## 提问、回答与审批

### 提问

需要人做选择时，让 Codex 提问，不要自己猜：

> “问一下我：迁移是在部署前跑，还是部署后跑？”

Codex 会挂出一个带 2 到 5 个选项的问题，任务进入 Needs you，并一直停在那里。

### 回答

直接回复决定和理由：

> “部署前跑迁移。迁移失败就不应该继续发布。”

Codex 调用 `kanban_task_answer` 记录选择。注意：回答不等于审批，问题仍算未决，任务继续
留在 Needs you，直到有人批准或驳回。

### 审批

决定要说清楚：

> “这个决定我批准了，把任务关掉。”

Codex 以 `as: "user"` 调用 `kanban_task_approve`，把 `confirmed_by` 写成你的决定摘要，
任务随后进入 Done。含糊的“行吧”不算决定；要批准就说“批准”，要打回就说“驳回”。

通过 MCP 审批时，以下三条必须同时成立：

- `as` 为 `"user"`；
- `confirmed_by` 非空，并且确实来自你的决定；
- 如果问题还开着，先用 `kanban_task_answer` 记录一个选项。

驳回同理，只是带一条说明：

> “驳回。重试路径没有测试。把这条备注写进去，然后打回 Backlog。”

## 评审交付物

工作已经完成、需要人看一眼时，智能体会把任务移到 `in_review`。任务出现在 Needs you，
带评审标记。你只有两个选择：

> “实现没问题，批准。”

> “驳回：重试路径没有测试。把这条备注写进去，然后打回。”

处于评审状态的任务，智能体不能自己关掉。如果你让 Codex“把它移到 Done”，它应该反过来
请你批准或驳回。这是审批边界在起作用，不是工具坏了。

## 阻塞与解除

缺的如果是对话之外的东西，用阻塞：权限、依赖、坏掉的环境、别人的交付物。如果缺的是
一个人的决定，用提问。

> “把部署任务阻塞掉。我还得给你 staging 的访问凭据。”

Codex 记下一句可执行的原因，任务进入 Needs you。

外部条件满足后：

> “staging 凭据已经加好了，解除部署任务的阻塞。”

Codex 清掉阻塞，任务回到原来的状态。阻塞未解除时，任务不能被批准，也不能移到 Done。

## 渲染看板

在 Codex 里说：

> “把看板渲染出来。”

Codex 写出 `.kanban/board.html`；在 Codex 应用里，还会单独输出一行内联视觉引用。用 CLI：

```bash
node plugin/bin/codex-kanban.mjs render --open
```

`render` 只写文件并打印路径，`--open` 会顺便打开；`open` 命令等于两者都做。

HTML 看板有四列、详情抽屉和操作按钮。它是只读的：在 Codex 应用里，按钮会把后续消息发回
Codex；在普通浏览器里仍然可以看，但按钮无法写入，界面会给出提示。

## CLI 速查

以下命令默认当前目录就是 `codex-kanban` 检出目录。要操作其他仓库，加
`--root /path/to/repo`。数字引用（如 `1`）会解析成 `<项目前缀>-1`。

| 命令 | 作用 |
| --- | --- |
| `node plugin/bin/codex-kanban.mjs board` | 输出 Markdown 看板，Needs you 在前。 |
| `node plugin/bin/codex-kanban.mjs board --column needs` | 只看 Needs you。 |
| `node plugin/bin/codex-kanban.mjs board --no-done` | 隐藏 Done。 |
| `node plugin/bin/codex-kanban.mjs list` | 按列列出任务，一行一条。 |
| `node plugin/bin/codex-kanban.mjs list --json` | 输出完整看板视图 JSON。 |
| `node plugin/bin/codex-kanban.mjs get 1` | 查看任务详情和活动记录。 |
| `node plugin/bin/codex-kanban.mjs add "标题" --priority high --label auth` | 新建任务。 |
| `node plugin/bin/codex-kanban.mjs update 1 --title "新标题"` | 修改字段，不移动任务。 |
| `node plugin/bin/codex-kanban.mjs move 1 --to in_progress` | 移到某一列或状态。 |
| `node plugin/bin/codex-kanban.mjs block 1 --reason "等待凭据"` | 记录阻塞。 |
| `node plugin/bin/codex-kanban.mjs unblock 1` | 解除阻塞。 |
| `node plugin/bin/codex-kanban.mjs ask 1 --prompt "先做哪套环境？" --option Staging --option Production` | 带选项提问。 |
| `node plugin/bin/codex-kanban.mjs answer 1 --option opt_1` | 记录回答。 |
| `node plugin/bin/codex-kanban.mjs approve 1 --confirmed-by "先上 staging"` | 以人类身份批准。 |
| `node plugin/bin/codex-kanban.mjs reject 1 --confirmed-by "缺测试" --note "补重试覆盖"` | 以人类身份驳回。 |
| `node plugin/bin/codex-kanban.mjs comment 1 --body "staging 验证通过"` | 添加评论。 |
| `node plugin/bin/codex-kanban.mjs render` | 写出 `.kanban/board.html`。 |
| `node plugin/bin/codex-kanban.mjs open` | 写出并打开 HTML 看板。 |

CLI 默认以人类身份运行。`approve` 和 `reject` 始终以人类身份执行，必须提供
`--confirmed-by`。只有在你刻意模拟智能体行为时才用 `--as agent`。

插件安装后，把命令里的 CLI 路径换成安装位置：

```bash
node "$HOME/.codex/plugins/cache/silassolivagus/codex-kanban/0.1.0/bin/codex-kanban.mjs" board --root "$PWD"
```

Codex 主目录不在默认位置时，使用
`$CODEX_HOME/plugins/cache/silassolivagus/codex-kanban/<version>/bin/codex-kanban.mjs`。

## 故障排查

### `BOARD_LOCKED`

另一个进程正持有 `.kanban/board.lock`。存储层最多重试五秒，然后直接报错，避免覆盖并发
写入。

- 等另一个写入结束，再执行一次。
- 如果没有 Codex 会话或 CLI 在跑，可能是崩溃留下的锁。超过 30 秒的锁会在下一次写入时
  自动回收。
- 确认没有写入进程之前，不要手动删除锁。确实要删，先确认没有活跃写入方，再删
  `.kanban/board.lock`。

### `CORRUPT_BOARD`

`.kanban/board.json` 不是合法 JSON，或者顶层不是带 `tasks` 数组的看板对象。读取会失败，
存储层不会覆盖这个文件，所以正常命令不会悄悄把它清掉。

1. 先备份：`cp .kanban/board.json .kanban/board.json.bak`
2. 恢复最后一次提交的版本：`git checkout -- .kanban/board.json`
3. 如果文件从未提交过，就手工修 JSON。报错信息里会带解析失败的原因。最低结构只需要
   `schema`、`project` 和 `tasks` 数组。

### `VERSION_REQUIRED`

通过 MCP 写入时没有带版本。先调用 `kanban_task_get` 读取任务，再用返回的 `version`
重试。CLI 会自动读取当前版本，所以这个错误通常来自直接调用 MCP 或自定义客户端。

### `TASK_VERSION_CONFLICT`

任务在读取之后被改过。重新用 `kanban_task_get` 读一次，带新版本重试。不要强行写入，也
不要自己编一个版本号。

### `HUMAN_DECISION_REQUIRED`

审批或驳回时没有同时提供 `as: "user"` 和 `confirmed_by`，或者智能体试图关闭
`in_review` 任务。请人明确表态后再重试；评审中的任务只能由人批准或驳回。

### `BLOCKER_ACTIVE`

任务还有未解除的阻塞。先解决外部依赖，调用 `kanban_task_unblock`，再重试移动或审批。

### `ANSWER_REQUIRED`

任务有未决问题，但还没有记录选项。先请人选择，用 `kanban_task_answer` 记录，再审批。

### `QUESTION_OPEN`

任务有未解决的问题，不能移到 Done。回答问题或驳回任务；驳回会把任务送回 Backlog。

## 数据在哪里

- `.kanban/board.json` 就是看板。一个仓库一块，普通 JSON，适合跟项目一起评审和提交。
- `.kanban/board.html` 是生成的只读视图，已被 git 忽略。
- `.kanban/board.lock` 用于串行化写入，是临时文件，已被 git 忽略。
- 已取消的任务仍保留在 `board.json`，也能按标识读取，但不会显示在任何一列。
