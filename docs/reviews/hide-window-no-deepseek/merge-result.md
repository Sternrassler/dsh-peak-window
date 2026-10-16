Urteil: erfuellt

## Bindung an Kontext

- `base=17c9b85594d33e3af1027aa90700f2ceaf2f4eea` entspricht exakt dem Elternkommit von `HEAD=cbecb714b0a174cf2d2bcca11a91e44e6762744b` (laut gitStatus: `cbecb71 fix(client): Preisfenster ohne DeepSeek-Modell ausblenden` direkt über `17c9b85`).
- `reviewed.patch` und `merge-diff.patch` sind inhaltlich identisch (gleiche Hunks für README.md, client.js, lib/client.template.js, lib/model-scope.js, docs/spezifikation.md, alle Testdateien, beide NFR-Dokumente); einziger Unterschied ist die Position des neuen Files `docs/nfr/nachweise/2026-10-16-model-applicability-hide.md` im Diff-Strom (mittig vs. am Ende) — das deckt sich exakt mit der Kontextangabe „nur Diff-Reihenfolge und Commitbindung aktualisiert“.
- `diffSha256=38047ff…` kann ich mit den mir verfügbaren Werkzeugen (Read/Grep/Glob, kein Bash/Hash-Tool) nicht selbst nachrechnen — das ist eine Prüfgrenze, keine Abweichung, die ich beobachtet hätte.
- Der aktuelle Arbeitsbaum (= `HEAD`) wurde gegen jeden Hunk des Diffs geprüft (`lib/model-scope.js`, `lib/client.template.js`, generiertes `client.js`, alle drei Testdateien, `README.md`, `docs/spezifikation.md`, beide NFR-Dateien) und entspricht in jedem Fall exakt dem Post-Patch-Stand.

## Korrektheit

1. **Kein Badge ohne anwendbares DeepSeek-Modell.** `computeModelScope` liefert `applies:false` für Fremd-Provider (auch bei `routable:false`), `applies:null` für fehlende Selektion (`neutral`) und für `routable:false` bei DeepSeek (`unavailable`). `lib/client.template.js:56` / `client.js:483`: `if (scope.applies !== true) return null;` — vor jeglichem DOM-Aufbau, kein `—`, kein Hint-Span, kein Countdown.
2. **Gültige Auswahl rendert, Wechsel aktualisiert.** `useSyncExternalStore` bleibt vor dem Early-Return aktiv (keine Hook-Order-Verletzung), daher reagiert die Badge auf Store-Änderungen. `test/client-runtime.test.js:172-191` prüft genau einen Subscriber, Verschwinden bei Wechsel zu `codex` und Wiedererscheinen bei Rückwechsel zu `deepseek-official`.
3. **Artefakt/Tests/Doku stimmen überein.** `client.js` enthält denselben Early-Return wie das Template; `test/client-artifact.test.js:53-57` verankert ihn per Regex; README §„Known limitations“ und `docs/spezifikation.md` §3.5 beschreiben konsistent „not rendered“ statt der früheren Graustufen-/Hinweis-Logik; `docs/nfr/nachweise/2026-10-11-…` ist korrekt als „superseded“ markiert, `2026-10-16-…` dokumentiert den aktuellen Verhaltensnachweis.
4. **Keine Altlasten.** Keine verbleibenden `MODEL_SCOPE_HINT`, `state-idle-primary`, `hintText`-Referenzen in Quelle, Artefakt oder aktiver Doku außerhalb der explizit historisch markierten Datei.

## Regressionsrisiken (keine blockierenden)

- Entfernte Zweige (`active`, `shownState`, `hint`) betrafen ausschließlich nicht-anwendbare Zustände; PEAK/OFF_PEAK-Zeitlogik, Countdown-Formatierung und Theme-Tokens sind unverändert.
- `ErrorBadge` wird bei nicht-anwendbarem Modell mitverborgen, da der Early-Return vor `validateRule` liegt — beabsichtigt und in §3.5 der Spezifikation dokumentiert, keine Laufzeitgefahr (Regel ist Build-Zeit-Daten).
- `useNow`-Effekte laufen auch im verborgenen Zustand weiter (Intervall/Timeout) — regelkonform nach React-Hooks, ohne sichtbare Auswirkung.

## Gaps (nicht blockierend, bereits bekannt)

1. Zwei Testassertions (`client-runtime.test.js:145,179`) prüfen weiterhin die Absenz von `'DeepSeek pricing only'`, obwohl dieser Text durch die Architektur gar nicht mehr erzeugt werden kann — harmlos, aber aussagelos.
2. JSDoc in `lib/model-scope.js:16-20` könnte präzisieren, dass `routable:null` bei DeepSeek weiterhin `applies:true` ergibt (nur `false` deaktiviert) — reine Kommentarschärfung.
3. Kein Live-Browser-/Host-Nachweis; das ist in der neuen NFR-Evidenz selbst ehrlich als „Remaining verification limits“ ausgewiesen.

**Fazit:** Quelle, generiertes Artefakt, Regressionstests und nutzerseitige Dokumentation stimmen für den an `base=17c9b85`/`head=cbecb71` gebundenen, kanonischen `merge-diff.patch` lückenlos überein; alle vier Erfolgskriterien sind erfüllt. Die einzige echte Prüfgrenze ist, dass ich den `diffSha256`-Wert ohne Hash-Tool nicht selbst nachrechnen konnte.
