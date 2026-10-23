#!/bin/sh
# Install a systemd user service that serves the Codex Kanban web board at login.
set -eu

UNIT_NAME="codex-kanban.service"
UNIT_DIR="$HOME/.config/systemd/user"
UNIT="$UNIT_DIR/$UNIT_NAME"
ROOT=""
PORT="4317"
OPEN="--no-open"

usage() {
  cat <<USAGE
Usage: scripts/install-autostart-linux.sh [--root PATH] [--port 4317] [--open]

  --root PATH   repository to serve (default: current directory)
  --port N      port to listen on (default: 4317)
  --open        also try to open the browser at login (needs a desktop session)

Installs $UNIT and enables it for the current user.
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

[ "$(uname -s)" = "Linux" ] || { echo "this installer is Linux-only" >&2; exit 1; }
command -v systemctl >/dev/null 2>&1 || { echo "systemd not found" >&2; exit 1; }

PLUGIN_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
NODE_BIN=$(command -v node || true)
[ -n "$NODE_BIN" ] || NODE_BIN="/usr/bin/node"
[ -x "$NODE_BIN" ] || { echo "Node.js 22+ not found" >&2; exit 1; }

if [ -z "$ROOT" ]; then ROOT=$(pwd); fi
ROOT=$(CDPATH= cd -- "$ROOT" && pwd) || { echo "root does not exist: $ROOT" >&2; exit 1; }

mkdir -p "$UNIT_DIR"
cat > "$UNIT" <<UNITFILE
[Unit]
Description=Codex Kanban web board
After=network.target

[Service]
Type=simple
ExecStart=$NODE_BIN $PLUGIN_DIR/plugin/bin/codex-kanban.mjs serve --root $ROOT --port $PORT $OPEN
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
UNITFILE

systemctl --user daemon-reload
systemctl --user enable --now "$UNIT_NAME"
echo "Installed and started $UNIT_NAME"
echo "  root: $ROOT"
echo "  url:  http://127.0.0.1:$PORT"
echo "  logs: journalctl --user -u $UNIT_NAME -f"
