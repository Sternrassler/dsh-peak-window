# Plan — DeepSeek PEAK/OFF-PEAK status (DSH plugin) + NFR introduction

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Authoritative specification | [`docs/spezifikation.md`](../spezifikation.md) |
| NFR package | NFR specification package v1.0 (reference state 2026-10-10) |
| Domain rule | DeepSeek "Models & Pricing" (URL in specification §2) |
| Implementation | local, only after separate approval (`executing-plans`) |

> **Reading note:** this document records the planning state **before**
> implementation. Statements such as the empty, non-Git workspace in section 3
> describe that earlier state; the implementation happened afterwards and is
> evidenced in [`docs/nfr/nachweise/`](../nfr/nachweise/). The planning text is
> deliberately not rewritten to match the outcome.

## 1. Goal

A DSH client plugin that shows the current DeepSeek price window **PEAK** (red) /
**OFF_PEAK** (green) with a countdown below the composer
(`conversation.composer.dock`), according to the rule in `docs/spezifikation.md`
§3 — including the Beijing time zone and Chinese public holidays. In parallel the
NFR specification is introduced in "new project" mode (gates sharp from day 1).

## 2. Architecture

- **Pure time logic** (`lib/price-window.js`): `state(nowUtc, config)`,
  `nextTransition(nowUtc, config)`, `validateConfig(config)`. No DOM/DSH
  dependency → fully unit-testable.
- **Client plugin** (`client.js`): registers at the slot
  `conversation.composer.dock`, renders the badge, holds timers
  (computation on mount, `setInterval` 30 s, exact `setTimeout` to the boundary).
- **Bundle** (`package.json`, `cordis.patch.yml`, if needed `index.js` as host
  shell): per `cordis-plugin-development` → `templates/decoration/`.
- **Config** is projected as a JSON schema (specification §4.1).

## 3. Global constraints

- Workspace `/home/ix/vscode/deepseekharness` is **empty and not yet a Git repo**.
- Installation into the profile via `plugin_manager` → `install_bundle` (changes
  the `web` profile; every action needs approval).
- **Delivery is not approved** (no push/PR/publish). CI is set up and
  demonstrated locally; the external acceptance PR needs separate approval.
- No network, storage or host dependency on the runtime path.

## 4. Scope

**In:** time logic, config (time zone, PEAK windows, holidays, countdown
precision), badge UI, holiday maintenance, NFR foundation + gates + acceptance.

**Not in:** prices/costs, model selection, live fetch of the pricing page,
handling of "调休", publication.

## 5. Success criteria (observable)

1. Unit tests of the time logic (cases from specification §3.1) green.
2. `install_bundle` → `application: applied`; `cordis_inspect_query` confirms
   registration at `conversation.composer.dock`.
3. The badge shows PEAK/OFF_PEAK + countdown correctly, flips exactly at window
   and holiday boundaries, is readable in light **and** dark, no console errors.
4. Gate acceptance: a deliberately offending commit is blocked by the local gate
   (observed proof per stage).

---

## 6. Tasks

### T0.1 — Project and NFR foundation

- **Context/target paths:** `docs/spezifikation.md`, NFR package, template
  "Non-functional requirements" from the NFR package.
  Produces: `AGENTS.md`, `docs/nfr/risikoprofil.md`, `docs/nfr/qualitaetsszenarien.md`,
  `.github/` templates, `docs/specs/nfr/` (referenced/copied), `package.json`.
- **Behaviour:** the `nfr-template:v1` block **including its usage rules** goes
  into `AGENTS.md` (not copied into third-party code/archives). Risk profile and
  quality scenarios from specification §5 are stored as files. DoD, PR and issue
  templates (from the NFR package `templates/`) are included; references to the
  concrete gate and the evidence protocol are substituted.
- **Steps:**
  1. `git init`; `.gitignore` (node_modules, dist, local secrets).
  2. Create `AGENTS.md` with a project entry point + NFR block.
  3. Adopt `docs/specs/nfr/` (README references version/reference state).
  4. Write risk profile/scenario files and templates.
  5. Create `package.json` (bundle skeleton, no runtime dependencies).
- **Check:** `node -e "JSON.parse(require('fs').readFileSync('package.json'))"` OK;
  `grep -q 'nfr-template:v1' AGENTS.md` OK; templates contain the mandatory NFR
  block.
- **Done when:** all files exist; the NFR owner (sternrassler) and the roles are
  documented. **Dependency:** none.

### T0.2 — Set up gates and demonstrate them locally

- **Context/target paths:** `02-quality-gates.md` (check catalogue, §2).
  Produces: `Makefile`/`npm run` scripts (`lint`, `test`, `sast`, `secret`,
  `deps`, `check`), `.github/workflows/` (fast/pre-merge, merge, release).
- **Behaviour:** map check categories to tools and confirm the thresholds from the
  quality scenarios:
  - Fast: `test` (unit) + `secret` (gitleaks, hard).
  - Merge: `lint` (ESLint+Prettier, 0 errors), `sast` (Semgrep, 0 critical/high),
    `deps` (npm audit, 0 exploitable critical/high), `test`, markdown link check.
  - Release: `install_bundle` + `cordis_inspect_query` smoke + manual visual
    check light/dark.
  - **Escape marking:** targeted, time-boxed disabling of a single check with a
    reference to a documented exception + review date; no blanket gate
    exceptions.
