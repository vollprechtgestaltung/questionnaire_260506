---
name: project_voting_design
description: Bewusste Design-Entscheidungen zur Voting-Logik und Hardware-Setup
metadata:
  type: project
---

Mehrere Votes pro Gerät sind explizit gewollt. Der einzige iPad am Stand
soll nach ~20s Inaktivität zurückfallen und eine neue Abstimmung erlauben —
das erfordert, dass dasselbe Gerät mehrfach abstimmen kann. Kein „1 Vote
per Device" erzwingen.

**Why:** Ein einzelner iPad im Kiosk-Modus; Besucher wechseln, jeder soll
abstimmen können.

**How to apply:** Rate-Limit-Logik (15s-Fenster) als Anti-Spam reicht.
Keine zusätzliche Sperre pro Device-ID einbauen oder vorschlagen.

---

Admin-UI ist nicht geplant. CSV-Export direkt aus Supabase reicht für
diesen Use Case. Kein Dashboard, kein Admin-Panel vorschlagen.

**Why:** Scope-Entscheidung, explizit out of scope.

**How to apply:** Bei Fragen zu Ergebnisauswertung auf Supabase-Export
hinweisen, keine eigene Admin-Oberfläche bauen.
