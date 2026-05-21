# Changelog

Versions-Historie des Templates. Folgt [SemVer](https://semver.org):

- **MAJOR** — Breaking Change in der Template-Struktur (z.B. Hook-Pfade
  verschieben sich, `.template-manifest`-Format ändert sich, ein
  Pflicht-Doc wird umbenannt). Update erfordert manuelle Migration.
- **MINOR** — Neue Datei, neue Hook-Regel, neuer Slash-Command, neues
  Doc — abwärtskompatibel.
- **PATCH** — Bugfix in einem Hook, Typo-Fix, Klarstellung in einem Doc,
  zusätzlicher Testfall.

Jeder Eintrag enthält knapp: **Was**, **Warum**, ggf. **Migration**
für Projekte, die bereits auf einer früheren Version basieren.

## Tagging-Workflow

**Wer:** Der Template-Maintainer (Solo-Setup — vollprecht gestaltung).
Tags werden manuell vergeben, nicht automatisiert.

**Wann:** Sobald `main` einen kohärenten Stand hat, der in abgeleitete
Projekte gepullt werden soll. Nicht jeder Commit auf `main` bekommt
einen Tag — nur die, die als „freigegebene Template-Version" gelten:

- Hooks haben grüne Tests (`bash tests/hooks.sh`).
- CHANGELOG-Eintrag für diese Version ist geschrieben (oben in
  `[Unreleased]` → in neue `[x.y.z]` umbenennen).

**Wie:**

```bash
# 1. CHANGELOG-Block aus [Unreleased] in [x.y.z] umbenennen + Datum setzen
# 2. Commit: "release: vX.Y.Z"
# 3. Annotierter Tag direkt auf diesem Commit:
git tag -a vX.Y.Z -m "Release vX.Y.Z — kurze Zusammenfassung"
# 4. Push inkl. Tags
git push && git push --tags
```

**Welche Stelle increment-en?** Anhand der Liste oben (MAJOR/MINOR/PATCH).
Faustregel: wenn `/project:template-update` für einen bestehenden
Projektstand manuelle Eingriffe nötig macht → MAJOR. Wenn ein
abgeleitetes Projekt nach `--apply` einfach läuft → MINOR. Wenn nur ein
Hook-Detail oder eine Doc-Klarstellung passiert → PATCH.

**Verbindung zu `.template-version`:** Abgeleitete Projekte halten den
Tag-Namen, gegen den sie zuletzt geupdatet wurden, in
`.template-version` fest. `bin/template-update.py` liest `.template-version`,
checkt die getaggten Refs im Template-Repo und führt den 3-way-Diff
gegen den dort verlinkten Stand.

---

## [Unreleased]

(noch nichts)

---

## [1.5.0] — 2026-05-21

**Was:** `source_fallbacks` in `.template-version` für Multi-Maschinen-
Setups. `bin/template-update.py` akzeptiert jetzt eine YAML-Liste
absoluter Pfade als zusätzliche Fallback-Kandidaten nach `source:`.

- `bin/template-update.py`: `TemplateMeta.source_fallbacks` neu, von
  `read_version()` aus einer `source_fallbacks:`-Liste gelesen,
  von `write_version()` wieder rausgeschrieben. `resolve_source()`
  hängt die Fallbacks in Reihenfolge an die Kandidatenliste an;
  nicht-existente Fallbacks werden still übersprungen.
- `docs/template-versioning.md`: Abschnitt „Mehrere Maschinen /
  wechselnde Pfade" mit Beispiel-Snippet ergänzt.

**Warum:** Wenn dasselbe Projekt auf mehreren Maschinen mit
unterschiedlichen User-Homes liegt (Dropbox/iCloud zwischen
`/Users/tobias07` und `/Users/tobias06`), bricht der relative
`source:`-Pfad sobald die Projektdatei verschoben wird, und ein
absoluter Pfad funktioniert nur auf einer Maschine. Die
Fallback-Liste vermeidet pro-Maschinen-`settings.local.json`-Pflege.

**Migration:** Keine. Projekte ohne `source_fallbacks` verhalten
sich identisch.

---

## [1.4.4] — 2026-05-20

**Was:** Portabilität für Linux-CI hergestellt (drei Bugs aus
pls-INC006-questionaire zurückgemeldet).

- `package.json`: `"os": ["darwin"]` entfernt — blockierte `npm ci`
  auf Ubuntu-Runnern mit „Unsupported platform".
- `.claude/hooks/check-sandbox-bypass.sh` + `session-start.sh`:
  BSD-only `date -j -f` → portables GNU-first / BSD-fallback-Pattern.
- `tests/hooks.sh`: BSD-only `date -v-2M` → portables GNU-first /
  BSD-fallback-Pattern.

**Warum:** GitHub Actions läuft auf Ubuntu; alle drei Stellen silent-
failed auf GNU date, was CI zuverlässig rot machte.

---

## [1.4.3] — 2026-05-19

**Was:** `bootstrap.md` (Schritt 1, Template-Quelle bestimmen) verwendet
jetzt einen `$HOME`-relativen Default-Pfad. Wenn das Template am
Standard-Ort liegt, wird es ohne Rückfrage übernommen; `find` ist nur
noch Fallback.

**Warum:** Der bisherige `find "$HOME"/Library/CloudStorage/Dropbox-*/`
schlägt in zsh fehl, wenn das Glob `Dropbox-*/` vor `find` nicht
matcht (`no matches found`). Resultat: der Bootstrap fragt den User
trotzdem nach dem Pfad — bei jedem neuen Projekt aufs Neue. Der
Default-Pfad ist über alle vollprecht-Maschinen identisch
(`$HOME/Library/CloudStorage/Dropbox-vollprechtgestaltung/vollprecht
gestaltung/90_dev/__claude_base/_claude-tmpl-base`), nur das
User-Verzeichnis variiert.

**Migration:** Keine — `bootstrap.md` ist im `.template-manifest`
getrackt; Derivate ziehen den Fix via `/project:template-update`.

---

## [1.4.2] — 2026-05-18

**Was:** Session-Commands umbenannt — `/project:start` und `/project:end`
ersetzen die bisherigen Varianten.

**Warum:** Kürzere, intuitivere Namen. `/project:start` ist neu und
formalisiert den manuellen Session-Start (Hook-Output verarbeiten,
Memories laden, User briefen). `/project:end-session` → `/project:end`
(gleicher Inhalt, kürzerer Name).

- `.claude/commands/start.md` neu — 4-Schritt-Anleitung: Hook ausführen,
  Memories verarbeiten, Warnungen beachten, User melden.
- `.claude/commands/end.md` neu (ersetzt `end-session.md`) — identischer
  Inhalt, kürzerer Dateiname.
- `.claude/commands/end-session.md` gelöscht.
- `CLAUDE.md` → „## Available Skills": beide Commands gelistet,
  `end-session` entfernt.

**Migration:** `/project:end-session` → `/project:end` in eigenen
Workflows/Docs ersetzen.

---

## [1.4.1] — 2026-05-18

**Was:** Slash-Command `/project:end-session` als expliziter Trigger
zum Session-Ende.

**Warum:** Der Stop-Hook nagt erst beim tatsächlichen Stop — manchmal
will man die Session aber aktiv „abschließen" (Bestandsaufnahme,
DSG-Check, Verdichten nach decisions/todos, dem User vor Stop zeigen).
Der Command formalisiert genau diesen Pfad.

