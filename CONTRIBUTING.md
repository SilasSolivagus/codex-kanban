# Contributing to Codex Kanban

Codex Kanban is a small plugin: one board store, one MCP server, one skill, one CLI,
and no runtime dependencies. Changes should stay in that shape.

## Requirements

- Node.js 22 or newer.
- Codex with plugin support for end-to-end checks.
- No package installation or build step. `node --test` is the full test command.

## Setup

```bash
git clone https://github.com/SilasSolivagus/codex-kanban.git
cd codex-kanban
node --test
```

Run one suite while iterating:

```bash
node --test test/store.test.mjs
```

The tests create temporary directories and never touch a real `.kanban` board. They
must not need network access.

## Plugin layout

| Path | Responsibility |
| --- | --- |
| `.agents/plugins/marketplace.json` | Local marketplace entry; `source.path` must stay `./plugin`. |
| `plugin/.codex-plugin/plugin.json` | Plugin manifest: name, version, skills, MCP config, interface. |
| `plugin/.mcp.json` | Launches the MCP server through `bin/mcp-launcher.sh` with `cwd: "."`. |
| `plugin/bin/mcp-launcher.sh` | Finds a Node 22+ runtime and starts `server/index.mjs`. |
| `plugin/bin/codex-kanban.mjs` | Human CLI over the same domain and store. |
| `plugin/server/` | Hand-written JSON-RPC 2.0 stdio server and the 13 tool handlers. |
| `plugin/src/` | `rules` (columns, statuses, attention), `store` (lock, atomic write), `domain` (task operations), `render` (Markdown), `html` (self-contained board). |
| `plugin/skills/kanban/SKILL.md` | Agent-facing policy: board first, ask versus block, approval boundary. |
| `plugin/assets/icon.svg` | Plugin icon. |
| `test/` | `node:test` suites for each layer plus plugin packaging and MCP. |

Keep the dependency direction one-way: `rules` → `domain`/`store` → renderers and
tools → CLI. Do not import the CLI from the server or the server from the CLI.

## Try a change in an isolated Codex home

Use a throwaway `CODEX_HOME` so the real Codex configuration is untouched:

```bash
mkdir -p .tmp-codex-home
cp ~/.codex/auth.json .tmp-codex-home/auth.json
export CODEX_HOME="$PWD/.tmp-codex-home"
codex plugin marketplace add "$PWD"
codex plugin list
codex plugin add codex-kanban@silassolivagus
```

Then run Codex in a scratch repository and exercise the plugin:

```bash
mkdir -p /tmp/codex-kanban-smoke
cd /tmp/codex-kanban-smoke
codex
```

Inside the session, ask for something small and verifiable:

> "Create a task called Smoke test, add the `smoke` label, and render the board."

Check the result:

```bash
cat /tmp/codex-kanban-smoke/.kanban/board.json
ls /tmp/codex-kanban-smoke/.kanban/board.html
```

Clean up:

```bash
rm -rf /tmp/codex-kanban-smoke
```

Back in the checkout, remove `.tmp-codex-home` when you are done. It contains your
auth token and is ignored by git. If you changed the manifest or MCP config, remove
and reinstall the plugin in the isolated home rather than relying on a cached copy.

## What to test

- **Store and domain:** a new test should fail before the fix and pass after it.
  Cover version conflicts, blockers, questions, and the human-only approval path.
- **MCP:** tool names, argument validation, error codes and the exact failure text
  callers depend on.
- **Renderers:** Markdown column order and HTML's zero-network guarantee. The HTML
  file must not reference external URLs.
- **CLI:** every command should exit non-zero with the error code on stderr.
- **Packaging:** `test/plugin.test.mjs` pins the manifest paths. Keep `source.path`
  as `./plugin`.

Do not weaken `.kanban/board.json` compatibility to make a test pass. The schema is
versioned for a reason.

## Pull requests

- One focused change per pull request. Keep commits in the existing style
  (`feat:`, `fix:`, `docs:`, `test:`), in the imperative mood.
- `node --test` must pass on Node 22. CI runs exactly that command.
- No new runtime dependencies. A development dependency needs a concrete reason and
  should not replace `node:test`.
- Update the README, usage guide, or skill when behavior visible to users or agents
  changes. If a count such as the test total changes, update the badge and text in
  both READMEs.
- Explain user-visible behavior and error-code changes in the pull request
  description. Include the Codex and Node versions you tested with for installation
  or packaging changes.
- Do not commit `.kanban/`, `.tmp-codex-home/`, `node_modules/`, `*.tmp`, or
  generated `board.html` files.

## Reporting a bug

Include the Codex version, Node version, the exact prompt or CLI command, the error
code (`BOARD_LOCKED`, `TASK_VERSION_CONFLICT`, and so on), and whether the board was
created by the plugin or by hand. A minimal `board.json` helps for store and render
bugs.

## License

By contributing, you agree that your contribution is licensed under the MIT License.
