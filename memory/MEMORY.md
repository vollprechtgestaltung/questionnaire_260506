<!--
Memory index for this project.

All memory files live in this folder (project-relative), NOT in
~/.claude/projects/<hash>/memory/. This keeps memories portable across
machines via Dropbox sync.

Each entry: one line, ~150 chars max:
- [Title](file.md) — one-line hook
-->

- [Template-Baseline](template_baseline.md) — Grund-Defaults aus dem Template (Plattform, Sync, Sprache, Hooks) — gelten, solange das Projekt sie nicht explizit widerruft.
- [Multi-Machine-Setup](multi_machine_setup.md) — User arbeitet auf tobias07 + tobias06; Dropbox-Pfad sonst identisch → keine absoluten Pfade in geteilten Dateien.
- [CI-Debug-Reihenfolge](feedback_ci_debugging.md) — Bei CI-Fails zuerst Job-Logs via GitHub-API holen, nicht lokal raten. Spart massiv Tokens.
- [Git Author Email](feedback_git_author.md) — Nie userEmail aus Session-Kontext als Git-Author nutzen; korrekte Email: git@vollprecht.com.
- [Kein ungefragter Branch](feedback_no_unprompted_branch.md) — Bei "commit + push" auf den aktuellen Branch (main) committen; Branch nur auf explizite Anweisung.
- [Voting Design](project_voting_design.md) — Mehrere Votes pro Gerät gewollt (1 iPad, Kiosk-Rückfall nach 20s); kein Admin-UI geplant.
- [Production Status](project_production_status.md) — App läuft am echten Messetag; „Prototyp" aus CLAUDE.md nicht als Qualitäts-Relativierung verwenden.
- [Messe-Prep](project_messe_prep.md) — Messe Mitte/Ende August 2026; vorher DB-Wipe + Supabase-Restore + Pro-Upgrade als ein Schritt.
