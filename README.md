# Puls Questionnaire

iPad-Kiosk PWA für Messe-Abstimmungen. Vite + Svelte, Supabase, Vercel.

---

## Voraussetzungen

- Node.js 18+
- Supabase-Projekt mit eingerichtetem Schema (siehe `docs/supabase-setup.sql`)
- `.env` mit den Supabase-Credentials (siehe `.env.example`)

---

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App läuft unter **http://localhost:5173**

> Hinweis: Im Dev-Modus ist der Service Worker nicht aktiv.

---

## Lokale PWA-Vorschau (mit Service Worker)

```bash
npm run build
npm run preview
```

App läuft unter **http://localhost:4173**

Dieser Modus entspricht dem Produktionsverhalten inkl. Offline-Caching.

---

## Auf iPad testen (im lokalen Netz)

```bash
npm run dev -- --host
```

App ist dann unter der lokalen IP erreichbar, z.B. **http://192.168.1.x:5173**  
IP-Adresse wird im Terminal angezeigt. iPad muss im gleichen WLAN sein.

---

## Deployment (Vercel)

1. Repo mit Vercel verbinden
2. Framework: **Vite** (wird automatisch erkannt)
3. Umgebungsvariablen in Vercel setzen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUBMIT_VOTE_URL`
   - `CRON_SECRET` (optional, schützt Heartbeat-Endpoint)
4. Deploy — Build-Command: `npm run build`, Output: `dist/`

Der Vercel-Cron in `vercel.json` hält das Supabase-Projekt im Free-Tier
aktiv (siehe `docs/heartbeat.md`).

---

## Edge Function (Supabase)

Vote-Inserts laufen über die Edge Function `submit-vote` — nicht direkt via REST API.
Die Funktion validiert Input, erzwingt Rate Limiting und nutzt den Service Role Key serverseitig.

**CORS:** Die Edge Function akzeptiert Requests nur von der konfigurierten Domain.  
Bei Domain-Änderung muss `ALLOWED_ORIGIN` in `supabase/functions/submit-vote/index.ts:4` angepasst
und die Funktion neu deployed werden:

```bash
supabase functions deploy submit-vote --project-ref zgqxmooimqhugszgreki
```

Aktuelle Domain: `https://questionnaire-260506.vercel.app`

---

## Als PWA auf iPad installieren

1. App-URL in Safari öffnen
2. Teilen-Button → **Zum Home-Bildschirm**
3. App startet danach im Vollbild ohne Browser-UI

> iPad-Einstellung: **Einstellungen → Anzeige & Helligkeit → Auto-Sperre → Nie**

---

## Supabase Setup

SQL-Schema einmalig im Supabase SQL Editor ausführen:

```
docs/supabase-setup.sql
```

Erstellt die `votes`-Tabelle mit RLS (INSERT + SELECT erlaubt, kein UPDATE/DELETE).
