# CI

GitHub Actions Workflow `check.yml` läuft bei jedem Push auf `main` und
auf jedem PR. Zwei Jobs:

- **template-integrity** — JSON-Validierung `settings.json`, Hook-Files
  `chmod +x`, Hook-Test-Suite (`tests/hooks.sh`), `> When to read:`
  Konvention in `docs/*.md`, Secret-Scan, `.env`-Files nicht im Repo.
- **project-stack** — wenn `package.json` + Lockfile vorhanden:
  installiert Dependencies, ruft `npm run lint / typecheck / test`
  (alle drei optional).

Pre-Commit ist client-side und Vertrauenssache; CI ist die
Verteidigungslinie. Beide nutzen dieselben Checks → keine Divergenz.
Siehe [`.githooks/README.md`](../../.githooks/README.md) für die
Pre-Commit-Seite.
