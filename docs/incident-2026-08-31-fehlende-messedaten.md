# Incident 2026-08-31 — keine Messedaten vom 26.08. in `votes`

> When to read: wenn es um die Vote-Daten des Messetags 2026-08-26 geht,
> um den Zustand der iPads danach, oder bevor irgendjemand `votes` leert
> bzw. die Offline-Queue auf einem iPad verwirft. Auch lesen, bevor die
> Zähler in `pg_stat_user_tables` erneut als Beleg herangezogen werden.

**Status: offen.** Der technische Teil ist geklärt, der organisatorische
nicht. Es fehlt die Rückmeldung, was am Messetag tatsächlich passiert ist.

## Kurzfassung

Der Post-Messe-Snapshot am 31.08. förderte **2 Zeilen** zutage, beide vom
27./28.08. und beide vom selben Gerät. **Aus dem Messetag 26.08. liegt keine
einzige Zeile in `votes`.**

Die Postgres-Zähler belegen: die Daten wurden **nicht gelöscht — sie sind nie
angekommen.** Damit sind die iPads der einzige Ort, an dem sie noch existieren
können (Offline-Queue in `localStorage`, `puls_vote_queue`, Limit 500/Gerät).

## Messwerte (erhoben 2026-08-31, ~09:00 CEST)

Snapshot `backups/votes-2026-08-31-0900-post-messe.csv`:

- 2 Zeilen, 2 eindeutige IDs
- Zeitraum `2026-08-27 07:34:48` … `2026-08-28 10:46:04` UTC
- beide Zeilen tragen dieselbe `device_id`

`pg_stat_user_tables` für `votes`:

| Feld | Wert |
|---|---|
| `n_tup_ins` | 641 |
| `n_tup_upd` | 0 |
| `n_tup_del` | 617 |
| `n_live_tup` | 2 |
| `n_dead_tup` | 13 |
| `last_autovacuum` / `last_autoanalyze` | 2026-08-24 18:06:38 UTC |
| `last_vacuum` / `last_analyze` | `null` |

Referenzwert: `backups/votes-2026-08-24-pre-wipe.csv` enthält **605**
Datenzeilen.

## Beweisführung

**Es wurden keine Messedaten gelöscht.** Das hängt an einer einzigen Zahl:

> `n_tup_del` = 617. Allein der Wipe vom 24.08. hat 605 Zeilen gelöscht.
> Über die gesamte Projekthistorie hinweg sind also ausserhalb dieses einen
> Wipes höchstens **12** Zeilen je gelöscht worden — 9 davon der dokumentierte
> Snapshot-Probelauf vom 25.08. (siehe `docs/todos.md` → `## Erledigt`).

Was auch immer am 26.08. in die Datenbank gelangt und später verschwunden sein
könnte: es können **höchstens 3 Zeilen** gewesen sein. Ein Messetag-Volumen ist
damit ausgeschlossen — unabhängig davon, wer was ausgeführt hat.

**Der Zähler-Reset-Einwand greift nicht.** Wären die Statistiken nach der Messe
zurückgesetzt worden, könnten sie den Wipe vom 24.08. nicht mehr enthalten.
`n_tup_del` = 617 deckt aber genau diese 605 plus die 9 vom 25.08. ab. Die
Zähler laufen also durchgehend über den Messetag.

**Auch eingefügt wurde am 26.08. nichts.** Seit dem Wipe vom 24.08. wurden
höchstens 14 Zeilen eingefügt (≤ 12 später gelöschte + 2 lebende), davon sind
11 bekannt: 9 Probelauf, 2 Einzelvotes vom 27./28.

## Verworfene Hypothese: `TRUNCATE`

