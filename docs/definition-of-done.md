# Definition of Done

Eine Änderung ist erst fertig, wenn **alle** folgenden Punkte erfüllt sind:

- [ ] Betroffene Qualitätsbereiche sind benannt (`NFR-B1…B5`, ggf. `M1…M5`).
- [ ] Für jede betroffene Anforderung liegt ein Nachweis mit beobachtetem
      Ergebnis vor ([docs/nfr/nachweise/](nfr/nachweise/), Vorlage
      `~/vscode/brain/docs/specs/nfr/templates/nachweis-protokoll.md`).
- [ ] Automatisierte Prüfungen des zugeordneten Gates sind bestanden
      (`npm run check` grün, CI-Gates grün).
- [ ] Bei geänderter Regel: `npm run build:client` ausgeführt, `client.js`
      eingecheckt und `npm run check:client` grün.
- [ ] Nicht anwendbare Kriterien sind begründet; fehlende Prüfungen und
      Restrisiken sind benannt.
- [ ] Nachweise sind datensparsam (keine Secrets, keine realen
      personenbezogenen Daten, keine vollständigen Logs).

Nicht erfüllte Punkte blockieren den Merge.

Normativ hinterlegt in der referenzierten NFR-Spezifikation, Abschnitt 6.3.
