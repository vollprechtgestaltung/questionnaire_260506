Prüfe den aktuellen Code auf Konformität mit dem Schweizer DSG und der
EU-DSGVO. **Erst `docs/privacy.md` und `docs/loeschkonzept.md` lesen**
(die enthalten die projekt-spezifischen Regeln), dann den Code prüfen.

## Mechanische Vor-Checks

```bash
# 1) Personenbezogene Daten als Pattern (Mail, deutsche Tel-Nummer, IBAN)
grep -rInE \
  '[A-Za-z0-9._%+-]+@(?!example\.|test\.)[A-Za-z0-9.-]+\.[A-Z]{2,}|\+?49[0-9 /-]{8,}|\+?41[0-9 /-]{8,}|DE[0-9]{20}|CH[0-9]{19}' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
  --include='*.md' --include='*.html' --include='*.css' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . 2>/dev/null

# 2) Klassische Real-Name-Test-Daten
grep -rInE '(max\.mustermann|john\.doe|john\.smith|jane\.doe)' \
  --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null \
  | grep -viE '(example|test|fixture|fake)' || true
```

Treffer kurz auflisten, dann manuell prüfen ob legitim
(Test-Fixture mit `@example.com` ist okay).

## Manueller Code-Review

Pro Treffer-Datei + per Augenmaß im aktuellen Diff:

1. **Personenbezogene Daten** — echte Namen, Mails, Tel, Adressen in
   Code, Tests, Logs, Commits, Kommentaren? Anonymisierte Daten:
   `max.mustermann@example.com`, nicht Real-Adressen.
2. **Datenminimierung (Art. 6 DSG / Art. 5 DSGVO)** — werden nur
   minimal nötige Daten erhoben/gespeichert?
3. **Privacy by Default (Art. 7 DSG)** — datenschutzfreundlichste
   Einstellung als Standard? Opt-in statt Opt-out?
4. **Drittland-Transfer (Art. 16/17 DSG)** — externe Services im Spiel
   (Analytics, Mail-Provider, CDN, AI-APIs)? SCC/DPA vorhanden? In
   `docs/decisions.md` dokumentiert?
5. **Aufbewahrung** — passt zu `docs/loeschkonzept.md`? Werden Daten
   länger gespeichert als nötig?
6. **Logging** — landen personenbezogene Daten in Logs, Fehler-Reports,
   Sentry, Console?

## Bericht

- **Findings** — was gefunden wurde (Datei:Zeile)
- **Risikobewertung** — hoch / mittel / niedrig pro Finding
- **Empfehlung** — konkrete Aktion, keine Floskeln

Bei jedem hoch-Finding: stopp, beim User rückfragen statt eigenmächtig
patchen.