- **Steps:** write scripts → CI workflows → `make check` green locally →
  acceptance: a deliberately offending commit (e.g. a secret in a test file) on a
  branch → `make check` **blocks**; record the result in
  `docs/nfr/nachweise/`.
- **Check:** `make check` on a clean state = green; on the offending commit =
  exit ≠ 0 with the finding printed.
- **Done when:** three gate stages runnable locally, escape marking present, one
  observed acceptance proof per gate. **Dependency:** T0.1.

### T1 — Time logic + tests

- **Context/target paths:** specification §3. Produces: `lib/price-window.js`,
  `test/price-window.test.js`. Test runner `node:test` (no dependency).
- **Behaviour/interfaces:**
  - `state(nowUtc, config) -> 'PEAK' | 'OFF_PEAK'`
  - `nextTransition(nowUtc, config) -> { atUtc, next }` (first change)
  - `validateConfig(config) -> { ok, errors[] }`
  - Error cases: invalid windows (end ≤ start, format), invalid holiday date,
    empty `peakWindows`, unknown `timeZone`. No silent fallbacks →
    `validateConfig` reports, the UI shows a defined error state.
- **Test cases (at least):** Mon 10:00 → PEAK; Mon 12:30 → OFF_PEAK; Mon 15:00 →
  PEAK; Mon 18:00 → OFF_PEAK; Mon 09:00 → PEAK; Sat 10:00 → OFF_PEAK; holiday
  (Mon 10:00) → OFF_PEAK; flips 12:00/14:00; countdown at 08:59 → 1 min to PEAK;
  time zone independence (fixed UTC instant → same statement regardless of
  `process.env.TZ`); config validation errors.
- **Steps:** implement the module → write tests red (red-green-refactor)
  → `validateConfig` + error states.
- **Check:** `node --test test/` → all green, exit 0.
- **Done when:** all test cases green, module free of DOM/DSH imports.
  **Dependency:** T0.1.

### T2 — Bundle (UI plugin)

- **Context/target paths:** skill `cordis-plugin-development` →
  `templates/decoration/` and `references/ui-plugin.md` (client manifest, module
  loader, slot registration), `references/practices.md`, slot topology
  (`conversation.composer.dock`, registration `id`/`order`/`label`).
  Produces: `package.json`, `cordis.patch.yml`, `index.js`, `client.js`.
- **Behaviour:** the client registers the badge at the dock slot; renders text
  label + countdown + `aria-label`; colours only via theme tokens
  `--dsw-alias-state-success-primary` / `--dsw-alias-state-error-primary` and
  neutral tokens. Timers as in specification §3.5. The config schema from §4.1 is
  projected.
- **Error cases:** invalid config → visible error state instead of a wrong
  PEAK/OFF_PEAK; timers are cleaned up on unmount (no leak).
- **Steps:** copy templates → config schema + slot registration → wire `client.js`
  against `lib/price-window.js` → `node --check` per file → check the manifest.
- **Check:** `node --check client.js && node --check index.js` exit 0;
  patch/manifest syntactically valid.
- **Done when:** bundle files exist, no harness client packages imported.
  **Dependency:** T1.

### T3 — Installation and visual verification

- **Context/target paths:** bundle directory; `plugin_manager install_bundle`;
  `cordis_inspect_query` (`Slots.listSubTree` with
  `root: conversation.composer.dock`).
- **Behaviour:** installation into the `web` profile; registration at the dock
  slot visible; the badge appears below the composer.
- **Steps:** `install_bundle` → check result `application: applied` → confirm slot
  registration via `cordis_inspect_query` → visual check light/dark + console for
  slot entry crashes → plausibility-check the state against real Beijing time.
- **Check:** `application: applied`; `cordis_inspect_query` shows the registered
  entry; no console errors; badge readable in both themes.
- **Done when:** the plugin runs visibly and correctly; result + limits of the
  check (e.g. without browser automation) documented.
  **Dependency:** T2, T0.2 (release gate).

### T4 — Documentation and holiday maintenance

- **Context/target paths:** `README.md`, `docs/spezifikation.md` §3.3.
  Produces: `README.md`, holiday defaults in the config default.
- **Behaviour:** the README documents the rule, source (URL + date), config fields,
  holiday maintenance (who maintains when, source State Council of China
  国务院办公厅) and the meaning of `holidays: []`.
- **Steps:** write the README → maintain the 2026/2027 holidays from the official
  announcement, record source + date in the repository → adopt the defaults into
  the config.
- **Check:** markdown link check 0 errors; holiday defaults are traceable against
  the named source.
- **Done when:** README + maintained holiday list with source. **Dependency:** T2.

## 7. Order and open core assumptions

Critical path: **T0.1 → T1 → T2 → T3**, with **T0.2 → T3** for the release gate;
**T4** after T2.

**Open core assumption (to check before implementation):**
1. Exact holiday dates for 2026/2027 only exist once the official announcement is
   published — T4 must not present invented data as authoritative; until then use
   `holidays: []` with documented meaning, or a list explicitly marked as
   "preliminary".

**Delivery boundary:** push/PR/publish of the bundle is not part of this plan; it
requires its own explicit approval.
