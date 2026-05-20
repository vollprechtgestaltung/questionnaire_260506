# Decisions

> When to read: vor jeder Architektur-, Pattern- oder Prozess-Entscheidung,
> die über die aktuelle Datei hinaus wirkt. Hier steht, was schon
> entschieden wurde und warum — nicht erneut zur Diskussion stellen.

Architektur- und Prozessentscheide, die über die Session hinaus
nachvollziehbar bleiben sollen (ADR-light).

## Format

Jeder Eintrag folgt diesem Schema. Reihenfolge **nicht ändern** —
der SessionStart-Index und spätere Reviews verlassen sich darauf.

```
## YYYY-MM-DD — Titel

**Status:** proposed | accepted | superseded by <Titel> | deprecated
**Kontext:** Was war die Ausgangslage? Welche Constraints galten?
**Entscheidung:** Was wurde entschieden? (eine Aussage, kein Essay)
**Begründung:** Warum diese Option — und warum nicht die Alternativen?
**Konsequenzen:** Was folgt daraus, positiv UND negativ?
```

Regeln:

- Einträge sind **append-only**. Eine Entscheidung wird nie überschrieben,
  sondern durch eine neue ADR ersetzt — Status der alten auf
  `superseded by <neue Titel>` setzen.
- Sortierung: neueste oben (nach `## Format`-Block).
- Trenner `---` zwischen Einträgen.
- Datum = Datum der Entscheidung, nicht der Implementierung.

---

## 2026-05-20 — Plain JS statt TypeScript strict für die Portierung

**Status:** accepted

**Kontext:** Das Vorprojekt `_puls_questionaire-001` ist vollständig in Plain JS implementiert (Svelte 5, Vite 6, Vitest, ESLint + Prettier). Der Senior-Default des Templates wäre TypeScript strict. TS-Migration wäre ein eigenes, separates Workpaket.

**Entscheidung:** Portierung erfolgt in Plain JS. TypeScript wird nach Abschluss der Portierung als separates Workpaket evaluiert.

**Begründung:** Direkte Portierung des fertigen Vorprojekts hat Priorität — TS jetzt einzuführen würde die Portierung aufblähen und Risiken (Breaking Changes, fehlende Typen für Svelte/Supabase) einschliessen. Die Option bleibt explizit offen.

**Konsequenzen:**
- (+) Portierung schneller und risikoärmer.
- (+) Kein Tooling-Wechsel (ESLint/Prettier bleiben wie im Vorprojekt).
- (−) Override des Senior-Defaults — muss in Code Reviews explizit kommuniziert werden.
- (−) TS-Migration muss später aktiv angestossen werden (nicht vergessen).

---
