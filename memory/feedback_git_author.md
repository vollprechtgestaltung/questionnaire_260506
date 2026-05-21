---
name: feedback_git_author
description: Nie die userEmail aus dem Session-Kontext als Git-Author verwenden — das ist die Claude-Code-Account-Email, kein GitHub-Account.
metadata:
  type: feedback
---

Nie `userEmail` aus dem injiziertem Session-Kontext (`claude@vollprecht.com`) als Git-Commit-Author verwenden.

**Why:** Diese Email ist die Claude Code Login-Email, kein GitHub-Account. Vercel (und GitHub) können den Commit-Author nicht auflösen → Deployment schlägt fehl mit «GitHub user not found».

**How to apply:**

- Wenn git config nicht lesbar ist (Sandbox-Override `HOME=/tmp` blockiert `~/.gitconfig`): User bitten, den Commit selbst zu machen.
- Korrekte Author-Email für dieses Projekt: `git@vollprecht.com` (GitHub-Account `vollprechtgestaltung`).
- Nie spekulativ eine Email aus dem Kontext übernehmen — lieber nachfragen.
