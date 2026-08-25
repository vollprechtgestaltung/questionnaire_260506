# Betriebs-Tooling (Health-Check & Snapshot)

> When to read: vor jedem `DELETE` auf `votes`, beim Messe-Betrieb
> („läuft das Backend noch?"), oder bei Arbeit an `bin/health-check.js`,
> `bin/snapshot.js`, `bin/lib/`.

Zwei dependency-freie Node-Skripte in `bin/`. Beide lesen `.env`
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUBMIT_VOTE_URL`)
und brauchen kein Service-Role-Key — der Anon-Key genügt, weil auf
`votes` die RLS-Policy `allow select` (`USING true`) plus ein
`SELECT`-Grant für `anon` liegt.

## `npm run health`

Kurzer Betriebs-Check. **Schreibt nichts, setzt keinen Vote.**

```bash
npm run health
```

Prüft in vier Zeilen: `.env` vollständig · Supabase-REST erreichbar
(Status + Latenz) · aktueller Zeilen-Count und Zeitpunkt des letzten
Votes · `submit-vote` Edge Function erreichbar.

Exit-Code 0 = alles grün, 1 = mindestens ein Check rot — damit
skriptbar.

Der CORS-Check ist standardmässig nur ein Erreichbarkeits-Test. Mit
einer konkreten Origin wird daraus ein echter Preflight:

```bash
npm run health -- --origin=https://<vercel-domain>
```

## `npm run snapshot`

Zieht die komplette `votes`-Tabelle als CSV nach `backups/`.

```bash
npm run snapshot -- --label=pre-wipe
```

Dateiname: `backups/votes-YYYY-MM-DD-HHMM[-label].csv` (lokale Zeit).

**Warum das Skript lieber abbricht als schreibt:** Ohne
Point-in-Time-Recovery (Free-Plan, ADR 2026-08-24) ist dieser Export
das einzige Backup. Ein still gekürztes CSV wäre schlimmer als gar
keins, weil es Sicherheit vortäuscht. Deshalb:

- Zeilen-Count wird **vorher** serverseitig geholt (`Prefer: count=exact`)
  und **nachher** gegen die tatsächlich geschriebenen Zeilen geprüft.
  Weniger Zeilen als erwartet → Abbruch, **keine Datei**.
- Paginierung in 1000er-Seiten über `Range`, mit festem
  `order=created_at.asc,id.asc`. Ohne deterministische Sortierung kann
  PostgREST zwischen Seiten Zeilen doppeln oder überspringen.
- Doppelte IDs → Abbruch (fängt genau diesen Paginierungs-Fehler).
- Geschrieben wird mit Flag `wx`: eine bestehende Datei wird **nie**
  überschrieben.
- Leere Tabelle → keine Datei, Exit 0.

Kommen während des Exports Votes rein, ist das unkritisch: bei
aufsteigendem `created_at` landen sie am Ende, nie mitten in einer schon
geholten Seite. Das Skript weist sie separat aus.

Die Paginierungs- und Prüflogik liegt in `bin/lib/snapshot-core.js` und
ist in `bin/lib/snapshot-core.test.js` abgedeckt (Mehrseiten-Export,
exaktes Seitenvielfaches, Kürzung, Duplikate, leere Tabelle).

### `--page-size` (Probelauf)

```bash
npm run snapshot -- --label=probelauf --page-size=3
```

Die Unit-Tests prüfen die Paginierung gegen einen Fake-Pager — also
gegen **unsere Annahme**, wie PostgREST auf `Range`-Header antwortet.
Stimmt die Annahme nicht, bleiben die Tests grün und die Realität
bricht. Eine kleine Seitengrösse lässt eine Handvoll Testvotes den
echten Mehrseiten-Pfad durchlaufen und schliesst genau diese Lücke.

Der Output weist in diesem Modus zusätzlich die Anzahl Seiten aus —
sonst sieht man nicht, ob überhaupt paginiert wurde.

Ungültige Werte (nicht-numerisch, 0, negativ, Bruch, Flag ohne Wert)
brechen mit Exit 1 ab, **bevor** ein Request rausgeht. Das ist kein
Komfort: ein `NaN` würde die Abbruchbedingung der Paginierungsschleife
dauerhaft falsch machen — Endlosschleife gegen die Live-API.

Im Normalbetrieb bleibt es bei 1000. Das Flag ist eine Probelauf-Hilfe,
kein Tuning-Regler.

## Wipe-Sequenz

Verbindlich vor jedem `DELETE FROM votes;`:

```bash
npm run snapshot -- --label=pre-wipe
```

→ Zeilenzahl im Output gegen den erwarteten Count prüfen → `DELETE` →
`npm run health` zur Bestätigung, dass der Count auf 0 steht.

## Bekannte Einschränkung

Das Zeilen-Splitting im CSV nimmt an, dass kein Feld ein Newline
enthält. Für das aktuelle Schema (uuid, int, uuid, timestamp, timestamp)
gilt das. Kommt eine Freitext-Spalte dazu, braucht es einen echten
CSV-Parser.
