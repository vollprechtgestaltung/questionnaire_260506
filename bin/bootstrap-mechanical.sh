#!/usr/bin/env bash
# Mechanical part of project bootstrap. Called after Claude has gathered
# answers from the user and edited the project-specific files
# (CLAUDE.md, README.md, package.json, docs/stack.md, docs/decisions.md).
#
# What this script does (atomic git+init dance, no questions):
#  1. wipe .git (template history) and `git init`
#  2. python3 bin/template-update.py --init --source <template>
#  3. git config core.hooksPath .githooks
#  4. bash tests/hooks.sh (smoke test)
#  5. initial commit
#
# Why split: the file edits (Project Context, stack defaults, project name)
# must happen via Claude's Edit tool with the user's answers. The bash
# parts here are deterministic and safe to script.
#
# Usage:
#   bash bin/bootstrap-mechanical.sh <template-source-path> <project-name>

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "usage: $0 <template-source-path> <project-name>" >&2
  exit 2
fi

template="$1"
project_name="$2"

if [ ! -d "$template" ] || [ ! -f "$template/.template-manifest" ]; then
  echo "error: '$template' does not look like a template source (missing .template-manifest)" >&2
  exit 2
fi

if [ -f .template-version ]; then
  echo "error: .template-version already exists — this project is already bootstrapped." >&2
  exit 2
fi

basename_self=$(basename "$(pwd)")
if [[ "$basename_self" == _template-base-* ]]; then
  echo "error: refuse to bootstrap inside the template itself ($basename_self)." >&2
  exit 2
fi

red()   { printf '\033[31m%s\033[0m\n' "$1" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
bold()  { printf '\033[1m%s\033[0m\n' "$1"; }

bold "▶ wiping template git history"
rm -rf .git
git init -b main > /dev/null

bold "▶ initializing template tracking (--init)"
python3 bin/template-update.py --init --source "$template"

bold "▶ activating pre-commit hooks"
git config core.hooksPath .githooks

bold "▶ running hook test suite"
bash tests/hooks.sh

template_version=$(grep '^version:' .template-version | sed 's/^version:[[:space:]]*//')

bold "▶ creating initial commit"
git add -A
GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-bootstrap}" \
GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-bootstrap@local}" \
  git commit -m "chore: bootstrap '${project_name}' from template v${template_version}" > /dev/null

green ""
green "✓ bootstrap complete"
green "  project:  ${project_name}"
green "  template: v${template_version} (${template})"
green ""
green "next steps:"
green "  - SessionStart hook will be silent from now on"
green "  - run 'bash tests/hooks.sh' any time after touching .claude/hooks/"
green "  - use '/project:template-update' when the template advances"
