# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Klickbarer Fragebogen-Prototyp (Questionnaire) für puls — Auftrag
INC006. Browser-basiert (Svelte 5 + Vite 6, Plain JS), PWA-fähig
(iPad-Offline-Szenario), Supabase-Backend (Edge Function + PostgreSQL),
Deployment via Vercel. Dient internen Stakeholder-Reviews vor der
Production-Implementierung. Kein persistentes Auth, keine
Analytics-Integration.

## Common Commands

- `npm run dev` — Vite Dev-Server starten (localhost)
- `npm run build` — Production-Build nach `dist/`
- `npm run preview` — gebauten Build lokal vorschauen
- `npm run test` — Vitest (Unit-Tests in `src/`)
- `npm run lint` — ESLint (alle JS/Svelte-Dateien)
- `npm run format` — Prettier (alle unterstützten Dateien)
- `bash tests/hooks.sh` — Hook-Test-Suite. Pre-Commit ruft das
  automatisch auf, wenn `.claude/hooks/*` oder `tests/hooks.sh` geändert
  wurde. **Bei jeder Änderung an einem Hook: Tests anpassen, nicht
  abschalten.**
- `bash .claude/hooks/session-start.sh` — manual fallback for the
  SessionStart context injection (used when running outside Claude Code).
- `/project:setup-check` — verify the template's config files are intact.
- `/project:dsg-check` — Swiss DSG / EU DSGVO scan.
- `/project:security-audit` — secrets / vulnerabilities / unsafe patterns.
- `/project:template-update` — pull updates from the base template
  (3-way diff: baseline / project / template; see `bin/template-update.py`).
- `/project:bootstrap` — only used once per new project, when the
  SessionStart-Hook signals „FRESH TEMPLATE DUPLICATE" (Finder-Copy-
  Workflow). Führt durch Initialisierung: Fragen, Edits, Git-Reset,
  Template-Tracking. Siehe `.claude/commands/bootstrap.md`.

## Language

- Code comments and commit messages in English
- User-facing content in German

## Conventions

- Keep files minimal and well-structured
- Follow existing Webflow project patterns where applicable
- No unnecessary dependencies

## Code Quality

- Follow existing code style — do not introduce new patterns without discussion
- No hardcoded secrets, API keys, or credentials in code
- Validate all external input (user input, API responses)
- Prefer simple, readable code over clever abstractions

## Git Conventions

- Branch naming: feature/, fix/, chore/
- Commit messages: imperative mood, max 72 chars subject line
- One logical change per commit

## Sandbox-Bypass — niemals ungefragt

`dangerouslyDisableSandbox: true` ist per Default geblockt. Bypass nur
über expliziten User-Klick auf `AskUserQuestion` mit Header **exakt**
`Sandbox-Bypass anfordern` und Option `Bypass erlauben`. Single-use,
TTL 60 s. Die SDK-Default-„retry-mit-Sandbox-aus"-Logik gilt hier
**nicht**.

Voller Mechanismus + beteiligte Files: [`docs/sandbox-bypass.md`](docs/sandbox-bypass.md).

## Settings

- Sandbox and permissions configured in `.claude/settings.json`.
- Filesystem sandboxed to project directory only.
- **Network allowlist is intentionally minimal** (`github.com`, `npmjs.org`).
  Every project extends this list in its own `.claude/settings.json`
  with the domains it actually needs (e.g. `supabase.co`, `vercel.app`,
  `*.webflow.com`). Do not widen the template's defaults — extend in
  the consuming project.
- **Deny rules are stolperschutz, not security.** Glob patterns in
  `permissions.deny` only catch literal typos. The real safety net is
  the PreToolUse hook `.claude/hooks/block-destructive-bash.sh`, which
  regex-matches destructive intent regardless of argument order or
  pipe/`&&` chaining.
- Sensitive paths blocked (`~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.env`).
- Personal overrides go in `.claude/settings.local.json` (gitignored).
  Use ONLY for truly machine-specific values — anything that should be
  available on other machines belongs in `.claude/settings.json`.

## Platform

**macOS only.** Hooks use bash + standard Unix tools (`awk`, `sed`,
`grep`, `git`). Windows is not supported; if it becomes relevant later,
the hooks need to be rewritten in a cross-platform language.

## Portable Persistence

Volle Regeln in [`docs/persistence.md`](docs/persistence.md).
Operative Summary:

- Memories → `./memory/` (nie nach `~/.claude/projects/<hash>/memory/`,
  Hook blockt).
- Persistente TODOs → `docs/todos.md`; Decisions → `docs/decisions.md`.
- Keine Symlinks, keine absoluten Pfade in Inhalten.
- Bei jedem Sonderfall (Symlink-Wunsch, externer Pfad, neue
  Persistenz-Form): erst `docs/persistence.md` öffnen.

## Data Privacy (DSG / DSGVO)

