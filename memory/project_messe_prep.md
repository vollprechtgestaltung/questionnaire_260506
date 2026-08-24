---
name: project_messe_prep
description: Messe ab 2026-08-26; Vor-Messe-Checkliste (Zwei-Schritt-DB-Wipe). Supabase bleibt bewusst Free — kein Pro-Upgrade.
metadata:
  type: project
---

Die Messe beginnt am **2026-08-26** (vom User am 2026-08-24 genannt). DB-Bereinigung am **2026-08-25** früh.

**Why:** Bis zur Messe liegen nur Handtest-Daten in `votes`. Der Zähler muss bei Türöffnung auf 0 stehen.

**How to apply:**

- **Zwei-Schritt-Wipe**, nicht einer. `DELETE FROM votes;` am 25.08. gibt einen sauberen
  Ausgangspunkt fürs iPad-Setup — aber die Pflicht-Testvotes aus `docs/todos.md`
  („Testvote auf jedem iPad") landen danach wieder in der Tabelle. Der **zweite Wipe
  kurz vor Türöffnung** ist der, der zählt. Jeder Wipe: vorher CSV-Export ins Projekt,
  nachher Count verifizieren. Destruktiv → jedes Mal vom User bestätigen lassen.
- **Kein Supabase-Pro-Upgrade.** Entscheid User 2026-08-24: Pro war nur als Reaktion
  geplant, falls Supabase die Free-Tier-DB pausiert. Ist nie passiert (Projekt
  durchgehend `ACTIVE_HEALTHY`), also nicht nötig. Konsequenz: kein Point-in-Time-
  Recovery → der CSV-Export vor jedem `DELETE` ist das einzige Backup.
- Festhängende lokale Queues (`puls_vote_queue`) in Test-Browsern ggf. leeren
  (lösen sich seit Rate-Limit-Entfernung aber selbst auf).

**Korrektur (2026-08-24):** Frühere Annahme „Keep-alive füllt die Tabelle neu" ist
falsch. `api/heartbeat.js` macht ausschliesslich `select id ... limit 1` — kein Insert.
Neue Zeilen entstehen nur durch echte Votes bzw. Handtests.

Restliche Geräte-/Standchecks: `docs/todos.md` (iPad-Setup, MiFi, Guided Access, Backup-iPad).
Siehe auch [[project_production_status]], [[project_voting_design]].
