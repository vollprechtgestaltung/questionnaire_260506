#!/usr/bin/env bash
# Stop hook: remind Claude to write a session summary before stopping.
#
# Fires when Claude is about to stop. If today does not yet have a file in
# docs/sessions/YYYY-MM-DD*.md, this hook blocks the stop once with a
# reminder message. After Claude writes the summary (or any other tool
# call), Claude tries to stop again — now today's file exists, the hook
# allows the stop silently.
#
# Loop protection: Claude Code sets stop_hook_active=true in the stdin
# JSON when a previous Stop-block is still in effect. We always allow
# stop in that case to avoid an infinite block-retry loop, even if the
# summary file is still missing (Claude actively chose not to write it).
#
# Allow-paths:
#  - stop_hook_active: true        → silent allow (loop guard)
#  - today's summary exists        → silent allow
#  - SESSION_SUMMARY_SKIP=1 in env → silent allow (test escape hatch)

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Test escape hatch — lets tests of OTHER hooks invoke Stop without nag.
if [ "${SESSION_SUMMARY_SKIP:-0}" = "1" ]; then
  exit 0
fi

input=$(cat 2>/dev/null || echo "")

stop_hook_active=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
print("true" if data.get("stop_hook_active") is True else "false")
' 2>/dev/null || echo "false")

if [ "$stop_hook_active" = "true" ]; then
  exit 0
fi

today=$(date '+%Y-%m-%d')
if compgen -G "docs/sessions/${today}*.md" > /dev/null; then
  exit 0
fi

now=$(date '+%Y-%m-%d-%H%M')
cat >&2 <<EOF
SESSION SUMMARY MISSING

Bevor diese Session endet: kurzen Summary nach docs/sessions/${now}.md
schreiben. Konvention + Pflicht-Inhalt: docs/sessions/README.md.

Mindest-Inhalt (ein A4 ist viel):

  # Session ${now/-/ }
  > When to read: <Trigger für künftige Relevanz>
  ## Kontext      — worum ging es?
  ## Was passiert ist
  ## Entscheidungen
  ## Offene Punkte

DSG-Pflicht: keine Klarnamen, keine echten Tokens, keine sensiblen
Internals — der Ordner ist Git-getrackt.

Falls die Session wirklich trivial war (keine Datei-Änderungen, keine
Entscheidungen): einen 2-Zeilen-Stub schreiben, dann erneut stoppen.
EOF
exit 2
