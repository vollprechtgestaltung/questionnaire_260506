# Löschkonzept

> When to read: bei jeder Frage zu Aufbewahrungsfristen, automatischer
> Datenlöschung, Backup-Aufbewahrung oder Recht-auf-Vergessen-Workflows.

Gemäss Schweizer DSG (Art. 6, 32) und EU-DSGVO (Art. 5, 17).

## Grundsätze

- **Datenminimierung:** Nur erheben, was notwendig ist
- **Zweckbindung:** Daten nur für den definierten Zweck verwenden
- **Speicherbegrenzung:** Aufbewahrungsfristen definieren, nach Ablauf löschen
- **Auskunfts- und Löschrecht:** Betroffene können Löschung verlangen (Art. 32 DSG)

## Aufbewahrungsfristen

### Projektdaten

| Datenart | Aufbewahrung | Löschung |
|----------|-------------|----------|
| Prompts/Konversationen (lokal) | Während Session | Automatisch bei Session-Ende |
| Prompts bei Anthropic | Gemäss Anthropic DPA | Max. 30 Tage (siehe DPA) |
| Claude Memory (~/.claude/) | Bis manuell gelöscht | Regelmässig prüfen und bereinigen |
| Git-History | Dauerhaft | Personendaten dürfen nicht committed werden |
| Testdaten/Fixtures | Projektlaufzeit | Nur anonymisierte Daten. Bei Projektende löschen |
| Logs | Max. 90 Tage | Automatisiert rotieren, keine Personendaten loggen |

### Backups

| Datenart | Aufbewahrung | Löschung |
|----------|-------------|----------|
| Projekt-Backups (ohne Personendaten) | Unbegrenzt | — |
| Backups mit Personendaten | Gemäss gesetzlicher Aufbewahrungspflicht | Nach Wegfall des Zwecks |
| Inkrementelle Backups | Max. 1 Jahr | Älteste nach 1 Jahr rotieren |

Alle Backups werden **verschlüsselt** aufbewahrt.

### Gesetzliche Aufbewahrungspflichten (Schweiz)

| Datenart | Frist | Grundlage |
|----------|-------|-----------|
| Geschäftsunterlagen | 10 Jahre | OR Art. 958f |
| Buchhaltung | 10 Jahre | OR Art. 958f |
| Steuerunterlagen | 10 Jahre | DBG Art. 126 |
| Verträge | 10 Jahre nach Ablauf | OR Art. 127/128 |
| Personalakten | 5 Jahre nach Austritt | OR Art. 128 |

## Prozess bei versehentlicher Dateneingabe

1. Prompt-Session sofort beenden
2. Lokale Konversationsdaten löschen
3. Falls committed: Personendaten aus Git-History entfernen (BFG Repo-Cleaner)
4. Vorfall dokumentieren
5. Bei sensiblen Daten: Datenschutzverantwortlichen informieren

## Verantwortlichkeiten

| Aufgabe | Verantwortlich |
|---------|---------------|
| Einhaltung Löschfristen | Projektleiter |
| Backup-Rotation und Verschlüsselung | Ops/DevOps |
| Prüfung Claude Memory | Entwickler |
| Vorfallmeldung | Alle Beteiligten |

## Prüfintervall

Dieses Löschkonzept wird **jährlich** überprüft und bei Bedarf angepasst.
