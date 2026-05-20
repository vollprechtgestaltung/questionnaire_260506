# Tech Stack

> When to read: Pflicht-Read vor jedem Source-File (neu oder Edit).
> Solange Felder leer/`?` sind, kein Code — stattdessen Stack mit User
> klären und hier eintragen.

Diese Datei fixiert die technischen Entscheidungen für das Projekt.
**Sie muss vollständig sein, bevor Code geschrieben wird.** Solange
ein Feld leer oder mit `?` markiert ist, fragt Claude beim User nach
statt eine Annahme zu treffen.

## Entscheidungen (Pflichtfelder)

Diese fünf müssen vor dem ersten Source-File gesetzt sein. `none`
ist eine gültige Antwort (z.B. „kein Test-Framework"), `?` ist es nicht.

- **Sprache(n):** JavaScript (Plain JS)
- **Typsystem:** none (TS-Migration nach Portierung als eigenes Workpaket geplant)
- **Package Manager:** npm
- **Linter + Formatter:** ESLint + Prettier
- **Ziel-Umgebung:** browser

## Entscheidungen (Conditional)

Nur ausfüllen, wenn auf das Projekt zutreffend. `n/a` markieren, wenn
absichtlich übersprungen — `?` blockiert weiterhin das Code-Gate.

- **Test-Framework:** Vitest
- **Build / Bundler:** Vite 6
- **Deployment:** Vercel
- **CMS / Backend:** Supabase (Edge Function `submit-vote`, PostgreSQL)
- **Externe APIs / SDKs:** supabase-js, vite-plugin-pwa

## Begründungen

Kurze Notiz pro Entscheidung, warum diese Option (nicht nur was).

> **Plain JS** — Vorprojekt liegt fertig in JS vor; TS-Migration ist eigenes Workpaket nach der Portierung (bewusster Override des Senior-Defaults → ADR in `docs/decisions.md`).
> **npm** — Default, kein Argument für pnpm/yarn/bun in einem Prototyp dieser Grösse.
> **ESLint + Prettier** — aus dem Vorprojekt übernommen; Biome wäre Alternative, aber Konfiguration steht bereits.
> **browser** — Prototyp läuft ausschliesslich im Browser, keine Node-Runtime nötig.
> **Vitest** — aus dem Vorprojekt übernommen; leichter Einstieg, Vite-nativ.
> **Vite 6** — Build + Dev-Server; aus dem Vorprojekt übernommen.
> **Vercel** — aus dem Vorprojekt übernommen; kostengünstig für Prototyp, Cron-Heartbeat via `api/heartbeat.js`.
> **Supabase** — aus dem Vorprojekt; Edge Function `submit-vote` und PostgreSQL-DB bleiben unverändert (Redeploy nicht nötig).
> **supabase-js + vite-plugin-pwa** — Vorprojekt-Deps; PWA für iPad-Offline-Szenario.

## Senior-Level-Erinnerung

Diese Liste ist keine Bürokratie. Sie verhindert, dass weiter unten im
Projekt moniert wird, „warum wurde X nicht von Anfang an gemacht".
Wenn eine Entscheidung explizit gegen einen Senior-Standard läuft
(z.B. „kein TypeScript" für ein neues Browser-Projekt), wird das hier
**dokumentiert begründet** — nicht stillschweigend übernommen.
