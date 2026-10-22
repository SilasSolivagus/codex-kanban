---
name: kanban
description: "Track work on the repository kanban board. Use when the user asks what needs me, wants to see the board, wants work tracked, blocked, sent to review, approved or rejected, or when work should outlive this conversation. Covers the kanban_* MCP tools, the four-column model, and the human approval boundary."
---

# Kanban

The board is the task layer for this repository. Conversations end; tasks stay.

## Find the repository root

Determine the root once per session:

```bash
pwd
git rev-parse --show-toplevel
```

Pass the result as the absolute `root` argument on every kanban tool call. If a
result mentions a project prefix from a different repository, the root is wrong.

## Board first

Call `kanban_board` before answering questions about work. It returns Markdown
ordered as Needs you, then Running, Backlog and Done.

- "What needs me?" — `kanban_board`, then report only the Needs you column.
- "What are we working on?" — `kanban_board`, group by column, keep it short.
- "Where is X?" — `kanban_board`, or `kanban_task_get` for one identifier.
- "Track this" — `kanban_task_create`.

Do not create a task for every step you take. Create one when the user asks to
track work, when the work spans sessions, or when a finding must not be lost.
Reading the board is cheap; writing noise is not.

## Projects

A repository board can hold several projects (workstreams).

- `kanban_project_list` before assuming a single board; pass `project` (id or name)
  to `kanban_board` and the task tools when the repo has more than one.
- `kanban_project_create` / `update` / `archive` / `restore` manage them.
- An archived project is read-only: every task write fails with
  `PROJECT_ARCHIVED` until it is restored. Do not try to work around it.
- Attachments are managed on the local web board (`codex-kanban serve`); agents
  should reference a link or describe the file instead of moving bytes.

## Columns and statuses

| Column | Stored status | Meaning |
| --- | --- | --- |
| Backlog | `backlog`, `todo` | Not started |
| Running | `in_progress` | Being worked on |
| Needs you | computed | Open question, active blocker or review |
| Done | `done` | Closed |

`Needs you` is computed, never chosen. It is the union of tasks with an open
question, an active blocker, or `in_review`. Attention priority is question,
then blocker, then review.

## Read before writing

1. Call `kanban_task_get` and note the task `version`.
2. Do the work or make the decision.
3. Write with that version. A stale version fails with `TASK_VERSION_CONFLICT`;
   read the task again and retry with the new version. Never force a write or
   invent a version.
4. Record the outcome with `kanban_task_move`, `kanban_task_ask`,
   `kanban_task_block`, `kanban_task_comment`, or the approval tools.

## Ask or block

Use `kanban_task_ask` when a human decision is needed:

- Offer 2 to 5 real options, each a genuine alternative.
- Put the trade-off in the option detail, not in the prompt.
- After asking, stop and let the human answer. Do not pick an option yourself.

Use `kanban_task_block` when external work is missing: access, a dependency, a
failing environment, or someone else's deliverable. Write one sentence the human
can act on.

Use `kanban_task_move` to `in_review` when the deliverable exists and needs a
human look. Do not ask a question when the missing piece is outside the
conversation, and do not block when the human simply has to choose.

## Human decisions

Approval and rejection belong to the human.

- `kanban_task_approve` and `kanban_task_reject` require `as: "user"` and a
  non-empty `confirmed_by` that quotes or summarizes the human decision. Without
  an explicit yes or no in the conversation, do not call them.
- Never approve, reject or answer your own question, even if the user seems to
  agree in passing. Ask for a clear confirmation, then quote it.
- `kanban_task_answer` records a choice but does not close the question. The
  card stays in Needs you until a human approves or rejects it.
- Agents cannot close `in_review` tasks. Ask the human to approve or reject the
  task; do not move it to Done yourself.

## Rendering

- Terminal: `kanban_board` output is the board. Do not paraphrase all of it.
- Codex app: call `kanban_render`, then emit the returned inline reference on
  its own line, verbatim. Do not wrap it in a code fence, do not turn it into a
  link, and do not call it an artifact. Add at most one sentence of context.
- Never open a browser for the board unless the user asks.

## Error recovery

| Error | Meaning | Recovery |
| --- | --- | --- |
| `TASK_VERSION_CONFLICT` | The task changed since you read it. | Call `kanban_task_get` again and retry with the new version. Never force. |
| `BLOCKER_ACTIVE` | The task still has an active blocker. | Resolve the external work, call `kanban_task_unblock`, then retry. |
| `ANSWER_REQUIRED` | Approval needs a selected option first. | Ask the human to choose, record it with `kanban_task_answer`, then approve. |
| `HUMAN_DECISION_REQUIRED` | You tried a human-only action without one. | Ask the human for an explicit decision, then retry with `as: "user"` and `confirmed_by`. |

Keep responses about the board short. Identifiers first, status second, detail
only when asked.