- `.claude/commands/end-session.md` neu (in beiden Templates) —
  6-Schritt-Anleitung: Bestandsaufnahme, Summary nach Format-Spec
  schreiben, DSG-Check, Verdichten prüfen, User zeigen, Stop.
- `CLAUDE.md` → „## Available Skills": Command gelistet.

**Migration:** Keine. Additiv.

---

## [1.4.0] — 2026-05-18

**Was:** Session-Summary-Workflow. Jede produktive Session hinterlässt
einen Summary in `docs/sessions/YYYY-MM-DD-HHMM.md`. Der SessionStart-
Hook injiziert den jüngsten beim nächsten Aufschlag, der neue Stop-Hook
nagt einmal pro Session, wenn noch kein Summary für heute existiert.

**Warum:** Lange Session-Pausen vergessen Kontext. Eine kompakte
Anker-Notiz pro Session gibt der nächsten einen klaren Aufsetzpunkt
und entkoppelt das Erinnern vom unzuverlässigen „letzten Diff lesen".
Verdichten von Summaries → `docs/decisions.md` / `docs/todos.md`
bleibt manueller Akt.

- `docs/sessions/README.md` neu — Format-Spec inkl. DSG-Pflichten
  (Git-getrackt → keine Klarnamen, keine echten Tokens, keine
  sensiblen Internals).
