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

## 2026-08-24 — Supabase bleibt im Free-Plan, kein Pro-Upgrade

**Status:** accepted

**Kontext:** Seit der Free-Tier-Pause im Juni 2026 stand ein Upgrade auf Supabase Pro als Vor-Messe-Task in `memory/project_messe_prep`. Begründet war es ausschliesslich mit dem Risiko, dass Supabase das Projekt wegen Inaktivität pausiert — am Messetag wäre die App damit tot. Seit Einführung des täglichen Vercel-Cron-Heartbeats (`api/heartbeat.js`, 06:00 UTC) ist das Projekt durchgehend `ACTIVE_HEALTHY`; die Pause ist nie eingetreten.

**Entscheidung:** Kein Pro-Upgrade. Das Projekt läuft auch während der Messe im Free-Plan.

**Begründung:** Der einzige Auslöser für das Upgrade war ein Risiko, das der Heartbeat bereits abdeckt — Pro hätte dasselbe Problem ein zweites Mal gelöst. Die Messe ist ein Einsatz über wenige Tage mit erwartbar niedrigem Volumen; die Free-Limits (500 MB DB, 5 GB Egress) sind bei ~4 KB pro Vote um Grössenordnungen entfernt. Ein Upgrade wäre eine laufende Kostenposition gegen einen Fall, der nicht eintritt.

**Konsequenzen:**

- Positiv: keine Kosten, keine Plan-Migration kurz vor dem Einsatz.
- Negativ: **kein Point-in-Time-Recovery.** Ein versehentliches `DELETE` oder ein Datenverlust während der Messe ist nicht aus Supabase heraus wiederherstellbar. Deshalb gilt: **vor jedem `DELETE FROM votes;` ein CSV-Export ins Projekt** (`backups/`, git-getrackt). Der Export ist das einzige Backup.
- Negativ: Der Heartbeat wird damit zur kritischen Infrastruktur. Fällt der Vercel-Cron aus, pausiert das Projekt nach 7 Tagen Inaktivität. Vor längeren Pausen zwischen Einsätzen den Cron-Status prüfen.
- Falls sich die Lage ändert (mehrtägiger Dauereinsatz, echte Besucherdaten mit Wiederherstellungsbedarf): neue ADR, diese hier auf `superseded` setzen.

**Nachtrag 2026-08-25 — Pro hätte den genannten Nachteil gar nicht behoben.**

Die Frage „einen Monat auf Pro, um ein Fallback zu haben?" kam erneut auf. Recherche in den Supabase-Docs ergab zwei Punkte, die oben fehlten und die Entscheidung *stärken* statt sie zu relativieren:

- **PITR ist nicht Teil von Pro**, sondern ein separates, nutzungsbasiert abgerechnetes Add-on. Der oben als Free-Nachteil geführte Punkt „kein Point-in-Time-Recovery" wäre durch ein Pro-Upgrade also **nicht** verschwunden. Wer die Konsequenz oben liest, könnte das Gegenteil annehmen — daher dieser Nachtrag.
- **Pro allein liefert tägliche Snapshots** (7 Tage Retention). Für einen Einzeltag-Einsatz ist das wirkungslos: das Backup entsteht zu einem nicht steuerbaren Zeitpunkt, der jüngste Snapshot stammt damit von vor Türöffnung, und ein Restore läge vor allen Votes des Tages.

Entscheidend ist die Asymmetrie: Support und Ressourcen lassen sich **reaktiv** nachkaufen, ein Backup nicht — das existiert nur, wenn der Plan schon vor dem Verlust aktiv war. Genau dieses eine Argument für ein Vorab-Upgrade greift hier nicht.

**Konsequenz:** Entscheidung unverändert `accepted`. Der CSV-Export vor jedem `DELETE` bleibt das einzige Backup — seit 2026-08-25 durch `npm run snapshot` abgesichert, das bei unvollständigem Export abbricht statt zu schreiben (siehe `docs/ops-tooling.md`). Ein künftiges Upgrade müsste mit Support oder Ressourcen begründet werden, nicht mit Datensicherheit.

---

## 2026-06-25 — Server-Rate-Limit entfernt, Dedup nur über UNIQUE id

**Status:** accepted

**Kontext:** Die Edge Function `submit-vote` lehnte Votes ab, wenn dieselbe `device_id` innerhalb von 15s schon einen Vote abgesetzt hatte (429). Das Limit war 2026-05-15 als Schutz gegen schnelles Mehrfach-Klicken eingeführt, mit der Annahme „liegt unter dem 20s-Reset, trifft legitime Nutzung nie". Der versteckte Skip-Button („Geister-Button") im Result-Footer brach diese Annahme: Votes <15s wurden möglich, vom Limit abgelehnt — und der Client behandelte das 429 als vorübergehenden Fehler und wiederholte `queue[0]` endlos (429-Sturm, sichtbar in Safari; lokale Queue-Anzeige inflationierte den Count).

**Entscheidung:** Das zeitbasierte Rate-Limit wird ersatzlos entfernt. Duplikat-Schutz läuft allein über stabile UUID + UNIQUE-Constraint + `23505`-als-Erfolg. Zusätzlich: Client unterscheidet terminale (4xx → verwerfen) von vorübergehenden Fehlern (5xx/Netz/Timeout → wiederholen). Der Geister-Button wird entfernt — einziger Rückweg zum Vote-Screen ist der 20s-Reset.

**Begründung:** Das Limit schützte gegen niemanden: echte Besucher können wegen 20s-Reset + `voted`-Flag ohnehin nicht schnell re-voten; Bots umgehen es trivial, da `device_id` im Client-Payload steht (und der Endpunkt ohne Auth öffentlich ist). Mehrfach-Votes pro Gerät sind ausdrücklich gewollt (1 iPad, viele Besucher). Es verursachte nur den Sturm. Ein client-seitiges Bypass-Flag wurde verworfen (redundant zur UUID-Dedup, aushebelbar, Over-Engineering).

**Konsequenzen:**
- (+) Kein 429-Sturm mehr; festhängende Queue-Votes lösen sich auf.
- (+) Schnelle (Test-)Votes zählen alle; kein Head-of-Line-Blocking der Queue.
- (+) Robuste Fehlerklasse-Trennung schützt vor künftigen terminalen Fehlern.
- (−) Kein server-seitiger Flood-Backstop mehr. Für einen öffentlichen No-Auth-Voting-Endpunkt ist echter Bot-Schutz ohnehin nur mit Auth/Token-Architektur möglich (out of scope).
- (!) **Deploy nötig:** Repo-Edit deployt die Edge Function nicht automatisch — `submit-vote` muss neu deployed werden.

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
