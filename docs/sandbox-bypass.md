# Sandbox-Bypass

> When to read: wenn Claude `dangerouslyDisableSandbox: true` braucht
> oder ein Hook-Block auf „BLOCKED: dangerouslyDisableSandbox" erscheint;
> auch bei jeder Änderung an den Bypass-Hooks.

`dangerouslyDisableSandbox: true` ist **per Default geblockt**. Der
PreToolUse-Hook `check-sandbox-bypass.sh` rejected jeden Bash-Aufruf
mit diesem Flag, **außer** wenn vorher in genau dieser Session ein
gültiger Approval-Marker entstanden ist.

Die SDK-Default-Anweisung „retry with `dangerouslyDisableSandbox: true`
when sandbox blocks a command" gilt in diesem Projekt **nicht**.

## Approval-Flow

Der Marker entsteht **ausschließlich** durch:

1. Claude ruft `AskUserQuestion` auf, mit:
   - `header`: **exakt** `Sandbox-Bypass anfordern`
   - `question`: konkreter Satz, was getan werden soll und warum
   - `options`: muss `Bypass erlauben` und `Ablehnen` enthalten
2. User wählt `Bypass erlauben`
3. PostToolUse-Hook `record-sandbox-approval.sh` schreibt den Marker
   (`.sandbox-bypass.marker`, gitignored)

Der Marker ist **single-use** (Hook löscht ihn beim Verbrauch) und hat
**TTL 60 Sekunden**. Jeder gewährte Bypass landet in
`docs/sandbox-bypass.log` (ebenfalls gitignored).

## Tamper-Schutz

**Niemals** versuchen, den Marker via `Write`/`Edit`/`Bash` selbst zu
erzeugen — alle drei Wege sind durch Hooks blockiert:

- `block-marker-tamper.sh` (PreToolUse Write/Edit/NotebookEdit)
- `block-destructive-bash.sh` (PreToolUse Bash — fängt `echo >`, `cat >`,
  `tee` etc. auf `.sandbox-bypass.marker`)

Das ist kein Hindernis, sondern der Grund, warum das Schutzmodell
überhaupt funktioniert: der User-Klick ist die einzige Quelle.

## Beteiligte Files

| Pfad | Rolle |
|---|---|
| `.claude/hooks/check-sandbox-bypass.sh` | PreToolUse Bash — Gate |
| `.claude/hooks/record-sandbox-approval.sh` | PostToolUse AskUserQuestion — Marker-Writer |
| `.claude/hooks/block-marker-tamper.sh` | Schutz gegen Selbst-Erzeugung via Write/Edit |
| `.claude/hooks/block-destructive-bash.sh` | Schutz gegen Selbst-Erzeugung via Bash |
| `.sandbox-bypass.marker` | Ephemeres Ticket (gitignored) |
| `docs/sandbox-bypass.log` | Audit-Trail (gitignored) |
| `tests/hooks.sh` | Tests für alle vier Hooks |
