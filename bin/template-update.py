#!/usr/bin/env python3
"""Template-Update-Tool für das vollprecht-gestaltung Projekt-Template.

Verwaltet einen 3-Wege-Diff zwischen:
  - `.template-baseline/`  — Stand des Templates beim letzten Update
  - `./<path>`             — aktueller Projekt-Stand (möglicherweise modifiziert)
  - `<SOURCE>/<path>`      — aktueller Template-Stand (was es jetzt gibt)

Modi:
  --init           Bootstrap: legt .template-baseline/ und .template-version
                   in einem frisch instanziierten Projekt an.
  --check          Dry-run: zeigt was sich ändern würde.
  --apply          Interaktiv: pro geänderter Datei y/n/diff/skip.

Quelle:
  - --source PATH                expliziter Override
  - Env $TEMPLATE_PATH           zweite Priorität
  - .template-version → source:  dritte Priorität
"""

from __future__ import annotations

import argparse
import difflib
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from enum import Enum
from pathlib import Path
from typing import Iterable

BASELINE_DIR = ".template-baseline"
VERSION_FILE = ".template-version"
MANIFEST_FILE = ".template-manifest"
PACKAGE_JSON = "package.json"


# ── helpers ───────────────────────────────────────────────────────────────────

def red(s: str) -> str:    return f"\033[31m{s}\033[0m"
def green(s: str) -> str:  return f"\033[32m{s}\033[0m"
def yellow(s: str) -> str: return f"\033[33m{s}\033[0m"
def gray(s: str) -> str:   return f"\033[90m{s}\033[0m"
def bold(s: str) -> str:   return f"\033[1m{s}\033[0m"

def die(msg: str, code: int = 1) -> "None":
    print(red(f"error: {msg}"), file=sys.stderr)
    sys.exit(code)


# ── manifest ──────────────────────────────────────────────────────────────────

def read_manifest(root: Path) -> list[str]:
    f = root / MANIFEST_FILE
    if not f.is_file():
        die(f"{MANIFEST_FILE} not found in {root}")
    out: list[str] = []
    for line in f.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        out.append(line)
    return out


def expand_paths(root: Path, entries: Iterable[str]) -> list[Path]:
    """Expand directory entries to their contained files. Returns relative paths."""
    seen: set[Path] = set()
    for entry in entries:
        p = root / entry
        if entry.endswith("/"):
            if not p.exists():
                continue
            for f in sorted(p.rglob("*")):
                if f.is_file():
                    seen.add(f.relative_to(root))
        elif p.exists() and p.is_file():
            seen.add(Path(entry))
    return sorted(seen)


# ── version file ──────────────────────────────────────────────────────────────

@dataclass
class TemplateMeta:
    version: str
    source: str | None
    adopted_at: str | None

def read_version(root: Path) -> TemplateMeta | None:
    f = root / VERSION_FILE
    if not f.is_file():
        return None
    data: dict[str, str] = {}
    for line in f.read_text().splitlines():
        m = re.match(r"^([a-z_]+):\s*(.*)$", line.strip())
        if m:
            data[m.group(1)] = m.group(2).strip()
    return TemplateMeta(
        version=data.get("version", "?"),
        source=data.get("source") or None,
        adopted_at=data.get("adopted_at") or None,
    )

def write_version(root: Path, version: str, source: str | None) -> None:
    lines = [f"version: {version}"]
    if source:
        lines.append(f"source: {source}")
    lines.append(f"adopted_at: {date.today().isoformat()}")
    (root / VERSION_FILE).write_text("\n".join(lines) + "\n")


def read_template_version(template_root: Path) -> str:
    pj = template_root / PACKAGE_JSON
    if not pj.is_file():
        die(f"{PACKAGE_JSON} not found in template source {template_root}")
    m = re.search(r'"version"\s*:\s*"([^"]+)"', pj.read_text())
    if not m:
        die(f"version not found in {pj}")
    return m.group(1)


# ── source resolution ─────────────────────────────────────────────────────────

def resolve_source(root: Path, explicit: str | None) -> Path:
    candidates: list[tuple[str, Path]] = []
    if explicit:
        candidates.append(("--source", Path(explicit).expanduser()))
    env = os.environ.get("TEMPLATE_PATH")
    if env:
        candidates.append(("$TEMPLATE_PATH", Path(env).expanduser()))
    meta = read_version(root)
    if meta and meta.source:
        candidates.append((f"{VERSION_FILE}:source", (root / meta.source).resolve()))
    if not candidates:
        die(
            f"no template source resolved. Set $TEMPLATE_PATH, pass --source, "
            f"or add `source:` to {VERSION_FILE}."
        )
    for label, path in candidates:
        if path.is_dir() and (path / PACKAGE_JSON).is_file() and (path / MANIFEST_FILE).is_file():
            return path
        print(yellow(f"  ignored {label}={path} (not a template root)"))
    die("no usable template source among candidates")


