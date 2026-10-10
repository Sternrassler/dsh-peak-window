# Nachweis — Gate-Abnahme (Fast / Merge)

| Feld | Wert |
|---|---|
| **Änderung / PR / Version** | Baseline-Commit `98cbd06`, Arbeitsstand 2026-10-10 |
| **Qualitätsbereich + Anforderung** | `NFR-B2` (Artefakt-/Build-Konsistenz), `NFR-B3-1`, `NFR-B3-2` |
| **Art der Prüfung** | automatisiert |
| **Prüfung (Test/Tool, Version)** | `npm run check:client` (Node v26.7.0), `npm test` (node:test), ESLint 9, Prettier 3 |
| **Beobachtetes Ergebnis** | 1) Sauberer Stand: `npm run check` grün, 21/21 Tests bestanden. 2) Absichtliche Drift in `client.js`: Gate blockiert, Exit 1. 3) Absichtliche Grenzwert-Regression (`minutes < end` → `<=`): 3 Tests rot, Exit 1. |
| **Status** | bestanden |
| **Datum / Stand** | 2026-10-10 |
| **Prüfende Person / System** | lokal ausgeführt (DSH-Agent), Ergebnis oben beobachtet |

**Nicht anwendbare Kriterien (Begründung):**
- Last-/Performance-Gate (`NFR-M1`): Modul inaktiv (keine spürbare Latenz).
- Kapazitätstest (`NFR-M2`): Modul inaktiv (kein Server, ein Badge pro Client).
- Compliance-Prüfung (`NFR-M5`): Modul inaktiv (keine Rechtsvorgabe).
- Wiederanlauf-/RTO-RPO-Drill: kein betriebener Dienst (Client-UI ohne Zustand).

**Fehlende Prüfungen / Restrisiken:**
- `NFR-M4-1` (Slot-Registrierung) ist Release-Gate und wird separat
  nachgewiesen (`docs/nfr/nachweise/`).
- `NFR-B1/2-1` (Review, 0 offene „unklar"-Befunde) ist review-basiert und wird
  vom NFR-Owner vor dem Merge geprüft.
- Sichtprüfung Light/Dark im Browser steht aus (Release-Gate).
- Die Installation des Bundles ins Profil wurde von der Freigabe-Abfrage
  abgelehnt; sie ist nicht erfolgt und nicht umgangen.

---

## Nachtrag — CI-Läufe (beobachtet)

| Feld | Wert |
|---|---|
| **Änderung / PR / Version** | `bd553a3` (Repo `Sternrassler/dsh-deepseek-price-window`, privat) |
| **Qualitätsbereich + Anforderung** | `NFR-B3-1`, `NFR-B3-2`, `NFR-B4-1`, `NFR-B2` |
| **Art der Prüfung** | automatisiert, CI (GitHub Actions) |
| **Prüfung (Test/Tool, Version)** | `npm ci`, `check:client`, ESLint 9, Prettier 3, `node --test`, gitleaks 8.30.1 CLI, Semgrep 1.180.0 CLI, `npm audit --omit=dev` |
| **Beobachtetes Ergebnis** | Lauf [38048699013](https://github.com/Sternrassler/dsh-deepseek-price-window/actions/runs/38048699013): **Fast / Pre-Merge grün** (Artefakt, Lint, Format, 21 Tests, Secret-Scan 0 Befunde) und **Merge-Gate grün** (SAST ohne Critical/High, 0 ausnutzbare Produktivabhängigkeitslücken, 21 Tests). Release-Gate nicht ausgeführt (kein Tag). |
| **Status** | bestanden (Fast, Merge) |
| **Datum / Stand** | 2026-10-10 |
| **Prüfende Person / System** | GitHub Actions, Ergebnis oben beobachtet |

**Beobachteter Fehlschlag vor der Korrektur:** Lauf 38048566362 (Fast) brach ab mit
`[Sternrassler] is an organization. License key is required.` — die
`gitleaks/gitleaks-action` ist für Organisationen lizenzpflichtig. Die Prüfung
wurde auf die Gitleaks-CLI (MIT) umgestellt und blockiert weiterhin.

**Offener Punkt (Release-Gate):** Der Job nutzt das GitHub-Environment
`release`. Ohne Required-Reviewer blockiert es nicht. Einzurichten durch den
Repo-Owner (Settings → Environments → `release` → Required reviewers) oder per
API; das ist eine Owner-Entscheidung und hier nicht vorweggenommen.

---

## Nachtrag — Installation und Slot-Registrierung (`NFR-M4-1`)

| Feld | Wert |
|---|---|
| **Änderung / PR / Version** | `dsh-deepseek-price-window` 1.0.0, installiert 2026-10-10 |
| **Qualitätsbereich + Anforderung** | `NFR-M4` (Kompatibilität), `NFR-M4-1` |
| **Art der Prüfung** | automatisiert (Plugin-Manager + Slot-Inspection) |
| **Prüfung (Test/Tool, Version)** | `plugin_manager install_bundle`, `cordis_inspect_query` → `Slots.listSubTree` |
| **Beobachtetes Ergebnis** | Installation: `application: applied`, `enabled: true`, `exitCode: 0`, `warnings: []`. Profil: `link:/home/ix/vscode/dsh-deepseek-price-window`, `dsh.profile.bundles` enthält das Bundle, `dsh --dump-config` zeigt die Zeile. Slot `conversation.composer.dock`: Eintrag `dsh-deepseek-price-window` (order 20) mit `active: true` neben dem vorhandenen `stats`-Eintrag; keine Slot-Entry-Fehler. |
| **Status** | teilweise bestanden |
| **Datum / Stand** | 2026-10-10 |
| **Prüfende Person / System** | DSH-Agent; Ergebnis oben beobachtet |

**Fehlende Prüfung (Restrisiko):** Die **visuelle** Prüfung — Badge sichtbar
unter dem Composer, Text `PEAK`/`OFF_PEAK`, Countdown, Lesbarkeit in Light und
Dark, keine Console-Fehler — ist **nicht** durchgeführt. Registrierung allein
belegt nicht, was der Nutzer sieht. Erforderlich: Seite neu laden und ansehen.

Die Peer-Dependency-Warnung des Profil-Installers betrifft ausschließlich
bereits vorhandene Pakete (`dsh-experimental-agent-team*`); dieses Bundle hat
keine Abhängigkeiten und keine Peers.
