---
name: kanban
description: "Track work on the repository kanban board. Use when the user asks what needs them, asks for the board, wants a task tracked, blocked, reviewed, approved or rejected, or when work should outlive this conversation. Covers the kanban_* MCP tools, the four-column model, and the human approval boundary."
---

# Kanban

The board is the task layer for this repository. Conversations end; tasks stay.

## Find the board

Every tool takes `root`: the absolute repository path. Determine it once per
session:

```bash
pwd
git rev-parse --show-toplevel
```

Pass that path as `root` on every kanban call. If the tool result mentions a
different project prefix than expected, the root is wrong.

## First move

Call `kanban_board` before answering questions about work in flight. It returns
Markdown ordered as Needs you → Running → Backlog → Done.

- "What needs me?" → `kanban_board`, then summarize only the Needs you column.
- "What are we working on?" → `kanban_board`, group by column, keep it short.
- "Track this" → `kanban_task_create`.
- "Where is X?" → `kanban_board` or `kanban_task_get` for that identifier.

Do not create a task for every step you take. Create one when the user asks to
track work, when work spans sessions, or when a finding must not be lost.
Reading the board is cheap; writing noise is not.

## Columns and statuses

| Column | Stored status | Meaning |
| --- | --- | --- |
| Backlog | `backlog`, `todo` | Not started |
| Running | `in_progress` | Being worked on |
| Needs you | computed | Question, blocker or review |
| Done | `done` | Closed |

`Needs you` is computed, never chosen. It is the union of tasks with an open
question, an active blocker, or `in_review`. Attention priority is question,
then blocker, then review.

## The loop

1. `kanban_task_get` — read the task and note its `version`.
2. Do the work or make the decision.
3. Write with that version. A stale version fails with
   `TASK_VERSION_CONFLICT`; read again instead of retrying blindly.
4. Record the outcome with `kanban_task_move`, `kanban_task_ask`,
   `kanban_task_block`, `kanban_task_comment`, or an approval tool.

## Ask or block

Use `kanban_task_ask` when the user must choose:

- 2–5 options, each a real alternative.
- State the trade-off in the option detail, not in the prompt.
- After asking, stop and let the human answer. Do not pick an option yourself.

Use `kanban_task_block` when external work is missing: access, a dependency, a
failing environment, someone else's deliverable. Write one sentence the human
can act on.

Use `kanban_task_move` to `in_review` when the deliverable exists and needs a
human look.

## Human decisions

Approval and rejection belong to the human.

- `kanban_task_approve` and `kanban_task_reject` require `as: "user"` and a
  `confirmed_by` quote of the human decision. Without an explicit yes or no in
  the conversation, do not call them.
- Never approve a question you wrote, even if the user seems to agree in
  passing. Ask for a clear confirmation, then quote it.
- `kanban_task_answer` records a choice but does not close the question. The
  card stays in Needs you until a human approves or rejects.

## Rendering

- Terminal: `kanban_board` output is the board. Do not paraphrase all of it.
- Codex app: call `kanban_render`, then emit the returned inline reference on
  its own line, verbatim. Do not wrap it in a code fence, link it, or call it an
  artifact. Add at most one sentence of context.
- Never open a browser for the board unless the user asks.

## Errors

- `TASK_VERSION_CONFLICT` — read the task again; do not force.
- `BLOCKER_ACTIVE` — clear the blocker before moving to Done.
- `ANSWER_REQUIRED` — pick an option before approving.
- `HUMAN_DECISION_REQUIRED` — you tried to approve or reject on your own. Ask
  the human, then retry with `as: "user"` and `confirmed_by`.

Keep responses about the board short. Identifiers first, status second, detail
only when asked.
