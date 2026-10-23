#!/bin/sh
# Remove the systemd user service installed by install-autostart-linux.sh.
set -eu
UNIT_NAME="codex-kanban.service"
UNIT="$HOME/.config/systemd/user/$UNIT_NAME"

if [ -f "$UNIT" ]; then
  systemctl --user disable --now "$UNIT_NAME" 2>/dev/null || true
  rm -f "$UNIT"
  systemctl --user daemon-reload 2>/dev/null || true
  echo "Removed $UNIT_NAME"
else
  echo "Not installed: $UNIT"
fi
