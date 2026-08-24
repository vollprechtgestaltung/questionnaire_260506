---
name: feedback_git_author
description: Nie die userEmail aus dem Session-Kontext als Git-Author verwenden — das ist die Claude-Code-Account-Email, kein GitHub-Account.
metadata:
  type: feedback
---

Nie `userEmail` aus dem injiziertem Session-Kontext (`claude@vollprecht.com`) als Git-Commit-Author verwenden.

**Why:** Diese Email ist die Claude Code Login-Email, kein GitHub-Account. Vercel (und GitHub) können den Commit-Author nicht auflösen → Deployment schlägt fehl mit «GitHub user not found».

**How to apply:**

- Korrekte Author-Email für dieses Projekt: `git@vollprecht.com` (GitHub-Account `vollprechtgestaltung`).
- Nie spekulativ eine Email aus dem Kontext übernehmen — lieber nachfragen.

**Lokale Git-Kommandos ohne Sandbox-Bypass** (verifiziert 2026-08-24): Die Sandbox
sperrt `/Users/tobias06`, deshalb scheitert jedes `git` an `~/.gitconfig`
(«Operation not permitted»). Statt einen Bypass anzufordern:

```
export GIT_CONFIG_GLOBAL=/dev/null
git -c user.name=vollprechtgestaltung -c user.email=git@vollprecht.com commit ...
```

Damit laufen `status`, `add`, `commit`, `log` normal durch (Pre-Commit-Hook inklusive);
die Warnung zu `~/.config/git/ignore` ist harmlos. Der Author muss explizit per `-c`
gesetzt werden, weil die globale Config wegfällt und repo-lokal keiner konfiguriert ist.
**Nur `push` braucht weiterhin einen echten Bypass** (Credentials liegen ausserhalb).
