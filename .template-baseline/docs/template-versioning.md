# Template-Versionierung

> When to read: bei Fragen zur Template-Version, vor `/project:template-update`,
> oder wenn entschieden werden muss, ob eine Datei Template- oder
> Projekt-Eigentum ist.

Dieses Projekt basiert auf einer getaggten Template-Version. Stand in
`.template-version` (Version + Quelle + Adoption-Datum).

## Update-Pfad

- `bin/template-update.py --check` — dry-run, zeigt Divergenzen
- `bin/template-update.py --apply` — interaktiv pro divergenter Datei
  (3-way diff: baseline / project / template)
- `/project:template-update` — Slash-Command, der Claude durch den
  Ablauf führt (inkl. Sichtprüfung divergenter Files)

## Eigentumsmodell

**Template-Eigentum** (wird beim Update gepflegt): definiert in
[`.template-manifest`](../.template-manifest). Eine Zeile pro Pfad,
Verzeichnisse mit trailing slash. Aktuell u.a.: `.claude/hooks/`,
`.claude/commands/`, `.claude/settings.json`, `.githooks/`,
`tests/hooks.sh`, `.github/workflows/check.yml`, `bin/`, sowie alle
universellen Docs (`persistence.md`, `privacy.md`, `loeschkonzept.md`,
`sandbox-bypass.md`, `template-versioning.md`).

**Projekt-Eigentum** (wird NICHT vom Template überschrieben):

- `CLAUDE.md`, `README.md`
- `docs/stack.md`, `docs/decisions.md`, `docs/todos.md`
- `package.json`, `.gitignore`
- Memories außer `template_baseline.md`

Anwendungs-Ordner (`src/`, `tests/` für App-Tests, …) werden pro Projekt
ergänzt und nie vom Template angefasst.

## Mehrere Maschinen / wechselnde Pfade

Wenn dasselbe Projekt auf mehreren Maschinen liegt (Dropbox/iCloud
zwischen unterschiedlichen User-Homes wie `/Users/tobias07` und
`/Users/tobias06`), bricht der relative `source:`-Pfad sobald das
Projekt im Dateibaum verschoben wird; ein absoluter Pfad funktioniert
nur auf einer Maschine.

Lösung: Feld `source_fallbacks:` in `.template-version` mit einer
Liste absoluter Pfade. `bin/template-update.py` probiert sie in
Reihenfolge und wählt den ersten existierenden Pfad, der ein gültiges
Template enthält (`package.json` + `.template-manifest`).
Nicht-existente Einträge werden still übersprungen.

Beispiel `.template-version`:

```yaml
version: 1.5.0
source: ../../../../../../90_dev/__claude_base/_claude-tmpl-base-webflow
adopted_at: 2026-05-21
source_fallbacks:
  - /Users/tobias07/Library/CloudStorage/Dropbox-.../90_dev/__claude_base/_claude-tmpl-base-webflow
  - /Users/tobias06/Library/CloudStorage/Dropbox-.../90_dev/__claude_base/_claude-tmpl-base-webflow
```

**Auflösungsreihenfolge:** `--source` → `$TEMPLATE_PATH` → `source` →
`source_fallbacks` (in Listen-Reihenfolge).

**Hinweis:** `.template-version` ist eingecheckt. Die Liste enthält
Dateipfade, keine Secrets — das ist ok. Aber: keine Pfade ablegen,
die selbst Geheimnis-Charakter haben (z.B. Pfade, die NDA-relevante
Kunden-/Projektnamen verraten, gehören dann eher in
`.claude/settings.local.json`).

## Changelog

[`CHANGELOG.md`](../CHANGELOG.md) listet Template-Versionen und ihre
breaking changes. Vor `--apply` einen Blick lohnt sich.