# ── classification ────────────────────────────────────────────────────────────

class Status(Enum):
    IDENTICAL = "identical"
    USER_ONLY = "user-only"            # user changed, template unchanged → skip
    TEMPLATE_UPDATE = "template-update"  # template changed, user untouched → auto-adopt
    BOTH_CHANGED = "both-changed"      # divergent → manual
    NEW_IN_TEMPLATE = "new-in-template"  # template has it, project doesn't → adopt
    DELETED_IN_TEMPLATE = "deleted-in-template"  # baseline had it, template removed → prompt
    NO_BASELINE = "no-baseline"        # first time seeing — treat as new

def read_or_none(p: Path) -> bytes | None:
    return p.read_bytes() if p.is_file() else None

def classify(baseline: bytes | None, project: bytes | None, template: bytes | None) -> Status:
    if template is None and baseline is not None:
        return Status.DELETED_IN_TEMPLATE
    if template is not None and project is None and baseline is None:
        return Status.NEW_IN_TEMPLATE
    if template is not None and baseline is None and project is not None:
        return Status.NO_BASELINE
    if baseline == project == template:
        return Status.IDENTICAL
    if baseline == template and project != template:
        return Status.USER_ONLY
    if baseline == project and template != project:
        return Status.TEMPLATE_UPDATE
    return Status.BOTH_CHANGED


# ── operations ────────────────────────────────────────────────────────────────

def show_diff(label_a: str, a: bytes | None, label_b: str, b: bytes | None) -> None:
    sa = (a or b"").decode("utf-8", errors="replace").splitlines(keepends=True)
    sb = (b or b"").decode("utf-8", errors="replace").splitlines(keepends=True)
    for line in difflib.unified_diff(sa, sb, fromfile=label_a, tofile=label_b, lineterm=""):
        if line.startswith("+") and not line.startswith("+++"):
            print(green(line.rstrip()))
        elif line.startswith("-") and not line.startswith("---"):
            print(red(line.rstrip()))
        elif line.startswith("@@"):
            print(yellow(line.rstrip()))
        else:
            print(line.rstrip())

