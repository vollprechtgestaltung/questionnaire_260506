<!--
Memory index for this project.

All memory files live in this folder (project-relative), NOT in
~/.claude/projects/<hash>/memory/. This keeps memories portable across
machines via Dropbox sync.

Each entry: one line, ~150 chars max:
- [Title](file.md) — one-line hook
-->

- [Template-Baseline](template_baseline.md) — Grund-Defaults aus dem Template (Plattform, Sync, Sprache, Hooks) — gelten, solange das Projekt sie nicht explizit widerruft.
- [CI-Debug-Reihenfolge](feedback_ci_debugging.md) — Bei CI-Fails zuerst Job-Logs via GitHub-API holen, nicht lokal raten. Spart massiv Tokens.
