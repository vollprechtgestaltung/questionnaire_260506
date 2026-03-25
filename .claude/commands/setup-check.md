Prüfe ob alle erforderlichen Konfigurationsdateien für das Projekt vorhanden und korrekt sind:

1. **Claude Code Konfiguration**
   - `.claude/settings.json` vorhanden und valides JSON?
   - `.claude/settings.local.json` vorhanden (optional)?
   - `CLAUDE.md` vorhanden und aktuell?

2. **Git Konfiguration**
   - `.gitignore` vorhanden?
   - Sensible Dateien ausgeschlossen (.env, settings.local.json)?
   - Git-Repository initialisiert?

3. **Projekt-Dateien**
   - Projektstruktur vorhanden (src/, tests/, docs/)?
   - package.json oder andere Projektdefinition?

4. **Sicherheit**
   - Keine Secrets oder Credentials in versionierten Dateien?
   - Sandbox korrekt konfiguriert?
   - Permissions sinnvoll gesetzt?

Erstelle einen kurzen Status-Bericht:
- OK: was vorhanden und korrekt ist
- FEHLT: was noch erstellt werden muss
- WARNUNG: potenzielle Probleme
