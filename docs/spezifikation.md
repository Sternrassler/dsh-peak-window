# Spezifikation — DeepSeek PEAK/OFF-PEAK Status (DSH-Plugin)

| Feld | Wert |
|---|---|
| Status | Entwurf, zur Freigabe |
| Stand | 2026-10-10 |
| Paketname | `@sternrassler/dsh-deepseek-price-window` |
| Zielplattform | DSH Web-UI (Client-Plugin, Cordis-Bundle) |

## 1. Zweck und Zielbild

In der DSH-Statuszeile **unterhalb des Prompt-Eingabefelds** wird laufend
angezeigt, ob aktuell der **PEAK**- oder **OFF_PEAK**-Zeitraum der DeepSeek-API-
Preistabelle gilt, inklusive Countdown bis zum nächsten Wechsel.

- **PEAK** → rot, **OFF_PEAK** → grün.
- Genau zwei Zustände; keine Preise, keine Modellauswahl.
- Zeitverschiebung China ↔ Client: Die Regel gilt in **Beijing-Zeit**
  (Asia/Shanghai, UTC+8, keine Sommerzeit). Der Client rechnet seine lokale Zeit
  automatisch auf Beijing-Zeit um.

## 2. Normative Quellen

1. **Fachliche Regel** (autoritativ): DeepSeek API Docs, „Models & Pricing",
   <https://api-docs.deepseek.com/quick_start/pricing/> (Stand 2026-10-10).
   Fußnote (2) lautet sinngemäß:

   > OFF_PEAK kostet die Hälfte von PEAK. Beijing-Zeit Mo–Fr
   > **09:00–12:00 und 14:00–18:00** (ohne chinesische Feiertage) ist PEAK;
   > alle übrigen Zeiten — inklusive Wochenende und chinesischer Feiertage
   > ganztägig — sind OFF_PEAK.

   Die englische Seite drückt dieselben Fenster in UTC aus
   (01:00–04:00 und 06:00–10:00 UTC); inhaltlich identisch.

2. **NFR**: NFR-Spezifikationspaket v1.0 (Bezugsstand 2026-10-10).
   Modus **Neues Projekt**.

## 3. Fachliche Anforderungen

### 3.1 Auswertungsregel (Funktion `state(nowUtc, config)`)

Gegeben ein UTC-Zeitpunkt `now` und die Config:

1. Wandle `now` in die Zielzeitzone `config.timeZone` (Default
   `Asia/Shanghai`) um. Ermittle dort lokales Datum, Wochentag und Uhrzeit.
2. **Wochenende** (Sa/So) → `OFF_PEAK` (wenn `config.weekendOffPeak === true`).
3. **Feiertag** (lokales Datum innerhalb eines Bereichs in `config.holidays`)
   → `OFF_PEAK` (ganztägig).
4. Sonst: Uhrzeit in einem PEAK-Fenster → `PEAK`, andernfalls `OFF_PEAK`.

**Fenster-Semantik:** halboffen `[start, ende)`. `09:00` zählt zu PEAK,
`12:00` und `18:00` zählen bereits zu OFF_PEAK.

**Countdown:** Der nächste Zustandswechsel wird aus einer sortierten Liste
bevorstehender Grenzereignisse bestimmt (Fensteranfang/-ende, Feiertagsbeginn
00:00, Feiertagsende 00:00, Montag 00:00 nach einem Wochenende) über einen
Horizont von ≥ 31 Tagen. Angezeigt wird die Restdauer bis zum ersten Ereignis,
dessen Folgezustand vom aktuellen abweicht.

### 3.2 Zeitverschiebung

- Immer gegen die **Zielzeitzone** auswerten, nie gegen die Client-Zeitzone.
- Umsetzung über `Intl.DateTimeFormat(..., { timeZone })` bzw. äquivalente
  IANA-Zeitzonenlogik — kein manueller Offset, keine Annahme über DST der
  Client-Zone. `Asia/Shanghai` ist UTC+8 ohne DST; `Intl` bleibt dennoch die
  robuste Wahl, damit auch andere Zielzonen korrekt sind.

### 3.3 Feiertage

- Chinesische Feiertage kommen aus der Config (statisch, keine Netzabfrage).
- Datumsbereiche inklusive, Format `YYYY-MM-DD`.
- `config.holidays === []` bedeutet ausdrücklich „Feiertagsausnahme
  deaktiviert" (nur Mo–Fr-Fenster). Das ist definiert, aber **kein** stiller
  Ersatzwert: Die Bedeutung steht in README und Config-Schema.
- Defaults werden aus der offiziellen Bekanntgabe (国务院办公厅) gepflegt und
  im Repo mit Quelle + Stand dokumentiert. Pflege ist Wartungsaufgabe, kein
  Laufzeit-Fetch.

