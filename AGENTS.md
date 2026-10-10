# Projektregeln — dsh-deepseek-price-window

DSH-Client-Plugin, das in der Statuszeile unterhalb des Composers den aktuellen
DeepSeek-Preiszeitraum (`PEAK` rot / `OFF_PEAK` grün) samt Countdown anzeigt.

- **Ziel:** [docs/spezifikation.md](docs/spezifikation.md)
- **Plan:** [docs/plans/2026-10-10-deepseek-peak-offpeak-status.md](docs/plans/2026-10-10-deepseek-peak-offpeak-status.md)
- **NFR:** [docs/specs/nfr/README.md](docs/specs/nfr/README.md), Risikoprofil [docs/nfr/risikoprofil.md](docs/nfr/risikoprofil.md), Szenarien [docs/nfr/qualitaetsszenarien.md](docs/nfr/qualitaetsszenarien.md)
- **Regel/Feiertage:** [data/rule.json](data/rule.json) — Änderungen mit `npm run build:client` einspielen
- **Prüfen:** `npm run check` (Artefakt-Aktualität + Tests)

## Bootstrap-Regeln

- Truth-Tiers: (1) Quellcode, (2) Repo-Doku, (3) Brain.
- Lokale Änderungen und Tests eigenständig; externe Delivery (Push, PR, Publish)
  nur bei explizitem Auftrag.
- Skill-Artefakte dieses Projekts: Client-Bundles in DSH erlauben **keine
  relativen Requires**; `client.js` ist generiert und selbstenthalten.

<!-- nfr-template:v1 begin -->
<a id="nichtfunktionale-anforderungen"></a>
## Nichtfunktionale Anforderungen

Diese Anforderungen gelten für neue und geänderte Arbeit im Projektscope.
Strengere lokale Regeln bleiben verbindlich. Die Aufnahme dieses Abschnitts
ist kein Nachweis, dass der Bestand die Anforderungen bereits erfüllt.

- **Clean Code — Stufe Weiß:** Das gesamte
  [Clean-Code-Developer-Wertesystem](https://clean-code-developer.de/die-grade/weisser-grad/)
  (Bezugsstand 04.10.2026) als kontinuierliche Praxis anwenden: verständliche Namen, kleine kohärente
  Einheiten, klare Zuständigkeiten, explizite Verträge, KISS/DRY/SOLID mit
  Augenmaß, passende Tests, Refactoring und regelmäßige Reflexion.
  Keine unnötigen Abstraktionen; Weiß ist keine Zertifizierung oder Bewertung.
- **Wartbarkeit:** Änderungen lokal begrenzen, Schnittstellen und Abhängigkeiten
  nachvollziehbar halten. Entscheidungen und Betriebswissen im Repo pflegen;
  Doku bei Änderungen nachziehen. Reproduzierbare Builds und passende
  Format-, Analyse- und Regressionchecks für vorhandene Software verwenden.
- **Ausfallsicherheit:** Ungültige Eingaben und Ausfälle explizit behandeln;
  keine stillen Ersatzwerte oder Erfolgsmeldungen. Externe Aufrufe begrenzen
  (Timeouts, endliche Retries; Wiederholung nur bei sicherer Semantik).
  Teilfehler eingrenzen, Datenintegrität schützen und Fehler beobachtbar machen.
  Für persistente Nutzerdaten und betriebene Dienste Wiederherstellung,
  Backup/Restore und gegebenenfalls Rollback passend zum Risiko festlegen und prüfen.
- **Informationssicherheit:** Eingaben an Vertrauensgrenzen validieren,
  minimale Rechte und sichere Voreinstellungen verwenden. Secrets aus Git,
  Logs und Ausgaben fernhalten. Abhängigkeiten und betroffene Angriffsflächen
  prüfen; neue Sicherheitsbefunde bewerten und vor Auslieferung beheben oder
  eine begründete, ausdrücklich akzeptierte Ausnahme im Repo dokumentieren.
- **Datenschutz:** Nur zweckgebundene, erforderliche Daten verarbeiten und
  speichern. Datenflüsse, Zugriffe, Aufbewahrung und Löschung im Projekt
  festhalten, soweit personenbezogene Daten betroffen sind. Synthetische
  Testdaten bevorzugen; Logs und Telemetrie minimieren. Reale personenbezogene
  oder vertrauliche Daten nur innerhalb der konkret geltenden Anbieter-,
  Vertrags- und Freigabegrenzen an externe Dienste oder KI übergeben.

**Nachweis bei Änderungen:** Betroffene Qualitätsbereiche benennen und
passende Prüfungen mit beobachtetem Ergebnis dokumentieren. Bei Laufzeitwirkung
relevante Fehler-/Wiederanlaufpfade, bei Sicherheits- oder Datenschutzwirkung
Vertrauensgrenzen beziehungsweise Datenflüsse mitprüfen. Nicht anwendbare
Kriterien begründen; fehlende Prüfungen und verbleibende Risiken offen nennen.
Keine pauschale Konformitätsbehauptung ohne Nachweis.
Nachweise datensparsam führen: Test/Version, Status und knappe Ergebnisse
bevorzugen; keine Secrets, realen personenbezogenen Daten, vertraulichen
Payloads oder vollständigen Logs aufnehmen. Notwendige Ausschnitte redigieren
oder synthetische Werte verwenden; geschützte Artefakte nur innerhalb ihrer
Zugriffs- und Aufbewahrungsgrenzen referenzieren.
<!-- nfr-template:v1 end -->

## Verhältnis zur NFR-Spezifikation

Dieser Block ist die kompakte, angewandte Instanz der Vorlage
`agents-nichtfunktionale-anforderungen.md` (Bezugsstand 2026-10-04). Die
erweiterte Spezifikation wird als Paket referenziert, nicht kopiert:
[docs/specs/nfr/README.md](docs/specs/nfr/README.md).
