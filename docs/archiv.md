# Archivierung & Wiederinbetriebnahme

> When to read: bevor Supabase- oder Vercel-Projekt gelöscht werden, wenn die
> App nach der Einmottung wieder aufgebaut werden soll, oder wenn jemand fragt,
> wo der Stand des Projekts nach Abschluss liegt.

**Status: abgeschlossen am 2026-09-07.** Archiv verifiziert, Freigabe der
Agentur eingeholt, Vercel- und Supabase-Projekt gelöscht. Ab hier existiert das
Projekt nur noch in diesem Repository.

## Grundsatz

**Das Git-Repository ist der Archivstand, nicht Supabase.** Die Online-Dienste
werden gelöscht; alles, was zum Wiederaufbau nötig ist, liegt im Repo. Kein
Schritt der Wiederinbetriebnahme setzt voraus, dass ein pausiertes oder
gelöschtes Supabase-Projekt wiederherstellbar ist.

## Was wo liegt

| Bestandteil | Ort im Repo | Stand |
|---|---|---|
| DB-Schema (Tabelle, RLS, Grants, `get_vote_counts`) | `docs/supabase-setup.sql` | gegen Live-DB verifiziert 2026-09-07 |
| Edge Function `submit-vote` | `supabase/functions/submit-vote/index.ts` | identisch mit deployter Version 10 |
| Frontend (Svelte 5 + Vite 6, PWA) | `src/`, `public/`, `index.html`, `vite.config.js` | — |
| Hosting-Konfiguration (CSP, Cache, Cron) | `vercel.json` | — |
| Heartbeat gegen Free-Tier-Pause | `api/heartbeat.js` | — |
| Betriebs-Tooling | `bin/`, Doku in `docs/ops-tooling.md` | — |
| **Vote-Daten (produktiv)** | `backups/votes-2026-08-31-0900-post-messe.csv` | **2 Zeilen — vollständig** |
| Vote-Daten (Testphase, vor Wipe 24.08.) | `backups/votes-2026-08-24-pre-wipe.csv` | 605 Zeilen |

## Verifikation 2026-09-07

Gegen das Live-Projekt `zgqxmooimqhugszgreki` geprüft, bevor gelöscht wird:

- **Daten vollständig.** Live-Tabelle: 2 Zeilen, 1 `device_id`, `created_at`
  von `2026-08-27 07:34:48` bis `2026-08-28 10:46:04` UTC. Deckungsgleich mit
  der committeten CSV. **Ein weiterer Snapshot ist nicht nötig.**
- **Edge Function ohne Drift.** Deployte Version 10 ist zeichengleich mit dem
  Repo-Quelltext. (Relevant, weil ein Repo-Push die Function *nicht*
  mitdeployt — siehe ADR 2026-06-25.)
- **Eine Schema-Lücke gefunden und geschlossen:** die Live-Tabelle führt die
  Spalte `voted_at`, die im Setup-SQL fehlte. Ein Wiederaufbau aus dem alten
  Skript hätte eine Tabelle erzeugt, in die `submit-vote` nicht schreiben kann.
  `docs/supabase-setup.sql` ist ergänzt.
- **Sonst keine Abweichung:** nur die Tabelle `votes` im Schema `public`, ein
  Index (`votes_pkey`), zwei Constraints, eine Function (`get_vote_counts`).

## Was NICHT im Repo liegt

Bewusst nicht — beim Wiederaufbau neu zu beschaffen bzw. neu zu erzeugen:

- **Supabase-URL, Anon-Key, Service-Role-Key.** Stehen lokal in `.env`
  (gitignored) und in den Vercel-Env-Variablen. Nach dem Löschen des Projekts
  sind sie ohnehin ungültig — ein neues Projekt bringt neue Werte mit.
- **`CRON_SECRET`** (Vercel-Env, optional).
- **Die Vercel-Domain `questionnaire-260506.vercel.app`.** Nach dem Löschen
  nicht reserviert. Sie steht als Fallback-Default im Quelltext der Edge
  Function (`index.ts:5`) und in der Vercel-CSP — beim Wiederaufbau anzupassen.

Die eigentliche Abhängigkeit ist damit **nicht** die Datenbank, sondern der
Bestand des Git-Repositorys (Dropbox + GitHub-Remote).

## Wiederinbetriebnahme

Reihenfolge beachten: die Edge Function braucht die Vercel-Domain, die es vor
Schritt 5 noch nicht gibt. Deshalb wird sie in Schritt 6 ein zweites Mal
angefasst.

1. **Repo auschecken**, Tag `archiv-2026-09-07` (Stand bei Einmottung).
   `npm install`, `npm run test`, `npm run build` als Funktionsnachweis —
   läuft ohne Backend.
