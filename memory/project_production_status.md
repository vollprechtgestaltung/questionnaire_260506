---
name: project_production_status
description: App ist production-ready und wird am echten Messetag eingesetzt — nicht als interner Stakeholder-Review-Prototyp behandeln.
metadata:
  type: project
---

Die App wird am echten Messetag mit echtem Publikum eingesetzt. CLAUDE.md nennt sie noch „Prototyp" (ursprünglicher Auftragsrahmen), aber der Qualitätsanspruch ist Production.

**Why:** User hat explizit darauf hingewiesen, dass „Prototyp" als Qualitäts-Relativierung nicht mehr gilt. CRON_SECRET ist in Vercel gesetzt, alle Audit-Findings sind geschlossen.

**How to apply:** Security- und Robustheitsentscheidungen nicht mit „für einen Prototyp akzeptabel" abschwächen. Voller Production-Anspruch gilt.
