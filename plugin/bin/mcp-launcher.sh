#!/bin/sh
set -eu
PLUGIN_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

if [ -n "${NODE_BIN:-}" ] && [ -x "${NODE_BIN}" ]; then
  exec "$NODE_BIN" "$PLUGIN_DIR/server/index.mjs"
fi

for candidate in "$(command -v node 2>/dev/null || true)" /opt/homebrew/bin/node /usr/local/bin/node; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    exec "$candidate" "$PLUGIN_DIR/server/index.mjs"
  fi
done

echo "codex-kanban: Node.js 22 or newer is required" >&2
exit 1
