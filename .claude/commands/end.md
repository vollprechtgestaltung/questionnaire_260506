Schliesse die aktuelle Session sauber ab — schreibe einen Summary nach
`docs/sessions/YYYY-MM-DD-HHMM.md` (lokale Zeit, ermitteln mit
`date '+%Y-%m-%d-%H%M'`), zeige ihn dem User zur Korrektur, dann
beende. Format-Spec in `docs/sessions/README.md`.

## Schritte

1. **Bestandsaufnahme** — knapp im Kopf:
   - Welche Files wurden geaendert? (`git status`, `git diff --stat`)
   - Welche Entscheidungen wurden mit dem User getroffen?
   - Was wurde verworfen, was offen vertagt?

2. **Summary schreiben** nach Format aus `docs/sessions/README.md`.
   Kurz halten — eine A4-Seite ist viel. Pflicht-Sektionen:
   `## Kontext`, `## Was passiert ist`, `## Entscheidungen`,
   `## Offene Punkte`. Optional `## Notizen`.

   Pflicht-Frontmatter direkt nach H1:
   ```markdown
   > When to read: <ein Satz, wann diese Session fuer eine spaetere relevant wird>
   ```

3. **DSG-Check vor dem Speichern** (`docs/sessions/` ist git-getrackt):
   - Keine Klarnamen — fiktive Namen oder Rollen verwenden
     ("Kunde A", "der PM", "Projektleitung")
   - Keine echten Tokens, API-Keys, Passwoerter, internen URLs
   - Keine sensiblen Geschaefts-Internals (Vertraege, Honorare,
     laufende Verhandlungen)
   - Im Zweifel: abstrahieren oder weglassen

4. **Verdichten pruefen** — ist in dieser Session etwas entstanden,
   das nach `docs/decisions.md` (dauerhafte Entscheidung) oder
   `docs/todos.md` (mehrfach vertagtes TODO) gehoben werden sollte?
   Falls ja: kurz benennen und mit dem User abstimmen, **bevor**
   verschoben wird.

5. **Dem User zeigen** — Pfad + Inhalt anzeigen, **bevor** die Session
   tatsaechlich endet. Gibt ihm die Chance, Korrekturen anzubringen
   oder dich auf vergessene Punkte hinzuweisen.

6. **Stop-Hook wird still** — sobald `docs/sessions/YYYY-MM-DD*.md`
   fuer heute existiert, laesst der Stop-Hook beim naechsten Stop
   durchlaufen. Kein zusaetzlicher Schritt noetig.

## Triviale Session

Falls wirklich nichts substantielles passiert ist (z.B. nur eine
Frage beantwortet, kein File angefasst, keine Entscheidung): mit
dem User abklaeren, ob uebersprungen werden soll. Falls ja: 2-Zeilen-
Stub schreiben (Datum, "trivial — nur Q&A, kein Diff"), damit der
Stop-Hook still wird, ohne das Archiv aufzublehen.

## Mehrere Summaries pro Tag

Erlaubt und gewollt, wenn ein klarer Themenwechsel passiert
(z.B. vormittags Feature X, nachmittags Bugfix Y). Jeder bekommt
seine eigene Uhrzeit im Namen. Der SessionStart-Hook injiziert
immer den juengsten.