def copy_into(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def remove_file(p: Path) -> None:
    if p.is_file():
        p.unlink()


# ── modes ─────────────────────────────────────────────────────────────────────

def cmd_init(root: Path, source: Path) -> int:
    if (root / BASELINE_DIR).exists():
        die(f"{BASELINE_DIR}/ already exists — refusing to overwrite. Delete it first if you really mean it.")
    template_version = read_template_version(source)
    paths = expand_paths(source, read_manifest(source))
    if not paths:
        die("manifest expanded to zero paths")
    print(bold(f"initializing from template v{template_version} at {source}"))
    for rel in paths:
        src = source / rel
        dst_baseline = root / BASELINE_DIR / rel
        copy_into(src, dst_baseline)
        # Only write to project if not already present (cp -R already did this normally).
        dst_project = root / rel
        if not dst_project.exists():
            copy_into(src, dst_project)
            print(green(f"  + {rel} (new in project)"))
        else:
            print(gray(f"  · {rel}"))
    try:
        rel_source = os.path.relpath(source, root)
    except ValueError:
        rel_source = str(source)
    write_version(root, template_version, rel_source)
    print(green(f"\ninitialized v{template_version} ({rel_source})"))
    return 0


def cmd_check_or_apply(root: Path, source: Path, apply: bool) -> int:
    meta = read_version(root)
    if not meta:
        die(f"{VERSION_FILE} not found — run --init first.")
    template_version = read_template_version(source)
    print(bold(f"project @ v{meta.version}  ↔  template @ v{template_version}"))
    if meta.version == template_version:
        print(green("already on the latest template version."))
    else:
        print_changelog(source, meta.version, template_version)

    paths = expand_paths(source, read_manifest(source))
    if not paths:
        die("manifest expanded to zero paths")

    decisions = {
        "auto-adopted": [],
        "skipped (user-modified)": [],
        "manual-adopted": [],
        "manual-kept": [],
        "deleted": [],
        "deletion-skipped": [],
        "identical": [],
    }

    for rel in paths:
        baseline = read_or_none(root / BASELINE_DIR / rel)
        project = read_or_none(root / rel)
        template = read_or_none(source / rel)
        st = classify(baseline, project, template)

        if st is Status.IDENTICAL:
            decisions["identical"].append(rel)
            continue

        if st is Status.USER_ONLY:
            print(yellow(f"  ≠ {rel}   user-modified, template unchanged → keep your version"))
            decisions["skipped (user-modified)"].append(rel)
            continue

        if st in (Status.TEMPLATE_UPDATE, Status.NEW_IN_TEMPLATE):
            verb = "new" if st is Status.NEW_IN_TEMPLATE else "updated"
            print(green(f"  ▲ {rel}   {verb} in template → auto-adopt"))
            if apply:
                copy_into(source / rel, root / rel)
                copy_into(source / rel, root / BASELINE_DIR / rel)
            decisions["auto-adopted"].append(rel)
            continue

        if st is Status.DELETED_IN_TEMPLATE:
            print(yellow(f"  ✗ {rel}   removed in template"))
            if apply:
                ans = prompt("delete this file from project?", "ynd")
                if ans == "y":
                    remove_file(root / rel)
                    remove_file(root / BASELINE_DIR / rel)
                    decisions["deleted"].append(rel)
                elif ans == "d":
                    show_diff("project", project, "template", None)
                    ans2 = prompt("delete now?", "yn")
                    if ans2 == "y":
                        remove_file(root / rel)
                        remove_file(root / BASELINE_DIR / rel)
                        decisions["deleted"].append(rel)
                    else:
                        decisions["deletion-skipped"].append(rel)
                else:
                    decisions["deletion-skipped"].append(rel)
            else:
                decisions["deletion-skipped"].append(rel)
            continue

        # BOTH_CHANGED or NO_BASELINE → manual decision
        print(red(f"  ! {rel}   diverges (manual decision needed)"))
        if apply:
            while True:
                ans = prompt("[d]iff / [a]dopt template / [k]eep project / [s]kip", "daks")
                if ans == "d":
                    show_diff("project", project, "template", template)
                    continue
                if ans == "a":
                    copy_into(source / rel, root / rel)
                    copy_into(source / rel, root / BASELINE_DIR / rel)
                    decisions["manual-adopted"].append(rel)
                elif ans == "k":
                    # baseline tracks template so next time only NEW changes prompt
                    if template is not None:
                        copy_into(source / rel, root / BASELINE_DIR / rel)
                    decisions["manual-kept"].append(rel)
                else:
                    decisions["manual-kept"].append(rel)
                break
        else:
            decisions["manual-kept"].append(rel)

    if apply:
        try:
            rel_source = os.path.relpath(source, root)
        except ValueError:
            rel_source = str(source)
        write_version(root, template_version, rel_source)

    print()
    print(bold("summary:"))
    for k, v in decisions.items():
        if v:
            print(f"  {k}: {len(v)}")
            for f in v:
                print(gray(f"    - {f}"))
    if not apply:
        print(yellow("\ndry-run only — re-run with --apply to make changes."))
    return 0


def prompt(text: str, allowed: str) -> str:
    while True:
        sys.stdout.write(f"    {text} ({'/'.join(allowed)}): ")
        sys.stdout.flush()
        try:
            line = input().strip().lower()
        except EOFError:
            return allowed[-1]
        if line and line[0] in allowed:
            return line[0]


def print_changelog(source: Path, current: str, latest: str) -> None:
    cl = source / "CHANGELOG.md"
    if not cl.is_file():
        return
    print(bold(f"\nCHANGELOG entries (v{current} → v{latest}):"))
    capture = False
    found = False
    for line in cl.read_text().splitlines():
        m = re.match(r"^## \[([^\]]+)\]", line)
        if m:
            ver = m.group(1)
            if ver == latest:
                capture = True
            elif capture:
                # any subsequent section header ends the capture window
                break
        if capture:
            print(f"  {line}")
            found = True
    if not found:
        print(gray("  (no entries found between versions — check CHANGELOG.md manually)"))
    print()


# ── entry ─────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Template update tool")
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument("--init", action="store_true", help="bootstrap a derived project")
    g.add_argument("--check", action="store_true", help="dry-run: show what would change")
    g.add_argument("--apply", action="store_true", help="interactive update")
    parser.add_argument("--source", help="path to template source (overrides env/version-file)")
    parser.add_argument("--root", default=".", help="project root (default: cwd)")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    source = resolve_source(root, args.source)
    if source.resolve() == root:
        die("source and project root are identical — you're inside the template itself.")

    if args.init:
        return cmd_init(root, source)
    return cmd_check_or_apply(root, source, apply=args.apply)


if __name__ == "__main__":
    sys.exit(main())
