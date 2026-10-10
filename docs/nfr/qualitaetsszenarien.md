# Qualitätsszenarien

Je aktivem Qualitätsbereich mindestens ein Szenario mit Ziel, Auslöser, Metrik,
Schwellwert (mit Einheit und Vergleichsrichtung), Messmethode, Owner und Gate
(NFR-Spezifikation Abschnitt 5).

## NFR-B1/2-1 — Verständlichkeit (review-basiert)

| Feld | Wert |
|---|---|
| **Ziel** | Lesbarkeit und Wartbarkeit ohne mündliche Übergabe |
| **Auslöser** | Review vor dem Merge; eine Person arbeitet sich neu ein |
| **Metrik** | Anzahl offener „unklar"-Befunde (Definition und Kriterien unten) |
| **Schwellwert** | `= 0` offene Befunde |
| **Messmethode** | Code-Review mit Kriterienliste, Befundliste im Nachweis-Protokoll |
| **Owner** | Karsten Flache (Quality Owner Wartbarkeit) |

**Zugeordnetes Gate:** Merge

Als „unklar"-Befund zählt jede Stelle, die ohne mündliche Übergabe nicht
verstanden wird oder deren Absicht nur geraten werden kann. Kriterien:
Zweck erkennbar · Zuständigkeit klar · Vertrag explizit · Grenzfall begründet ·
Zahl/Text herleitbar (09:00/12:00/14:00/18:00 mit Quellenverweis) · keine
Personenabhängigkeit · Doku aktuell. Jeder Befund wird behoben oder als
dokumentierte Ausnahme geführt (NFR-Spezifikation Abschnitt 8).

## NFR-B3-1 — Definierter Zustand bei ungültiger Regel-Konfiguration

| Feld | Wert |
|---|---|
| **Ziel** | Keine stillen Ersatzwerte bei ungültiger Regel |
| **Auslöser** | `data/rule.json` enthält ungültiges Fenster, ungültiges Feiertagsdatum oder unbekannte Zeitzone |
| **Metrik** | Fehlschlagende Validierungsfälle in `test/price-window.test.js` |
| **Schwellwert** | `= 0` Fehler |
| **Messmethode** | automatisiert: `npm test` (node:test), Fast-Gate |
| **Owner** | Karsten Flache (Quality Owner Ausfallsicherheit) |

**Zugeordnetes Gate:** Fast / Pre-Merge

## NFR-B3-2 — Korrekte Grenzwert- und Zeitzonenlogik

| Feld | Wert |
|---|---|
| **Ziel** | Korrekte Zuordnung PEAK/OFF_PEAK an Fenster-, Wochenend- und Feiertagsgrenzen |
| **Auslöser** | Zeitpunkt exakt an einer Fensterkante bzw. in einer Zone ungleich Asia/Shanghai |
| **Metrik** | Fehlschlagende Zeitlogik-Tests (21 Fälle in `test/price-window.test.js`) |
| **Schwellwert** | `= 0` Fehler |
| **Messmethode** | automatisiert: `npm test`, Merge-Gate |
| **Owner** | Karsten Flache |

**Zugeordnetes Gate:** Merge

## NFR-B4-1 — Keine Secrets, keine kritischen Befunde

| Feld | Wert |
|---|---|
| **Ziel** | Keine Secrets im Repo, keine kritischen Schwachstellen |
| **Auslöser** | Commit/PR bzw. Release |
| **Metrik** | Befunde je Scan |
| **Schwellwert** | `= 0` Secrets, `= 0` SAST Critical/High, `= 0` ausnutzbare Abhängigkeitslücken (Produktivabhängigkeiten) |
| **Messmethode** | automatisiert: `npm run secret` (gitleaks, hart), `npm run sast` (Semgrep), `npm run deps` (npm audit) |
| **Owner** | Karsten Flache (Quality Owner Informationssicherheit) |

**Zugeordnetes Gate:** Fast (Secrets) / Merge (SAST, Dependencies)

Hinweis: Das Paket hat **keine** Produktivabhängigkeiten (`require('react')`
stammt aus der DSH-Modultabelle), damit ist die Angriffsfläche klein — das
ersetzt die Prüfung nicht.

## NFR-B5-1 — Keine personenbezogenen Daten

| Feld | Wert |
|---|---|
| **Ziel** | Keine Verarbeitung oder Übertragung personenbezogener Daten |
| **Auslöser** | Laufzeit des Plugins im Browser |
| **Metrik** | Bestätigte Datenflüsse |
| **Schwellwert** | `= 0` personenbezogene Daten, `= 0` Netzwerkziele |
| **Messmethode** | Review des Laufzeitpfads + automatisiert: Artifact-Test verbietet Netz-/Storage-Aufrufe |
| **Owner** | Karsten Flache (Quality Owner Datenschutz) |

**Zugeordnetes Gate:** Merge

## NFR-M3-1 — Zustand nicht nur über Farbe, Kontrast in beiden Themes

| Feld | Wert |
|---|---|
| **Ziel** | Zustand ohne Farbwahrnehmung erkennbar; lesbar in Light und Dark |
| **Auslöser** | Farbfehlsichtigkeit; Theme-Wechsel |
| **Metrik** | Accessibility-Verstöße; Vorhandensein von Textlabel und `aria-label` |
| **Schwellwert** | `= 0` Verstöße; Textlabel `PEAK`/`OFF_PEAK` und `aria-label` müssen vorhanden sein |
| **Messmethode** | automatisiert: Artifact-Test prüft Textlabel, `role="status"`, `aria-label` und Theme-Tokens; dazu manueller Sichtprüf-Check in Light und Dark |
| **Owner** | Karsten Flache (Quality Owner Usability) |

**Zugeordnetes Gate:** Merge / Release

## NFR-M4-1 — Saubere Registrierung im DSH-Slot

| Feld | Wert |
|---|---|
| **Ziel** | Bundle registriert sich ohne Fehler am Dock-Slot |
| **Auslöser** | Installation/Update des Bundles im Profil |
| **Metrik** | Slot-Registrierung vorhanden; Console-Fehler |
| **Schwellwert** | Registrierung vorhanden, `= 0` Slot-Entry-Crashes |
| **Messmethode** | automatisiert/manuell: `plugin_manager install_bundle` → `application: applied`; `cordis_inspect_query` `Slots.listSubTree` mit `root: conversation.composer.dock`; Sichtprüfung |
| **Owner** | Karsten Flache (Quality Owner Kompatibilität) |

**Zugeordnetes Gate:** Release

## Inaktive Bereiche

`NFR-M1`, `NFR-M2`, `NFR-M5` sind inaktiv; Begründung im
[Risikoprofil](risikoprofil.md). Für inaktive Module ist kein Szenario nötig.
