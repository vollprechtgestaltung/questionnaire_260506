#!/usr/bin/env bash
# SessionStart hook: inject current project state into the session.
#
# - Inlines ALL memory files (full content) so they are immediately available.
# - Lists docs/* with a one-line summary so Claude can read by relevance.
# - Extracts open TODOs from docs/todos.md.
# - Shows git status + recent commits.
# - Warns if CLAUDE.md "Project Context" still has empty/placeholder fields.

set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# --- Stale sandbox-bypass marker cleanup ---
# A leftover marker should never outlive its 60s TTL. check-sandbox-bypass.sh
# only cleans up on the next bypass attempt, which may never come. Removing
# stale markers at session start keeps the state self-explanatory: if a
# marker exists, it is fresh and meaningful.
# Logs the cleanup to docs/sandbox-bypass.log for audit trail; silent in
# the session injection to avoid noise.
if [ -f .sandbox-bypass.marker ]; then
  # `|| true` so a malformed marker (no granted_at: line) doesn't kill
  # the script under `set -euo pipefail`.
  granted_at=$(grep -m1 '^granted_at:' .sandbox-bypass.marker 2>/dev/null | sed 's/^granted_at:[[:space:]]*//' || true)
  granted_epoch=0
  if [ -n "$granted_at" ]; then
    granted_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$granted_at" "+%s" 2>/dev/null || echo 0)
  fi
  now_epoch=$(date "+%s")
  age=$((now_epoch - granted_epoch))
  if [ "$granted_epoch" -eq 0 ] || [ "$age" -lt 0 ] || [ "$age" -gt 60 ]; then
    rm -f .sandbox-bypass.marker
    mkdir -p docs
    printf '%s | session-start-cleanup | age=%ss | reason=%s\n' \
      "$(date '+%Y-%m-%dT%H:%M:%SZ')" \
      "$age" \
      "$([ "$granted_epoch" -eq 0 ] && echo "unparseable_or_missing_granted_at" || echo "ttl_expired")" \
      >> docs/sandbox-bypass.log
  fi
fi

echo "# Project State (auto-loaded at session start)"
echo
echo "Source of truth for memories, todos and decisions. Use this to bring"
echo "yourself up to date before answering. Read docs/* on demand based on"
echo "the listed summaries."
echo

# --- Fresh-template-duplicate detection ---
# Designed for the Finder-duplicate workflow: user duplicates the template
# folder, renames it, opens it in Claude Desktop. Hook then surfaces a
# loud BOOTSTRAP-REQUIRED warning so Claude can drive /project:bootstrap
# before any other work happens.
project_basename=$(basename "$(pwd)")
if [[ "$project_basename" == _template-base-* ]]; then
  : # this is the template source itself, never warn
elif [ -f .template-version ]; then
  : # already bootstrapped, normal session
elif [ -d .git ] && git log --oneline 2>/dev/null | grep -qiE "bootstrap.*from template v[0-9]"; then
  echo "## NOTE: bootstrap committed but .template-version not visible"
  echo
  echo "Sieht nach Dropbox-Sync-Verzögerung aus. Eine Minute warten und"
  echo "neu öffnen. Falls dauerhaft: \`python3 bin/template-update.py --init\`"
  echo "manuell mit korrektem \`--source\` ausführen."
  echo
else
  echo "## FRESH TEMPLATE DUPLICATE — BOOTSTRAP REQUIRED"
  echo
  echo "Dieses Projekt sieht aus wie eine frische Duplizierung des Templates,"
  echo "wurde aber noch nicht initialisiert. Es fehlt:"
  echo
  echo "  - .template-version       Versions-Anker fehlt → Update-Pfad tot"
  echo "  - .template-baseline/     Drift-Erkennung gegen Template tot"
  echo "  - sauberer Git-Stand      Template-Historie noch drin (Push-Risiko)"
  echo "  - projekt-spezifischer Inhalt in CLAUDE.md, README.md, package.json"
  echo "  - Pre-Commit aktiv        core.hooksPath nicht gesetzt"
  echo
  echo "**Pflicht vor jeder anderen Arbeit:**"
  echo
  echo "1. Den User höflich darauf hinweisen, dass das Projekt neu wirkt."
  echo "2. Fragen, ob initialisiert werden soll."
  echo "3. Bei Ja: dem Slash-Command \`/project:bootstrap\` folgen"
  echo "   (Anleitung in \`.claude/commands/bootstrap.md\`)."
  echo
  echo "Niemals andere Anfragen beantworten oder Files editieren, bevor"
  echo "Bootstrap durch ist — sonst entstehen Commits auf der Template-"
  echo "Git-Historie und CLAUDE.md bleibt voll mit Template-Meta-Inhalt."
  echo
