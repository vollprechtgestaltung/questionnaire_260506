#!/usr/bin/env bash
# Test suite for the project's PreToolUse hooks.
#
# Self-contained: pure bash, no BATS/jest/pytest required. Each test
# pipes a JSON tool-input payload into the hook and asserts on exit code
# (0 = allow, 2 = block).
#
# Run:   bash tests/hooks.sh
# CI:    exit code 1 if any test fails.

set -uo pipefail

# Resolve project root regardless of CWD.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_BASH="$ROOT/.claude/hooks/block-destructive-bash.sh"
HOOK_MEM="$ROOT/.claude/hooks/block-external-memory.sh"
HOOK_SANDBOX="$ROOT/.claude/hooks/check-sandbox-bypass.sh"
HOOK_APPROVE="$ROOT/.claude/hooks/record-sandbox-approval.sh"
HOOK_MARKER="$ROOT/.claude/hooks/block-marker-tamper.sh"
HOOK_SESSION_START="$ROOT/.claude/hooks/session-start.sh"
HOOK_STOP_SUMMARY="$ROOT/.claude/hooks/stop-session-summary.sh"

# Use a throwaway project dir for sandbox-bypass tests so we don't pollute
# the real project with marker/log files. Anchor explicitly in TMPDIR
# (default mktemp prefix ignores $TMPDIR on macOS).
SANDBOX_TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/hooks-sandbox-XXXXXX")"
if [ -z "$SANDBOX_TEST_DIR" ] || [ ! -d "$SANDBOX_TEST_DIR" ]; then
  echo "FATAL: could not create sandbox test dir (mktemp failed)" >&2
  exit 1
fi
trap 'rm -rf "$SANDBOX_TEST_DIR"' EXIT
mkdir -p "$SANDBOX_TEST_DIR/docs"
export CLAUDE_PROJECT_DIR="$SANDBOX_TEST_DIR"

pass=0
fail=0
failed_names=()