- `.claude/hooks/stop-session-summary.sh` neu — Stop-Hook, blockt
  einmal pro Session mit Reminder, wenn keine `docs/sessions/YYYY-MM-DD*.md`
  existiert. Loop-Guard über `stop_hook_active`. Escape-Hatch
  `SESSION_SUMMARY_SKIP=1` für Tests.
- `.claude/settings.json`: Stop-Hook registriert.
- `.claude/hooks/session-start.sh`: injiziert den lexikographisch
  größten `YYYY-MM-DD-HHMM.md` aus `docs/sessions/` (README + Nicht-
  Datums-Files werden ignoriert).
- `CLAUDE.md`: neue Sektion „## Session Summary"; Workflow-Tabelle um
  Anknüpf-Trigger erweitert; `## Project Structure` listet
  `docs/sessions/`.
- `tests/hooks.sh`: 6 neue Test-Blöcke (Stop-Hook: 4 Pfade,
  SessionStart: newest pick + leerer Ordner).
- `.template-manifest`: `docs/sessions/README.md` als Template-Eigentum
  ergänzt; Session-Files selbst bleiben Projekt-Eigentum.

**Migration:** Keine. Stop-Hook ist additiv, ältere Projekte erben
ihn beim nächsten `/project:template-update`. Beim ersten Stop nach
Adoption nagt der Hook — das ist gewollt; ggf. `SESSION_SUMMARY_SKIP=1`
für einzelne Sessions setzen.

---

## [1.3.0] — 2026-05-18

---

## [1.3.0] — 2026-05-18

**Was:** Qualitäts-Refactor am Template selbst — Doku-Auslagerung,
SessionStart-Hook-Härtung und adaptive Memory-Injection. Kein neuer
Capability-Layer, keine breaking changes.

**Warum:** CLAUDE.md war an mehreren Stellen zu prosaisch geworden
(Sandbox-Bypass-Mechanik, Template-Versionierung, Pre-Commit-Details).
Diese Inhalte gehören hinter die `> When to read:`-Konvention in
`docs/`, damit CLAUDE.md selbst kompakt bleibt und Claude die Docs
gezielt öffnet, statt sie immer mitzulesen. Außerdem: Stale
Sandbox-Bypass-Marker konnten zwischen Sessions überleben, falls kein
zweiter Bypass-Versuch folgte; und Memory-Injection inlinte unabhängig
von der Sammlungsgröße alles in den Context.

- `docs/sandbox-bypass.md` neu — voller Bypass-Mechanismus inkl.
  Approval-Flow, Tamper-Schutz, beteiligte Files. CLAUDE.md verweist
  jetzt nur noch knapp dorthin.
- `docs/template-versioning.md` neu — Update-Pfad und Eigentumsmodell
  (Template vs. Projekt). CLAUDE.md gekürzt auf Verweis + Manifest-Hinweis.
- `.github/workflows/README.md` + `.githooks/README.md` neu — die
  jeweiligen Details (CI-Jobs, Pre-Commit-Checks) leben jetzt neben dem
  Code, nicht in CLAUDE.md.
