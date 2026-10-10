# dsh-deepseek-price-window

DSH-Client-Plugin: In der Statuszeile **unterhalb des Prompt-Eingabefelds**
zeigt es den aktuellen DeepSeek-Preiszeitraum samt Countdown bis zum Wechsel.

```
OFF_PEAK  → PEAK in 2h 14m
   ^grün
PEAK      → OFF_PEAK in 0h 47m
   ^rot
```

## Fachliche Regel

Autoritativ ist die DeepSeek-Preisseite, Fußnote (2):
<https://api-docs.deepseek.com/quick_start/pricing/>

> **PEAK** ist Beijing-Zeit (UTC+8) Montag bis Freitag **09:00–12:00** und
> **14:00–18:00**, **ohne chinesische Feiertage**.
> **OFF_PEAK** ist alles übrige — inklusive Wochenende und chinesischer
> Feiertage ganztägig.

Details: Fenster sind halboffen `[start, ende)`; `12:00` und `18:00` sind
bereits OFF_PEAK. Die Anzeige rechnet immer auf Beijing-Zeit um, unabhängig von
der Zeitzone des Clients.

## Installation

Das Plugin ist ein Cordis-Bundle. Installation in ein Profil über den
Plugin-Manager des Harness (`install_bundle` mit diesem Paketverzeichnis) —
nicht durch manuelles Schreiben in Profildateien.

Nach der Installation erscheint das Badge unter dem Composer; die Zeile im
Profil-Patch lautet:

```yaml
- insert:
    - id: deepseek-price-window
      name: 'dsh-deepseek-price-window'
```

## Regel und Feiertage pflegen

Alle Zeitdaten liegen in **[data/rule.json](data/rule.json)** — kein
Live-Abruf der Preisseite (die Seite ist HTML ohne API-Vertrag).

```json
{
  "timeZone": "Asia/Shanghai",
  "peakWindows": [
    { "start": "09:00", "end": "12:00" },
    { "start": "14:00", "end": "18:00" }
  ],
  "weekendOffPeak": true,
  "countdown": "minute"
}
```

Nach jeder Änderung das eingebettete Artefakt neu erzeugen:

```bash
npm run build:client   # schreibt client.js
npm run check          # prüft Artefakt, Lint, Format und Tests
```

### Feiertage

`data/rule.json` → `holidays.ranges` enthält die chinesischen Feiertage als
inklusive Datumsbereiche, mit `holidays.source` als Quelle.

- **Pflege:** jährlich, sobald das 国务院办公厅 die Feiertagsregelung des
  Folgejahres bekanntgibt (meist im November). Verantwortlich: NFR-Owner.
- **Aktueller Stand:** 2026, Quelle
  [国办发明电〔2025〕7号](https://www.gov.cn/zhengce/content/202511/content_7047090.htm)
  (2025-11-04).
- Für **2027** liegt noch keine Bekanntgabe vor; bis dahin fehlt der Block und
  die Feiertagsausnahme greift für 2027 nicht.
- **Wichtig:** Ist `holidays.ranges` leer, ist die Feiertagsausnahme
  ausdrücklich deaktiviert (nur Mo–Fr-Fenster). Das ist definiert, aber an
  Feiertagen falsch — die Liste gehört vor einer Auslieferung gepflegt.

`调休` (verschobene Arbeitstage) braucht keine Sonderbehandlung: die Regel
unterscheidet nur Mo–Fr, Wochenende und Feiertag; verschobene Arbeitstage sind
Wochenenden und damit ohnehin OFF_PEAK.

## Entwicklung

```bash
npm run check          # Fast-Gate: Artefakt, Lint, Format, Tests
npm run test           # nur Tests (node:test)
npm run lint           # ESLint
npm run format:check   # Prettier
npm run deps           # npm audit
```

### Aufbau

| Pfad | Rolle |
|---|---|
| [lib/price-window.js](lib/price-window.js) | Reine Zeitlogik; einzige Quelle, direkt getestet |
| [lib/client.template.js](lib/client.template.js) | UI-Vorlage mit Platzhaltern (kein eigenständiges Modul) |
| [data/rule.json](data/rule.json) | Zeitregel und Feiertage (gepflegte Daten) |
| [client.js](client.js) | **Generiertes** selbstenthaltenes Client-Bundle |
| [scripts/build-client.mjs](scripts/build-client.mjs) | Erzeugt `client.js` reproduzierbar |
| [test/](test/) | Unit-Tests der Logik + Artefakt-Guards |
| [index.js](index.js) | Host-Hälfte (inert) |

`client.js` ist erzeugt, weil der DSH-Client-Bundle-Loader **keine relativen
Requires** erlaubt. Deshalb wird die Logik eingebettet statt importiert; die
Vorlage ist kein lauffähiges Modul und wird von Lint/Prettier ausgenommen.

## Bekannte Grenzen

- **Kein Live-Abruf** der Preisseite: ändert DeepSeek die Fenster, ist
  `data/rule.json` nachzuziehen.
- **Keine Laufzeit-Konfiguration über `cordis.patch.yml`:** Die Config einer
  Bundle-Zeile erreicht laut Harness nur die Host-Hälfte; die Client-Hälfte
  erhält sie nicht. Die Einstellungen liegen daher als Daten in
  `data/rule.json` (ein JSON, kein Code) und werden beim Build eingebettet.
- **Keine Lokalisierung:** Die Beschriftungen `PEAK`/`OFF_PEAK` sind
  fachliche, sprachneutrale Bezeichner. Weitere Texte sind deutsch.
- Farben kommen ausschließlich aus Theme-Tokens
  (`--dsw-alias-state-success-primary`, `--dsw-alias-state-error-primary`);
  der Zustand wird zusätzlich als Text und in `aria-label` ausgegeben.

## Nichtfunktionale Anforderungen

Projektregeln: [AGENTS.md](AGENTS.md#nichtfunktionale-anforderungen) ·
Risikoprofil: [docs/nfr/risikoprofil.md](docs/nfr/risikoprofil.md) ·
Szenarien: [docs/nfr/qualitaetsszenarien.md](docs/nfr/qualitaetsszenarien.md) ·
Nachweise: [docs/nfr/nachweise/](docs/nfr/nachweise/) ·
Definition of Done: [docs/definition-of-done.md](docs/definition-of-done.md).

## Lizenz

MIT