fi

# --- Memories: adaptive injection ---
# Below threshold: inline full content (fast, no per-file Read call).
# Above threshold: inject only memory/MEMORY.md (the curated index) and
# instruct Claude to Read individual files on demand. Keeps long sessions
# cheap without losing the at-startup discoverability of all memories.
MEMORY_INLINE_THRESHOLD_BYTES=${MEMORY_INLINE_THRESHOLD_BYTES:-8192}
if [ -d memory ] && compgen -G "memory/*.md" > /dev/null; then
  total_bytes=$(cat memory/*.md 2>/dev/null | wc -c | tr -d ' ')
  if [ "${total_bytes:-0}" -le "$MEMORY_INLINE_THRESHOLD_BYTES" ]; then
    echo "## Memories (full content)"
    echo
    for f in memory/*.md; do
      echo "### $f"
      echo
      sed 's/^/    /' "$f"
      echo
    done
  else
    echo "## Memories — index only (memory/ = ${total_bytes} B > ${MEMORY_INLINE_THRESHOLD_BYTES} B threshold)"
    echo
    echo "Below is \`memory/MEMORY.md\` — the curated index. Read individual"
    echo "memory files via the Read tool when their hook matches the request."
    echo
    if [ -f memory/MEMORY.md ]; then
      sed 's/^/    /' memory/MEMORY.md
    else
      echo "    (memory/MEMORY.md missing — add an index file)"
    fi
    echo
  fi
fi

# --- Previous session summary (most recent file in docs/sessions/) ---
# Picks the lexicographically largest file matching YYYY-MM-DD-HHMM.md.
# The YYYY-MM-DD-HHMM naming convention makes lex order == chronological.
# README.md and any non-dated file are ignored.
if [ -d docs/sessions ]; then
  latest_summary=$(ls -1 docs/sessions 2>/dev/null \
    | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}\.md$' \
    | sort -r | head -1 || true)
  if [ -n "$latest_summary" ]; then
    echo "## Previous Session Summary (\`docs/sessions/${latest_summary}\`)"
    echo
    echo "Letzter Session-Stand. Vor neuer Arbeit kurz scannen, dann passend"
    echo "anknüpfen. Ältere Summaries on demand öffnen."
    echo
    sed 's/^/    /' "docs/sessions/${latest_summary}"
    echo
  fi
fi

# --- Docs: list with "When to read:" trigger as summary ---
# Each docs/*.md should declare its read-trigger as a blockquote line
# directly after the H1:
#
#     # Title
#
#     > When to read: <kurzer Trigger-Satz>
#
# The hook extracts that line so Claude knows when to open the file.
# Files without the line fall back to the H1 and emit a warning.
if [ -d docs ] && compgen -G "docs/*.md" > /dev/null; then
  echo "## Documentation (read on the listed trigger)"
  echo
  missing_trigger=""
  for f in docs/*.md; do
    trigger=$(awk '
      /^> When to read:/ {
        sub(/^> When to read:[[:space:]]*/, "")
        buf = $0
        getline line
        while (line ~ /^>[[:space:]]/) {
          sub(/^>[[:space:]]*/, "", line)
          buf = buf " " line
          if ((getline line) <= 0) break
        }
        print buf
        exit
      }
    ' "$f" 2>/dev/null)
    if [ -n "$trigger" ]; then
      echo "- \`$f\` — $trigger"
    else
      heading=$(grep -m1 -E '^# ' "$f" 2>/dev/null | sed -E 's/^#+[[:space:]]*//' || true)
      echo "- \`$f\` — ${heading:-(no heading)} ⚠ no \`> When to read:\` line"
      missing_trigger="${missing_trigger}${f} "
    fi
  done
  echo
  if [ -n "$missing_trigger" ]; then
    echo "> Hinweis: Docs ohne \`> When to read:\`-Zeile geben Claude keinen"
    echo "> klaren Lese-Anlass. Konvention nachpflegen in: $missing_trigger"
    echo
  fi
