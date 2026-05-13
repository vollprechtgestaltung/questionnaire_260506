# Known Pitfalls & Bugs

Bekannte Fallstricke für PWA + Supabase Voting-App auf iPad (Messebetrieb).

## Touch / UX

### Double-Vote durch schnelles Doppeltippen
Button reagiert zweimal bevor der erste Request abgeschlossen ist.
**Fix:** Button nach erstem Tap sofort deaktivieren, erst nach Server-Bestätigung oder Reset wieder aktivieren.

### Auto-Reset Timing
- Timer startet nicht nach Vote (wenn Vote-Handling den Timer nicht explizit triggert)
- Besucher liest noch Ergebnis, Reset springt zu früh an
**Fix:** Reset-Timer erst nach vollständigem Anzeigen des Ergebnisses starten. Timeout gut testen.

## iPad / iOS

### Display-Sleep trotz Guided Access
Guided Access verhindert nicht den Auto-Lock. Nach ~2 Minuten schwarzer Bildschirm.
**Fix:** Auto-Lock in iPad-Einstellungen → Display & Helligkeit → "Nie" setzen. Muss vor Messe geprüft werden.

## Netzwerk / Supabase

### Simultane Votes, kurzes Flackern
Zwei iPads gleichzeitig → Polling-Intervall leicht versetzt → %-Anzeige kann kurz springen.
**Fix:** Polling-Intervall auf allen Geräten gleich, Ergebnis nur nach vollständigem Response rendern.

### Polling bei Verbindungsausfall
Kein Internet = Polls schlagen fehl, letzte bekannte Ergebnisse bleiben sichtbar, Countdown läuft weiter.

### Vote geht verloren bei Netzausfall
Alle 3 Retries schlagen fehl → Vote nicht in DB.
**Fix (implementiert):** Offline-Queue in `localStorage` (`src/lib/queue.js`).
- Vote wird lokal gespeichert, Nutzer landet trotzdem auf dem Ergebnis-Screen
- Queue wird nach jedem erfolgreichen Poll-Zyklus geleert (Votes nachgeliefert)
- localStorage überlebt App- und iPad-Neustarts — nur manuelles Löschen der Browser-Daten verliert die Queue

## Deployment / Setup

### MiFi-Abhängigkeit
Kein Internet = keine Supabase-Verbindung.
**Checklist vor Messe:** MiFi geladen, SIM-Datentarif aktiv, Verbindung aller iPads getestet.
