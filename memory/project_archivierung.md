---
name: project_archivierung
description: Projekt ist am 2026-09-07 archiviert — Supabase und Vercel gelöscht, es existiert nur noch dieses Repo. Nichts mehr live, nichts mehr zu prüfen.
metadata:
  type: project
---

Das Projekt ist **archiviert und abgebaut, Stand 2026-09-07**. Entscheid als
ADR in `docs/decisions.md`, Ablauf und Restore-Anleitung in `docs/archiv.md`.

**Vercel-Projekt und der komplette Supabase-Account sind gelöscht** (nicht
pausiert) — samt UptimeRobot-Monitor. **Das Git-Repository ist der alleinige
Archivstand.** Es gibt keine laufende Instanz, keine erreichbare URL, keine
Datenbank, und auch keine Supabase-MCP-Anbindung mehr.

**Why:** Ohne diesen Stand versucht eine spätere Session, gegen ein
Supabase-Projekt zu prüfen, das es nicht mehr gibt — oder hält den Betrieb für
laufend, weil Code und Doku vollständig aussehen.

**How to apply:**

- **Nichts mehr live prüfen.** Kein `npm run health`, kein Supabase-MCP-Zugriff,
  kein Aufruf der Vercel-Domain. Alles davon läuft ins Leere. Tests und Build
  laufen weiterhin ohne Backend.
- **Das Archiv war verifiziert, nicht angenommen** (07.09., vor der Löschung):
  Daten vollständig als CSV in `backups/` (2 Zeilen, gegen die Live-DB
  abgeglichen), Edge Function zeichengleich mit der deployten Version 10,
  Schema-Lücke `voted_at` in `docs/supabase-setup.sql` geschlossen. Diese
  Prüfung ist nicht wiederholbar — der Stand gilt.
- **Beim Abbau übersehen: der UptimeRobot-Monitor.** Er war nur im
  Session-Summary vom 2026-05-21 dokumentiert, nicht in den TODOs. Lehre für
  jeden künftigen Abbau: nicht nur die eigenen Dienste aufzählen, sondern
  fragen, **was von aussen auf das Deployment zeigt** (Monitoring, Cron-Dienste,
  installierte PWAs auf fremden Geräten, geteilte Links).
- **Beim Wiederaufbau die Reihenfolge einhalten:** die Edge Function braucht
  die Vercel-Domain, die es vorher nicht gibt — `ALLOWED_ORIGIN` wird nach dem
  ersten Vercel-Deploy nachgezogen. Sonst scheitert jeder Vote an CORS.
- **`backups/` und Doku nicht ausdünnen.** Genau darin liegt der Archivwert.

Siehe auch [[project_messe_prep]], [[project_production_status]].
