# Evidence — gate acceptance (fast / merge)

| Field | Value |
|---|---|
| **Change / PR / version** | Baseline commit `98cbd06`, working state 2026-10-10 |
| **Quality area + requirement** | `NFR-B2` (artifact/build consistency), `NFR-B3-1`, `NFR-B3-2` |
| **Type of check** | automated |
| **Check (test/tool, version)** | `npm run check:client` (Node v26.7.0), `npm test` (node:test), ESLint 9, Prettier 3 |
| **Observed result** | 1) Clean state: `npm run check` green, 21/21 tests passed. 2) Deliberate drift in `client.js`: gate blocks, exit 1. 3) Deliberate boundary regression (`minutes < end` → `<=`): 3 tests red, exit 1. |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | run locally (DSH agent), result observed above |

**Not applicable criteria (justification):**
- Load/performance gate (`NFR-M1`): module inactive (no perceptible latency).
- Capacity test (`NFR-M2`): module inactive (no server, one badge per client).
- Compliance check (`NFR-M5`): module inactive (no legal requirement).
- Restart/RTO-RPO drill: no operated service (client UI without state).

**Missing checks / remaining risks:**
- `NFR-B1/2-1` (review, 0 open "unclear" findings) is review-based and is checked
  by the NFR owner before the merge.

**Resolved in the meantime (see addendum below):** the light/dark visual check
was performed and the bundle is installed in the profile; the earlier
installation attempt that was refused by the approval prompt is therefore
superseded. After the rename (commit `646fd6a`) it was reinstalled and checked
again after a restart; `NFR-M4-1` is recorded as **passed** in the addendum.

---

## Addendum — CI runs (observed)

| Field | Value |
|---|---|
| **Change / PR / version** | `bd553a3` (repo `Sternrassler/dsh-deepseek-price-window`, private) |
| **Quality area + requirement** | `NFR-B3-1`, `NFR-B3-2`, `NFR-B4-1`, `NFR-B2` |
| **Type of check** | automated, CI (GitHub Actions) |
| **Check (test/tool, version)** | `npm ci`, `check:client`, ESLint 9, Prettier 3, `node --test`, gitleaks 8.30.1 CLI, Semgrep 1.180.0 CLI, `npm audit --omit=dev` |
| **Observed result** | Run [38048699013](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38048699013): **fast / pre-merge green** (artifact, lint, format, 21 tests, secret scan 0 findings) and **merge gate green** (SAST without critical/high, 0 exploitable production dependency gaps, 21 tests). Release gate not executed (no tag). |
| **Status** | passed (fast, merge) |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | GitHub Actions, result observed above |

**Latest run after the rename, publication and link check (observed):**
run [38069151558](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38069151558)
on `01b97d8`, the first run in the now public repository — **fast / pre-merge
green** and **merge gate green**, including the newly added step "relative links
and anchors"; release gate skipped (no tag). The 21 tests in the table above are
the count at that time; the current suite has 23 tests, which the green run
covers.

**Observed failure before the fix:** run 38048566362 (fast) aborted with
`[Sternrassler] is an organization. License key is required.` — the
`gitleaks/gitleaks-action` requires a licence for organizations. The check was
switched to the gitleaks CLI (MIT) and still blocks.

**Open point (release gate):** the job uses the GitHub environment `release`.
Without required reviewers it does not block. To be set up by the repo owner
(Settings → Environments → `release` → Required reviewers) or via API; that is an
owner decision and is not pre-empted here.

**Repository renamed and published (owner decision, 2026-10-10):** the repository
moved from `Sternrassler/dsh-deepseek-price-window` (private) to
`Sternrassler/dsh-peak-window` (**public**). The names and the visibility stated
in the tables above are the ones observed at the time and are kept; the run link
was repointed to the new URL because the old name serves no anonymous redirect
for a repository that was private when it was renamed (checked: old name returns
HTTP 404 anonymously, the new name returns HTTP 200).

Consequences for the evidence, recorded deliberately:
- every commit, and therefore the earlier documentation state that still contains
  a real name, is part of the public history; the working state was cleaned up,
  the history was not rewritten (a rewrite would change all commit hashes and
  invalidate the CI references above)
- the repository was public before any package was published, so no installation
  was ever exposed
- pre-publication check: `gitleaks detect` over all 17 commits, no leaks

---

## Addendum — installation and slot registration (`NFR-M4-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | `@sternrassler/dsh-deepseek-price-window` 1.0.0 (commit `646fd6a`), reinstalled 2026-10-10 |
| **Quality area + requirement** | `NFR-M4` (compatibility), `NFR-M4-1` |
| **Type of check** | automated (plugin manager + slot inspection) and review-based (visual check) |
| **Check (test/tool, version)** | `plugin_manager install_bundle`, `cordis_inspect_query` → `Slots.listSubTree`; visual check in the running `web` profile (DSH web GUI) |
| **Observed result** | Reinstalled after the rename: the profile `package.json` lists only `@sternrassler/dsh-deepseek-price-window` (old name plus lockfile entry and symlink removed), the composition `dsh --profile web --dump-config` shows `- id: deepseek-price-window` with `name: '@sternrassler/dsh-deepseek-price-window'`, no old name left. Also fixed: the `exports` field did not allow `./package.json` even though the loader resolves the manifest through it; after adding it, `<name>/package.json` and `<name>/client` resolve from the profile context (`platform: web`, `patch: ./cordis.patch.yml`), guarded by a test. After restarting the `web` profile: the badge appears below the composer, displays state `OFF_PEAK` in green with a countdown, readable in light and dark, no console and no slot entry errors. Threshold (registration present, `= 0` slot entry crashes) met. |
| **Status** | passed |
| **Date / state** | 2026-10-10 18:12 local (Beijing: 2026-10-11 00:12) |
| **Checking person / system** | sternrassler (visual check after restart); DSH agent (installation, composition and resolution check) |

