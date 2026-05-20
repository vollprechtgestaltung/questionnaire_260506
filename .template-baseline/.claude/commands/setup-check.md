Prüfe, ob das Template-Setup vollständig und intakt ist. **Nicht raten —
prüfe die Dateien tatsächlich.** Erst lesen (`Read`/`ls`/`bash`), dann
berichten.

## Auto-Checks (mechanisch)

Führe folgende Bash-Schritte aus und übernimm das Ergebnis:

```bash
# 1) Pflicht-Files vorhanden?
for f in CLAUDE.md README.md .gitignore .claude/settings.json \
         .claude/hooks/session-start.sh .claude/hooks/block-external-memory.sh \
         .claude/hooks/block-destructive-bash.sh .githooks/pre-commit \
         tests/hooks.sh docs/stack.md docs/decisions.md docs/privacy.md \
         docs/persistence.md docs/loeschkonzept.md docs/todos.md \
         memory/MEMORY.md .github/workflows/check.yml; do
  [ -f "$f" ] && echo "ok   $f" || echo "MISS $f"
done

# 2) Hooks executable?
for f in .claude/hooks/*.sh .githooks/* tests/hooks.sh; do
  [ -x "$f" ] && echo "ok   exec $f" || echo "FAIL exec $f (chmod +x)"
done

# 3) settings.json valid?
python3 -m json.tool .claude/settings.json > /dev/null && echo "ok   settings.json valid" || echo "FAIL settings.json invalid"

# 4) > When to read: Konvention in docs/
for f in docs/*.md; do
  grep -q '^> When to read:' "$f" && echo "ok   trigger $f" || echo "MISS trigger $f"
done

# 5) Hook-Tests grün?
bash tests/hooks.sh > /dev/null 2>&1 && echo "ok   hook tests" || echo "FAIL hook tests"

# 6) Pre-Commit aktiviert?
[ "$(git config core.hooksPath)" = ".githooks" ] && echo "ok   pre-commit active" || echo "WARN pre-commit not active (git config core.hooksPath .githooks)"
```

## Inhalts-Checks (Augenmaß)

- `CLAUDE.md` → `## Project Context`: alle Felder ausgefüllt (kein
  Platzhalter-`?`)?
- `docs/stack.md` → Pflichtfelder gesetzt (kein `?`)? Conditional-Felder
  entweder gesetzt oder mit `n/a` markiert?
- `.gitignore` → enthält `.env`, `.claude/settings.local.json`,
  `node_modules/`?
- `memory/` → mindestens `template_baseline.md` vorhanden, in
  `MEMORY.md` verlinkt?

## Bericht

Knapp gehalten, drei Buckets:

- **OK** — was funktioniert (eine Zeile pro Item)
- **FEHLT** — was angelegt/befüllt werden muss
- **WARNUNG** — was funktioniert, aber suboptimal ist
