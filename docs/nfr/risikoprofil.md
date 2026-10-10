# Risikoprofil und Rollen

| Feld | Wert |
|---|---|
| Stand | 2026-10-10 |
| NFR-Paket | v1.0, Bezugsstand 2026-10-10 |
| Modus | Neues Projekt |

## 1. Risikoprofil

Basis-Module `NFR-B1…B5` sind immer aktiv. Risikobasierte Module `NFR-M1…M5`
sind begründet aktiv oder inaktiv.

| Modul | Status | Begründung |
|---|---|---|
| NFR-B1 Clean Code | aktiv | immer aktiv |
| NFR-B2 Wartbarkeit | aktiv | immer aktiv |
| NFR-B3 Ausfallsicherheit | aktiv | immer aktiv |
| NFR-B4 Informationssicherheit | aktiv | immer aktiv |
| NFR-B5 Datenschutz | aktiv | immer aktiv |
| NFR-M1 Performance | **inaktiv** | Keine spürbare Latenz und kein relevantes Datenvolumen: die Anzeige rechnet ausschließlich lokal aus `Date.now()` und einem eingebetteten Regelsatz; kein Netz-, Storage- oder Host-Aufruf im Laufzeitpfad. |
| NFR-M2 Skalierbarkeit | **inaktiv** | Keine variable Last: genau ein Badge pro Browser-Client; keine Serverkomponente, keine Nebenläufigkeit. |
| NFR-M3 Usability/Barrierefreiheit | **aktiv** | Endnutzer-Oberfläche: das Badge ist sichtbare UI im DSH-Composer-Bereich. |
| NFR-M4 Kompatibilität/Interoperabilität | **aktiv** | Verteilung als Bundle an Dritte; Abhängigkeit von der DSH-Slot-/Theme-API und vom Client-Bundle-Loader. |
| NFR-M5 Compliance | **inaktiv** | Keine gesetzlichen oder branchenspezifischen Vorgaben über die Basis-Module hinaus; keine Verarbeitung personenbezogener Daten. |

Aktive Qualitätsbereiche: `NFR-B1`, `NFR-B2`, `NFR-B3`, `NFR-B4`, `NFR-B5`,
`NFR-M3`, `NFR-M4` — jeder mit mindestens einem Qualitätsszenario in
[qualitaetsszenarien.md](qualitaetsszenarien.md).

Neu zu bewerten, wenn sich der Produktscope ändert (z. B. Live-Abruf der
Preisseite → M1/M4 neu, oder eine Serverkomponente → M2 neu).

## 2. Rollen

| Rolle | Person | Anmerkung |
|---|---|---|
| NFR-Owner | sternrassler | genau eine Person; entscheidet über Ausnahmen |
| Quality Owner NFR-B1/B2 (Wartbarkeit) | sternrassler | Solo-Projekt |
| Quality Owner NFR-B3 (Ausfallsicherheit) | sternrassler | Solo-Projekt |
| Quality Owner NFR-B4 (Informationssicherheit) | sternrassler | Solo-Projekt |
| Quality Owner NFR-B5 (Datenschutz) | sternrassler | Solo-Projekt |
| Quality Owner NFR-M3 (Usability/Barrierefreiheit) | sternrassler | Solo-Projekt |
| Quality Owner NFR-M4 (Kompatibilität) | sternrassler | Solo-Projekt |
| Umsetzungsteam | sternrassler, DSH-Agent (KI) | |
| Reviewer (Merge-Gate, DoD) | sternrassler | prüft gegen Definition of Done |
| Betrieb | entfällt | kein betriebener Dienst; Client-UI ohne Server- oder Speicherzustand |

Damit ein Quality Owner je aktivem Bereich benannt ist, trägt in diesem
Solo-Projekt der NFR-Owner die Bereichsverantwortung; das ist hier dokumentiert
(NFR-Spezifikation Abschnitt 3.2).

## 3. Ausnahmen

Aktuell keine. Ausnahmen werden je Anforderung oder Prüfung mit Begründung,
Owner, Review-Datum und gegebenenfalls Kompensationsmaßnahme in
[docs/nfr/ausnahmen/](ausnahmen/) abgelegt; pauschale Ausnahmen sind unzulässig.