### 3.4 Anzeige

- Zustands-Badge: Farbpunkt + Textlabel `PEAK` (rot) bzw. `OFF_PEAK` (grün).
- Countdown: `noch 1h 23m` bzw. `→ PEAK in 3h 02m`.
- `config.countdown` = `"minute"` (Default) oder `"second"`.
- Barrierefreiheit: Zustand ist **nicht nur** über Farbe erkennbar (Textlabel);
  zusätzlich `aria-label`/`title`, z. B.
  `DeepSeek Preiszeitraum: PEAK, Wechsel zu OFF_PEAK in 1h 23m (Beijing-Zeit)`.

### 3.5 Aktualisierung

- Berechnung beim Mount, danach periodisch (`setInterval` 30 s) **und** ein
  exakter `setTimeout` auf die nächste Grenze für den präzisen Zustandsflip.
- Countdown-Genauigkeit „minute": Neuberechnung mindestens jede Minute
  (30-s-Intervall deckt das ab); „second": Intervall 1 s.

## 4. Technische Einordnung

- **Slot:** `conversation.composer.dock` (List-Slot, „Ambient entries below the
  composer card", Scope `session`). Registrierung: `id`, `order`, `label`.
- **Plugin-Typ:** Client-UI-Plugin (Cordis-Bundle, Vorlage
  `cordis-plugin-development` → `templates/decoration/`).
- **Theming:** Zustandsfarben über Theme-Tokens
  `--dsw-alias-state-success-primary` (grün) und
  `--dsw-alias-state-error-primary` (rot); neutrale Flächen/Texte über
  `--dsw-alias-bg-layer-1`, `--dsw-alias-label-secondary`,
  `--dsw-alias-border-l1`. Keine hartkodierten Farben; Light/Dark wird vom
  Theme geliefert.
- **Keine Netz-, Storage- oder Host-Abhängigkeit** für den Laufzeitpfad:
  reine Zeitberechnung im Client.

### 4.1 Regel-Daten (umgesetzt)

Die Regel liegt als gepflegtes JSON in `data/rule.json` und wird beim Build in
das selbstenthaltene `client.js` eingebettet.

```jsonc
{
  "timeZone": "Asia/Shanghai",                                  // IANA-Zielzeitzone
  "peakWindows": [{ "start": "09:00", "end": "12:00" },          // halboffen, in timeZone
                  { "start": "14:00", "end": "18:00" }],
  "weekendOffPeak": true,                                        // Sa/So immer OFF_PEAK
  "countdown": "minute",                                         // "minute" | "second"
  "holidays": {                                                  // inklusive Datumsbereiche
    "source": "…z. B. 国办发明电〔2025〕7号…",
    "ranges": [{ "start": "2026-10-01", "end": "2026-10-07" }]
  }
}
```

**Abweichung von der ursprünglichen Fassung (begründet):** Geplant war die
Regel als `config` der Bundle-Zeile in `cordis.patch.yml`. Der Harness liefert
die Zeilen-Config nachweislich nur an die Host-Hälfte (`ui-settings-general`
liest sie in `lib/index.js`); die Client-Hälfte erhält sie nicht. Da die
Anzeige vollständig im Client lebt, liegen die Einstellungen deshalb als
editierbares JSON in `data/rule.json`, das per `npm run build:client` in das
Artefakt eingebettet wird. Die Prüfung `npm run check:client` hält Artefakt und
Quelle synchron (keine stillen Abweichungen).

## 5. NFR — Risikoprofil, Rollen, Qualitätsszenarien

### 5.1 Risikoprofil

| Modul | Status | Begründung |
|---|---|---|
| NFR-B1 Clean Code | aktiv | immer aktiv |
| NFR-B2 Wartbarkeit | aktiv | immer aktiv |
| NFR-B3 Ausfallsicherheit | aktiv | immer aktiv |
| NFR-B4 Informationssicherheit | aktiv | immer aktiv |
| NFR-B5 Datenschutz | aktiv | immer aktiv |
| NFR-M1 Performance | **inaktiv** | reine lokale Zeitberechnung, keine spürbare Latenz, kein Datenvolumen |
| NFR-M2 Skalierbarkeit | **inaktiv** | ein Badge pro Client, keine variable Last |
| NFR-M3 Usability/Barrierefreiheit | **aktiv** | Endnutzer-Oberfläche (Badge) |
| NFR-M4 Kompatibilität/Interoperabilität | **aktiv** | verteiltes Bundle, abhängig von DSH-Slot-/Theme-/Config-API |
| NFR-M5 Compliance | **inaktiv** | keine gesetzlichen/branchenspezifischen Vorgaben |

### 5.2 Rollen

| Rolle | Person | Anmerkung |
|---|---|---|
| NFR-Owner | sternrassler | genau eine Person |
| Quality Owner (alle aktiven Bereiche) | sternrassler | Solo → dokumentiert getragen |
| Umsetzungsteam | sternrassler + DSH-Agent | |
| Reviewer | sternrassler | DoD-Prüfung im Merge-Gate |
| Betrieb | N/A | kein betriebener Dienst (Client-UI) |

### 5.3 Qualitätsszenarien (Kurzfassung)

| Kennung | Ziel | Metrik | Schwellwert | Messmethode | Gate |
|---|---|---|---|---|---|
| NFR-B1/2-1 | Verständlichkeit ohne mündliche Übergabe | offene „unklar"-Befunde (§5.4) | = 0 | Code-Review mit Kriterienliste (§5.4) | Merge |
| NFR-B3-1 | definierter Zustand bei ungültiger Config | Config-Validierungs-Tests | 0 Fehler | Unit-Tests | Fast+Merge |
| NFR-B3-2 | korrekte Grenzwert-/Zeitzonenlogik | Zeitlogik-Tests (Fälle in §3.1) | 0 Fehler | Unit-Tests | Merge |
| NFR-B4-1 | keine Secrets, keine kritischen Befunde | Secret/SAST/Dependency-Scan | 0 Secrets, 0 Critical/High, 0 ausnutzbare Lücken | CI-Scans | Fast+Merge |
| NFR-B5-1 | keine personenbezogenen Daten | bestätigte Datenflüsse | = 0 | Review + statischer Check (kein fetch/XHR/Storage) | Merge |
| NFR-M3-1 | Zustand nicht nur über Farbe, Kontrast | Accessibility-/Kontrast-Verstöße | = 0 | Linter + Visuell-Check light/dark | Merge+Release |
| NFR-M4-1 | Bundle registriert sich sauber | Slot-Registrierung + Console-Fehler | 0 Fehler | install_bundle + cordis_inspect_query + Sichtprüfung | Release |

### 5.4 Review-Szenario NFR-B1/2-1 (explizite Kriterien)

Lesbarkeit und Clean Code sind nicht automatisierbar messbar. Der „Schwellwert"
ist daher die Erfüllung der folgenden Kriterien im Review (NFR-Spezifikation
§5.5). Als **„unklar"-Befund** zählt jede Stelle, die eine Person **ohne
mündliche Übergabe** nicht versteht oder deren Absicht sie nur raten kann.

**Kriterien (je Befund zu prüfen):**

| # | Kriterium | Befund, wenn … |
|---|---|---|
| 1 | Zweck erkennbar | Name/Funktion verrät nicht, was die Einheit tut |
| 2 | Zuständigkeit klar | eine Einheit erledigt sichtbar mehrere unverbundene Dinge |
| 3 | Vertrag explizit | Ein-/Ausgabe oder Fehlerfall ist nicht erkennbar (`state`, `nextTransition`, `validateConfig`) |
| 4 | Grenzfall begründet | `[start, ende)`-Semantik oder Feiertags-/Wochenendlogik wird nicht erklärt |
| 5 | Zahl/Text herleitbar | 09:00/12:00/14:00/18:00 oder Config-Defaults stehen ohne Verweis auf die Quelle im Code |
| 6 | Keine Personenabhängigkeit | Wissen wie „weiß nur der Autor" ist nicht im Repo dokumentiert |
| 7 | Doku aktuell | README/Config-Schema widerspricht dem Verhalten |

**Zählregel:**

- **Auslöser:** Review vor dem Merge bzw. eine Person, die sich neu einarbeitet.
- **Metrik:** Anzahl offener, nicht behobener „unklar"-Befunde.
- **Schwellwert:** `= 0` offene Befunde; jeder Befund wird behoben **oder** als
  dokumentierte Ausnahme mit Owner und Review-Datum geführt (NFR §8).
- **Nachweis:** Befundliste im Nachweis-Protokoll (geprüfte Version, Anzahl
  Befunde, Status). Bei Solo-Umsetzung prüft der Reviewer die Liste gegen den
  Code, nicht gegen die eigene Erinnerung.
- **Owner:** NFR-Owner (sternrassler) · **Gate:** Merge.

## 6. Abgrenzung

- **Keine** Preis-/Kostenanzeige, keine Modellauswahl, kein Vergleich Flash/v4-pro.
- **Kein** Live-Abruf der Preisseite (Seite ist HTML ohne API-Vertrag; Regel und
  Feiertage sind Config-Daten).
- **Keine** Berücksichtigung von „调休" (verschobene Arbeitstage): die Regel
  unterscheidet nur Mo–Fr vs. Wochenende vs. Feiertag.
- Delivery (Push/PR/Publish des Bundles) ist **nicht** durch diese Spezifikation
  freigegeben; die Umsetzung braucht eine eigene Freigabe.
