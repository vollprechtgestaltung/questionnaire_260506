---
name: feedback_ci_debugging
description: Bei CI-Fails zuerst die Job-Logs über GitHub-API holen, nicht lokal raten. Spart massiv Tokens.
metadata:
  type: feedback
---

Bei CI-Fails (GitHub Actions): **Job-Logs zuerst, Fixes danach.**

**Why:** In Session 2026-05-20 habe ich bei wiederholten CI-Fails lokal
geraten — Workflow-Steps nachgestellt, file-Modes geprüft, Pattern
verglichen — bis der User abbrach: „verbrauchst aber enorm deine
Tokens". Erst nach 4–5 Versuchen über `curl` auf die GitHub-API gegangen,
und in einer einzigen Antwort den exakten failenden Step gesehen. Schätzung:
~70% Token gespart, wenn die API der erste Move gewesen wäre.

**How to apply:**

1. **Erster Move bei CI-Fail:** `curl -sS https://api.github.com/repos/<owner>/<repo>/actions/runs?per_page=1` → run-ID holen → `/jobs` → conclusion + Step-Status pro Job.
2. Wenn der User ein Screenshot oder PDF schickt: **direkt lesen**, nicht parallel raten.
3. Ohne `gh` CLI: API + python3 reicht völlig. Falls verfügbar: `gh run view --log-failed`.
4. Erst NACH dem exakten Step lokal nachstellen — nicht alle 6 Steps spekulativ durchprobieren.
5. Nicht jeden Hypothese-Zweig lokal verifizieren. 2–3 Hypothesen formen, die wahrscheinlichste prüfen, dann entscheiden.

Anwendungsbereich: nicht nur GitHub Actions — gilt analog für jedes
externe System mit eigenen Logs (Vercel, Supabase Edge Functions etc.).
