---
name: project_archivierung
description: Projekt wird abgeschlossen — Supabase- und Vercel-Projekt werden gelöscht, das Repo ist der Archivstand. Löschtermin noch offen (Agentur).
metadata:
  type: project
---

Das Projekt geht ins Archiv. Entscheid vom **2026-09-07** (ADR in
`docs/decisions.md`): **Supabase- und Vercel-Projekt werden gelöscht**, nicht
pausiert. **Das Git-Repository ist der alleinige Archivstand.** Ablauf,
Verifikation und Restore-Anleitung: `docs/archiv.md`.

**Der Löschzeitpunkt ist offen** — er wird vom User mit der Agentur
abgestimmt. Bis dahin bleibt alles unverändert online.

**Why:** Zwischen Entscheid und Ausführung liegt eine unbestimmte Wartezeit.
Ohne diesen Stand wird in einer späteren Session entweder vorschnell gelöscht
oder der Heartbeat „aufgeräumt", was beides Schaden anrichtet.

**How to apply:**

- **Nicht ungefragt löschen.** Weder Supabase noch Vercel, solange der Termin
  nicht bestätigt ist. Erst fragen.
- **Den Heartbeat-Cron in `vercel.json` nicht abschalten.** Er läuft bewusst
  bis zur Löschung weiter; ein früheres Aus liesse die DB pausieren, die vor
  dem Löschen erst wieder reaktiviert werden müsste. Er verschwindet mit dem
  Vercel-Projekt von selbst.
- **Das Archiv ist verifiziert, nicht angenommen** (Stand 07.09.): Daten
  vollständig als CSV in `backups/` (2 Zeilen, gegen die Live-DB abgeglichen),
  Edge Function zeichengleich mit der deployten Version 10, Schema-Lücke
  `voted_at` in `docs/supabase-setup.sql` geschlossen. Wer erneut prüft, prüft
  gegen diesen Stand, nicht von vorne.
- **Beim Wiederaufbau die Reihenfolge einhalten:** die Edge Function braucht
  die Vercel-Domain, die es vorher nicht gibt — `ALLOWED_ORIGIN` wird nach dem
  ersten Vercel-Deploy nachgezogen. Sonst scheitert jeder Vote an CORS.
- **`backups/` und Doku nicht ausdünnen.** Genau darin liegt der Archivwert.

Siehe auch [[project_messe_prep]], [[project_production_status]].