Full rules in [`docs/privacy.md`](docs/privacy.md). Operative summary:

- Never put real personal data into code, tests, fixtures, logs, commits
  or prompts. Use fictional data (`max.mustermann@example.com`).
- Memories in `./memory/` are Git-shared → also no personal data there.
- Anthropic processes prompts in the US (SCCs, not Privacy Framework).
  Verify the DPA covers your use case before production use.
- CLAUDE.md is organizational policy, not technical enforcement —
  data typed into a prompt has already been transmitted.

## Project Context

> Fill these fields in when instantiating the template. The session-start
> hook flags this section as incomplete until the placeholders are gone.

- **Client:** puls
- **Project:** INC006 — Questionnaire-Prototyp
- **Deliverable:** Klickbarer Fragebogen-Prototyp im Browser, ohne persistente Datenhaltung.
- **Recipient:** puls intern (Stakeholder-Review) — Grundlage für Entscheid über Production-Umsetzung.
- **Out of scope:** Production-Backend, Authentifizierung, persistente Datenspeicherung, Analytics-Integration.

## Project Standards (Senior Level — mandatory)

Senior level means **raising the right questions upfront**, not flagging
gaps in retrospect. If a typical senior decision has not been made yet,
ASK before producing any artefact.

- Work at senior level: minimal, intentional, no over-engineering
- Structure before speed — a well-considered setup saves more time than fast execution
- Prefer deleting over adding — less is more
- No speculative abstractions or "just in case" patterns
- Scalability and clarity from day one: folder structure, naming, and conventions
  should make sense to someone seeing the project for the first time
- If something feels wrong, say so — don't just execute
- Point out when a request conflicts with good practice, then follow the user's decision

## Before Writing Code (mandatory gate)

Before generating, scaffolding or editing any source file, verify that
`docs/stack.md` is fully filled in. **No code until the stack is fixed.**

If `docs/stack.md` is missing or any field is empty / contains `?`:

