# Rückflüsse ins Template (`_template-base-002`)

> When to read: wenn die nächste Session im Template-Projekt `_template-base-002` startet und die hier gesammelten Rückflüsse eingearbeitet werden sollen.

Zwei Teile, unabhängig voneinander abarbeitbar:

1. **Drei CI-Bugs** (unten als wörtlich kopierbarer Prompt) — entdeckt im
   Projekt `pls-INC006-questionaire`, Session 2026-05-20-1458, dort bereits
   gefixt.
2. **Eine fehlende Konvention** (`## Zusatz 2026-09-07`) — kein Bug, sondern
   eine Lücke, die erst beim Abbau desselben Projekts sichtbar wurde.

---

## Prompt (kopieren ab hier)

Im Projekt `pls-INC006-questionaire` sind in Session 2026-05-20
drei Template-Bugs aufgefallen, die GitHub-Actions-CI auf Ubuntu
zuverlässig rot machen. Alle drei sind macOS-spezifischer Code, der
auf Linux silent failed. Bitte ins Template zurückspielen.

### Bug 1 — `os: ["darwin"]` in `package.json`-Template

**Problem:** Wenn ein bootstrapped Projekt eine `package.json` mit
`"os": ["darwin"]` bekommt, scheitert `npm ci` auf Ubuntu-CI mit
"Unsupported platform" — der Run failed bevor er Tests erreicht.

**Fix-Entscheidung:** Das Feld komplett entfernen. Die macOS-only-
Stance ist über die Bash-Hooks und CLAUDE.md schon ausreichend
dokumentiert; `os`-Feld bringt keinen zusätzlichen Schutz, blockt
aber CI auf jeder Linux-Runner-Plattform (GitHub Actions, Vercel
Build-Step, etc.).

**Stelle:** Falls das Template ein `package.json` oder einen Bootstrap-
Schritt hat, der `os: ["darwin"]` schreibt — entfernen. Falls als
Default-Template-File vorhanden: löschen oder zu `["darwin","linux"]`
ergänzen.

---

### Bug 2 — BSD-only `date -j -f` in zwei Hooks

**Problem:** `date -j -f "%Y-%m-%dT%H:%M:%SZ" "$granted_at" "+%s"`
ist BSD-syntax (macOS). Auf Linux gibt es nur GNU `date -d`. Der
existierende `|| echo 0` Fallback macht aus jedem fehlgeschlagenen
Parsing einen `granted_epoch=0`, was den Marker als „uralt" wertet
und zwangs-cleant — was wiederum die Hook-Tests `fresh marker
preserved` und `marker consumed after allow` brechen lässt.

**Stellen:**
- `.claude/hooks/check-sandbox-bypass.sh` (war: Zeile 91)
- `.claude/hooks/session-start.sh` (war: Zeile 27)

**Fix-Pattern (portabel):**

```bash
# Portable ISO-8601 → epoch: GNU date (Linux/CI) first, BSD date (macOS) fallback.
granted_epoch=$(date -d "$granted_at" "+%s" 2>/dev/null \
  || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$granted_at" "+%s" 2>/dev/null \
  || echo 0)
```

GNU zuerst (CI), BSD als Fallback (macOS-Dev), `echo 0` als Last
Resort. Funktioniert auf beiden Plattformen.

---

### Bug 3 — BSD-only `date -v-2M` in `tests/hooks.sh`