red()   { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
gray()  { printf '\033[90m%s\033[0m\n' "$1"; }

# assert_exit <name> <expected_exit> <hook_path> <json_payload>
assert_exit() {
  local name="$1"; local expected="$2"; local hook="$3"; local payload="$4"
  local out
  out=$(printf '%s' "$payload" | "$hook" 2>&1)
  local rc=$?
  if [ "$rc" -eq "$expected" ]; then
    green "  ✓ $name"
    pass=$((pass + 1))
  else
    red   "  ✗ $name (expected exit $expected, got $rc)"
    gray  "    payload: $payload"
    gray  "    output : $(printf '%s' "$out" | head -1)"
    fail=$((fail + 1))
    failed_names+=("$name")
  fi
}

# Helper to build a Bash tool-input payload.
bash_payload() {
  printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')"
}

# Helper to build a Write tool-input payload.
write_payload() {
  printf '{"tool_input":{"file_path":%s}}' "$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')"
}

echo "── block-destructive-bash.sh ──"

# Recursive rm — various forms must all block.
assert_exit "rm -rf /tmp/foo"                 2 "$HOOK_BASH" "$(bash_payload 'rm -rf /tmp/foo')"
assert_exit "rm -r foo"                       2 "$HOOK_BASH" "$(bash_payload 'rm -r foo')"
assert_exit "rm -fr foo"                      2 "$HOOK_BASH" "$(bash_payload 'rm -fr foo')"
assert_exit "rm -Rrf foo"                     2 "$HOOK_BASH" "$(bash_payload 'rm -Rrf foo')"
assert_exit "rm -rf chained after cd"         2 "$HOOK_BASH" "$(bash_payload 'cd foo && rm -rf bar')"
assert_exit "rm -rf after semicolon"          2 "$HOOK_BASH" "$(bash_payload 'echo hi; rm -rf foo')"

# find -delete and find -exec rm.
assert_exit "find -delete"                    2 "$HOOK_BASH" "$(bash_payload 'find . -name "*.log" -delete')"
assert_exit "find -exec rm"                   2 "$HOOK_BASH" "$(bash_payload 'find . -type f -exec rm {} \;')"

# Git force-push variants.
assert_exit "git push --force"                2 "$HOOK_BASH" "$(bash_payload 'git push --force origin main')"
assert_exit "git push -f"                     2 "$HOOK_BASH" "$(bash_payload 'git push -f origin main')"
assert_exit "git push origin main --force"    2 "$HOOK_BASH" "$(bash_payload 'git push origin main --force')"

# Git reset/clean/restore destructive forms.
assert_exit "git reset --hard"                2 "$HOOK_BASH" "$(bash_payload 'git reset --hard HEAD')"
assert_exit "git clean -fd"                   2 "$HOOK_BASH" "$(bash_payload 'git clean -fd')"
assert_exit "git checkout -- ."               2 "$HOOK_BASH" "$(bash_payload 'git checkout -- .')"
assert_exit "git restore ."                   2 "$HOOK_BASH" "$(bash_payload 'git restore .')"
assert_exit "git branch -D feature"           2 "$HOOK_BASH" "$(bash_payload 'git branch -D feature/foo')"

# Filesystem-level danger.
assert_exit "chmod 777"                       2 "$HOOK_BASH" "$(bash_payload 'chmod 777 secret.key')"
assert_exit "dd of=/dev/sda"                  2 "$HOOK_BASH" "$(bash_payload 'dd if=/dev/zero of=/dev/sda1 bs=1M')"
assert_exit "mkfs.ext4"                       2 "$HOOK_BASH" "$(bash_payload 'mkfs.ext4 /dev/sda1')"
assert_exit "fork bomb"                       2 "$HOOK_BASH" "$(bash_payload ':(){ :|:& };:')"

# --no-verify policy.
assert_exit "git commit --no-verify"          2 "$HOOK_BASH" "$(bash_payload 'git commit -m foo --no-verify')"
assert_exit "git push --no-verify"            2 "$HOOK_BASH" "$(bash_payload 'git push --no-verify')"

# Harmless commands must pass.
assert_exit "ls -la"                          0 "$HOOK_BASH" "$(bash_payload 'ls -la')"
assert_exit "git status"                      0 "$HOOK_BASH" "$(bash_payload 'git status')"
assert_exit "git log --oneline -5"            0 "$HOOK_BASH" "$(bash_payload 'git log --oneline -5')"
assert_exit "git push origin main"            0 "$HOOK_BASH" "$(bash_payload 'git push origin main')"
assert_exit "git reset HEAD~1 (soft default)" 0 "$HOOK_BASH" "$(bash_payload 'git reset HEAD~1')"
assert_exit "rm single file (non-recursive)"  0 "$HOOK_BASH" "$(bash_payload 'rm foo.txt')"
assert_exit "chmod 644"                       0 "$HOOK_BASH" "$(bash_payload 'chmod 644 file')"
assert_exit "find without -delete"            0 "$HOOK_BASH" "$(bash_payload 'find . -name "*.log"')"
assert_exit "empty command"                   0 "$HOOK_BASH" '{"tool_input":{"command":""}}'
assert_exit "malformed JSON"                  0 "$HOOK_BASH" 'not json at all'

echo
echo "── block-external-memory.sh ──"

assert_exit "external memory path blocked" \
  2 "$HOOK_MEM" "$(write_payload '/Users/x/.claude/projects/abc123/memory/note.md')"
assert_exit "project memory path allowed" \
  0 "$HOOK_MEM" "$(write_payload './memory/note.md')"
assert_exit "absolute project memory allowed" \
  0 "$HOOK_MEM" "$(write_payload '/Users/x/work/project/memory/note.md')"
assert_exit "docs path allowed" \
  0 "$HOOK_MEM" "$(write_payload './docs/todos.md')"
assert_exit "src path allowed" \
  0 "$HOOK_MEM" "$(write_payload './src/index.ts')"
assert_exit "no file_path field" \
  0 "$HOOK_MEM" '{"tool_input":{}}'
assert_exit "malformed JSON" \
  0 "$HOOK_MEM" 'definitely not json'

echo
echo "── block-destructive-bash.sh: marker tamper ──"

assert_exit "touch .sandbox-bypass.marker"  2 "$HOOK_BASH" "$(bash_payload 'touch .sandbox-bypass.marker')"
assert_exit "echo > .sandbox-bypass.marker" 2 "$HOOK_BASH" "$(bash_payload 'echo granted > .sandbox-bypass.marker')"
assert_exit "cp to marker"                  2 "$HOOK_BASH" "$(bash_payload 'cp /tmp/x .sandbox-bypass.marker')"

echo
echo "── block-marker-tamper.sh (Write/Edit) ──"

assert_exit "write to marker (relative)"    2 "$HOOK_MARKER" "$(write_payload '.sandbox-bypass.marker')"
assert_exit "write to marker (absolute)"    2 "$HOOK_MARKER" "$(write_payload '/Users/x/project/.sandbox-bypass.marker')"
assert_exit "write to docs/ allowed"        0 "$HOOK_MARKER" "$(write_payload 'docs/notes.md')"
assert_exit "no file_path"                  0 "$HOOK_MARKER" '{"tool_input":{}}'

echo
echo "── check-sandbox-bypass.sh ──"

# Helper to build a Bash tool-input with explicit dangerouslyDisableSandbox.
sandbox_payload() {
  local cmd="$1"; local flag="$2"  # flag: "true" or "false"
  CMD="$cmd" FLAG="$flag" python3 -c '
import json, os
flag_bool = os.environ["FLAG"] == "true"
print(json.dumps({
    "tool_name": "Bash",
    "tool_input": {"command": os.environ["CMD"], "dangerouslyDisableSandbox": flag_bool}
}))
'
}

# 1. dangerouslyDisableSandbox absent or false → always passes
assert_exit "no bypass flag → pass" \
  0 "$HOOK_SANDBOX" "$(sandbox_payload 'ls' 'false')"
assert_exit "bypass false → pass" \
  0 "$HOOK_SANDBOX" '{"tool_name":"Bash","tool_input":{"command":"ls"}}'

# 2. bypass true without marker → block
rm -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
assert_exit "bypass true, no marker → block" \
  2 "$HOOK_SANDBOX" "$(sandbox_payload 'git commit -m foo' 'true')"

# 3. bypass true with fresh marker → allow, consume marker
printf 'granted_at: %s\nquestion_text: test\n' "$(date '+%Y-%m-%dT%H:%M:%SZ')" \
  > "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
assert_exit "bypass true, fresh marker → allow" \
  0 "$HOOK_SANDBOX" "$(sandbox_payload 'git commit -m foo' 'true')"

# Marker must have been consumed.
if [ -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  red "  ✗ marker not consumed after allow"
  fail=$((fail + 1))
  failed_names+=("marker consumption")
else
  green "  ✓ marker consumed after allow"
  pass=$((pass + 1))
fi

# 4. Second call right after consumption → block again
assert_exit "second bypass without new marker → block" \
  2 "$HOOK_SANDBOX" "$(sandbox_payload 'git commit -m foo' 'true')"

# 5. bypass with expired marker (>60s old) → block, marker removed
old_ts=$(date -j -v-2M '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null \
       || date -u -d '-2 minutes' '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)
printf 'granted_at: %s\nquestion_text: test\n' "$old_ts" \
  > "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
assert_exit "bypass true, expired marker → block" \
  2 "$HOOK_SANDBOX" "$(sandbox_payload 'git commit -m foo' 'true')"
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ expired marker auto-removed"
  pass=$((pass + 1))
else
  red "  ✗ expired marker not removed"
  fail=$((fail + 1))
fi

# 6. malformed marker → block, marker removed
echo "garbage" > "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
assert_exit "bypass true, malformed marker → block" \
  2 "$HOOK_SANDBOX" "$(sandbox_payload 'git commit -m foo' 'true')"

# 7. audit log was written for the one allowed call
if grep -q '| granted | tool=Bash' "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log" 2>/dev/null; then
  green "  ✓ audit log records granted call"
  pass=$((pass + 1))
else
  red "  ✗ audit log missing 'granted' entry"
  fail=$((fail + 1))
fi

echo
echo "── record-sandbox-approval.sh ──"

approve_payload() {
  local header="$1"; local question="$2"; local answer="$3"
  HEADER="$header" QUESTION="$question" ANSWER="$answer" python3 -c '
import json, os
h = os.environ["HEADER"]; q = os.environ["QUESTION"]; a = os.environ["ANSWER"]
print(json.dumps({
    "tool_name": "AskUserQuestion",
    "tool_input": {"questions": [{"header": h, "question": q, "options": []}]},
    "tool_response": {"answers": {q: a}}
}))
'
}

# Wrong header → no marker
rm -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
printf '%s' "$(approve_payload 'Andere Frage' 'Was?' 'Bypass erlauben')" | "$HOOK_APPROVE" > /dev/null 2>&1
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ wrong header → no marker"
  pass=$((pass + 1))
else
  red "  ✗ marker created on wrong header"
  fail=$((fail + 1))
fi

# Right header but wrong option → no marker
printf '%s' "$(approve_payload 'Sandbox-Bypass anfordern' 'OK?' 'Ablehnen')" | "$HOOK_APPROVE" > /dev/null 2>&1
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ right header, wrong option → no marker"
  pass=$((pass + 1))
else
  red "  ✗ marker created with wrong option"
  fail=$((fail + 1))
fi

# Right header AND right option → marker
printf '%s' "$(approve_payload 'Sandbox-Bypass anfordern' 'OK?' 'Bypass erlauben')" | "$HOOK_APPROVE" > /dev/null 2>&1
if [ -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ] && grep -q '^granted_at:' "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"; then
  green "  ✓ right header + right option → marker written"
  pass=$((pass + 1))
else
  red "  ✗ marker not written on legitimate approval"
  fail=$((fail + 1))
fi

# Wrong tool name → no action
rm -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
printf '{"tool_name":"Bash","tool_input":{},"tool_response":{}}' | "$HOOK_APPROVE" > /dev/null 2>&1
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ wrong tool_name → no marker"
  pass=$((pass + 1))
else
  red "  ✗ marker created on wrong tool_name"
  fail=$((fail + 1))
fi

echo
echo "── session-start.sh stale marker cleanup ──"

# Helper: write a marker with a specific granted_at timestamp.
# NB: record-sandbox-approval.sh writes a LOCAL-time string with a Z suffix
# (the Z is literal, not real UTC). check-sandbox-bypass.sh and the
# session-start cleanup parse it as local time. Tests must mirror that.
write_marker_at() {
  local ts="$1"
  printf 'granted_at: %s\nquestion_text: test\n' "$ts" > "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
}

# Stale marker (>60s old) → removed, cleanup logged.
rm -f "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log"
write_marker_at "$(date -v-2M '+%Y-%m-%dT%H:%M:%SZ')"
"$HOOK_SESSION_START" > /dev/null 2>&1 || true
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ stale marker removed"
  pass=$((pass + 1))
else
  red "  ✗ stale marker not removed"
  fail=$((fail + 1))
fi
if grep -q 'session-start-cleanup.*ttl_expired' "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log" 2>/dev/null; then
  green "  ✓ stale cleanup logged with reason=ttl_expired"
  pass=$((pass + 1))
else
  red "  ✗ stale cleanup not logged"
  fail=$((fail + 1))
fi

# Fresh marker (just now) → preserved.
rm -f "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log"
write_marker_at "$(date '+%Y-%m-%dT%H:%M:%SZ')"
"$HOOK_SESSION_START" > /dev/null 2>&1 || true
if [ -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ fresh marker preserved"
  pass=$((pass + 1))
else
  red "  ✗ fresh marker removed (false-positive cleanup)"
  fail=$((fail + 1))
fi

echo
echo "── session-start.sh adaptive memory injection ──"

# Setup: clean memory dir under the sandbox test dir.
mkdir -p "$SANDBOX_TEST_DIR/memory"
rm -f "$SANDBOX_TEST_DIR/memory"/*.md
# Use a small threshold so we don't have to generate 8 KB in tests.
export MEMORY_INLINE_THRESHOLD_BYTES=200

# Below threshold → full content inlined.
echo "secret canary phrase below threshold" > "$SANDBOX_TEST_DIR/memory/MEMORY.md"
echo "tiny memory" > "$SANDBOX_TEST_DIR/memory/foo.md"
out=$("$HOOK_SESSION_START" 2>&1 || true)
if printf '%s' "$out" | grep -q "## Memories (full content)" \
   && printf '%s' "$out" | grep -q "secret canary phrase below threshold" \
   && printf '%s' "$out" | grep -q "tiny memory"; then
  green "  ✓ below threshold → full inline (all files visible)"
  pass=$((pass + 1))
else
  red "  ✗ below threshold did not inline all memories"
  fail=$((fail + 1))
fi

# Above threshold → MEMORY.md only, other files NOT inlined.
printf 'index hook line\n' > "$SANDBOX_TEST_DIR/memory/MEMORY.md"
# Fill another file with >200 bytes of content under a unique marker.
{ printf 'MARKER-large-memory-content\n'; head -c 400 < /dev/zero | tr '\0' 'x'; } \
  > "$SANDBOX_TEST_DIR/memory/big.md"
out=$("$HOOK_SESSION_START" 2>&1 || true)
if printf '%s' "$out" | grep -q "## Memories — index only" \
   && printf '%s' "$out" | grep -q "index hook line" \
   && ! printf '%s' "$out" | grep -q "MARKER-large-memory-content"; then
  green "  ✓ above threshold → MEMORY.md only, big.md not inlined"
  pass=$((pass + 1))
else
  red "  ✗ above-threshold mode did not behave as expected"
  fail=$((fail + 1))
fi

unset MEMORY_INLINE_THRESHOLD_BYTES
rm -rf "$SANDBOX_TEST_DIR/memory"

# Malformed marker (no granted_at) → removed, reason logged.
rm -f "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log"
echo "garbage with no timestamp" > "$SANDBOX_TEST_DIR/.sandbox-bypass.marker"
"$HOOK_SESSION_START" > /dev/null 2>&1 || true
if [ ! -f "$SANDBOX_TEST_DIR/.sandbox-bypass.marker" ]; then
  green "  ✓ malformed marker removed"
  pass=$((pass + 1))
else
  red "  ✗ malformed marker kept"
  fail=$((fail + 1))
fi
if grep -q 'session-start-cleanup.*unparseable_or_missing_granted_at' "$SANDBOX_TEST_DIR/docs/sandbox-bypass.log" 2>/dev/null; then
  green "  ✓ malformed cleanup logged"
  pass=$((pass + 1))
else
  red "  ✗ malformed cleanup not logged"
  fail=$((fail + 1))
fi

echo
echo "── stop-session-summary.sh ──"

mkdir -p "$SANDBOX_TEST_DIR/docs/sessions"
rm -f "$SANDBOX_TEST_DIR/docs/sessions"/*.md

# No summary today → block (exit 2) with stderr reminder.
out=$(printf '{"stop_hook_active":false}' | "$HOOK_STOP_SUMMARY" 2>&1 >/dev/null)
rc=$?
if [ "$rc" -eq 2 ] && printf '%s' "$out" | grep -q "SESSION SUMMARY MISSING"; then
  green "  ✓ no summary → block + reminder"
  pass=$((pass + 1))
else
  red "  ✗ expected block (exit 2) + reminder, got rc=$rc"
  fail=$((fail + 1))
fi

# Today's summary exists → allow silently.
today=$(date '+%Y-%m-%d')
touch "$SANDBOX_TEST_DIR/docs/sessions/${today}-1200.md"
out=$(printf '{"stop_hook_active":false}' | "$HOOK_STOP_SUMMARY" 2>&1 >/dev/null)
rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then
  green "  ✓ today's summary exists → silent allow"
  pass=$((pass + 1))
else
  red "  ✗ expected silent exit 0, got rc=$rc, output=$out"
  fail=$((fail + 1))
fi
rm -f "$SANDBOX_TEST_DIR/docs/sessions/${today}-1200.md"

# stop_hook_active=true → allow even without summary (loop guard).
out=$(printf '{"stop_hook_active":true}' | "$HOOK_STOP_SUMMARY" 2>&1 >/dev/null)
rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then
  green "  ✓ stop_hook_active=true → loop guard allows stop"
  pass=$((pass + 1))
else
  red "  ✗ loop guard failed, rc=$rc, output=$out"
  fail=$((fail + 1))
fi

# SESSION_SUMMARY_SKIP=1 escape hatch → silent allow.
out=$(SESSION_SUMMARY_SKIP=1 printf '{"stop_hook_active":false}' | SESSION_SUMMARY_SKIP=1 "$HOOK_STOP_SUMMARY" 2>&1 >/dev/null)
rc=$?
if [ "$rc" -eq 0 ] && [ -z "$out" ]; then
  green "  ✓ SESSION_SUMMARY_SKIP=1 → silent allow"
  pass=$((pass + 1))
else
  red "  ✗ escape hatch failed, rc=$rc"
  fail=$((fail + 1))
fi

echo
echo "── session-start.sh previous summary injection ──"

mkdir -p "$SANDBOX_TEST_DIR/docs/sessions"
rm -f "$SANDBOX_TEST_DIR/docs/sessions"/*.md
# Older + newer summaries — newer should be injected.
printf '# Older session\nOLDER-MARKER\n' > "$SANDBOX_TEST_DIR/docs/sessions/2026-01-15-0900.md"
printf '# Newer session\nNEWER-MARKER\n' > "$SANDBOX_TEST_DIR/docs/sessions/2026-01-15-1700.md"
# README.md must NOT be picked even though it's in the same folder.
printf '# Sessions README\nREADME-MARKER\n' > "$SANDBOX_TEST_DIR/docs/sessions/README.md"

out=$("$HOOK_SESSION_START" 2>&1 || true)
if printf '%s' "$out" | grep -q "Previous Session Summary" \
   && printf '%s' "$out" | grep -q "2026-01-15-1700.md" \
   && printf '%s' "$out" | grep -q "NEWER-MARKER" \
   && ! printf '%s' "$out" | grep -q "OLDER-MARKER" \
   && ! printf '%s' "$out" | grep -q "README-MARKER"; then
  green "  ✓ newest dated summary injected (README + older ignored)"
  pass=$((pass + 1))
else
  red "  ✗ summary injection did not behave as expected"
  fail=$((fail + 1))
fi

# No summaries at all → no "Previous Session Summary" block.
rm -f "$SANDBOX_TEST_DIR/docs/sessions"/*.md
out=$("$HOOK_SESSION_START" 2>&1 || true)
if ! printf '%s' "$out" | grep -q "Previous Session Summary"; then
  green "  ✓ no summaries → block omitted"
  pass=$((pass + 1))
else
  red "  ✗ summary block emitted with no summaries present"
  fail=$((fail + 1))
fi

rm -rf "$SANDBOX_TEST_DIR/docs/sessions"

echo
total=$((pass + fail))
if [ "$fail" -eq 0 ]; then
  green "$pass/$total passed"
  exit 0
else
  red "$fail/$total failed"
  for n in "${failed_names[@]}"; do red "  - $n"; done
  exit 1
fi