fi

# --- Persistent open todos ---
if [ -f docs/todos.md ]; then
  open_todos=$(awk '
    /^## Offen/         {flag=1; next}
    /^## /              {flag=0}
    flag && /^- \[ \]/  {print}
  ' docs/todos.md)
  if [ -n "$open_todos" ]; then
    echo "## Open TODOs (docs/todos.md → Offen)"
    echo
    printf '%s\n' "$open_todos"
    echo
  fi
fi

# --- Git status ---
echo "## Git"
echo
echo '```'
git status -sb 2>/dev/null | head -20 || echo "(not a git repo)"
echo
echo "Recent commits:"
git --no-pager log --oneline -5 2>/dev/null || true
echo '```'
echo

# --- Tech-stack completeness check ---
if [ ! -f docs/stack.md ]; then
  echo "## WARNUNG: docs/stack.md fehlt"
  echo
  echo "Kein verbindlicher Tech-Stack hinterlegt. Vor jedem Code-Artefakt"
  echo "(neue Datei, Scaffold, Refactor) muss der Stack mit dem User"
  echo "abgestimmt und in docs/stack.md festgehalten werden."
  echo
  echo "Siehe CLAUDE.md → 'Before Writing Code (mandatory gate)'."
  echo
else
  stack_missing=$(awk '
    /^## Entscheidungen/ {flag=1; next}
    /^## /              {flag=0}
    flag && /^- \*\*[^*]+:\*\*/ {
      val = $0
      sub(/^- \*\*[^*]+:\*\*[[:space:]]*/, "", val)
      sub(/[[:space:]]*<!--.*-->[[:space:]]*$/, "", val)
      field = $0
      sub(/^- \*\*/, "", field); sub(/:\*\*.*$/, "", field)
      if (val == "" || val == "?" || val ~ /\?[[:space:]]*$/) print "  - " field
    }
  ' docs/stack.md)
  if [ -n "$stack_missing" ]; then
    echo "## WARNUNG: Tech-Stack unvollständig"
    echo
    echo "Folgende Felder in docs/stack.md sind noch offen (leer oder '?'):"
    echo
    printf '%s\n' "$stack_missing"
    echo
    echo "Vor dem Erzeugen oder Editieren von Source-Files: Stack mit dem"
    echo "User klären, Senior-Default vorschlagen, Entscheidung in"
    echo "docs/stack.md eintragen. Siehe CLAUDE.md → 'Before Writing Code'."
    echo
  fi
fi

# --- Project Context completeness check ---
if [ -f CLAUDE.md ]; then
  missing=$(awk '
    /^## Project Context/ {flag=1; next}
    /^## /                {flag=0}
    flag && /^- \*\*[A-Z][^*]*:\*\*/ {
      val = $0
      sub(/^- \*\*[^*]*:\*\*[[:space:]]*/, "", val)
      field = $0
      sub(/^- \*\*/, "", field); sub(/:\*\*.*$/, "", field)
      if (val == "" || val ~ /\?[[:space:]]*$/) print "  - " field
    }
  ' CLAUDE.md)
  if [ -n "$missing" ]; then
    echo "## WARNUNG: Project Context unvollständig"
    echo
    echo "Folgende Felder in CLAUDE.md → ## Project Context sind leer oder"
    echo "enthalten noch eine Platzhalter-Frage:"
    echo
    printf '%s\n' "$missing"
    echo
    echo "Beim User nachfragen, bevor inhaltliche Arbeit beginnt."
    echo
  fi
fi
