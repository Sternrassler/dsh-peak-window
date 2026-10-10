# Plan — DeepSeek PEAK/OFF-PEAK Status (DSH-Plugin) + NFR-Einführung

| Feld | Wert |
|---|---|
| Stand | 2026-10-10 |
| Autoritative Spezifikation | [`docs/spezifikation.md`](../spezifikation.md) |
| NFR-Paket | `~/vscode/brain/docs/specs/nfr/` (v1.0, Bezugsstand 2026-10-10) |
| Fachregel | DeepSeek „Models & Pricing" (URL in Spezifikation §2) |
| Umsetzung | lokal, erst nach eigener Freigabe (`executing-plans`) |

## 1. Ziel

Ein DSH-Client-Plugin, das unterhalb des Composers (`conversation.composer.dock`)
den aktuellen DeepSeek-Preiszeitraum **PEAK** (rot) / **OFF_PEAK** (grün) samt
Countdown anzeigt, nach der Regel in `docs/spezifikation.md` §3 — inklusive
Beijing-Zeitzone und chinesischer Feiertage. Parallel wird die NFR-Spezifikation
im Modus „Neues Projekt" eingeführt (Gates ab Tag 1 scharf).

## 2. Architektur

- **Pure Zeitlogik** (`lib/price-window.js`): `state(nowUtc, config)`,
  `nextTransition(nowUtc, config)`, `validateConfig(config)`. Keine DOM-/DSH-
  Abhängigkeit → vollständig unit-testbar.
- **Client-Plugin** (`client.js`): registriert sich am Slot
  `conversation.composer.dock`, rendert Badge, hält Timer
  (Mount-Berechnung, `setInterval` 30 s, exakter `setTimeout` zur Grenze).
- **Bundle** (`package.json`, `cordis.patch.yml`, ggf. `index.js` als Host-Hülle):
  nach `cordis-plugin-development` → `templates/decoration/`.
- **Config** wird als JSON-Schema projiziert (Spezifikation §4.1).

## 3. Globale Randbedingungen

- Workspace `/home/ix/vscode/deepseekharness` ist **leer und noch kein Git-Repo**.
- Installation ins Profil via `plugin_manager` → `install_bundle` (verändert das
  Profil `web`; jede Aktion benötigt Freigabe).
- **Delivery ist nicht freigegeben** (kein Push/PR/Publish). CI wird eingerichtet
  und lokal demonstriert; der externe Abnahme-PR braucht gesonderte Freigabe.
- Keine Netz-, Storage- oder Host-Abhängigkeit im Laufzeitpfad.

## 4. Scope

**In:** Zeitlogik, Config (Zeitzone, PEAK-Fenster, Feiertage, Countdown-Präzision),
Badge-UI, Feiertags-Pflege, NFR-Grundlage + Gates + Abnahme.

**Nicht:** Preise/Kostenanzeige, Modellauswahl, Live-Abruf der Preisseite,
„调休"-Behandlung, Veröffentlichung.

## 5. Erfolgskriterien (beobachtbar)

1. Unit-Tests der Zeitlogik (Fälle Spezifikation §3.1) grün.
2. `install_bundle` → `application: applied`; `cordis_inspect_query` bestätigt
   Registrierung am `conversation.composer.dock`.
3. Badge zeigt korrekt PEAK/OFF_PEAK + Countdown, flippt exakt an Fenster-/
   Feiertagsgrenzen, liest sich in Light **und** Dark, keine Console-Fehler.
4. Gate-Abnahme: ein absichtlich verletzender Commit wird vom lokalen Gate
   blockiert (beobachteter Nachweis je Stufe).

---

## 6. Aufgaben

### T0.1 — Projekt- und NFR-Grundlage

- **Kontext/Zielpfade:** `docs/spezifikation.md`, NFR-Paket, Vorlage
  `~/vscode/brain/docs/templates/agents-nichtfunktionale-anforderungen.md`.
  Erzeugt: `AGENTS.md`, `docs/nfr/risikoprofil.md`, `docs/nfr/qualitaetsszenarien.md`,
  `.github/`-Templates, `docs/specs/nfr/` (referenziert/kopiert), `package.json`.
- **Verhalten:** NFR-Block `nfr-template:v1` **samt Verwendungsregeln** ins
  `AGENTS.md` (kein Kopieren in Fremdcode/Archive). Risikoprofil und
  Qualitätsszenarien aus Spezifikation §5 als Dateien ablegen. DoD-, PR- und
  Issue-Template (aus NFR-Paket `templates/`) einbinden; Verweise auf konkretes
  Gate und Nachweis-Protokoll ersetzen.
