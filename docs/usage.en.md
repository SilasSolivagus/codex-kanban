# Using Codex Kanban

This guide covers the human side of the board: starting one, creating tasks, asking
and answering questions, approving work, handling blockers, rendering the HTML view,
and recovering from the usual errors. The tool reference lives in the
[README](../README.md); the agent-facing rules live in
[`plugin/skills/kanban/SKILL.md`](../plugin/skills/kanban/SKILL.md).

## Before you start

- The plugin must be installed. See [Install](../README.md#install).
- The board belongs to a repository. Run Codex in that repository, or pass
  `--root /path/to/repo` to the CLI.
- The first board is free: reading an empty repository returns an empty board.
  `.kanban/board.json` appears on the first write.

## The first board

Open the repository in Codex and ask:

> "Show me the board."

On a fresh repository the answer is that the board is empty. That is expected: a
read does not create a file. Create the first task:

> "Create a task: write the v0.1 release notes. Medium priority, `docs` label."

Codex creates the task in Backlog and returns its identifier, for example
`MYAPP-1`. The board now exists:

```
<repo>/.kanban/board.json
```

You can also create it from the CLI:

```bash
node plugin/bin/codex-kanban.mjs add "Write the v0.1 release notes" \
  --description "Cover install, the 13 tools, and the human approval boundary." \
  --priority medium --label docs
```

Commit `.kanban/board.json` with the change it describes. Do not commit
`.kanban/board.html` or `.kanban/board.lock`; both are generated.

## Create a task

In Codex:

> "Track the login redirect bug. Users land on `/` after SSO instead of the page
> they came from. High priority, `auth` label."

Codex calls `kanban_task_create` and reports the new identifier. Useful task
properties:

| Property | Values |
| --- | --- |
| Status | `backlog` (default), `todo`, `in_progress`, `in_review`, `done`, `canceled` |
| Priority | `none` (default), `low`, `medium`, `high`, `urgent` |
| Labels | Up to 20 short strings |
| Links | Up to 50 `{ "label": "...", "url": "https://..." }` entries |

Keep a task at the size of a deliverable, not a checklist. A task that spans
sessions, needs a decision, or must not be lost is a good task. A task for every
tool call is noise.

## Questions, answers and approvals

### Ask for a decision

When progress depends on a human choice, ask instead of guessing:

> "Ask me whether the migration should run before or after the deploy."

Codex posts a question with two to five options. The task stays in Needs you while
the question is open.

### Answer it

Reply with the decision and the reason:

> "Run the migration before the deploy. If it fails, the release should stop."

Codex calls `kanban_task_answer` and the choice is recorded. The question is still
open: an answer is not an approval, and the card stays in Needs you until someone
approves or rejects it.

### Approve it

Be explicit:

> "I approve that decision. Close the task."

Codex calls `kanban_task_approve` with `as: "user"` and a `confirmed_by` value that
summarizes your decision, then the task moves to Done. A vague "sounds good" is not
a decision; say "approve" or "reject" if that is what you mean. This is a
cooperative boundary, not authentication: the actor and the confirmation are
self-declared, and an agent that lies or edits `board.json` can bypass it. The
protection is that the board is plain JSON you review.

Approval through the MCP server fails unless all three are true:

- `as` is `"user"`.
- `confirmed_by` is non-empty and reflects your decision.
- If a question is open, an option has already been recorded with
  `kanban_task_answer`.

Rejecting works the same way, with a note:

> "Reject it. The retry path is untested. Send it back to Backlog with that note."

## Review a deliverable

When the work exists and needs a human look, the agent moves the task to
`in_review`. The task appears in Needs you with a review badge. You have two
choices:

> "The implementation looks right. Approve it."

> "Reject it: the retry path is untested. Send it back with that note."

An agent cannot close a task that is in review. If you ask Codex to "move it to
Done", it should ask you to approve or reject instead; that is the boundary working,
not a failure.

## Block and unblock

Use a blocker when the missing piece is outside the conversation: access, a
dependency, a broken environment, or another person's deliverable. Ask for a
decision with a question instead.

> "Block the deploy task. I still need to give you staging credentials."

Codex records one actionable sentence and the task moves to Needs you.

When the external piece arrives:

> "I added the staging credentials. Unblock the deploy task."

Codex clears the blocker and the task returns to its stored status. A blocked task
cannot be approved or moved to Done until it is unblocked.

## Render the board

Ask in Codex:

> "Render the board."

Codex writes `.kanban/board.html` and, in the Codex app, shows the inline visual
reference on its own line. From the CLI:

```bash
node plugin/bin/codex-kanban.mjs render --open
```

`render` writes the file and prints its path; `--open` also opens it. The `open`
command does both.

The HTML board has four columns, a detail drawer, and action buttons. It is
read-only. Inside the Codex app the buttons send a follow-up message back to Codex;
outside the app the board still reads, but the buttons cannot write and show a
notice saying so.

## CLI cheatsheet

These commands assume the current directory is the `codex-kanban` checkout. Add
`--root /path/to/repo` to target another repository. A numeric reference such as
`1` resolves to `<project-prefix>-1`.

| Command | What it does |
| --- | --- |
| `node plugin/bin/codex-kanban.mjs board` | Markdown board, Needs you first. |
| `node plugin/bin/codex-kanban.mjs board --column needs` | Only the Needs you column. |
| `node plugin/bin/codex-kanban.mjs board --no-done` | Hide Done. |
| `node plugin/bin/codex-kanban.mjs list` | One line per task, grouped by column. |
| `node plugin/bin/codex-kanban.mjs list --json` | The full board view as JSON. |
| `node plugin/bin/codex-kanban.mjs get 1` | Task detail with recent comments and activity. |
| `node plugin/bin/codex-kanban.mjs add "Title" --priority high --label auth` | Create a task. |
| `node plugin/bin/codex-kanban.mjs update 1 --title "New title"` | Update fields without moving. |
| `node plugin/bin/codex-kanban.mjs move 1 --to in_progress` | Move to a column or status. |
| `node plugin/bin/codex-kanban.mjs block 1 --reason "Waiting for credentials"` | Record a blocker. |
| `node plugin/bin/codex-kanban.mjs unblock 1` | Clear a blocker. |
| `node plugin/bin/codex-kanban.mjs ask 1 --prompt "Which target?" --option Staging --option Production` | Ask with options. |
| `node plugin/bin/codex-kanban.mjs answer 1 --option opt_1` | Record an answer. |
| `node plugin/bin/codex-kanban.mjs approve 1 --confirmed-by "Staging first"` | Approve as the human. |
| `node plugin/bin/codex-kanban.mjs reject 1 --confirmed-by "Needs tests" --note "Add retry coverage"` | Reject as the human. |
| `node plugin/bin/codex-kanban.mjs comment 1 --body "Staging check passed"` | Add a comment. |
| `node plugin/bin/codex-kanban.mjs render` | Write `.kanban/board.html`. |
| `node plugin/bin/codex-kanban.mjs open` | Write and open the HTML board. |

The CLI runs as the human by default. `approve` and `reject` always run as the
human and require `--confirmed-by`. Use `--as agent` only when you are deliberately
simulating what Codex can do.

When the plugin is installed, replace the CLI path with the installed one:

```bash
node "$HOME/.codex/plugins/cache/silassolivagus/codex-kanban/0.1.0/bin/codex-kanban.mjs" board --root "$PWD"
```

If your Codex home is elsewhere, use
`$CODEX_HOME/plugins/cache/silassolivagus/codex-kanban/<version>/bin/codex-kanban.mjs`.

## Troubleshooting

### `BOARD_LOCKED`

Another process holds `.kanban/board.lock`. The store retries for up to five
seconds, then fails instead of writing over a concurrent change.

- Retry the command once the other write finishes.
- If no Codex session or CLI is running, the lock may be left over from a crash.
  The next write automatically reclaims a lock older than 30 seconds.
- Do not delete a lock while a process may still be writing. If you must, confirm
  no writer is active first, then remove `.kanban/board.lock`.

### `CORRUPT_BOARD`

`.kanban/board.json` is not valid JSON, or its top level is not a board object with
a `tasks` array. Reads fail and the store will not overwrite the file, so a normal
command cannot silently destroy it.

1. Back up the file: `cp .kanban/board.json .kanban/board.json.bak`
2. Restore the last committed version: `git checkout -- .kanban/board.json`
3. If the file was never committed, fix the JSON by hand. The error message names
   the parse failure. The store needs a JSON object with a `tasks` array; missing
   `schema`, `project` or `nextTaskNumber` values are filled with defaults.

### `VERSION_REQUIRED`

A write through the MCP server arrived without a version. Read the task first with
`kanban_task_get`, then retry with the returned `version`. The CLI reads the
current version automatically, so this error usually means a direct MCP call or a
custom client.

### `TASK_VERSION_CONFLICT`

The task changed after it was read. Read it again with `kanban_task_get` and retry
with the new version. Never force a write or invent a version.

### `HUMAN_DECISION_REQUIRED`

An approval or rejection was attempted without `as: "user"` and `confirmed_by`, or
an agent tried to close an `in_review` task. Ask the human for an explicit decision,
then retry; if the task is in review, the human approves or rejects it.

### `BLOCKER_ACTIVE`

The task still has a blocker. Clear the external dependency, run
`kanban_task_unblock`, then retry the move or approval.

### `ANSWER_REQUIRED`

The task has an open question without a recorded option. Ask the human to choose,
record it with `kanban_task_answer`, then approve.

### `QUESTION_OPEN`

The task has an unresolved question and cannot move to Done. Answer it or reject
the task; rejecting sends it back to Backlog.

## Where the data lives

- `.kanban/board.json` is the board. One board per repository. It is plain JSON and
  intended to be reviewed and committed with the project.
- `.kanban/board.html` is a generated, read-only view. Add it to your
  `.gitignore` if you do not want it committed.
- `.kanban/board.lock` serializes writes. It is temporary; add it to your
  `.gitignore` as well.
- Canceled tasks stay in `board.json` and remain reachable by identifier, but they
  are hidden from all four columns.
