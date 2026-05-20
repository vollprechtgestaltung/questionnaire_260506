#!/usr/bin/env bash
# PreToolUse hook: block writes outside the project memory folder.
#
# Memories must live in ./memory/ (project-relative, Dropbox-synced),
# never in ~/.claude/projects/<hash>/memory/ (machine-local).
#
# Exit code 2 blocks the tool call and returns the message to Claude.
#
# JSON is parsed with python3 (always present on macOS) — robust against
# escaped quotes and nested structures, unlike sed.

set -euo pipefail

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
  */.claude/projects/*/memory/*)
    cat >&2 <<EOF
Blocked: memories must be written to ./memory/ in the project root,
not ~/.claude/projects/<hash>/memory/ (machine-local, not Dropbox-synced).

Attempted path: $file_path

See CLAUDE.md → "Portable Persistence".
EOF
    exit 2
    ;;
esac

exit 0
