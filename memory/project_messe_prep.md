---
name: project_messe_prep
description: Messe 2026-08-26 ist vorbei; aus dem Messetag liegt kein einziger Vote in der DB — Incident offen. Supabase bleibt bewusst Free.
metadata:
  type: project
---

Die Messe war am **2026-08-26**. **Aus diesem Tag liegt keine einzige Zeile in
`votes`.** Nachgewiesen am 31.08.: nicht gelöscht, sondern nie angekommen — die
Postgres-Zähler schliessen ein gelöschtes Messetag-Volumen aus. Der Vorgang ist
**offen**, voller Kontext in `docs/incident-2026-08-31-fehlende-messedaten.md`.

**Why:** Ohne diesen Stand liest die nächste Session die alte Vor-Messe-Checkliste
als aktuellen Plan und hält die Daten für gesichert. Sind sie nicht.

**How to apply:**

- **Nicht als erledigt behandeln.** Bis die Agentur zu den drei Fragen im
  Incident-Doc geantwortet hat (Zustand der iPads, seitheriger Online-Betrieb, ob
  am 26.08. überhaupt abgestimmt wurde), gilt: auf den iPads keine Website-Daten
  löschen, PWA nicht deinstallieren, Geräte nicht zurücksetzen; an `votes` kein
  `DELETE`/`TRUNCATE`. Die Offline-Queue auf den Geräten ist der einzige Ort, an
  dem Messedaten noch liegen können.
- **Die erste Rückmeldung der Agentur war „alles ok"** — mit dem DB-Befund nicht
  vereinbar. Aussagen zum Messebetrieb nicht ungeprüft übernehmen.
- **Kein Supabase-Pro-Upgrade.** Entscheid User 2026-08-24, am 25.08. bestätigt:
  PITR ist ein separates Add-on, Pro hätte das Backup-Problem gar nicht gelöst.
  Konsequenz: der CSV-Export vor jedem `DELETE` ist das einzige Backup.
- **`n_tup_ins` ist kein Vote-Zähler.** PK-Kollisionen aus der Offline-Queue
  zählen mit (client-generierte `id` + `votes_pkey`). Wer Votes zählt, zählt
  Zeilen. Diese Verwechslung hat am 31.08. einmal zu einer falschen
  TRUNCATE-Vermutung geführt.

Siehe auch [[project_production_status]], [[project_voting_design]].
