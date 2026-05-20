# Pre-Commit

Opt-in pre-commit hook in `pre-commit`. Per Projekt aktivieren:

```bash
git config core.hooksPath .githooks
```

## Was geprüft wird (stack-agnostisch)

- blockt staged `.env` / Secret-Files
- blockt Files > 5 MB (vermutlich Versehen — git-lfs explizit nutzen)
- greppt staged Diff auf offensichtliche Secret-Pattern (private keys,
  `sk-...` Tokens, `api_key = "..."`) — Heuristik, kein echter Scanner
- ruft `npm run lint`, `npm run format:check`, `npm run typecheck` wenn
  diese Scripts in `package.json` definiert sind

## Hook-Tests

Wenn `.claude/hooks/*` oder `tests/hooks.sh` geändert wurde, läuft
zusätzlich `bash tests/hooks.sh` automatisch. **Bei jeder Hook-Änderung:
Tests anpassen, nicht abschalten.**

Wenn ein realer Stack gewählt ist, Pre-Commit entsprechend erweitern
oder ersetzen. CI ([`.github/workflows/README.md`](../.github/workflows/README.md))
nutzt dieselben Checks.
