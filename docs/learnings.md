# Learnings — Puls Questionnaire

## Supabase Setup

### RLS allein reicht nicht — GRANT ist zwingend
Das kritischste Learning: Row Level Security (RLS) und Postgres-Berechtigungen sind zwei getrennte Schichten.
RLS-Policies erlauben zwar Operationen auf Zeilenebene, aber Postgres prüft zuerst die Tabellen-Berechtigungen.
Ohne expliziten GRANT gibt es 401 — obwohl RLS korrekt konfiguriert ist.

```sql
-- Immer nach den RLS-Policies ausführen:
GRANT SELECT, INSERT ON votes TO anon;
```

### URL-Tippfehler sind schwer zu erkennen
`zgqxmooimqhugszgreki` vs `zggxmooimghugszgreki` — kaum sichtbar, führt zu DNS-Fehler.
URL immer direkt aus dem Supabase Dashboard kopieren, nie abtippen.

### Neues Key-System (2025/2026)
Supabase hat von JWT `anon`-Keys (`eyJ...`) auf `sb_publishable_...` umgestellt.
Beide Keys sind aktiv und funktionieren. Die Dashboard-UI ist verwirrend — der richtige Key
für Client-Apps ist unter **Settings → API Keys → Publishable key** (oder legacy anon).

---

## Vite / lokale Entwicklung

### .env-Änderungen erfordern Server-Neustart
Vite liest Umgebungsvariablen beim Start ein — nicht live.
Nach jeder `.env`-Änderung: `Ctrl+C` → `npm run dev`.

### Browser-Defaults überschreiben CSS-Vererbung bei Buttons
`<button>` erbt `color` nicht von `body`. Immer explizit setzen:
```css
button {
  color: inherit;
}
```

---

## Testing / Deployment

### VPN blockiert Supabase
Beim lokalen Testen VPN deaktivieren — Supabase-Requests werden sonst geblockt.

### Vercel: Env Vars vor erstem Deploy setzen
Umgebungsvariablen (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) müssen in Vercel
gesetzt sein, bevor der erste Deploy ausgeführt wird. Nur Production-Vars nötig.

---

## Offline-Verhalten / Queue

### Optimistische UX statt Fehlermeldung
Bei Netzausfall sieht der Nutzer keine Fehlermeldung — der Vote wird lokal gespeichert
und er landet trotzdem auf dem Ergebnis-Screen. Niemand auf einer Messe unterscheidet
zwischen «App kaputt» und «Netzwerk ausgefallen».

### localStorage als Offline-Queue
`src/lib/queue.js` speichert fehlgeschlagene Votes in `localStorage`.
Queue wird in `ResultScreen` nach jedem erfolgreichen Supabase-Request geleert.
localStorage überlebt App-Neustarts und iPad-Reboots — Votes werden zuverlässig nachgeliefert.

### Vote-ID vor Retry-Loop generieren
`crypto.randomUUID()` muss einmalig vor der Retry-Schleife aufgerufen werden.
Wird die ID innerhalb der Schleife generiert, entstehen bei mehreren Versuchen
verschiedene IDs für denselben Vote — potenzielle Duplikate in der DB.

### Supabase RPC für Aggregation
`supabase.rpc('get_vote_counts')` statt `select('option')` — gibt nur 4 Zeilen zurück,
egal wie viele Votes existieren. Postgres-Funktion muss mit `GRANT EXECUTE ON FUNCTION ... TO anon` freigegeben werden.
