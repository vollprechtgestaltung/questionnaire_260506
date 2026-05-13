# Offline-Strategie & Duplikat-Absicherung

## Übersicht

Die App muss auf Messen mit instabilem Netzwerk (MiFi) zuverlässig funktionieren.
Votes dürfen weder verloren gehen noch doppelt gezählt werden.

## Drei Szenarien beim Abstimmen

### 1. Offline (kein Netzwerk)
- **Erkennung:** `navigator.onLine === false` (sofort, kein Roundtrip)
- **Verhalten:** Vote wird direkt in `localStorage`-Queue gespeichert, kein Retry
- **UX:** Sofortiger Wechsel zum Ergebnis-Screen — kein Warten, keine Fehlermeldung

### 2. Online, Insert erfolgreich
- **Verhalten:** Vote direkt in Supabase geschrieben
- **UX:** Sofortiger Wechsel zum Ergebnis-Screen

### 3. Online, Insert schlägt fehl
- **Erkennung:** Supabase gibt Fehler zurück oder Request hat Timeout (4s pro Versuch)
- **Verhalten:** Bis zu 3 Retries mit je 4s Timeout. Nach letztem Fehlschlag → Queue
- **UX:** Loader (Spinner) sichtbar während Retries, danach Ergebnis-Screen

## Queue-Mechanismus

- **Speicherort:** `localStorage` unter Key `puls_vote_queue` (`src/lib/queue.js`)
- **Persistenz:** Überlebt App-Neustarts und iPad-Reboots
- **Flush-Trigger:** Nach jedem erfolgreichen Supabase-Poll im Ergebnis-Screen (alle 2.5s)
- **Einzeln abgearbeitet:** Jeder Vote wird einzeln inserted und bei Erfolg einzeln entfernt — kein Datenverlust bei Teilfehlern

## Duplikat-Absicherung (zwei Schichten)

### Schicht 1: Stabile Vote-ID
- `crypto.randomUUID()` wird **einmal** generiert, bevor die Retry-Loop startet
- Dieselbe ID geht durch alle Retries und in die Queue
- Kein Retry erzeugt eine neue ID

### Schicht 2: UNIQUE Constraint in Supabase
- Die `votes`-Tabelle hat einen UNIQUE Constraint auf der `id`-Spalte
- Wird ein Vote doppelt inserted (z.B. Retry hat doch geklappt, Response ging verloren, Queue liefert nochmal), lehnt Postgres mit Fehlercode `23505` ab
- `flushQueue()` behandelt `23505` als Erfolg und entfernt den Vote aus der Queue

### Warum zwei Schichten?
Die stabile ID allein reicht nicht: Wenn ein Insert durchgeht aber die HTTP-Response verloren geht (Netzwerkabbruch während Response), weiss die App nicht, dass der Vote in der DB ist. Sie queued ihn erneut. Ohne den UNIQUE Constraint wäre das ein Duplikat. Ohne die korrekte Behandlung von `23505` in `flushQueue()` würde der Vote endlos in der Queue kreisen.

## Beteiligte Dateien

| Datei | Rolle |
|-------|-------|
| `src/lib/queue.js` | localStorage-Queue (save, get, remove) |
| `src/lib/config.js` | `VOTE_RETRY_ATTEMPTS`, `VOTE_RETRY_TIMEOUT` |
| `src/components/VoteScreen.svelte` | Online-Check, Retry-Loop mit Timeout, Loader |
| `src/components/ResultScreen.svelte` | Polling, `flushQueue()` mit 23505-Handling |

## Bekannte Einschränkungen

- `navigator.onLine` erkennt nur, ob ein Netzwerk verbunden ist — nicht ob Supabase erreichbar ist. Daher braucht es trotzdem Retries mit Timeout für den Fall "WLAN da, Internet weg".
- Bei extrem langem Offline-Betrieb wächst die Queue in `localStorage`. Für den Messe-Einsatz (max. Stunden) ist das unkritisch.
