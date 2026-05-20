Führe ein Security-Audit des aktuellen Projekts durch. **Erst die echten
Files prüfen, dann berichten.** Nicht aus dem Gedächtnis raten.

## Mechanische Vor-Checks

```bash
# 1) Secret-Pattern im gesamten Tree (gleiche Heuristik wie CI + Pre-Commit)
grep -rInE \
  '(aws_secret_access_key|api[_-]?key[[:space:]]*[:=][[:space:]]*["'\''][A-Za-z0-9_-]{20,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[a-zA-Z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{20,})' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --include='*.json' --include='*.yml' --include='*.yaml' --include='*.md' \
  --include='*.sh' --include='*.py' --include='*.env*' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=build --exclude-dir=coverage . 2>/dev/null

# 2) .env-Files getrackt?
git ls-files 2>/dev/null | grep -E '(^|/)\.env(\..+)?$' | grep -v '\.example$' || echo "(none)"

# 3) Dependency-Audit (falls Node-Projekt)
[ -f package.json ] && npm audit --omit=dev 2>&1 | tail -20 || true

# 4) Sandbox + Hooks aktiv?
python3 -c "
import json
s = json.load(open('.claude/settings.json'))
print('sandbox.enabled       =', s.get('sandbox', {}).get('enabled'))
print('sandbox.allowedDomains=', s.get('sandbox', {}).get('network', {}).get('allowedDomains'))
print('hooks.PreToolUse      =', len(s.get('hooks', {}).get('PreToolUse', [])), 'matcher(s)')
"

# 5) Hook-Tests grün?
bash tests/hooks.sh > /dev/null 2>&1 && echo "ok   hook tests" || echo "FAIL hook tests — security hooks may be broken"
```

## Manueller Review pro Bereich

1. **Secrets & Credentials** — alle Pattern-Treffer einzeln prüfen.
   False-Positives in Test-Fixtures akzeptabel, ansonsten KRITISCH.
2. **Dependencies** — `npm audit` Output: bekannte CVEs in Production-
   Deps? Unbenutzte Packages?
3. **Input-Validierung** — wird User-Input vor Verwendung validiert?
   SQL-/Command-Injection, XSS möglich? API-Responses validiert?
4. **Sandbox & Permissions** — `allowedDomains` minimal? Schreibrechte
   außerhalb des Projekts? Deny-Liste passend?
5. **Hooks-Integrität** — `block-destructive-bash.sh` und
   `block-external-memory.sh` unverändert / via `tests/hooks.sh` grün?
6. **Konfiguration** — Debug-Modi aus für Produktion? CORS, HTTPS,
   CSP-Header gesetzt (falls Web)?

## Bericht

- **KRITISCH** — sofort beheben oder rollback
- **WARNUNG** — sollte vor Merge behoben werden
- **INFO** — Verbesserungsempfehlung

Bei jedem KRITISCH-Finding: stopp, beim User rückfragen statt
selbstständig zu „fixen", da Sicherheits-Fixes oft Folgewirkungen haben.