**Problem:** `date -v-2M '+%Y-%m-%dT%H:%M:%SZ'` (BSD-syntax für „2
Minuten zurück") wird im Test verwendet, um einen stale-Marker-
Timestamp zu erzeugen. Auf Linux failed das silent → leerer String
→ der Hook loggt `unparseable_or_missing_granted_at` statt
`ttl_expired` → Test `stale cleanup logged with reason=ttl_expired`
failed.

**Stelle:** `tests/hooks.sh` (war: Zeile 300)

**Fix-Pattern (portabel):**

```bash
write_marker_at "$(date -d '2 minutes ago' '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -v-2M '+%Y-%m-%dT%H:%M:%SZ')"
```

GNU zuerst, BSD als Fallback.

---

### Verifikation

Nach dem Fix:

```bash
bash tests/hooks.sh          # muss lokal 73/73 grün bleiben
```

Echtes Verifizieren der Linux-Branch ist nur auf Linux möglich.
Optionen:
1. Im Template-Repo eine GitHub Action mit `runs-on: ubuntu-latest`
   die `bash tests/hooks.sh` ausführt — sollte sowieso vorhanden sein
   (siehe `.github/workflows/check.yml`). Push und CI-Lauf abwarten.
2. Lokal via Docker: `docker run --rm -v "$PWD":/work -w /work ubuntu:22.04 bash -c "apt-get update && apt-get install -y bash coreutils && bash tests/hooks.sh"`

### CHANGELOG-Eintrag (vorschlag)

```
v1.4.2 — CI portability fixes

- Remove `os: ["darwin"]` from bootstrap package.json default;
  macOS-only stance stays documented in CLAUDE.md and via bash hooks.
- Make ISO-8601 timestamp parsing in sandbox-bypass hooks portable
  between BSD (macOS) and GNU (Linux/CI).
- Make 'N minutes ago' helper in tests/hooks.sh portable.
```

### Template-Manifest

Wenn `.template-manifest` versioniert ist: Version auf `v1.4.2`
heben, Manifest und `.template-baseline/` neu generieren.

## Zusatz 2026-09-07 — dem Template fehlt eine Abbau-Konvention

Kein Bug. Das Template regelt Aufsetzen und Betrieb sauber, sagt aber nichts
darüber, wie ein Projekt **aufhört**. Beim Abbau von `pls-INC006-questionaire`
sind daraus zwei Fehler entstanden, von denen einer nur durch Zufall auffiel.

**Beobachtung 1 — die Abbau-Liste zählt die falsche Menge auf.** Ich hatte
sauber aufgelistet, *was wir betreiben* (Supabase, Vercel) und beides abgebaut.
Übersehen wurde ein UptimeRobot-Monitor, der auf einen Health-Endpoint des
Deployments zeigte und nach der Löschung dauerhaft Alarm geschlagen hätte. Er
war nur in einem vier Monate alten Session-Summary dokumentiert, nie in den
TODOs. Der User musste ihn erinnern.

Die richtige Frage ist nicht „welche Dienste betreiben wir?", sondern **„was
zeigt von aussen auf das Deployment?"** — Monitoring, externe Cron-/Ping-
Dienste, installierte PWAs auf fremden Geräten, geteilte Links, DNS-Einträge,
Webhooks. Das ist die Menge, die man beim Abbau abhaken muss.

**Beobachtung 2 — Setup-Skripte driften still.** Das `supabase-setup.sql` des
Projekts wich vom Live-Schema ab (eine Spalte fehlte, per Migration ergänzt und
nie zurückgeschrieben). Vier Monate unbemerkt, weil nie jemand aus dem Skript
neu aufgebaut hat. Wäre die Instanz vor der Prüfung gelöscht worden, hätte das
niemand mehr feststellen können — der Fehler wäre erst beim Wiederaufbau
aufgetaucht, ohne Referenz zum Abgleich.

Daraus: **Wer eine laufende Instanz abbaut, prüft vorher das Rekonstruktions-
Material gegen die Realität.** Danach ist die Referenz weg.

**Vorschlag für das Template**

- Eine `docs/archiv.md` als Template-File mit `> When to read:`-Trigger,
  analog zu `docs/loeschkonzept.md`. Inhalt: Verifikation vor dem Abbau
  (Daten, deployter Code vs. Repo, Schema-Skript vs. Live-Schema), die
  Frage „was zeigt von aussen darauf?", eine Abbau-Reihenfolge und eine
  Restore-Anleitung.
- Ergänzung in `CLAUDE.md` unter `## Workflow` in der Trigger-Tabelle:
  „Projekt abbauen / archivieren / Dienst abschalten → `docs/archiv.md`".
- Optional in `docs/persistence.md` oder im Session-Summary-README: **externe
  Dienste gehören bei der Einrichtung in `docs/todos.md`**, nicht nur in den
  Summary des Tages. Ein Summary ist ein Anker, kein Inventar — der
  SessionStart-Hook injiziert nur den jüngsten.

Die ausformulierte Fassung aus dem Projekt liegt in dessen `docs/archiv.md`
und kann als Vorlage dienen.

## Quellen

- Projekt-Commits, die die Fixes enthalten (in `pls-INC006-questionaire`):
  - `d13b0a4d` — `os: ["darwin"]` removal + doc triggers
  - `d3861ef9` — portable date parsing in hooks
  - `79bb3157` — portable 'N minutes ago' in test suite
- Session-Summary: `docs/sessions/2026-05-20-1458.md`
- Memory: `memory/feedback_ci_debugging.md`
- Zum Zusatz: `docs/archiv.md`, Session-Summary `docs/sessions/2026-09-07-0930.md`,
  Memory `memory/project_archivierung.md` (alle in `pls-INC006-questionaire`)