Erste Vermutung war ein `TRUNCATE` (erhöht `n_tup_del` nicht), weil
`n_tup_ins` − `n_tup_del` = 24 nicht zu `n_live_tup` = 2 passt. **Das war ein
Rechenfehler:** lebenslange Zähler lassen sich nicht gegen `n_live_tup`
halten, weil ANALYZE letzteren auf den echten Wert zurücksetzt. Der
Autoanalyze vom 24.08. 18:06 lief direkt nach dem Wipe, als die Tabelle leer
war; seither zählt er nur die Differenz: +11 / −9 = 2. Passt exakt. Die
Lücke von 22 liegt vollständig **vor** dem 24.08.

**Die tatsächliche Ursache der Lücke ist der Duplikatschutz.**
`supabase/functions/submit-vote/index.ts:70` macht ein schlichtes `insert` mit
**client-generierter `id`**; auf `votes` liegt `votes_pkey` (PK auf `id`).
Sendet die Offline-Queue einen bereits abgesetzten Vote erneut, kollidiert er
mit dem PK und die Transaktion bricht ab — die Zeile war zu dem Zeitpunkt aber
physisch schon geschrieben. Postgres zählt sie deshalb in `n_tup_ins`, nie in
`n_tup_del`, und lebend wird sie nie. Über vier Monate Entwicklung mit
Wiederholungs-Sends sind 22 solche Kollisionen unauffällig.

Konsequenz: **kein Verdacht auf manuelle oder MCP-seitige Eingriffe in die
Datenbank.** Der offene TODO `REVOKE TRUNCATE ON public.votes FROM anon;`
bleibt sinnvoll, aber als Hygiene — nicht als Spur in diesem Vorgang.

Merkposten für später: `n_tup_ins` ist bei diesem Schema **kein** Zähler für
angenommene Votes. Wer Votes zählen will, zählt Zeilen.

## Bis zur Klärung gilt

- **Auf den iPads keine Website-/Browserdaten löschen**, PWA nicht
  deinstallieren, Geräte nicht zurücksetzen. Falls dort eine Queue liegt, ist
  das der einzige verbliebene Ort der Messedaten.
- **An `votes` nichts ausführen** — kein `DELETE`, kein `TRUNCATE`.
- Ein iPad kurz online mit geöffneter App würde die Queue flushen. Das ist der
  gewünschte Weg der Rettung, aber erst nach Absprache — vorher festhalten,
  was auf dem Gerät liegt.

## Offene Fragen an die Agentur

1. **Sind die iPads noch im Zustand vom Messetag?** Nicht zurückgesetzt, PWA
   nicht deinstalliert, Website-Daten nicht gelöscht?
2. **Wurden sie seither online mit geöffneter App betrieben?** Wenn ja, hätte
   die Queue geflusht — in der DB ist aber nichts angekommen. Das grenzt weiter
   ein.
3. **Wurde am 26.08. überhaupt über die iPads abgestimmt?** Wenn nein, ist
   nichts verloren und die Frage ist eine andere.

## Verlauf

- **2026-08-26** — Messetag laut Planung (`memory/project_messe_prep.md`).
  Die beiden Messetag-TODOs (Wipe vor Türöffnung, Snapshot nach Messeschluss)
  wurden an dem Tag nicht ausgeführt.
- **2026-08-31** — Post-Messe-Snapshot nachgeholt: 2 Zeilen. Befund an den
  Auftraggeber gemeldet; Rückmeldung der Agentur „alles ok", laut Auskunft
  ohne Rücksprache mit dem Endkunden. Analyse der Zähler → dieser Eintrag.

## Bezüge

- `docs/ops-tooling.md` — Snapshot- und Health-Check-Tooling
- `docs/offline-strategy.md` — Queue, Duplikat-Erkennung, Offline-Verhalten
- `docs/decisions.md` — ADR 2026-08-24 (Free-Plan, kein PITR)
- `docs/todos.md` — Messe-TODOs und `REVOKE TRUNCATE`
- `docs/sessions/2026-08-25-1042.md` — Aufbau des Tooling, Probelauf mit 9 Votes