2. **Supabase-Account und -Projekt neu anlegen.** Nicht nur das Projekt wurde
   gelöscht, sondern der ganze Account (siehe Abbau unten) — ein Wiederaufbau
   beginnt bei null. Ursprung zum Vergleich: Region `eu-west-3`, Postgres 17.
3. **Schema aufsetzen:** `docs/supabase-setup.sql` vollständig im SQL Editor
   ausführen.
4. **Daten importieren** (nur falls die historischen Votes gebraucht werden):
   `backups/votes-2026-08-31-0900-post-messe.csv` über den Table Editor
   importieren. Die Spaltenreihenfolge der CSV entspricht dem Schema.
5. **Frontend deployen:** Repo bei Vercel importieren, Env-Variablen setzen
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUBMIT_VOTE_URL`,
   optional `CRON_SECRET`), deployen → Domain notieren.
6. **Edge Function deployen und auf die Domain zeigen:**
   `supabase functions deploy submit-vote --project-ref <neue-ref>`, dann
   `supabase secrets set ALLOWED_ORIGIN=https://<neue-domain>`. Ohne das
   scheitert jeder Vote an CORS.
7. **Abnahme:** `npm run health -- --origin=https://<neue-domain>` — prüft
   Erreichbarkeit, Zeilen-Count und CORS-Preflight in einem Lauf.
8. **Nur bei erneutem Live-Betrieb:** Uptime-Monitoring neu aufsetzen. Der
   Endpoint dafür existiert weiterhin (`api/ping.js`, unauthentifiziert, gibt
   `{ok:true}`) — bewusst getrennt vom `CRON_SECRET`-geschützten
   `api/heartbeat.js`.

Weiterführend: `docs/build-plan.md` (Aufbaureihenfolge der App),
`docs/heartbeat.md` (Cron gegen Free-Tier-Pause), `docs/ops-tooling.md`.

## Abbau — ausgeführt 2026-09-07

1. [x] **Zeilen-Count final geprüft.** Live-Tabelle unverändert bei 2 Zeilen,
       einem Gerät, identischen Zeitstempeln zur committeten CSV. Ein
       Pre-Delete-Snapshot war damit nicht nötig.
2. [x] **Vercel-Projekt gelöscht** — mitsamt Deployment, Domain und
       Heartbeat-Cron.
3. [x] **Supabase-Projekt gelöscht.**
4. [x] **UptimeRobot-Monitor gelöscht.** Zeigte auf `/api/ping` der gelöschten
       Vercel-Domain und hätte sonst dauerhaft Alarm geschlagen.
5. [x] **Supabase-Account vollständig gelöscht**, nicht nur das Projekt —
       Entscheid des Users, „sauberer". Der Account war zu dem Zeitpunkt leer
       (null Projekte, Free-Plan). Damit ist auch das Personal Access Token
       der MCP-Anbindung erledigt, das mit dem Account ungültig wird.
       Konsequenz: ein Wiederaufbau beginnt mit der Account-Anlage.
6. [x] **`.env` bleibt lokal liegen** — Entscheid des Users. URL und Anon-Key
       zeigen auf ein gelöschtes Projekt, laufen also ins Leere; die Datei ist
       gitignored und verlässt das Arbeitsverzeichnis nicht. Kein Risiko, kein
       Aufräumbedarf.

**Nachtrag zur Vollständigkeit:** Der Monitor ist beim Aufstellen der
Checkliste übersehen worden. Er war nur im Session-Summary vom 2026-05-21
dokumentiert, nicht in den TODOs. Lehre für den nächsten Abbau: nicht nur die
eigenen Dienste aufzählen, sondern fragen, **was von aussen auf das Deployment
zeigt** — Monitoring, Cron-Dienste, installierte PWAs auf fremden Geräten,
geteilte Links.

Weiterhin offen an fremder Stelle: **auf den iPads der Agentur ist die PWA
installiert** und zeigt ab jetzt dauerhaft „Server nicht erreichbar". Falls die
Geräte weiterverwendet werden, gehört sie dort entfernt — das liegt bei der
Agentur.

Nicht zu tun: Repo-Inhalte aufräumen, `backups/` löschen oder die Doku
ausdünnen. Der Wert des Archivs liegt genau darin.

## Datenschutz

Beide CSV-Exporte enthalten `uuid, smallint, text (Geräte-UUID), timestamptz,
timestamptz` — **keine personenbezogenen Daten.** `device_id` ist eine
client-generiert Kennung des iPads, keiner Person zugeordnet und nach der
Messe ohne Bezug. Nach `docs/loeschkonzept.md` fallen die Exporte damit unter
„Projekt-Backups (ohne Personendaten) — Aufbewahrung unbegrenzt"; sie dürfen
im Repo bleiben.
