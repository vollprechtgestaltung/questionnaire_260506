Führe ein Security-Audit des aktuellen Projekts durch:

1. **Secrets & Credentials**
   - Hardcoded API-Keys, Passwörter, Tokens im Code?
   - .env-Dateien versioniert oder exponiert?
   - Credentials in Konfigurationsdateien?

2. **Dependencies**
   - Bekannte Schwachstellen in Abhängigkeiten?
   - Veraltete Packages mit Sicherheitslücken?
   - Unnötige Dependencies?

3. **Input-Validierung**
   - Wird User-Input validiert und sanitized?
   - SQL-Injection, XSS, Command-Injection möglich?
   - Werden API-Responses validiert?

4. **Dateisystem & Permissions**
   - Sensible Dateien korrekt geschützt?
   - Sandbox-Konfiguration angemessen?
   - Dateiberechtigungen korrekt?

5. **Konfiguration**
   - Debug-Modus in Produktion deaktiviert?
   - CORS korrekt konfiguriert?
   - HTTPS erzwungen?

Erstelle einen Bericht mit:
- KRITISCH: sofort beheben
- WARNUNG: sollte behoben werden
- INFO: Empfehlung zur Verbesserung
