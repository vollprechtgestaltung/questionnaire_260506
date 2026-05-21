Initialisiere ein frisch dupliziertes Template als eigenständiges Projekt.

**Vorbedingung:** SessionStart hat „FRESH TEMPLATE DUPLICATE — BOOTSTRAP
REQUIRED" gemeldet. Wenn nicht: nicht ausführen.

## Ablauf

### Schritt 1 — Template-Quelle bestimmen

```bash
# Default-Pfad zuerst prüfen (identisch auf allen vollprecht-Maschinen,
# nur der User-Ordner unter /Users/ unterscheidet sich — daher $HOME).
TEMPLATE_DEFAULT="$HOME/Library/CloudStorage/Dropbox-vollprechtgestaltung/vollprecht gestaltung/90_dev/__claude_base/_claude-tmpl-base"
if [ -d "$TEMPLATE_DEFAULT" ] && [ -f "$TEMPLATE_DEFAULT/.template-version" ]; then
  echo "$TEMPLATE_DEFAULT"
else
  # Fallback: suche andere _claude-tmpl-* unter CloudStorage
  find "$HOME/Library/CloudStorage" -maxdepth 8 -type d -name "_claude-tmpl-*" 2>/dev/null | head -3
fi
```

Wenn der Default-Pfad existiert: ohne Rückfrage verwenden.

Sonst den ersten Fallback-Treffer dem User zur Bestätigung anbieten:
„Template-Quelle: `<pfad>` — passt das?"

Bei mehreren Treffern oder keinem: User nach dem absoluten Pfad fragen.

### Schritt 2 — Antworten einsammeln (eine Frage, vier Felder)

Eine konsolidierte Frage stellen, alle Felder auf einmal:

- **Projektname** (kurzer Slug, wird `package.json.name` + folder-reference)
- **Client** (Auftraggeber)
- **Deliverable** (was wird abgegeben)
- **Recipient** (wer empfängt das Ergebnis, wofür)
- **Out of scope** (was ist explizit nicht Teil des Projekts)

Plus Stack-Defaults in einer zweiten Frage:

- **Sprache(n)?** (TypeScript / JavaScript / HTML+CSS only / Python / andere)
- **Typsystem?** (TypeScript strict / JS / Python typed / none — Senior-Default: TypeScript strict)
- **Ziel-Umgebung?** (browser / node / edge / server-only)
- **Package Manager?** (npm / pnpm / yarn / bun / none — Default: npm)
- **Linter + Formatter?** (eslint+prettier / biome / ruff / none — Default: biome bei TS, n/a bei reinem HTML)

Conditional-Felder (Test-Framework, Build/Bundler, Deployment, CMS/Backend,
externe APIs/SDKs) **nicht aktiv abfragen** — als `n/a` setzen, falls
User sie später wirklich braucht, trägt er sie selbst ein.

### Schritt 3 — Files editieren (vor dem mechanischen Script)

Mit den gesammelten Antworten:

**3a. `CLAUDE.md`** — zwei Sektionen anpassen:

