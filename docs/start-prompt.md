# Vibe Coding Start Prompt

```
Wir starten die Entwicklung einer iPad-Kiosk PWA für Messe-Abstimmungen.

Lies zuerst:
- CLAUDE.md
- docs/pitfalls.md

Projektkontext ist in der Memory gespeichert — bitte laden.

## Was gebaut wird

2-Screen PWA (iPad only, Fullscreen via Homescreen):
1. Vote-Screen: Logo, Frage, 4 Buttons
2. Ergebnis-Screen: CSS-animiertes Balkendiagramm mit %, Auto-Reset nach X Sekunden

Mehrere iPads schreiben gleichzeitig in dieselbe Datenbank.

## Stack

- Vite + Svelte
- Supabase (PostgreSQL) — Ergebnisse per Polling alle 2–3s, kein Realtime
- Deploy: Vercel
- Keine externen Schriftarten oder Icons — alles bundeln

## Anforderungen

- Supabase RLS konfigurieren: INSERT + SELECT erlaubt, UPDATE/DELETE verboten
- Button nach Tap sofort deaktivieren bis Reset (kein Double-Vote)
- Wake Lock API beim Start aufrufen (iOS 16.4+)
- Vote mit crypto.randomUUID() versehen, UNIQUE constraint auf vote_id
- Verbindungsindikator (klein, dezent) für Setup/Debugging
- Smoke-Test beim App-Start: Ping an Supabase
- Reset-Timer als konfigurierbare Konstante
- Einfaches Retry bei fehlgeschlagenem Vote (3 Versuche), danach Fehlermeldung für Besucher
- Alle Assets lokal gebundelt

## Schema (minimal)

votes: id (uuid), option (1–4), device_id, timestamp

## Frageinhalt

- Frage: "Was verändert diese Erfahrung für Sie?"
- A1: Eine neue Perspektive
- A2: Mehr Empathie
- A3: Besseres Verständnis
- A4: Verstärkter Handlungsbedarf

## Konfiguration

- Reset-Timer: 60 Sekunden (konfigurierbare Konstante)
- Branding: vorerst kein — wird später ergänzt
```
