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

## Changelog

[`CHANGELOG.md`](../CHANGELOG.md) listet Template-Versionen und ihre
breaking changes. Vor `--apply` einen Blick lohnt sich.