`## Project`: ersetzen durch ein bis zwei Sätze, die das *neue* Projekt
beschreiben (nicht „Base settings template for vollprecht gestaltung").

`## Project Context`: alle fünf Felder befüllen, **keine Platzhalter-`?` mehr**.

**3b. `README.md`** — komplett mit `Write` überschreiben, neuer Inhalt:

```markdown
# <Projektname>

<Client>: <Deliverable in einem Satz>.

> Empfänger: <Recipient>
> Out of scope: <Out of scope>

## Setup

Wird automatisch via SessionStart-Hook (vollprecht-template) verwaltet.
Manuelle Schritte:

- Pre-Commit aktivieren (falls nicht schon): `git config core.hooksPath .githooks`
- Stack-Lock prüfen: `docs/stack.md`

## Template-Bezug

Dieses Projekt basiert auf Template-Version **vX.Y.Z** (siehe `.template-version`).
Updates aus dem Template ziehen: `/project:template-update`.
```

**3c. `package.json`** — `Edit`:

- `"name"` → der Slug aus Schritt 2
- `"version": "1.0.0"` → `"version": "0.1.0"` (semver für *dieses* Projekt startet fresh)
- `"description"` → der Deliverable-Satz aus Schritt 2

**3d. `docs/stack.md`** — `Edit` der Pflichtfelder:

Die fünf Pflichtfelder mit den Antworten aus Schritt 2 ersetzen (`?` → echter Wert).
Die fünf Conditional-Felder auf `n/a` setzen (statt `?`), **außer** der User hat
explizit etwas anderes gesagt. Die `Begründungen`-Sektion mit je einem
Ein-Zeiler vorbefüllen.

**3e. `docs/decisions.md`** — komplett mit `Write` überschreiben, neuer Inhalt:

```markdown
# Decisions

> When to read: vor jeder Architektur-, Pattern- oder Prozess-Entscheidung,
> die über die aktuelle Datei hinaus wirkt. Hier steht, was schon
> entschieden wurde und warum — nicht erneut zur Diskussion stellen.

Architektur- und Prozessentscheide, die über die Session hinaus
nachvollziehbar bleiben sollen (ADR-light).

## Format

Jeder Eintrag folgt diesem Schema. Reihenfolge **nicht ändern** —
der SessionStart-Index und spätere Reviews verlassen sich darauf.

\`\`\`
## YYYY-MM-DD — Titel

**Status:** proposed | accepted | superseded by <Titel> | deprecated
**Kontext:** Was war die Ausgangslage? Welche Constraints galten?
**Entscheidung:** Was wurde entschieden? (eine Aussage, kein Essay)
**Begründung:** Warum diese Option — und warum nicht die Alternativen?
**Konsequenzen:** Was folgt daraus, positiv UND negativ?
\`\`\`

Regeln:

- Einträge sind **append-only**. Eine Entscheidung wird nie überschrieben,
  sondern durch eine neue ADR ersetzt — Status der alten auf
  `superseded by <neue Titel>` setzen.
- Sortierung: neueste oben (nach `## Format`-Block).
- Trenner `---` zwischen Einträgen.
- Datum = Datum der Entscheidung, nicht der Implementierung.

---

(noch keine projekt-spezifischen Entscheidungen)
```

Die im Template stehenden ADRs (2026-05-15 Memories/SessionStart/Tech-Stack-Gate)
gehören nicht in derived projects.

### Schritt 4 — Mechanisches Script ausführen

```bash
bash bin/bootstrap-mechanical.sh <template-pfad-aus-schritt-1> <projektname-aus-schritt-2>
```

Das Script:
- löscht die geerbte Template-Git-History
- `git init`
- ruft `python3 bin/template-update.py --init --source <pfad>` → erzeugt `.template-version` und `.template-baseline/`
- aktiviert Pre-Commit
- läuft `tests/hooks.sh` (muss 39/39 grün)
- macht den initialen Commit

### Schritt 5 — Verifikation + Übergabe

```bash
# zeige neue Version
cat .template-version
# zeige letzten Commit
git log --oneline -1
# letzter Sanity-Check
bash tests/hooks.sh > /dev/null && echo "hooks ok"
```

Dem User melden:

> Projekt **\<Name\>** auf Basis Template v\<X.Y.Z\> eingerichtet.
> Erster Commit liegt auf `main`. Was möchtest du als Nächstes machen?

## Grundregeln

- **Niemals** Bash-`rm`, `git`-destruktiv oder Bash-Schritte aus diesem Doc
  direkt ausführen — alles geht durch `bin/bootstrap-mechanical.sh`.
  (Die destruktiven Patterns wären sonst vom Hook geblockt — zu Recht.)
- Wenn `tests/hooks.sh` rot wird: **stoppen**, dem User berichten, nicht
  selbst „fixen".
- Wenn der User abbricht zwischen Schritt 3 und Schritt 4: die schon
  gemachten Edits dokumentieren, damit der User entscheiden kann, ob
  rückgängig oder beim nächsten Mal fortsetzen.