- **Schritte:**
  1. `git init`; `.gitignore` (node_modules, Dist, lokale Secrets).
  2. `AGENTS.md` mit Projekt-Einstieg + NFR-Block anlegen.
  3. `docs/specs/nfr/` übernehmen (README verweist auf Bezugsstand/Version).
  4. Risikoprofil-/Szenarien-Dateien und Templates schreiben.
  5. `package.json` (Bundle-Grundgerüst, keine Runtime-Dependencies) anlegen.
- **Prüfung:** `node -e "JSON.parse(require('fs').readFileSync('package.json'))"` OK;
  `grep -q 'nfr-template:v1' AGENTS.md` OK; Templates enthalten NFR-Pflichtblock.
- **Abschluss:** alle Dateien liegen vor; NFR-Owner (Karsten) und Rollen sind
  dokumentiert. **Abhängigkeit:** keine.

### T0.2 — Gates einrichten und lokal demonstrieren

- **Kontext/Zielpfade:** `02-quality-gates.md` (Prüfkatalog, §2). Erzeugt:
  `Makefile`/`npm run`-Skripte (`lint`, `test`, `sast`, `secret`, `deps`, `check`),
  `.github/workflows/` (Fast/Pre-Merge, Merge, Release).
- **Verhalten:** Prüfkategorien auf Werkzeuge mappen und Schwellwerte aus den
  Qualitätsszenarien bestätigen:
  - Fast: `test` (unit) + `secret` (gitleaks, hart).
  - Merge: `lint` (ESLint+Prettier, 0 Fehler), `sast` (Semgrep, 0 Critical/High),
    `deps` (npm audit, 0 ausnutzbare Critical/High), `test`, Markdown-Link-Check.
  - Release: `install_bundle` + `cordis_inspect_query`-Smoke + manueller
    Visuell-Check light/dark.
  - **Escape-Markierung:** gezielte, befristete Deaktivierung einer einzelnen
    Prüfung mit Verweis auf dokumentierte Ausnahme + Review-Datum; keine
    pauschalen Gate-Ausnahmen.
- **Schritte:** Skripte schreiben → CI-Workflows → lokal `make check` grün →
  Abnahme: ein absichtlich verletzender Commit (z. B. Secret in Testdatei) auf
  einem Branch → `make check` **blockiert**; Ergebnis im
  `docs/nfr/nachweise/` protokollieren.
- **Prüfung:** `make check` auf sauberem Stand = grün; auf verletzendem Commit =
  Exit ≠ 0 und Befund ausgegeben.
- **Abschluss:** drei Gate-Stufen lokal ausführbar, Escape-Markierung vorhanden,
  je Gate ein beobachteter Abnahmenachweis. **Abhängigkeit:** T0.1.

### T1 — Zeitlogik + Tests

- **Kontext/Zielpfade:** Spezifikation §3. Erzeugt: `lib/price-window.js`,
  `test/price-window.test.js`. Test-Runner `node:test` (keine Dependency).
- **Verhalten/Schnittstellen:**
  - `state(nowUtc, config) -> 'PEAK' | 'OFF_PEAK'`
  - `nextTransition(nowUtc, config) -> { atUtc, next }` (erster Wechsel)
  - `validateConfig(config) -> { ok, errors[] }`
  - Fehlerfälle: ungültige Fenster (Ende ≤ Anfang, Format), ungültiges
    Feiertags-Datum, leeres `peakWindows`, unbekannte `timeZone`. Keine stillen
    Ersatzwerte → `validateConfig` meldet, UI zeigt definierten Fehlerzustand.
- **Testfälle (mindestens):** Mo 10:00 → PEAK; Mo 12:30 → OFF_PEAK; Mo 15:00 →
  PEAK; Mo 18:00 → OFF_PEAK; Mo 09:00 → PEAK; Sa 10:00 → OFF_PEAK; Feiertag
  (Mo 10:00) → OFF_PEAK; Flips 12:00/14:00; Countdown bei 08:59 → 1 min bis PEAK;
  Zeitzonen-Unabhängigkeit (fester UTC-Instant → gleiche Aussage unabhängig von
  `process.env.TZ`); Config-Validierungsfehler.
- **Schritte:** Modul implementieren → Tests rot schreiben (Red-Green-Refactor)
  → `validateConfig` + Fehlerzustände.
