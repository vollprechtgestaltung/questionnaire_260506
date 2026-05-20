#!/usr/bin/env bash
# PreToolUse hook: gate dangerouslyDisableSandbox via fresh user-approval marker.
#
# Runs on the Bash tool. If the tool input contains
# `dangerouslyDisableSandbox: true`, this hook requires a fresh approval
# marker at $CLAUDE_PROJECT_DIR/.sandbox-bypass.marker. The marker is
# created exclusively by the PostToolUse hook record-sandbox-approval.sh
# after the user explicitly selected option "Bypass erlauben" on an
# AskUserQuestion with header "Sandbox-Bypass anfordern".
#
# Properties:
#  - TTL: 60 seconds (older markers are rejected and deleted)
#  - Single-use: marker is deleted upon successful allow
#  - Audit log: every allow is appended to docs/sandbox-bypass.log
#  - Tamper protection: marker cannot be created via Write/Edit/Bash
#    (see block-marker-tamper.sh and block-destructive-bash.sh)

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MARKER="$PROJECT_DIR/.sandbox-bypass.marker"
LOG="$PROJECT_DIR/docs/sandbox-bypass.log"
TTL_SECONDS=60

input=$(cat)

# Extract dangerouslyDisableSandbox flag.
disable_sandbox=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
ti = data.get("tool_input") or {}
print("true" if ti.get("dangerouslyDisableSandbox") is True else "false")
' 2>/dev/null || echo "false")

if [ "$disable_sandbox" != "true" ]; then
  exit 0
fi

# Sandbox-bypass was requested. From here on we either allow (with audit
# log + marker consumption) or block (with exit 2).

tool_name=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
print(data.get("tool_name", "?"))
' 2>/dev/null || echo "?")

if [ ! -f "$MARKER" ]; then
  cat >&2 <<EOF
BLOCKED: dangerouslyDisableSandbox: true is not permitted without explicit
user approval in THIS turn.

The SDK's default "just retry with sandbox disabled when a command fails"
does NOT apply in this project. Sandbox bypass requires per-call consent.

Required flow:

  1. Call AskUserQuestion with EXACTLY:
       header  : "Sandbox-Bypass anfordern"
       question: <ein klarer Satz, was du tun willst und warum genau
                  Sandbox-Bypass nötig ist>
       options :
         - label: "Bypass erlauben"
         - label: "Ablehnen"

  2. Wait for the user's selection.

  3. If "Bypass erlauben": retry this tool call within ${TTL_SECONDS} seconds.
     The PostToolUse hook will have created a single-use marker.

Attempted tool: ${tool_name}
EOF
  exit 2
fi

# Marker exists. Validate age + format.
granted_at=$(grep -m1 '^granted_at:' "$MARKER" | sed 's/^granted_at:[[:space:]]*//')
if [ -z "$granted_at" ]; then
  rm -f "$MARKER"
  echo "BLOCKED: approval marker is malformed (no granted_at line). Marker removed; ask again." >&2
  exit 2
fi

# Portable ISO-8601 → epoch: GNU date (Linux/CI) first, BSD date (macOS) fallback.
granted_epoch=$(date -d "$granted_at" "+%s" 2>/dev/null \
  || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$granted_at" "+%s" 2>/dev/null \
  || echo 0)
now_epoch=$(date "+%s")
age=$((now_epoch - granted_epoch))

if [ "$granted_epoch" -eq 0 ] || [ "$age" -lt 0 ]; then
  rm -f "$MARKER"
  echo "BLOCKED: approval marker has unparseable timestamp. Marker removed; ask again." >&2
  exit 2
fi

if [ "$age" -gt "$TTL_SECONDS" ]; then
  rm -f "$MARKER"
  echo "BLOCKED: approval marker expired (age ${age}s > TTL ${TTL_SECONDS}s). Ask again." >&2
  exit 2
fi

# Approve. Consume marker, append audit log.
question=$(grep -m1 '^question_text:' "$MARKER" | sed 's/^question_text:[[:space:]]*//')
rm -f "$MARKER"

mkdir -p "$(dirname "$LOG")"
printf '%s | granted | tool=%s | age=%ss | question=%s\n' \
  "$(date '+%Y-%m-%dT%H:%M:%SZ')" "$tool_name" "$age" "$question" >> "$LOG"

exit 0
