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
- Destructive and dangerous commands denied (rm -rf, git push --force, git reset --hard, chmod 777)
- Sensitive paths blocked (~/.ssh, ~/.aws, ~/.gnupg, ~/.env)
- Personal overrides go in `.claude/settings.local.json` (gitignored)

## DSGVO / Data Privacy

- Never use real personal data (names, emails, addresses) in code, tests, or fixtures
- Use anonymized or fictional test data only
- Do not include personal data in prompts or commit messages
- Log changes to privacy-relevant files
- Refer to Anthropic's Data Processing Agreement for compliance
- IMPORTANT: CLAUDE.md rules are guidance, not technical enforcement.
  Data entered in prompts is transmitted to Anthropic's servers regardless.
  Never enter real personal data in prompts.
- Anthropic DPA: https://console.anthropic.com/legal
- Anthropic GDPR approach: https://support.anthropic.com/en/articles/7996881-what-is-your-approach-to-gdpr-or-related-issues

## Swiss DSG Compliance

- Privacy by Design: consider data protection from the start of development
- Privacy by Default: use the most privacy-friendly settings as standard
- Data transfer: Anthropic (US-based) processes prompts — not certified
  under EU-US or Swiss-US Data Privacy Framework. Data transfers are
  secured via Standard Contractual Clauses (SCCs) per Art. 16/17 DSG.
  Verify Anthropic's DPA covers your use case.
- Individual accountability: Swiss DSG holds natural persons liable

## Project Context

- Client: Puls Agency
- Project: puls-questionnaire
- Deliverable: PWA with a questionnaire. 1 Question and 4 answers-options. After answering the results of all answers are shown. 
- Recipient: A client of puls pagency. Big Company in the Health business.
- Out of scope: No Admin panel to change the question and answers. 

## Project Standards

- Work at senior level: minimal, intentional, no over-engineering
- Structure before speed — a well-considered setup saves more time than fast execution
- Prefer deleting over adding — less is more
- No speculative abstractions or "just in case" patterns
- Scalability and clarity from day one: folder structure, naming, and conventions
  should make sense to someone seeing the project for the first time
- If something feels wrong, say so — don't just execute
- Point out when a request conflicts with good practice, then follow the user's decision

## Available Skills

Custom slash commands for this project (`.claude/commands/`):

- `/project:dsg-check` — Check code for Swiss DSG and EU DSGVO compliance
- `/project:setup-check` — Verify all config files are present and correct
- `/project:security-audit` — Scan for secrets, vulnerabilities, and unsafe patterns

## Workflow

- Always read existing files before editing
- Test changes locally before pushing
- Use Git for version control
- Ask before making destructive changes

## Before Starting a Task

- Verify no secrets or credentials in changed files
- Ensure changes and answers belong to the request. 
- Check for unintended side effects

## Before Completing a Task

- Verify no secrets or credentials in changed files
- Ensure changes are minimal and focused on the request
- Check for unintended side effects