- `.claude/hooks/session-start.sh`: räumt einen `.sandbox-bypass.marker`
  beim Session-Start auf, dessen TTL (60 s) abgelaufen oder dessen
  `granted_at:` nicht parsbar ist. Cleanup landet in
  `docs/sandbox-bypass.log` mit `reason=ttl_expired` bzw.
  `unparseable_or_missing_granted_at`.
- `.claude/hooks/session-start.sh`: adaptive Memory-Injection.
  `memory/` ≤ 8 KB → wie bisher voll inlined. Darüber: nur
  `memory/MEMORY.md` (der Index) injizieren, Claude liest Einzel-Files
  on demand via Read. Schwelle über `MEMORY_INLINE_THRESHOLD_BYTES`
  konfigurierbar.
- `tests/hooks.sh`: vier neue Test-Blöcke (stale removal + log,
  fresh preserve, malformed removal + log, below/above threshold).
- `.github/workflows/check.yml`: Hook-`chmod +x`-Check nutzt jetzt
  `tests/*.sh` statt `tests/hooks.sh`, damit neue Test-Files automatisch
  mitgenommen werden.
- `CHANGELOG.md`: Tagging-Workflow-Sektion neu (Solo-Maintainer-Prozess
  für Release-Cuts).
- `CLAUDE.md`: Sandbox-Bypass-, Template-Versioning- und Pre-Commit/CI-
  Sektionen auf Doc-Referenzen verschlankt. Memory-Section dokumentiert
  jetzt die adaptive Injection. Workflow-Tabelle um drei neue Trigger
  ergänzt (sandbox-bypass.md, template-versioning.md, CI/Pre-Commit-READMEs).

**Migration:** Keine. Abgeleitete Projekte können `/project:template-update`
laufen lassen; alle neuen Files sind additiv, alle Edits in
template-eigenen Files (CLAUDE.md ist projekt-eigen und bleibt
unangetastet — der Verschlankungs-Patch ist ein Vorschlag, kein Zwang).

---

## [1.2.0] — 2026-05-18

**Was:** Per-call user consent gate für `dangerouslyDisableSandbox: true`.
Vorher konnte Claude (gemäß SDK-Default) den Sandbox-Bypass nutzen, ohne
zu fragen. Jetzt ist Bypass per Default geblockt und nur freigeschaltet
durch eine explizite User-Bestätigung in genau dieser Session.

**Warum:** Eine Sandbox, die ungefragt umgangen werden kann, ist eine
Empfehlung, kein Schutz. Vor dieser Version war „Claude fragt vorher"
nur eine Verhaltenszusage — jetzt ist es technisch erzwungen.

**Inhalt:**

- `check-sandbox-bypass.sh` (PreToolUse, Bash): blockt
  `dangerouslyDisableSandbox: true` ohne frischen Marker. TTL 60s,
  single-use, Audit-Log in `docs/sandbox-bypass.log`.
- `record-sandbox-approval.sh` (PostToolUse, AskUserQuestion): erzeugt
  Marker nur bei striktem Header `Sandbox-Bypass anfordern` und User-
  Antwort `Bypass erlauben`.
- `block-marker-tamper.sh` (PreToolUse, Write/Edit/NotebookEdit):
  verhindert direktes Schreiben des Marker-Files.
- `block-destructive-bash.sh`: erweitert um Tamper-Schutz für den
  Marker-Pfad (jede Bash-Erwähnung von `.sandbox-bypass.marker` blockt).
- `tests/hooks.sh`: +21 Test-Cases. Total: 60/60.
- `.gitignore`: Marker + Audit-Log ausgeschlossen.

**Migration für bestehende Projekte:**

- `/project:template-update` ziehen — übernimmt die neuen Hooks und die
  `.gitignore`-Erweiterung automatisch.
- `settings.json` muss die neuen Hook-Einträge bekommen. Wenn die Datei
  lokal modifiziert ist und vom Update-Tool als „beides geändert"
  klassifiziert wird: manuell die `PreToolUse`-Bash-Chain um
  `check-sandbox-bypass.sh` und die neue `PostToolUse`-Sektion
  ergänzen (siehe Template).