- **Prüfung:** `node --test test/` → alle grün, Exit 0.
- **Abschluss:** alle Testfälle grün, Modul frei von DOM-/DSH-Importen.
  **Abhängigkeit:** T0.1.

### T2 — Bundle (UI-Plugin)

- **Kontext/Zielpfade:** Skill `cordis-plugin-development` →
  `templates/decoration/` und `references/ui-plugin.md` (Client-Manifest,
  Modul-Loader, Slot-Registrierung), `references/practices.md`, Slot-Topologie
  (`conversation.composer.dock`, Registrierung `id`/`order`/`label`).
  Erzeugt: `package.json`, `cordis.patch.yml`, `index.js`, `client.js`.
- **Verhalten:** Client registriert Badge am Dock-Slot; rendert Textlabel +
  Countdown + `aria-label`; Farben nur über Theme-Tokens
  `--dsw-alias-state-success-primary` / `--dsw-alias-state-error-primary` und
  neutrale Tokens. Timer wie Spezifikation §3.5. Config-Schema aus §4.1 wird
  projiziert.
- **Fehlerfälle:** ungültige Config → sichtbarer Fehlerzustand statt falschem
  PEAK/OFF_PEAK; Timer wird bei Unmount bereinigt (kein Leak).
- **Schritte:** Vorlagen kopieren → Config-Schema + Slot-Registrierung →
  `client.js` gegen `lib/price-window.js` verdrahten → `node --check` je Datei →
  Manifest prüfen.
- **Prüfung:** `node --check client.js && node --check index.js` Exit 0;
  Patch/Manifest syntaktisch gültig.
- **Abschluss:** Bundle-Dateien liegen vor, keine Harness-Client-Pakete importiert.
  **Abhängigkeit:** T1.

### T3 — Installation & visuelle Verifikation

- **Kontext/Zielpfade:** Bundle-Verzeichnis; `plugin_manager install_bundle`;
  `cordis_inspect_query` (`Slots.listSubTree` mit `root: conversation.composer.dock`).
- **Verhalten:** Installation ins Profil `web`; Registrierung am Dock-Slot
  sichtbar; Badge erscheint unterhalb des Composers.
- **Schritte:** `install_bundle` → Ergebnis `application: applied` prüfen →
  Slot-Registrierung per `cordis_inspect_query` bestätigen → Sichtprüfung
  Light/Dark + Console auf Slot-Entry-Crash → Zustand gegen reale Beijing-Zeit
  plausibilisieren.
- **Prüfung:** `application: applied`; `cordis_inspect_query` zeigt den
  registrierten Eintrag; keine Console-Fehler; Badge in beiden Themes lesbar.
- **Abschluss:** Plugin läuft sichtbar und korrekt; Ergebnis + Grenzen der
  Prüfung (z. B. ohne Browser-Automatisierung) dokumentiert.
  **Abhängigkeit:** T2, T0.2 (Release-Gate).

### T4 — Doku & Feiertags-Pflege

- **Kontext/Zielpfade:** `README.md`, `docs/spezifikation.md` §3.3.
  Erzeugt: `README.md`, Feiertags-Defaults in der Config-Default.
- **Verhalten:** README dokumentiert Regel, Quelle (URL + Stand), Config-Felder,
  Feiertags-Pflege (Wer pflegt wann, Quelle 国务院办公厅) und die Bedeutung von
  `holidays: []`.
- **Schritte:** README schreiben → Feiertage 2026/2027 aus offizieller
  Bekanntgabe pflegen, Quelle + Stand im Repo festhalten → Defaults in Config
  übernehmen.
- **Prüfung:** Markdown-Link-Check 0 Fehler; Feiertags-Defaults sind gegen die
  genannte Quelle nachvollziehbar.
- **Abschluss:** README + gepflegte Feiertagsliste mit Quelle. **Abhängigkeit:** T2.

## 7. Reihenfolge & offene Kernannahmen

Kritischer Pfad: **T0.1 → T1 → T2 → T3**, mit **T0.2 → T3** fürs Release-Gate;
**T4** nach T2.

**Offene Kernannahme (vor Umsetzung prüfen):**
1. Exakte Feiertagsdaten 2026/2027 liegen erst mit der offiziellen Bekanntgabe
   vor — T4 darf keine erfundenen Daten als autoritativ ausgeben; bis dahin
   `holidays: []` mit dokumentierter Bedeutung oder explizit als „vorläufig"
   markierte Liste verwenden.

**Delivery-Grenze:** Push/PR/Publish des Bundles ist nicht Teil dieses Plans;
sie erfordert eine eigene, ausdrückliche Freigabe.
