# Build Plan — Puls Questionnaire PWA

Status-Legende: ⬜ offen · 🔄 in Arbeit · ✅ erledigt

---

## Schritt 1 — Projekt-Setup ✅
- Vite + Svelte Projekt initialisieren
- `vite-plugin-pwa` installieren und konfigurieren
- PWA Manifest: Fullscreen, iPad-optimiert, keine externen Assets
- Ordnerstruktur anlegen: `src/lib/`, `src/components/`, `src/stores/`
- `.env` für Supabase-Credentials, `.env.example` committen

## Schritt 2 — Konfiguration & Constants ✅
- `config.js` anlegen mit allen konfigurierbaren Werten:
  - `RESET_TIMER = 60` (Sekunden)
  - `POLL_INTERVAL = 2500` (ms)
  - `VOTE_RETRY_ATTEMPTS = 3`
  - Fragetext + 4 Antworten

## Schritt 3 — Supabase ✅
- `votes`-Tabelle anlegen: `id (uuid)`, `option (1–4)`, `device_id`, `timestamp`
- RLS konfigurieren: INSERT + SELECT erlaubt, UPDATE/DELETE verboten
- UNIQUE constraint auf `vote_id`
- Supabase-Client in `src/lib/supabase.js`
- Smoke-Test-Funktion: Ping bei App-Start

## Schritt 4 — App-State ✅
- Svelte Store: aktueller Screen (`vote` | `result`)
- Svelte Store: Abstimmungs-Ergebnisse
- `device_id` via `localStorage` (einmalig generiert, persistent)

## Schritt 5 — Vote-Screen ✅
- Frage + 4 Buttons
- Button nach Tap sofort deaktivieren (kein Double-Vote)
- Vote an Supabase senden mit Retry-Logik (3 Versuche)
- Bei Fehler nach 3 Versuchen: Fehlermeldung für Besucher
- Wake Lock API aktivieren (iOS 16.4+)

## Schritt 6 — Ergebnis-Screen ✅
- Polling alle 2–3s: Stimmen aus Supabase lesen
- CSS-animiertes Balkendiagramm mit %-Anzeige
- 60s Reset-Timer startet nach vollständiger Anzeige
- Nach Reset: zurück zu Vote-Screen, Buttons wieder aktiv

## Schritt 7 — Verbindungsindikator ✅
- Kleines, dezentes Status-Element (online / offline / error)
- Sichtbar auf beiden Screens — primär für Setup und Debugging

## Schritt 8 — PWA & iOS ✅
- Service Worker konfigurieren
- iOS-spezifische Meta-Tags (`apple-mobile-web-app-capable` etc.)
- Alle Assets lokal gebundelt, keine externen Requests

## Schritt 9 — Aufräumen & Review ✅
- Secrets-Check: keine Credentials im Code
- `simplify`-Review: unnötiger Code raus
- `CLAUDE.md` aktualisieren falls nötig

## Schritt 10 — Testing against Pitfalls ⬜
Basierend auf `docs/pitfalls.md`:

- **Double-Vote:** Schnelles Doppeltippen testen — Button muss nach erstem Tap sofort deaktiviert sein
- **Auto-Reset Timing:** Sicherstellen, dass Timer erst nach vollständiger Ergebnis-Anzeige startet
- **Display-Sleep:** Prüfen, ob Wake Lock greift — iPad-Einstellung "Auto-Lock → Nie" dokumentieren
- **Simultane Votes:** Zwei Geräte gleichzeitig abstimmen — %-Anzeige darf nicht flackern
- **Verbindungsausfall:** WLAN trennen während Abstimmung — Retry greift, Fehlermeldung erscheint
- **MiFi-Checklist:** Vor Messe: MiFi geladen, SIM aktiv, alle iPads verbunden

---

_Letzte Aktualisierung: 2026-05-06_