---

## [1.1.0] — 2026-05-18

**Was:** Fresh-Duplicate-Detection im SessionStart-Hook +
claude-geführter Bootstrap via `/project:bootstrap`.

**Warum:** Der angedachte Workflow ist Finder-Duplikat + Umbenennen +
Claude Desktop, nicht CLI. Vor dieser Version musste der User
`rm -rf .git && git init && python3 bin/template-update.py --init && ...`
manuell ausführen — was im Finder-Workflow nie passierte. Folge:
Commits auf der Template-Git-Historie, Template-Meta-Inhalt in CLAUDE.md
und docs/decisions.md, kein Update-Pfad.

**Inhalt:**

- `session-start.sh`: erkennt fehlende `.template-version` + nicht-Template-
  Basename und gibt prominente „FRESH TEMPLATE DUPLICATE — BOOTSTRAP
  REQUIRED"-Warnung aus. Inkl. Dropbox-Sync-Race-Protection via
  git-log-Check auf den Bootstrap-Commit.
- `bin/bootstrap-mechanical.sh`: atomische Git-/Init-/Hook-/Commit-Operationen.
  Refuses to run in template itself; refuses if `.template-version` already
  exists.
- `.claude/commands/bootstrap.md`: Slash-Command führt Claude durch
  Schritt 1 (Quelle finden) bis Schritt 5 (Verifikation), inklusive
  inline-Skeleton für `docs/decisions.md` (Template-ADRs raus).
- CLAUDE.md Workflow-Trigger-Tabelle um die Zeile „FRESH TEMPLATE
  DUPLICATE → `/project:bootstrap`" ergänzt.

**Migration für bestehende Projekte:**

- Bereits bootstrapped (`.template-version` vorhanden): nichts zu tun.
- Manuell aufgesetzt ohne `.template-version`: in der nächsten Session
  fragt Claude automatisch nach dem Bootstrap. Wer das nicht will, legt
  `.template-version` selbst an (Format: drei Zeilen `version:`, `source:`,
  `adopted_at:`).

---

## [1.0.0] — 2026-05-18

Erste getaggte Version. Alles, was bisher passiert ist, ist Baseline.

**Inhalt:**

- Claude-Code Settings + Sandbox (`.claude/settings.json`)
- Hooks:
  - `SessionStart` injiziert Memories (full), Doc-Index mit
    `> When to read:`-Triggern, offene TODOs, Git-Status, Stack-/
    Context-Vollständigkeitswarnung
  - `block-external-memory.sh` blockiert Writes nach
    `~/.claude/projects/<hash>/memory/`
  - `block-destructive-bash.sh` regex-blockiert `rm -rf`, force-push,
    `reset --hard`, `--no-verify` etc.
- `tests/hooks.sh` mit 39 Test-Cases; Pre-Commit ruft Tests auf
  Hook-Änderungen automatisch
- `.github/workflows/check.yml` für CI (template-integrity + project-stack)
- `.githooks/pre-commit` opt-in (Secret-Scan, .env-Block, JSON-Validate)
- DSG/DSGVO-Doku ausgelagert: `docs/privacy.md`, `docs/loeschkonzept.md`
- Persistence-Regeln in `docs/persistence.md` (Dropbox-Multi-Machine)
- ADR-light in `docs/decisions.md` mit Status-Feld + Append-only
- Tech-Stack-Lock (`docs/stack.md`) mit Pflicht- und Conditional-Feldern
- `> When to read:`-Konvention für alle `docs/*.md`, mechanisch
  enforced via SessionStart-Hook + CI
- Slash-Commands `setup-check`, `dsg-check`, `security-audit` mit
  echten Bash-Vor-Checks (kein reines Prompt-Theater)
- Seed-Memory `memory/template_baseline.md`
- `package.json` mit `engines.node >= 20`, `os: [darwin]`

**Migration:** entfällt (erste Version).
