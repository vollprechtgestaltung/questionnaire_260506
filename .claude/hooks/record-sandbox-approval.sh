#!/usr/bin/env bash
# PostToolUse hook on AskUserQuestion: detect explicit sandbox-bypass
# approval and create a single-use marker for check-sandbox-bypass.sh.
#
# Strict matching to prevent accidental triggering:
#  - At least one question in the AskUserQuestion call must have
#    header EXACTLY equal to "Sandbox-Bypass anfordern"
#  - The user's selected answer for that question must be EXACTLY
#    "Bypass erlauben" (not "Other"-text, not partial match)
#
# Only then is the marker written. Any other AskUserQuestion call is
# ignored.

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MARKER="$PROJECT_DIR/.sandbox-bypass.marker"
LOG="$PROJECT_DIR/docs/sandbox-bypass.log"

input=$(cat)

result=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

if data.get("tool_name") != "AskUserQuestion":
    sys.exit(0)

ti = data.get("tool_input") or {}
tr = data.get("tool_response") or data.get("tool_result") or {}

target = None
for q in ti.get("questions") or []:
    if q.get("header") == "Sandbox-Bypass anfordern":
        target = q
        break
if target is None:
    sys.exit(0)

qtext = target.get("question", "")
answers = tr.get("answers") or {}
answer = answers.get(qtext, "")

if answer == "Bypass erlauben":
    # Single tab separator; question text may contain anything else.
    sys.stdout.write("APPROVE\t" + qtext)
' 2>/dev/null)

if [ "${result%%	*}" = "APPROVE" ]; then
  qtext="${result#APPROVE	}"
  ts=$(date '+%Y-%m-%dT%H:%M:%SZ')
  {
    echo "granted_at: $ts"
    echo "question_text: $qtext"
  } > "$MARKER"
  mkdir -p "$(dirname "$LOG")"
  printf '%s | approved | question=%s\n' "$ts" "$qtext" >> "$LOG"
fi

exit 0
