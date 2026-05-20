#!/usr/bin/env bash
# PreToolUse hook for Write/Edit/NotebookEdit: block any attempt to
# create or modify the sandbox-bypass marker file directly.
#
# The marker may only be created by record-sandbox-approval.sh (which
# runs in the harness, not via tool calls). Allowing Claude to write it
# via Write/Edit would let it self-grant the bypass.

set -uo pipefail

input=$(cat)

file_path=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
ti = data.get("tool_input") or data
print(ti.get("file_path", ""))
' 2>/dev/null || true)

if [ -z "$file_path" ]; then
  exit 0
fi

case "$file_path" in
  *.sandbox-bypass.marker|*/.sandbox-bypass.marker)
    cat >&2 <<EOF
BLOCKED: .sandbox-bypass.marker is system-managed and must not be created
or modified via Write/Edit. The marker is written exclusively by the
PostToolUse hook after the user selects "Bypass erlauben" on a
"Sandbox-Bypass anfordern" question. Forging it from a tool call would
defeat the per-call user-consent gate.

Attempted path: $file_path
EOF
    exit 2
    ;;
esac

exit 0
