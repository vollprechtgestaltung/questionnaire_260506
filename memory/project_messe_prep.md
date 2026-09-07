---
name: project_messe_prep
description: Messe 2026-08-26 gelaufen und als Erhebung gescheitert — nur 2 Votes insgesamt, Ursache Standbetrieb, nicht Technik. Kein Datenverlust.
metadata:
  type: project
---

Die Messe war am **2026-08-26**. Sie hat als Datenerhebung **nicht
funktioniert**: über die gesamte Standzeit kamen **2 Votes** zusammen, und
genau diese 2 liegen in `votes`. Am Messetag selbst wurde gar nicht
abgestimmt.

**Ursache ist der Standbetrieb, nicht die App:** das Standpersonal hat die App
nicht bedient, das iPad stand dunkel und schlecht positioniert. Die
Erfassungskette (PWA → Queue → Edge Function → DB) hat funktioniert; es gab
nichts zu erfassen. Der Incident vom 31.08. ist damit am **07.09. geschlossen**,
voller Verlauf in `docs/incident-2026-08-31-fehlende-messedaten.md`.

**Why:** Zwischen dem 31.08. und dem 07.09. galt der Vorgang als möglicher
Datenverlust, inklusive Sperre auf iPads und `votes`. Ohne diesen Stand wird
die Sperre erneut angenommen oder die App als fehlerhaft verdächtigt.

**How to apply:**

- **Kein Datenverlust, keine Sperre mehr.** iPads dürfen zurückgesetzt werden,
  `DELETE`/`TRUNCATE` auf `votes` ist wieder zulässig — weiterhin **nur nach
  `npm run snapshot`** (kein PITR im Free-Plan).
- **Die App nicht als Ursache verdächtigen.** Wer bei „keine Daten vom
  Messetag" wieder an Queue, Sync oder DB-Eingriff denkt: das ist geprüft und
  ausgeschlossen.
- **Den Fehlschlag nicht der Umsetzung zurechnen.** Die Position des iPads war
  vorgegeben (in Kombination mit einem Simulator, der ebenfalls schlecht
  angenommen wurde), die Instruktion des Standpersonals liegt bei Agentur bzw.
  Kunde. Die DB wurde an den Messetagen kontrolliert und die Agentur informiert
  — mehr war von hier aus nicht zu tun.
- **Kein Supabase-Pro-Upgrade.** Entscheid User 2026-08-24, am 25.08.
  bestätigt: PITR ist ein separates Add-on, Pro hätte das Backup-Problem gar
  nicht gelöst.
- **`n_tup_ins` ist kein Vote-Zähler.** PK-Kollisionen aus der Offline-Queue
  zählen mit (client-generierte `id` + `votes_pkey`). Wer Votes zählt, zählt
  Zeilen. Diese Verwechslung hat am 31.08. einmal zu einer falschen
  TRUNCATE-Vermutung geführt.

Siehe auch [[project_production_status]], [[project_voting_design]].
