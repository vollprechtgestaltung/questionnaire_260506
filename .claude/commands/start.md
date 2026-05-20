Starte eine neue Session: lade den aktuellen Projektstand, lies Memories
und Docs, und melde dich beim User mit einer kurzen Zusammenfassung.

## Schritte

1. **Session-Start-Hook ausführen** — den Output von
   `bash .claude/hooks/session-start.sh` lesen und verarbeiten.
   Das Script injiziert: Memories, letzten Session-Summary, Doc-Index
   mit Lese-Triggern, offene TODOs, Git-Status, Warnungen.

2. **Memories verarbeiten** — je nach Injection-Modus:
   - Vollständig injiziert (< 8 KB): direkt lesen.
   - Nur Index (`memory/MEMORY.md`): Index scannen, bei Bedarf
     einzelne Memory-Files per Read nachladen.

3. **Warnungen beachten** — der Hook kann folgende Warnungen ausgeben:
   - `FRESH TEMPLATE DUPLICATE` → `/project:bootstrap` vorschlagen
   - `Tech-Stack unvollständig` → User auf offene Felder hinweisen
   - `Project Context unvollständig` → User fragen, bevor weitergearbeitet wird

4. **Dem User melden** — kurze Zusammenfassung:
   - Was aus den Memories relevant ist
   - Stand der letzten Session (falls vorhanden)
   - Offene TODOs / Warnungen
   - Frage: „Was steht heute an?"
