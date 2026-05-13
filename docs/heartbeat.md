# Supabase Heartbeat

Hält das Supabase-Projekt im Free-Tier aktiv. Free-Tier-Projekte werden nach
7 Tagen Inaktivität automatisch pausiert — dann wäre die App am Messetag tot.

## Funktion

`api/heartbeat.js` führt einen leichten Read-Query auf die `votes`-Tabelle aus.
Vercel Cron triggert sie täglich um 06:00 UTC (siehe `vercel.json`).

## Setup auf Vercel

### 1. Environment Variables setzen

Die Heartbeat-Function nutzt dieselben Variablen, die für den Frontend-Build
schon in Vercel hinterlegt sind:

- `VITE_SUPABASE_URL` (bereits gesetzt)
- `VITE_SUPABASE_ANON_KEY` (bereits gesetzt)

Vercel macht alle Env-Variablen auch in Serverless Functions verfügbar —
der `VITE_`-Präfix ist nur eine Vite-Konvention.

**Optional:** `CRON_SECRET` als neuen Env-Eintrag setzen (beliebiger
Zufallsstring). Schützt den Endpoint davor, dass jemand anders ihn anpingt.
Vercel sendet ihn automatisch als `Authorization: Bearer ${CRON_SECRET}`
Header bei Cron-Aufrufen. Ohne `CRON_SECRET` ist der Endpoint offen
erreichbar — auch ok, weil er nur einen harmlosen Read macht.

### 2. Cron-Plan prüfen

- **Hobby-Tier:** bis 2 Cron-Jobs, nur einmal pro Tag — passt
- **Pro-Tier:** beliebige Frequenz

### 3. Deploy

Beim nächsten Vercel-Deploy wird der Cron automatisch eingerichtet. Status
sichtbar unter Vercel → Project → Crons.

## Manuell testen

```
curl https://your-deployment.vercel.app/api/heartbeat
```

Erwartet: `{"ok":true,"timestamp":"..."}`

Mit `CRON_SECRET`:

```
curl -H "Authorization: Bearer YOUR_SECRET" https://.../api/heartbeat
```

## Wenn der Heartbeat ausfällt

Im Vercel-Dashboard unter Logs sichtbar. Bei wiederholtem Fehler:

1. Supabase-Projekt-Status prüfen (Dashboard → Project Settings)
2. Env-Variablen in Vercel kontrollieren
3. Notfalls manuell einloggen, das wirft Pause-Timer ebenfalls zurück