1. **Stop.** Do not assume a stack (e.g. don't silently pick plain JS,
   don't silently pick TypeScript either).
2. Ask the user — one consolidated question listing the open fields and
   the senior-recommended default for each, with a one-line rationale.
3. Wait for the answer, write the decision into `docs/stack.md` (with a
   short reason under "Begründungen"), then proceed.

Specific senior defaults to propose unless project context says otherwise:

- **TypeScript strict** for any browser/Node project (early type safety
  is cheaper than retrofit)
- **Linter + formatter** configured before the first commit (ESLint/Biome,
  Prettier/Biome)
- **A test entry point** even if empty — wiring it later is more work
- **Package manager pinned** (one of npm/pnpm/yarn/bun) — not mixed

These are defaults to *suggest*, not to silently apply. The user decides;
the decision gets recorded.

## Project Structure

Vier Pflichtordner bleiben konstant über alle Projekte
(voller Baum: [`README.md`](README.md)):

- `.claude/` — Settings, Hooks, Slash-Commands
- `docs/` — Stack, Decisions, Privacy, Löschkonzept, TODOs
- `docs/sessions/` — Session-Summaries (chronologisch, git-getrackt)
- `memory/` — projekt-lokale Memories (Index: `MEMORY.md`)
- `.githooks/` — opt-in Pre-Commit
- `tests/` — Hook-Tests, Pre-Commit-enforced
- `bin/` — Tooling (Template-Update)

Projekt-spezifische Ordner (nach Portierung):

- `src/` — Svelte-App (App.svelte, main.js, components/, stores/, lib/)
- `public/` — statische Assets (Icons, Manifest)
- `api/` — Vercel Serverless Functions (heartbeat.js)
- `supabase/functions/submit-vote/` — Edge Function (Deno/TypeScript)

## Template-Versionierung

Version: `.template-version`. Manifest: `.template-manifest`. Update via
`/project:template-update` oder `bin/template-update.py`. Vor dem Update:
[`CHANGELOG.md`](CHANGELOG.md) prüfen.

Eigentumsmodell (Template vs. Projekt) + Update-Details:
[`docs/template-versioning.md`](docs/template-versioning.md).

## Session Start

A `SessionStart` hook (`.claude/hooks/session-start.sh`) injects the
current project state automatically at the beginning of every session:
memory content (see below), the doc index with one-line summaries, open
TODOs, git status + recent commits, and a warning if Project Context
fields are still empty.

**Memory injection is adaptive:**

- `memory/` ≤ 8 KB total → all files inlined in full (current default).
- `memory/` > 8 KB total → only `memory/MEMORY.md` (the curated index)
  is injected; individual memory files are read on demand via the Read
  tool when their hook matches the request.

**Required behavior — do this before anything else:**

1. Read the injected memories (full content or index — depends on mode).
   In index-only mode: when a request matches a hook in `MEMORY.md`,
   open the referenced file before answering.
2. Skim the docs index from the hook output and read on demand by relevance.
3. If the hook flagged Project Context as incomplete: **stop and ask the user.**
4. If the hook is not available (e.g. running outside Claude Code), fall back
   to manually reading `memory/MEMORY.md` + every file in `memory/`,
   plus `docs/todos.md` and `docs/decisions.md`.

**At end of session:**

- Is `## Project Structure` in this file still accurate? Update if folders
  or key files changed.
- Did any decision conflict with `## Project Standards`? Flag it so the
  user can decide whether to revise.
- Did anything worth remembering across sessions emerge? Save it as a
  memory file in `./memory/` and link from `memory/MEMORY.md`.
- **Session-Summary schreiben** — siehe `## Session Summary` unten.

## Session Summary

Jede produktive Session hinterlässt einen Summary in `docs/sessions/`.
Der SessionStart-Hook injiziert den jüngsten beim nächsten Aufschlag,
der Stop-Hook erinnert, wenn noch keiner für heute existiert.

- **Pfad:** `docs/sessions/YYYY-MM-DD-HHMM.md` (lokale Zeit)
- **Format + DSG-Pflichten:** [`docs/sessions/README.md`](docs/sessions/README.md)
- **Workflow:** kurz halten (eine A4-Seite ist viel). Wiederkehrende
  Entscheidungen nach `docs/decisions.md` heben, mehrfach offene
  TODOs nach `docs/todos.md`.

**Triviale Sessions** (keine Datei-Änderungen, keine Entscheidungen):
2-Zeilen-Stub schreiben oder mit dem User abklären, ob übersprungen
werden kann. Der Stop-Hook nagt einmal pro Session — beim zweiten
Stop wird er still.

## Available Skills

Custom slash commands for this project (`.claude/commands/`):

- `/project:start` — Load project state, memories, docs, and report session start
- `/project:end` — Write a session summary to `docs/sessions/` before stopping
- `/project:dsg-check` — Check code for Swiss DSG and EU DSGVO compliance
- `/project:setup-check` — Verify all config files are present and correct
- `/project:security-audit` — Scan for secrets, vulnerabilities, and unsafe patterns

## CI & Pre-Commit

- CI: GitHub Actions in `.github/workflows/check.yml` — Details in
  [`.github/workflows/README.md`](.github/workflows/README.md).
- Pre-Commit: opt-in via `git config core.hooksPath .githooks` — Details
  in [`.githooks/README.md`](.githooks/README.md).

Beide Seiten nutzen dieselben Checks; CI ist die Verteidigungslinie.

## Workflow

Vor der ersten inhaltlichen Antwort in einer Session prüfen, welche
Docs für die Anfrage relevant sind, und **sie lesen, nicht raten**.

Der SessionStart-Hook injiziert für jede `docs/*.md` einen
`> When to read:`-Trigger — dieser Trigger ist verbindlich. Wenn der
Anlass passt: Datei vollständig öffnen, bevor geantwortet/editiert wird.

Schneller Überblick:

| Anlass | Pflicht-Read |
|---|---|
| Code schreiben / ändern (jede Sprache, jedes File) | `docs/stack.md` |
| Architektur-, Pattern- oder Prozess-Entscheidung | `docs/decisions.md` |
| Datenmodell, Logging, Auth, externe APIs, Forms, Analytics | `docs/privacy.md` |
| Aufbewahrung / Löschung von Daten | `docs/loeschkonzept.md` |
| Datei ablegen / Pfad / Symlink / Memory-Ablage | `docs/persistence.md` |
| „Was ist offen / als nächstes?" | `docs/todos.md` |
| Anknüpfen an letzte Session | jüngster `docs/sessions/*.md` (auto-injiziert) |
| Setup / Hooks / Templating-Frage | `README.md` + dieser Datei |
| Sandbox-Bypass nötig oder Hook-Block aufgetaucht | `docs/sandbox-bypass.md` |
| Frage nach Template-Version oder -Update | `docs/template-versioning.md` + `CHANGELOG.md` |
| CI- oder Pre-Commit-Frage | `.github/workflows/README.md`, `.githooks/README.md` |
| SessionStart meldet „FRESH TEMPLATE DUPLICATE" | `/project:bootstrap` — nichts anderes vorher |

Bei nicht-trivialen Anfragen kurz benennen, was gelesen wurde
(„Stack gecheckt, Decisions gescannt — los."). Das macht Lücken sichtbar.

**Konvention für neue Docs in `docs/`:** direkt nach dem H1 muss eine
Blockquote-Zeile `> When to read: <Trigger>` stehen, sonst warnt der
SessionStart-Hook. Diese Konvention ersetzt freie Prosa-Überschriften.

Weiterhin gilt:

- Vor jedem Push: Pre-Commit grün, manueller Smoke-Test, bei UI eine
  kurze Browser-Sichtung.
- Bei destruktiven Aktionen (Branch löschen, File wegwerfen, Migration
  rückwärts): erst nachfragen.
