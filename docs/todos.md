# TODOs

> When to read: am Anfang jeder Session UND vor "was ist offen / was als
> nächstes". Offene Punkte stehen unter `## Offen`. Der SessionStart-Hook
> injiziert diese bereits — diese Datei vollständig lesen, wenn Kontext
> zu einem TODO gebraucht wird.

Persistente Aufgabenliste für dieses Projekt. Wird via Dropbox/Git geteilt
und ist von jedem Rechner aus erreichbar.

Für sessions-interne Schritte (Multi-Step-Planung innerhalb einer
Konversation) wird weiterhin das ephemere TodoWrite verwendet — alles
was über die Session hinaus relevant bleibt, gehört hierher.

## Format

- `[ ]` offen · `[x]` erledigt · `[~]` in Arbeit
- Datum in ISO (YYYY-MM-DD), Owner optional in Klammern

## Offen

### Portierung Vorprojekt `_puls_questionaire-001` → dieses Projekt

Beschluss: Stack vom Vorprojekt übernehmen (Svelte 5 + Vite 6 + Supabase
+ Vercel + PWA), zunächst Plain JS, Supabase/Vercel reusen, alte Git-
History via Graft erhalten, Push manuell über VS Code.

**Phase 1 — Stack & Doku auf Realität ziehen (vor jedem Code-Edit)**

- [x] 2026-05-20 `docs/stack.md` neu setzen: JS / none / npm / eslint+prettier / browser, conditional auf vitest / vite / vercel / supabase / supabase-js+vite-plugin-pwa; Begründungen anpassen
- [x] 2026-05-20 `docs/decisions.md` ADR „Plain JS statt TS strict" (override Senior-Default) eintragen
- [x] 2026-05-20 `CLAUDE.md` → `## Project` knapp halten (Prototyp-Beschreibung ist schon ok, ggf. PWA/iPad-Kontext ergänzen)
- [x] 2026-05-20 `CLAUDE.md` → `## Common Commands` ersetzen: `npm run dev/build/preview/test/lint/format`
- [x] 2026-05-20 `CLAUDE.md` → `## Project Structure` um `src/`, `api/`, `supabase/`, `public/` ergänzen

**Phase 2 — Settings & Netzwerk (User-Freigabe erforderlich)**

- [x] 2026-05-20 `.gitignore` mit Vorprojekt-`.gitignore` mergen (Template ist Superset — kein Delta)
- [x] 2026-05-20 **User fragen**: Network-Allowlist in `.claude/settings.json` erweitern um `*.supabase.co`, `*.supabase.com`, `*.vercel.app`, `vercel.com` — freigegeben und eingetragen

**Phase 3 — Files portieren (kopieren, nicht klonen)**

- [x] 2026-05-20 `src/` komplett kopieren (App.svelte, main.js, components/, stores/, lib/ inkl. Tests)
- [x] 2026-05-20 `api/heartbeat.js` kopieren
- [x] 2026-05-20 `supabase/functions/submit-vote/index.ts` kopieren — `ALLOWED_ORIGIN` bleibt unverändert (Vercel-Domain reused)
- [x] 2026-05-20 `public/`, `index.html`, `vite.config.js`, `vercel.json`, `eslint.config.js`, `.prettierrc` kopieren
- [x] 2026-05-20 `.env.example` kopieren — **NIEMALS `.env`** (User kopiert echte Secrets von Hand)
- [x] 2026-05-20 `package.json` mergen: Scripts + Deps aus Vorprojekt, `name`/`version`/`private`/`license`/`author`/`engines`/`os` aus aktuellem Template-Wert behalten
- [x] 2026-05-20 Docs portieren nach `docs/`: `build-plan.md`, `offline-strategy.md`, `heartbeat.md`, `pitfalls.md`, `learnings.md`, `supabase-setup.sql`; `loeschkonzept.md` mit Template-Version mergen (Template ist Superset — kein Delta)
- [x] 2026-05-20 `docs/todo.md` aus Vorprojekt sichten und offene Punkte hier unter `## Offen` einsortieren (Messebauer-Übergabe-Block)

**Phase 4 — Install & Smoke-Test**

- [x] 2026-05-20 `npm install` (462 packages, 0 vulnerabilities)
- [x] 2026-05-20 `npm run lint` grün
- [x] 2026-05-20 `npm run test` grün (6 Dateien, 55 Tests)
- [x] 2026-05-20 `npm run build` durchläuft (PWA, 663ms)
- [x] 2026-05-20 **User-Schritt:** `npm run dev` + Browser-Klicktest grün

