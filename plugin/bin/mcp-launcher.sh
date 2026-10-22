#!/bin/sh
# Launch the codex-kanban MCP server with a Node.js 22+ runtime.
set -eu

PLUGIN_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SERVER="$PLUGIN_DIR/server/index.mjs"

if [ ! -f "$SERVER" ]; then
  echo "codex-kanban: missing server entry: $SERVER" >&2
  exit 1
fi

is_node22() {
  [ -n "$1" ] && [ -x "$1" ] || return 1
  version=$("$1" -p 'process.versions.node' 2>/dev/null) || return 1
  major=${version%%.*}
  case "$major" in
    '' | *[!0-9]*) return 1 ;;
  esac
  [ "$major" -ge 22 ]
}

for candidate in "${NODE_BIN:-}" "$(command -v node 2>/dev/null || true)" /opt/homebrew/bin/node /usr/local/bin/node; do
  if is_node22 "$candidate"; then
    exec "$candidate" "$SERVER"
  fi
done

echo "codex-kanban: Node.js 22 or newer is required; install Node 22+ or point NODE_BIN at it" >&2
exit 1