**Known boundary of the check:** the visual check happened in state `OFF_PEAK`;
the red `PEAK` case was never confirmed visually, but is proven by unit tests and
theme token usage — can be repeated in a PEAK window (Beijing 09:00–12:00 or
14:00–18:00) if needed.

**After the language migration (commit `0d44c62`):** the visual check was renewed
on 2026-10-10 at 18:21 local; the badge was visible and correct, unchanged. Note:
the migration affected the error state and the accessible name
(`invalid rule — …`, `… switching to …`), which do not appear in the normal state.
The details are recorded in the
[`NFR-M3-1`](2026-10-10-nfr-m3-1-state-not-colour-only.md) evidence; this entry
here covers installation and slot registration, which the wording change left
untouched.

**Note on the checking means:** what was checked automatically is installation,
composition and manifest resolution; the registration at the slot
`conversation.composer.dock` is evidenced here by the visual check in the running
profile (no separate `cordis_inspect_query` run against the restarted server).
The artifact/test state (`npm run check`, 22 tests) belongs to commit `ee7d308`
and was collected before this evidence correction.

**Previously passing state (historical, under the old name):** installation
`application: applied`, `enabled: true`, `exitCode: 0`, `warnings: []`;
slot entry (order 20) active; visual check by sternrassler in state `OFF_PEAK` in
light and dark without console errors. The red `PEAK` case was never confirmed
visually (only proven via tests and theme tokens).

---

## Current addendum — installation and slot registration under the final name (`NFR-M4-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | `@sternrassler/dsh-peak-window` 1.0.0 (commit `ec0a714`), installed 2026-10-10 |
| **Quality area + requirement** | `NFR-M4` (compatibility), `NFR-M4-1` |
| **Type of check** | automated (plugin manager + composition) and review-based (visual check) |
| **Check (test/tool, version)** | `dsh plugin --profile web add/remove` (human-approved profile write), `dsh --profile web --dump-config`, `npm run check` (23 tests); visual check in the running `web` profile after a restart |
| **Observed result** | The profile `package.json` and `pnpm-lock.yaml` list only `@sternrassler/dsh-peak-window`; the superseded `@sternrassler/dsh-deepseek-price-window` entry and its orphaned `node_modules/@sternrassler` symlink are removed (that symlink is left behind by `pnpm remove` and had to be deleted explicitly). Composition: `- id: deepseek-price-window` with `name: '@sternrassler/dsh-peak-window'`. After a fresh instance and reload: the badge appears below the composer, `OFF_PEAK` in green with countdown, readable in light and dark, no console and no slot entry errors. Threshold (registration present, `= 0` slot entry crashes) met. |
| **Status** | passed |
| **Date / state** | 2026-10-10 18:53 local (Beijing: 2026-10-11 00:53) |
| **Checking person / system** | sternrassler (visual check in the fresh instance); DSH agent (installation, composition and removal of the superseded entry) |

**Superseded addendum above:** the `NFR-M4-1` tables further up document earlier
installations under the interim names. They are kept as historical observations
and are **no longer** the current state of the requirement; the table here is.

**Known boundary of the check (unchanged):** the visual check happened in state
`OFF_PEAK`; the red `PEAK` case was never confirmed visually, only via unit tests
and theme token usage.

The peer dependency warning of the profile installer concerns only pre-existing
packages (`dsh-experimental-agent-team*`); this bundle has no dependencies and no
peers.

---

## Change record — CI runner version (`NFR-B2`)

| Field | Value |
|---|---|
| **Change / PR / version** | `d75c6db` (pin to `ubuntu-24.04`), then `d52025c` (`@sternrassler/dsh-peak-window` 1.0.0) |
| **Quality area + requirement** | `NFR-B2` (artifact/build consistency), `NFR-B4-1` (checks stay effective) |
| **Type of check** | automated, CI (GitHub Actions) |
| **Check (test/tool, version)** | workflow `.github/workflows/ci.yml`; runs [38069577354](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38069577354) (24.04) and [38069839801](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38069839801) (26.04) |
| **Observed result** | CI warned that `ubuntu-latest` moves to Ubuntu 26. The label migrated from 24.04 to 26.04 over a window (2026-10-19 to 2026-11-19, runner-images#14748), so it was pinned first to `ubuntu-24.04` — job metadata reported `labels: ["ubuntu-24.04"]`, green. The gates were then moved to **`ubuntu-26.04`** — job metadata reports `labels: ["ubuntu-26.04"]`, fast / pre-merge and merge gate both green, release gate skipped (no tag). |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | GitHub Actions, job metadata read back via API |

**Why 26.04 was adopted rather than deferred:** the move was checked against the
one dependency that could plausibly break. Ubuntu 26.04 ships Python 3.14 by
default; semgrep's pinned `ruamel.yaml.clib` broke on 3.14 originally
(semgrep#11250) but that was fixed in 1.140.0, and the version used here (1.180.0)
ships `manylinux_2_34` wheels including `cp314`. The green run on 26.04 confirms
it. Node comes from the pinned `setup-node` action and gitleaks from a static
`linux_x64` release binary, so neither follows the image's interpreters.

**Note:** keeping the version explicit means a runner bump is a reviewable
commit. An unpinned `ubuntu-latest` would have moved the gate — possibly
mid-release — without any commit showing it.
