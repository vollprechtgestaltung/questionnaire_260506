# pls-inc006-questionaire

puls: Klickbarer Fragebogen-Prototyp im Browser, ohne persistente Datenhaltung.

> Empfänger: puls intern (Stakeholder-Review) — Grundlage für Entscheid über Production-Umsetzung.
> Out of scope: Production-Backend, Authentifizierung, persistente Datenspeicherung, Analytics-Integration.

## Lokale Entwicklung

```bash
npm install        # Abhängigkeiten installieren (einmalig)
npm run dev        # Dev-Server starten → http://localhost:5173
npm run build      # Production-Build nach dist/
npm run preview    # Gebauten Build lokal vorschauen → http://localhost:4173
```

Vor dem ersten Start: `.env` aus `.env.example` kopieren und Supabase-Keys eintragen.

## Setup

Wird automatisch via SessionStart-Hook (vollprecht-template) verwaltet.
Manuelle Schritte:

- Pre-Commit aktivieren (falls nicht schon): `git config core.hooksPath .githooks`
- Stack-Lock prüfen: `docs/stack.md`

## Template-Bezug

Dieses Projekt basiert auf dem Template `_claude-tmpl-base` (siehe `.template-version`).
Updates aus dem Template ziehen: `/project:template-update`.
