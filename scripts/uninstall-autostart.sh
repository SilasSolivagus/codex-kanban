#!/bin/sh
# Remove the Codex Kanban LaunchAgent installed by install-autostart.sh.
set -eu
LABEL="com.silassolivagus.codex-kanban"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ -f "$PLIST" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Removed $LABEL"
else
  echo "Not installed: $PLIST"
fi
