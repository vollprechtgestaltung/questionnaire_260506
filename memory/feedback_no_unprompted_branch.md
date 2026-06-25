---
name: feedback_no_unprompted_branch
description: Bei "commit + push" nicht ungefragt einen Branch anlegen — auf den aktuellen Branch (main) committen, außer der User verlangt explizit einen Branch.
metadata:
  type: feedback
---

Wenn der User "commit + push" (o. ä.) sagt, **direkt auf den aktuellen Branch** committen (i. d. R. `main`). **Keinen** neuen Feature-/Fix-Branch automatisch anlegen.

**Why:** In dieser Session habe ich aus der Default-Vorsicht „nicht direkt auf den Default-Branch" ungefragt einen Branch erstellt. Der User wollte das nicht ("wer hat das erlaubt?") — und der Branch-Push löste zusätzlich ein kaputtes Vercel-Preview-Deployment aus (Env-Vars nur in Production, nicht Preview).

**How to apply:** Branch nur anlegen, wenn der User es **explizit** verlangt. Sonst auf den aktuellen Branch committen. Die CLAUDE.md-Branch-Namenskonvention (feature/fix/chore) gilt nur *für den Fall, dass* gebrancht wird — sie ist keine Aufforderung, immer zu branchen. Push braucht in diesem Projekt jeweils einen einmaligen Sandbox-Bypass ([[template_baseline]]), Git-Author immer `git@vollprecht.com` ([[feedback_git_author]]).
