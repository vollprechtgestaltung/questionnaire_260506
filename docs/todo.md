# TODO — Übergabe an Messebauer

Folgende Punkte sind vor dem Messeeinsatz noch zu klären und zu dokumentieren.
Wird in einer separaten Session ausgearbeitet.

## Setup auf dem iPad

- [ ] Wie wird die App auf dem iPad installiert (Safari → Teilen → Home-Bildschirm)?
- [ ] Welche iPad-Einstellungen müssen vorgenommen werden?
  - Auto-Lock auf "Nie"
  - Lautstärke / Stummschalter
  - Helligkeit
  - Benachrichtigungen aus
  - WLAN-Verbindung zum MiFi
- [ ] Schriftarten / Sprache prüfen

## Kiosk-Modus

- [ ] Guided Access aktivieren (Einstellungen → Bedienungshilfen → Geführter Zugriff)
- [ ] Code für Guided Access festlegen und dokumentieren
- [ ] Bedienungselemente (Home-Button, Lautstärke, Touchbereiche) einschränken
- [ ] Test: Besucher kann die App nicht versehentlich verlassen

## Fehler-Handling vor Ort

- [ ] Was tun bei rotem "Server nicht erreichbar"-Indikator?
- [ ] Was tun bei eingefrorenem Bildschirm? (App neu starten via Guided Access aufheben)
- [ ] Wer ist Ansprechpartner am Messetag bei technischen Problemen?
- [ ] Backup-iPad vorbereiten und identisch konfigurieren

## Offline-Betrieb

- [ ] Wie lange kann die App ohne Internet sicher laufen?
  - Queue-Limit: 500 Votes pro iPad
  - Letzte bekannte Zahlen bleiben sichtbar
  - Votes werden bei Wiederverbindung automatisch nachgeliefert
- [ ] Was passiert, wenn das MiFi-Datenvolumen aufgebraucht ist?
- [ ] Empfohlene Mindest-Bandbreite

## Don'ts — was nicht gemacht werden darf

- [ ] iPad nicht komplett ausschalten (Service Worker und localStorage gehen nicht verloren, aber: Standby reicht)
- [ ] Browser-Daten / Website-Daten nicht löschen (Queue + Cache wären weg)
- [ ] Während aktivem Vote nicht das iPad neu starten
- [ ] Keine anderen Apps auf dem iPad verwenden während Messebetrieb
- [ ] iPad nicht in den Hintergrund schicken über längere Zeit (Wake Lock geht verloren)

## Checkliste vor Messebeginn

- [ ] Alle iPads im selben WLAN
- [ ] Alle iPads zeigen "Online" im Statusbereich
- [ ] Testvote auf jedem iPad → erscheint auf allen anderen
- [ ] MiFi geladen und SIM-Datenvolumen aktiv
- [ ] Ersatz-Ladekabel und Powerbank dabei
- [ ] Notfall-Kontaktnummer dem Standpersonal kommuniziert
