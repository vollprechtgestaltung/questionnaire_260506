---
name: project_messe_prep
description: Messetermin Mitte/Ende August 2026 + Vor-Messe-Checkliste (DB-Wipe, Supabase-Restore, Pro-Upgrade).
metadata:
  type: project
---

Der Messeeinsatz ist **Mitte/Ende August 2026** (Stand: vom User am 2026-06-25 genannt, kein exaktes Datum).

**Why:** Bis dahin laufen nur Test-/Keep-alive-Daten in der `votes`-Tabelle. Mehrere Tasks hängen am Termin, nicht am heutigen Tag.

**How to apply:** Kurz **vor** der Messe als ein Schritt erledigen:
- **DB-Wipe** für sauberen Count: `DELETE FROM votes;` (aktuell ~476 Test-Zeilen, alle vor der Messe). Vorher mit User bestätigen — destruktiv.
- **Supabase-Restore** falls Free-Tier-Projekt pausiert wurde (90-Tage-Fenster) + **Upgrade auf Supabase Pro** (kein Auto-Pause), siehe [[project_production_status]] und Session 2026-06-15.
- Festhängende lokale Queues (`puls_vote_queue`) in Test-Browsern ggf. leeren (lösen sich seit Rate-Limit-Entfernung aber selbst auf).

Restliche Geräte-/Standchecks: `docs/todos.md` (iPad-Setup, MiFi, Guided Access, Backup-iPad).
