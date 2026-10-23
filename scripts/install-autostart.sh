#!/bin/sh
# Install a macOS LaunchAgent that serves the Codex Kanban web board at login.
set -eu

LABEL="com.silassolivagus.codex-kanban"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/codex-kanban.log"
ROOT=""
PORT="4317"
OPEN="--no-open"

usage() {
  cat <<USAGE
Usage: scripts/install-autostart.sh [--root PATH] [--port 4317] [--open]

  --root PATH   repository to serve (default: current directory)
  --port N      port to listen on (default: 4317)
  --open        also open the browser at login (default: serve only)

Installs ~/Library/LaunchAgents/$LABEL.plist and loads it.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --open) OPEN=""; shift ;;
    --no-open) OPEN="--no-open"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

[ "$(uname -s)" = "Darwin" ] || { echo "this installer is macOS-only" >&2; exit 1; }

PLUGIN_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
NODE_BIN=$(command -v node || true)
[ -n "$NODE_BIN" ] || NODE_BIN="/opt/homebrew/bin/node"
[ -x "$NODE_BIN" ] || { echo "Node.js 22+ not found" >&2; exit 1; }

if [ -z "$ROOT" ]; then ROOT=$(pwd); fi
ROOT=$(CDPATH= cd -- "$ROOT" && pwd) || { echo "root does not exist: $ROOT" >&2; exit 1; }

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
fi

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$PLUGIN_DIR/plugin/bin/codex-kanban.mjs</string>
    <string>serve</string>
    <string>--root</string><string>$ROOT</string>
    <string>--port</string><string>$PORT</string>
    <string>$OPEN</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST

launchctl load -w "$PLIST"
echo "Installed $LABEL"
echo "  root: $ROOT"
echo "  url:  http://127.0.0.1:$PORT"
[ -n "$OPEN" ] || echo "  browser: opens at login"
echo "  log:  $LOG"
