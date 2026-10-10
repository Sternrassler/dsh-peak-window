# Nachweis — Zustand nicht nur über Farbe (`NFR-M3-1`)

| Feld | Wert |
|---|---|
| **Änderung / PR / Version** | Sprachmigration der Oberfläche auf Englisch, Arbeitsstand nach `1e28bbc` |
| **Qualitätsbereich + Anforderung** | `NFR-M3` (Usability/Barrierefreiheit), `NFR-M3-1` |
| **Art der Prüfung** | automatisiert (Artefakt-Test) und review-basiert (Sichtprüfung) |
| **Prüfung (Test/Tool, Version)** | `npm test` (node:test) auf `client.js`; Sichtprüfung im laufenden Profil `web` |
| **Beobachtetes Ergebnis** | Automatisiert: Textlabel `PEAK`/`OFF_PEAK` aus `state(now, RULE)`, `role="status"`, `aria-label` (Erfolgs- und Fehlerzustand) sowie Theme-Tokens statt fester Farben nachgewiesen; 23/23 Tests grün. Mutationsprobe: `role: 'status'` → `'none'` lässt den Test fehlschlagen (Exit ≠ 0). Sichtprüfung: Zustand als Text lesbar in Light und Dark. Schwellwert `= 0` Verstöße erfüllt. |
| **Status** | bestanden (automatisiert); Sichtprüfung nach der Sprachmigration erneut zu bestätigen |
| **Datum / Stand** | 2026-10-10, 18:12–18:20 lokal (Beijing 2026-10-11 00:12–00:20) |
| **Prüfende Person / System** | sternrassler (Sichtprüfung Light/Dark); DSH-Agent (Artefakt-Test, Mutationsprobe) |

**Lücke, die dieser Nachweis schließt:** Der Qualitätsszenarien-Katalog
versprach für `NFR-M3-1` einen automatisierten Artefakt-Test für Textlabel,
`role="status"`, `aria-label` und Theme-Tokens. Vorhanden waren nur die
Theme-Token-Prüfungen; die übrigen drei Zusicherungen fehlten, und ein eigener
`NFR-M3-1`-Nachweis existierte nicht. Die Zusicherungen wurden ergänzt und mit
einer Mutationsprobe als wirksam belegt.

**Bekannte Grenze der Prüfung:** Die Sichtprüfung aus dem Eintrag zu `NFR-M4-1`
(2026-10-10 18:12) bezog sich auf die **deutschen** Texte. Mit der
Sprachmigration haben sich zwei sichtbare Bestandteile geändert:
Fehlerzustand `Regel ungültig — …` → `invalid rule — …` und der zugängliche
Name `${TITLE}: ${current}, Wechsel zu ${transition.next} in ${countdown}` →
`…, switching to …`. Die Anzeige im Normalzustand (`OFF_PEAK`, Countdown, grüne
Darstellung) ist textlich unverändert, und `TITLE` wird im Normalzustand nicht
angezeigt. Offen bleibt damit eine kurze Sichtprüfung der englischen Texte;
bis dahin ist der Nachweis automatisiert bestanden, die Sichtprüfung jedoch
nicht erneuert.

**Geprüft und beibehalten:** Die Slot-Registrierung trägt weiterhin
`label: 'DeepSeek PEAK/OFF_PEAK'`. Dieses Feld ist Registrierungs-Metadaten und
laut der offiziellen Slot-API-Vorlage im Harness englisch zu halten
(`label: 'My entry'`); das Label ist bereits sprachneutral und wurde deshalb
nicht verändert. Sichtbar ist es nicht — die Anzeige leistet das Badge, das den
Zustand als Text ausgibt.
