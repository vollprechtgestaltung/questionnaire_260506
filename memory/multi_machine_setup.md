---
name: multi-machine-setup
description: User arbeitet auf zwei macOS-Maschinen mit unterschiedlichen Usernames (tobias07, tobias06); Dropbox-Pfad sonst identisch. Beeinflusst alle absoluten Pfade.
metadata:
  type: project
---

Der User arbeitet auf **zwei macOS-Maschinen** mit unterschiedlichen
Benutzer-Accounts:

- `tobias07` (Maschine A)
- `tobias06` (Maschine B)

Innerhalb von `~/Library/CloudStorage/Dropbox-vollprechtgestaltung/...`
ist die Ordnerstruktur **identisch** — nur das Username-Segment in
`/Users/<name>/` unterscheidet sich.

**Why:** Beide Maschinen werden über Dropbox synchronisiert
([[template-baseline]] hält das Sync-Modell allgemein fest). Weil der
Username im Pfad-Prefix variiert, sind **absolute Pfade nicht portabel**
zwischen den Maschinen — relative Pfade oder `$HOME`-basierte Pfade
schon.

**How to apply:**

- In versionierten Dateien (`.template-version:source`, Configs, Docs,
  Memories) **niemals absolute Pfade** mit `/Users/tobias07/...`
  hardcoden. Stattdessen:
  - relativ zum Projekt (`../../../...`), oder
  - `$HOME`/`~` wenn Shell-evaluiert.
- In `.claude/settings.local.json` (gitignored) sind absolute Pfade
  okay — die Datei ist explizit maschinen-lokal.
- Vor jeder Empfehlung „nimm einen absoluten Pfad" kurz prüfen, ob die
  Datei zwischen Maschinen geteilt wird. Falls ja: relativ bleiben.
- Das aktuelle `.template-version:source` ist bereits relativ — nicht
  ohne Not auf absolut umstellen.
