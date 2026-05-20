# Datenschutz (DSG / DSGVO)

> When to read: bei Arbeit an Datenmodell, Logging, Auth, externen APIs,
> Formularen, Cookies, Analytics — überall wo personenbezogene Daten
> entstehen, gespeichert oder übertragen werden könnten.

Verbindliche Regeln für den Umgang mit personenbezogenen Daten in
diesem Projekt. Wird von CLAUDE.md referenziert; vollständiger Inhalt
hier statt im Always-On-Kontext, um Context-Budget zu sparen.

Ergänzend: `docs/loeschkonzept.md` (Aufbewahrungs- und Löschfristen).

## EU-DSGVO

- Keine echten personenbezogenen Daten (Namen, E-Mail, Adressen,
  Telefonnummern) in Code, Tests, Fixtures, Logs, Commit-Messages
  oder Prompts.
- Nur anonymisierte oder fiktive Testdaten verwenden
  (`max.mustermann@example.com`, nicht Real-Adressen).
- Änderungen an datenschutzrelevanten Files protokollieren
  (Commit + ggf. `docs/decisions.md`).
- **Wichtig:** CLAUDE.md-Regeln sind organisatorisch, nicht technisch
  durchgesetzt. Daten, die im Prompt landen, gehen an Anthropic —
  unabhängig davon, was im Code steht. Verantwortung liegt beim
  Eintippenden.
- Anthropic DPA: <https://console.anthropic.com/legal>
- Anthropic GDPR: <https://support.anthropic.com/en/articles/7996881-what-is-your-approach-to-gdpr-or-related-issues>

## Schweizer DSG

- **Privacy by Design:** Datenschutz von Beginn der Entwicklung
  mitdenken (Datenmodell, Logs, Drittsystem-Anbindung).
- **Privacy by Default:** datenschutzfreundlichste Einstellung als
  Standard (Opt-in statt Opt-out, minimale Datenerhebung).
- **Datentransfer:** Anthropic ist US-Anbieter und nicht unter dem
  EU-US- bzw. Swiss-US-Data-Privacy-Framework zertifiziert.
  Übermittlung erfolgt über Standardvertragsklauseln (SCC) gemäss
  Art. 16/17 DSG. Vor produktivem Einsatz: Anthropic-DPA prüfen,
  ob der konkrete Use-Case abgedeckt ist.
- **Persönliche Verantwortung:** Das Schweizer DSG kennt
  Bussen gegen natürliche Personen — der Schutz, den Firmen­
  konstrukte unter der DSGVO bieten, greift nicht automatisch.

## Operative Konsequenzen

- Memories in `./memory/` werden via Git geteilt → keine
  personenbezogenen Daten dort ablegen.
- `docs/todos.md`, `docs/decisions.md`: ebenso git-versioniert,
  ebenso datenschutzrein halten.
- Bei Verdacht auf versehentlich eingecheckte personenbezogene Daten:
  Commit-Historie bereinigen (`git filter-repo`), nicht nur den
  aktuellen Stand korrigieren.
