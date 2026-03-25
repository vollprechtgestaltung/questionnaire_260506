# CLAUDE.md

## Project

Base settings template for vollprecht gestaltung projects.

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

## Settings

- Sandbox and permissions configured in `.claude/settings.json`
- Filesystem sandboxed to project directory only
- Network restricted to github.com and npmjs.org
- Destructive and dangerous commands denied (rm -rf, git push --force, chmod 777)
- Sensitive paths blocked (~/.ssh, ~/.aws, ~/.gnupg, ~/.env)

## Workflow

- Always read existing files before editing
- Test changes locally before pushing
- Use Git for version control
- Ask before making destructive changes

## Before Completing a Task

- Verify no secrets or credentials in changed files
- Ensure changes are minimal and focused on the request
- Check for unintended side effects
