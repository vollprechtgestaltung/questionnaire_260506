Aktualisiere dieses Projekt auf den neuesten Stand des Templates
(`_claude-tmpl-base`). Erst dry-run, dann auf Wunsch des Users `--apply`.

## Ablauf

1. **Vor-Checks (mechanisch):**
   ```bash
   # ist das überhaupt ein vom Template instanziiertes Projekt?
   test -f .template-version && echo "ok" || echo "FEHLT: .template-version — Bootstrap fehlt"
   test -d .template-baseline && echo "ok" || echo "FEHLT: .template-baseline/ — Bootstrap fehlt"

   # Template-Quelle erreichbar?
   bash -c 'source=$(grep "^source:" .template-version | sed "s/^source: //"); test -d "$source" && echo "source ok: $source" || echo "source FEHLT"'
   ```

2. **Dry-run** zur Übersicht, was sich ändern würde:
   ```bash
   python3 bin/template-update.py --check
   ```

   Output dem User vorlegen mit knapper Zusammenfassung:
   - „X Dateien identisch"
   - „Y Dateien vom User modifiziert (werden nicht angetastet)"
   - „Z Dateien Template-Update (würden auto-übernommen)"
   - „N Dateien divergent (manuelle Entscheidung nötig)"

3. **Bei divergenten Files (`! pfad   diverges`):** dem User diese
   Files einzeln nennen, bevor `--apply` läuft. Bei jedem ist später
   eine y/n-Entscheidung nötig.

4. **Apply nur nach User-Bestätigung:**
   ```bash
   python3 bin/template-update.py --apply
   ```

   Bei divergenten Files prompted das Script interaktiv
   (`[d]iff / [a]dopt / [k]eep / [s]kip`).

5. **Nach Apply:**
   - `.template-version` zeigt neue Version + `adopted_at:` heute.
   - `bash tests/hooks.sh` ausführen → muss grün bleiben.
   - Diff zeigen: `git diff --stat` damit User sieht, was sich geändert hat.
   - Vorschlagen: `git commit -m "chore: bump template to vX.Y.Z"`.

## Grundregeln

- Niemals `--apply` ohne explizite User-Zustimmung.
- Wenn `.template-baseline/` oder `.template-version` fehlt: zuerst
  `python3 bin/template-update.py --init --source <pfad>` vorschlagen
  (Bootstrap), nicht direkt apply.
- Wenn Hook-Tests nach Apply rot werden: stoppen, dem User melden,
  nicht selbst „fixen".
