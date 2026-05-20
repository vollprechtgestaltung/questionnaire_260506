---
name: template_baseline
description: Grund-Fakten, die in jedem aus diesem Template instanziierten Projekt gelten — Setup, Plattform, Sync-Modell, Sprache.
type: project
---

Dieses Projekt basiert auf `_template-base-002` (vollprecht gestaltung).
Grund-Setup, das ohne Nachfrage gilt — solange das aktuelle Projekt es
nicht explizit widerruft:

- **Auftraggeber / Maintainer:** vollprecht gestaltung
- **Plattform:** macOS only. Hooks nutzen bash + Unix-Tools. Windows ist
  nicht unterstützt.
- **Sync-Modell:** Dropbox + Git. Memories/Docs/TODOs leben projekt-
  relativ in `./memory/`, `./docs/`. Keine maschinen-lokalen Pfade
  (`~/.claude/projects/...`) — ein Hook blockt das.
- **Sprache:** Code/Commits/Kommentare auf Englisch. Texte für
  User/Endkunden auf Deutsch.
- **Senior-Level-Pflicht:** vor Code → `docs/stack.md` vollständig.
  Keine impliziten Stack-Annahmen, lieber einmal nachfragen.
- **Sicherheits-Hooks:** `.claude/hooks/block-destructive-bash.sh`,
  `.claude/hooks/block-external-memory.sh`, `block-marker-tamper.sh`,
  `check-sandbox-bypass.sh`, `record-sandbox-approval.sh` sind aktiv
  und werden vom Pre-Commit + CI getestet (`tests/hooks.sh`).
  Nicht abschalten ohne Begründung in `docs/decisions.md`.
- **Sandbox-Bypass:** `dangerouslyDisableSandbox: true` ist **immer**
  per Hook geblockt. Bypass nur nach `AskUserQuestion` mit dem strikten
  Header `Sandbox-Bypass anfordern` und User-Wahl `Bypass erlauben`.
  Marker ist single-use, TTL 60s. Der SDK-Default „just retry with
  sandbox disabled" gilt hier nicht.

**Why:** Diese Fakten ändern Claudes Verhalten in fast jeder Antwort
(Sprachwahl, Pfad-Wahl, Stack-Gate, Hook-Vertrauen). Sie aus CLAUDE.md
neu zu „lernen" kostet jede Session Context.

**How to apply:** Beim Lesen einer Anfrage diese Defaults als gegeben
annehmen, statt sie zu hinterfragen — es sei denn, das aktuelle Projekt
hat sie in `docs/decisions.md` explizit überschrieben.
