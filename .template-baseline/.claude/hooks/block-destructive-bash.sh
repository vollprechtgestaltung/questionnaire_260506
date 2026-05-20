#!/usr/bin/env bash
# PreToolUse hook for the Bash tool: block destructive command patterns
# that are easy to mistype and hard to undo.
#
# This is a *stolperschutz*, not a security boundary. A sufficiently
# motivated command can always be obfuscated. The point is to catch the
# common accidents (rm -rf in the wrong directory, force-push to main,
# hard-reset over uncommitted work).
#
# Exit code 2 blocks the call; the message is returned to Claude.
#
# Detection covers:
#   - recursive deletes anywhere on the line (rm -rf, rm -r, rm -fr, ...)
#   - find ... -delete / -exec rm
#   - git push --force / -f (including push --force-with-lease to main)
#   - git reset --hard
#   - git clean -f[dx]
#   - git checkout -- . / git restore .
#   - chmod 777
#   - dd of=/dev/...
#   - mkfs / :(){ :|:& };:
#
# To extend per project: add patterns at the bottom or override in
# .claude/settings.local.json by removing this hook.

set -euo pipefail

input=$(cat)

cmd=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
ti = data.get("tool_input") or data
print(ti.get("command", ""))
' 2>/dev/null || true)

if [ -z "$cmd" ]; then
  exit 0
fi

# Normalize whitespace for easier matching.
norm=$(printf '%s' "$cmd" | tr '\n\t' '  ' | tr -s ' ')

block() {
  local reason="$1"
  cat >&2 <<EOF
Blocked destructive bash command.

Reason: $reason
Command: $cmd

If this is intentional and you've verified the target, ask the user to
run it manually, or remove .claude/hooks/block-destructive-bash.sh from
the PreToolUse chain for this session.
EOF
  exit 2
}

# rm -r / rm -rf in any order, with or without leading paths
if printf '%s' "$norm" | grep -Eq '(^|[[:space:];&|`(])rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f?[a-zA-Z]*|-r[a-zA-Z]*|-fr[a-zA-Z]*|-rf[a-zA-Z]*)([[:space:]]|$)'; then
  block "recursive rm detected"
fi

# find ... -delete  or  find ... -exec rm
if printf '%s' "$norm" | grep -Eq 'find[[:space:]].*(-delete|-exec[[:space:]]+rm)'; then
  block "find -delete / find -exec rm detected"
fi

# git push --force (any variant, incl. -f flag)
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+push[[:space:]].*(--force([^-]|$)|-[a-zA-Z]*f([[:space:]]|$))'; then
  block "git push --force detected"
fi

# git reset --hard
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+reset[[:space:]]+(--hard|.*[[:space:]]--hard)'; then
  block "git reset --hard detected"
fi

# git clean -f / -fd / -fdx
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+clean[[:space:]]+(-[a-zA-Z]*f|--force)'; then
  block "git clean -f detected"
fi

# git checkout -- . / git restore .  (discards uncommitted work)
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+(checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+\.)'; then
  block "wholesale discard of uncommitted changes detected"
fi

# git branch -D
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+branch[[:space:]]+-D[[:space:]]'; then
  block "git branch -D detected (force-delete branch)"
fi

# chmod 777
if printf '%s' "$norm" | grep -Eq '(^|[[:space:];&|`(])chmod[[:space:]]+(-[a-zA-Z]+[[:space:]]+)?(777|a\+rwx)([[:space:]]|$)'; then
  block "chmod 777 detected"
fi

# dd writing to a device
if printf '%s' "$norm" | grep -Eq '(^|[[:space:];&|`(])dd[[:space:]].*of=/dev/'; then
  block "dd of=/dev/* detected"
fi

# mkfs.*
if printf '%s' "$norm" | grep -Eq '(^|[[:space:];&|`(])mkfs(\.[a-z0-9]+)?[[:space:]]'; then
  block "mkfs detected"
fi

# fork bomb
if printf '%s' "$cmd" | grep -Fq ':(){ :|:& };:'; then
  block "fork bomb pattern detected"
fi

# --skip-hooks / --no-verify on git commit/push (policy: never bypass hooks)
if printf '%s' "$norm" | grep -Eq 'git[[:space:]]+(commit|push|rebase|merge).*(--no-verify|--no-gpg-sign)'; then
  block "--no-verify / --no-gpg-sign is forbidden by project policy"
fi

# Tamper protection for the sandbox-bypass marker (see check-sandbox-bypass.sh).
# Any bash command that mentions the marker path is rejected — the only
# legitimate writer is the PostToolUse hook record-sandbox-approval.sh.
if printf '%s' "$cmd" | grep -Fq '.sandbox-bypass.marker'; then
  block "tampering with .sandbox-bypass.marker is forbidden — see check-sandbox-bypass.sh"
fi

exit 0