**Phase 5 — Git-History Graft (statt force-push)**

- [ ] 2026-05-20 Vorprojekt-`.git/` über aktuelles `.git/` kopieren (graft preserviert komplette Vorprojekt-History inkl. Remote-URL)
- [ ] 2026-05-20 Nach Graft: `git status` zeigt Template-Additions + Edits gegen Vorprojekt-HEAD; alles als **ein** Commit on top: „chore: rebase project on template v1.4.1 + bootstrap"
- [ ] 2026-05-20 Verifizieren: `git log --oneline` zeigt alte Commits + neuen Bootstrap-Commit linear
- [ ] 2026-05-20 Pre-Commit-Hook re-aktivieren (`git config core.hooksPath .githooks` — neue `.git/config` aus Graft hat das nicht mehr)
- [ ] 2026-05-20 User pusht via VS Code (kein force nötig, ist fast-forward)

**Phase 6 — Backend-Konfiguration (User-Schritt, nicht Claude)**

- [ ] 2026-05-20 User kopiert `.env` aus Vorprojekt von Hand
- [ ] 2026-05-20 Supabase-Projekt `zgqxmooimqhugszgreki` bleibt; Edge Function muss nicht redeployed werden, solange `ALLOWED_ORIGIN` unverändert

**Phase 7 — Session-Summary**

- [ ] 2026-05-20 `docs/sessions/2026-05-20-XXXX.md` schreiben: was portiert, was bewusst übersprungen, Git-Graft dokumentieren

**Risiken / Stolpersteine (zur Erinnerung):**

- TS-strict-Override muss in `docs/decisions.md`, sonst meckert Claude in jeder Session
- `.env` darf nirgendwo via Copy-Tool angefasst werden — nur User von Hand
- Network-Allowlist VOR Phase 5+6, sonst Sandbox-Block bei Supabase/Vercel-Calls
- Nach Graft: alte `.git/hooks/` aus Vorprojekt ist NICHT unser `.githooks/` — Pre-Commit muss neu aktiviert werden

### Übergabe an Messebauer (aus Vorprojekt übernommen)

Zu klären und dokumentieren vor dem Messeeinsatz.

**Setup iPad**

- [ ] Anleitung: Safari → Teilen → Zum Home-Bildschirm (PWA-Installation)
- [ ] iPad-Einstellungen: Auto-Lock «Nie», Lautstärke, Helligkeit, Benachrichtigungen aus, WLAN zum MiFi
- [ ] Schriftarten / Sprache prüfen

**Kiosk-Modus (Guided Access)**

- [ ] Guided Access aktivieren (Einstellungen → Bedienungshilfen → Geführter Zugriff)
- [ ] Code festlegen und dokumentieren
- [ ] Bedienungselemente einschränken (Home, Lautstärke, Touchbereiche)
- [ ] Test: Besucher kann App nicht verlassen

**Fehler-Handling vor Ort**

- [ ] Was tun bei rotem «Server nicht erreichbar»-Indikator?
- [ ] Was tun bei eingefrorenem Bildschirm? (Guided Access aufheben, App neu starten)
- [ ] Ansprechpartner am Messetag bei technischen Problemen definieren
- [ ] Backup-iPad vorbereiten und identisch konfigurieren

**Offline-Betrieb**

- [ ] Queue-Limit dokumentieren: 500 Votes pro iPad, letzte Zahlen bleiben sichtbar
- [ ] Verhalten bei aufgebrauchtem MiFi-Datenvolumen klären
- [ ] Empfohlene Mindest-Bandbreite festhalten

**Don'ts (Messepersonal)**

- [ ] iPad nicht komplett ausschalten (Standby reicht)
- [ ] Browser-/Website-Daten nicht löschen (Queue + Cache weg)
- [ ] Während aktivem Vote kein Neustart
- [ ] Keine anderen Apps während Messebetrieb
- [ ] iPad nicht länger in Hintergrund (Wake Lock geht verloren)

**Checkliste vor Messebeginn**

- [ ] Alle iPads im selben WLAN
- [ ] Alle iPads zeigen «Online»
- [ ] Testvote auf jedem iPad → erscheint auf allen anderen
- [ ] MiFi geladen und SIM-Datenvolumen aktiv
- [ ] Ersatz-Ladekabel und Powerbank dabei
- [ ] Notfall-Kontaktnummer dem Standpersonal kommuniziert

## Erledigt

<!-- - [x] 2026-05-15 Beispiel-Task -->
