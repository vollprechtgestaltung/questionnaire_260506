# Session Summaries

> When to read: am Anfang jeder Session liest der SessionStart-Hook den
> jüngsten Summary automatisch mit ein. Manuell öffnen, wenn ein
> spezifischer früherer Stand interessiert.

Jede produktive Session hinterlässt einen Summary in diesem Ordner.
Der SessionStart-Hook injiziert den jüngsten Summary in den Kontext;
der Stop-Hook erinnert Claude vor Session-Ende, einen zu schreiben.

## Konvention

- **Pfad:** `docs/sessions/YYYY-MM-DD-HHMM.md` (lokale Zeit, 24 h)
- **Mehrere Sessions pro Tag:** mehrere Files mit unterschiedlicher Uhrzeit
- **Git-getrackt:** Summaries gehören zum Projekt-Verlauf

## Pflicht-Inhalt

Kurz halten — der Summary ist ein Anker für die nächste Session, kein
Protokoll. Eine A4-Seite ist viel.

```markdown
# Session YYYY-MM-DD HH:MM

> When to read: <ein Satz, wann diese Session für eine spätere relevant wird>

## Kontext
Worum ging es? Welcher Trigger / welche User-Anfrage?

## Was passiert ist
- Konkrete Änderungen (Files, Hooks, Configs) — Stichpunkte reichen
- Verworfene Wege + warum

## Entscheidungen
- Was wurde festgelegt, was offen vertagt?
- Falls dauerhaft: nach `docs/decisions.md` heben

## Offene Punkte
- Was muss als nächstes passieren?
- Falls länger offen: nach `docs/todos.md` heben

## Notizen
Alles, was beim nächsten Aufschlag helfen würde.
```

## DSG-Pflicht (Git-getrackt!)

Summaries landen im Git und ggf. via Dropbox/GitHub bei Dritten. Daher
**verbindlich**:

- **Keine Klarnamen** von Kunden, Mitarbeitenden, Nutzern. Fiktive
  Namen oder Rollen (`Kunde A`, `der PM`, `Projektleitung`) verwenden.
- **Keine echten Tokens, API-Keys, Passwörter, internen URLs** —
  auch nicht als „Beispiel".
- **Keine sensiblen Geschäfts-Internals** (Verträge, Honorare,
  laufende Verhandlungen), wenn das Repo geteilt wird.
- Falls eine Session reale Daten berührt hat: im Summary nur
  abstrakt zusammenfassen („Daten-Import getestet, 200 Records"),
  nicht die Daten selbst.

Im Zweifel: lieber knapper schreiben oder `docs/decisions.md` für die
sanitisierte Variante nehmen.

## Lifecycle

- **Schreiben:** am Session-Ende. Der Stop-Hook erinnert daran, wenn
  noch kein Summary für heute existiert.
- **Lesen:** SessionStart-Hook injiziert den jüngsten Summary
  automatisch. Manuelles Durchblättern bei Bedarf.
- **Verdichten:** wenn eine Entscheidung in mehreren Summaries
  auftaucht, gehört sie nach `docs/decisions.md`. Wenn ein TODO
  mehrfach offen vertagt wird, nach `docs/todos.md`.
- **Aufräumen:** alte Summaries dürfen bleiben. Falls der Ordner
  unhandlich wird (> 50 Files): in `docs/sessions/archive/YYYY/`
  verschieben, der SessionStart-Hook ignoriert Unterordner.
