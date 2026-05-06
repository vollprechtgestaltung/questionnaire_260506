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
4. Deploy — Build-Command: `npm run build`, Output: `dist/`

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
