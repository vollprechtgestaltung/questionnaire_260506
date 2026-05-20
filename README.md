# pls-inc006-questionaire

puls: Klickbarer Fragebogen-Prototyp im Browser, ohne persistente Datenhaltung.

> Empfänger: puls intern (Stakeholder-Review) — Grundlage für Entscheid über Production-Umsetzung.
> Out of scope: Production-Backend, Authentifizierung, persistente Datenspeicherung, Analytics-Integration.

## Setup

Wird automatisch via SessionStart-Hook (vollprecht-template) verwaltet.
Manuelle Schritte:

- Pre-Commit aktivieren (falls nicht schon): `git config core.hooksPath .githooks`
- Stack-Lock prüfen: `docs/stack.md`

## Template-Bezug

Dieses Projekt basiert auf dem Template `_template-base-002` (siehe `.template-version`).
Updates aus dem Template ziehen: `/project:template-update`.
