Prüfe den aktuellen Code auf Konformität mit dem Schweizer DSG und der EU-DSGVO:

1. **Personenbezogene Daten**
   - Enthält der Code echte Personendaten (Namen, E-Mails, Telefonnummern, Adressen)?
   - Werden in Tests oder Fixtures reale Personendaten verwendet?
   - Sind personenbezogene Daten in Logs, Kommentaren oder Commit-Messages enthalten?

2. **Privacy by Design (Art. 7 DSG)**
   - Ist Datenschutz von Anfang an in der Architektur berücksichtigt?
   - Werden nur die minimal notwendigen Daten erhoben (Datenminimierung)?

3. **Privacy by Default (Art. 7 DSG)**
   - Sind die datenschutzfreundlichsten Einstellungen als Standard gesetzt?
   - Werden Daten ohne explizite Zustimmung an Dritte übermittelt?

4. **Datentransfer ins Ausland (Art. 16/17 DSG)**
   - Werden Daten an Dienste ausserhalb der Schweiz/EU übermittelt?
   - Sind angemessene Schutzmassnahmen vorhanden (SCCs, DPA)?

5. **Aufbewahrung und Löschung**
   - Gibt es ein Löschkonzept für personenbezogene Daten?
   - Werden Daten länger als nötig gespeichert?

Erstelle einen kurzen Bericht mit:
- Findings (was gefunden wurde)
- Risikobewertung (hoch/mittel/niedrig)
- Empfehlungen (was geändert werden sollte)
