# Portable Persistence

> When to read: wenn eine Datei abgelegt, ein Memory geschrieben, ein
> Pfad referenziert oder ein Symlink/absoluter Pfad benutzt werden
> soll. Diese Datei legt fest, **wo** Persistenz lebt und welche
> Anti-Patterns blockiert sind.

Das Projekt ist über Dropbox synchronisiert und muss von mehreren
Rechnern aus arbeitsfähig sein. Alles Persistente liegt **inside the
project directory**, nie in maschinen-lokalen Claude-Pfaden.

## Ablage-Regeln

- **Memories** → `./memory/` (mit `MEMORY.md` als Index).
  - **Nie** nach `~/.claude/projects/<hash>/memory/` schreiben — dieser
    Pfad ist maschinen-lokal und Dropbox-untauglich. Der PreToolUse-Hook
    `.claude/hooks/block-external-memory.sh` blockt solche Writes
    technisch (Exit-Code 2).
- **Persistente TODOs** → `docs/todos.md`. Der ephemere `TodoWrite`-Tool
  ist für In-Session-Schritt-Tracking okay; alles was die Session
  überleben muss → `docs/todos.md`.
- **Decisions / ADRs** → `docs/decisions.md` (Format: siehe Datei).
- **Allgemeine Dokumentation** → `docs/`.

## Anti-Patterns (blockiert oder zu vermeiden)

- **Keine Symlinks** im Projekt — Dropbox handhabt sie inkonsistent
  zwischen macOS und Windows. Bei Bedarf relative Pfade oder Kopien.
- **Keine absoluten Pfade** in Memory- oder Doc-Inhalten — absolute
  Dropbox-Pfade unterscheiden sich pro Rechner
  (`/Users/foo/Dropbox/...` vs. `/Users/bar/Library/.../Dropbox/...`).
  Immer projekt-relativ schreiben.
- **Keine `*conflicted copy*`-Dateien commiten** — Dropbox erzeugt
  diese bei Sync-Konflikten. Lösung: die korrekte Version behalten,
  Conflict-File löschen, dann erst commiten. `.gitignore` ignoriert
  sie zusätzlich.

## Non-Dropbox-Setup

Wird das Template ohne Dropbox eingesetzt, bleiben die Regeln intern
konsistent (alles in-repo, via Git versioniert). Lediglich der
Conflict-File-Hinweis und das Multi-Machine-Framing sind dann nicht
mehr nötig — die Struktur trotzdem **nicht** verändern, da andere
Projekte vom selben Template Dropbox nutzen.
