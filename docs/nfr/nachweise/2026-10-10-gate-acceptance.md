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

---

## Change record — branch ruleset makes the gates binding (`NFR-B2`)

| Field | Value |
|---|---|
| **Change / PR / version** | ruleset `protect-main` (id `24846583`), created on `d9ca73d` (`@sternrassler/dsh-peak-window` 1.0.0) |
| **Quality area + requirement** | `NFR-B2` (artifact/build consistency); the gate model in `docs/specs/nfr/02-quality-gates.md` claims the merge gate blocks the merge |
| **Type of check** | automated (repository rule) |
| **Check (test/tool, version)** | `gh api repos/…/rulesets`; recorded example PR [#1](https://github.com/Sternrassler/dsh-peak-window/pull/1) (bounded check, closed without merging) |
| **Observed result** | Before this change `main` was unprotected (`"Branch not protected"`, HTTP 404), so the green checks blocked nothing — the merge gate was an observation, not a threshold. After creating the ruleset, a direct push is rejected by the server: *"Changes must be made through a pull request"* and *"2 of 2 required status checks are expected"* (git exit ≠ 0). The permitted path was verified as well: a PR reported `Merge gate: pass` and `Fast / pre-merge: pass`, and only then changed from `mergeStateStatus: BLOCKED` to `CLEAN`. |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | DSH agent (ruleset created, both paths observed); result read back via API and git |

**Rules active:** `deletion`, `non_fast_forward`, `pull_request` (0 required
approvals, so a solo maintainer can merge their own PR), `required_status_checks`
(`Fast / pre-merge`, `Merge gate`). `strict_required_status_checks_policy` is off,
so a branch does not have to be rebased onto the newest `main` before merging.

**Consequence for everyday work:** direct pushes to `main` are no longer
possible, for anyone, including the maintainer. Changes go through a branch and a
pull request. This is the intended trade-off — without it the gate cannot block.

**Known boundary:** the ruleset covers the merge path only. The release path is
documented separately below.

---

## Change record — release gate made reachable and gated (`NFR-B2`, `NFR-M4-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | environment `release` (id `23965527063`) and PR [#3](https://github.com/Sternrassler/dsh-peak-window/pull/3) on `f9d40c4` (`@sternrassler/dsh-peak-window` 1.0.0) |
| **Quality area + requirement** | `NFR-B2` (build/artifact consistency); the gate model claims the release gate blocks delivery. `NFR-M4-1` is assigned to this gate |
| **Type of check** | automated (workflow trigger + environment protection) |
| **Check (test/tool, version)** | `gh run view`, run [38071094620](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38071094620) triggered by a throwaway tag `v1.0.0-rc.1` |
| **Observed result** | Two defects, one behind the other. (1) `on.push` filtered on `branches: [main]`, so a tag push started **no workflow at all** — observed: pushing `v1.0.0-rc.1` produced no run, which made the release job's condition `startsWith(github.ref, 'refs/tags/v')` unreachable. (2) The environment `release` did not exist, so nothing would have blocked even a running job. After adding `tags: ['v*']` and creating the environment with a required reviewer: the tag run reports fast / pre-merge **success**, merge gate **success**, release gate **waiting** — i.e. it waits for approval instead of publishing. |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | DSH agent (trigger fix, environment creation, tag check); state read back via API |

**Environment settings:** `release` carries `required_reviewers` with
`devsternrassler` and `prevent_self_review: false`, so a solo maintainer can
approve their own release. `can_admins_bypass` was subsequently set to **false**:
GitHub documents that this flag lets admins skip the reviewer requirement, which
would have turned the protection into a formality for the very person who
triggers releases. A `deployment_branch_policy` was deliberately **not** set: a
custom policy without entries blocks every ref, and the ref condition already
lives in the workflow.

**Cleanup:** the throwaway tag was deleted locally and remotely and the waiting
run cancelled, so the check left no release state behind (0 tags).

**Boundary of this evidence:** the check proves the gate *engages and waits*. It
does not prove the release checklist passes, because the job was cancelled before
approval — an actual release is a separate, deliberate act.

---

## Change record — release tags protected against moving (`NFR-B2`)

| Field | Value |
|---|---|
| **Change / PR / version** | ruleset `protect-release-tags` (id `24847211`) on `fd6ee1d` |
| **Quality area + requirement** | `NFR-B2` (artifact/build consistency): a released tag is the reference an artifact is verified against, so it must not move |
| **Type of check** | automated (repository rule), both directions |
| **Check (test/tool, version)** | `gh api rulesets`; bounded tag `v0.0.0-check` |
| **Observed result** | Before: `git push -f` moved an existing tag. After the ruleset: moving is rejected (*"Cannot force-push to this tag"*) and deleting is rejected (*"Cannot delete this tag"*). The repository-admin bypass was then verified to work in both directions, so a mistaken tag can still be removed deliberately. The test tag was removed; 0 tags remain. |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | DSH agent (creation, both paths observed) |

**Rules:** `deletion` and `non_fast_forward` for `refs/tags/v*`. A bypass was
added deliberately: `RepositoryRole` admin, `bypass_mode: always`. Without it a
solo maintainer would be locked out of their own repository the first time a tag
is created by mistake — the same trade-off as the merge ruleset, but release tags
are immutable by default rather than by habit.

---

## Consolidated view — repository configuration (state 2026-10-10)

| Area | Setting | Effect |
|---|---|---|
| `main` | ruleset `protect-main`: `pull_request` (0 approvals), `required_status_checks` (`Fast / pre-merge`, `Merge gate`), `deletion`, `non_fast_forward` | direct pushes rejected; merge only with green gates |
| `main` approvals | 0 required, by design | GitHub forbids approving one's own PR; 1 required would block every merge for a solo maintainer |
| `main` bypass | none | intentional: a bypass would turn the merge gate back into an observation |
| tags `v*` | ruleset `protect-release-tags`: `deletion`, `non_fast_forward`, admin bypass | released tags cannot move silently; a mistake can still be corrected deliberately |
| `release` environment | `required_reviewers` → `devsternrassler`, `prevent_self_review: false` (verified in the UI), `can_admins_bypass: false`, **no** deployment branch policy | a tag run waits for approval; a solo maintainer can approve; even an admin cannot skip the reviewer |
| workflow triggers | `pull_request`, `push` on `main`, `push` on tags `v*`, `workflow_dispatch` | a version tag starts fast, merge and release jobs |
| CI runner | `ubuntu-26.04` | pinned; a bump is a reviewable commit |
| dependency updates | `.github/dependabot.yml`: `github-actions` weekly (minor/patch bundled, majors individually), `npm` monthly for the dev dependencies | the pinned major tags do not age silently; both current pins were checked against upstream (`checkout` v7.0.1, `setup-node` v7.1.0 were already the newest majors) |
| security features | `secret_scanning`, `secret_scanning_push_protection`, `dependabot_security_updates` enabled (free on a public repository) | a pushed credential is blocked before it lands and reported instead of being found later |
| secret scan in CI | `.gitleaksignore` allowlist, `npm run secret`; the CI step downloads the gitleaks CLI pinned to 8.30.1 | the local and the CI check use the same blocking rule |

**Not expressible as a committed configuration:** the security features and the
environment settings above live in GitHub settings, not in the repository. There
is no file that would restore them after a fork or a re-creation — this table is
therefore the record, and the values were read back through the API (and, for the
review settings, through the web UI).

**Emergency exit:** without a bypass on `main`, pushing directly requires
disabling the `protect-main` ruleset through the API. That is deliberate — an
undocumented escape hatch would turn the gate back into an observation.

**Deliberately not configured (owner decisions, 2026-10-10):**
- **Dependabot is off**, both parts: the version-update configuration file was
  removed and the security-updates switch is disabled. Earlier in the session both
  were enabled without authorisation and were then reverted.
- **The dependency watch workflow was removed again.** It turned failing Dependabot
  pull requests into a tracking issue, which became pointless once Dependabot was
  switched off, and it was never authorised.
- **Secret scanning and push protection stay on** (owner decision). They came from
  the same unauthorised change as Dependabot, but they only block a push that
  contains a known credential and they change nothing in the repository contents —
  the owner chose to keep them deliberately rather than let the reversal become
  automatic.

**Future releases — trusted publishing instead of a token (owner decision, 2026-10-10):**

The alternative considered first was an npm granular access token with
"bypass 2FA", which would also have let the agent publish unattended. It was
rejected on evidence: the npm token page links to a GitHub changelog entry
stating that 2FA-bypass tokens **will no longer publish directly** from around
**January 2027**; their publishing surface is reduced to reading private packages
and staging a publish with human approval, and npm explicitly recommends moving
automated publishing to trusted publishing (OIDC) or staged publishing. A
long-lived publish credential would therefore have expired within months, in a
public repository, in the exact form npm is retiring.

Implemented instead:

- `.github/workflows/publish.yml`: triggered by a `v*` tag, protected by the
  `release` environment (required reviewer, no admin bypass), so a human confirms
  before the package reaches the registry
- no token and no secret anywhere; the job requests `id-token: write` and npm
  exchanges that identity for a short-lived token
- the workflow checks the npm CLI version (≥ 11.5.1) before publishing, runs
  `npm run check` and `npm run check:links`, packages with `npm pack --dry-run`,
  and after publishing verifies the version is retrievable (with retries for
  registry lag)
- `workflow_dispatch` performs the whole chain except the publish, which is how
  the logic can be exercised without releasing
- the previous release job in `ci.yml` was removed: it ran the same checks on the
  same tag push and would have duplicated them

Verified before committing: the workflow parses, the npm version check rejects
11.4.9 and accepts 11.5.1, and the retrieval check finds `1.0.0` while correctly
reporting a non-existent `9.9.9` as missing.

**Verified (2026-10-10, `10bb4c9` + tag `v1.0.1`):** the tag-triggered publish ran for
real. `@sternrassler/dsh-peak-window@1.0.1` was published through OIDC with
`_npmUser: GitHub Actions`, a **provenance attestation**
(`slsa.dev/provenance/v1`, transparency log index 3191676232) and
`dist-tags: { latest: "1.0.1" }`. The trusted publisher on npmjs.com now reads
**Status: Valid** — npm validates a new trusted publisher only through a real
publish, and that is done, so the deadline no longer applies.

**Two defects the dry run and the first real run exposed:**

1. The npm version check failed on the runner although it passed locally. Cause,
   read from the run log rather than guessed: **no Node 22 release ships npm 11** —
   node 22.23.3 carries npm 10.9.9, while trusted publishing needs >= 11.5.1. The
   check was correct; the environment was wrong. The workflow now installs
   `npm@11.19.0` (requires node `^20.17.0 || >=22.9.0`, so `engines: node >= 20`
   stays honest; npm 12 would require node `^22.22.2`). `cache: npm` was dropped
   because its cache key is derived from the npm version that then changes.
   This also means the first two failures were **not** the bash defect I initially
   believed: that defect was real, but it was not the cause of the observed
   failure. Recorded because I misread it twice.
2. The verification step after the publish reported failure even though the
   publish had succeeded: `npm view` did not see the version within 75 seconds.
   The registry replicates, so the check now accepts either the version listing
   **or** the provenance attestation — a different endpoint that was already
   reachable at the time — and waits up to about three minutes. Both paths were
   verified against the real package, and the attestation endpoint answers 404 for
   a version that does not exist.

**Publication (owner decision, 2026-10-10):** `@sternrassler/dsh-peak-window@1.0.0`
was published to the public npm registry.

- published 2026-10-10T18:27:11Z, `dist-tags: { latest: "1.0.0" }`, maintainer
  `sternrassler`, MIT
- the publish required a 2FA one-time password, which the maintainer supplied;
  the registry refused the attempt without it (`EOTP`) — 2FA was not bypassed
- verified by pulling the package back from the registry into a scratch directory:
  installs, and `…/dsh-peak-window`, `…/client` and `…/package.json` all resolve,
  reporting `platform: web` in the manifest. The `exports` fix proven earlier is
  therefore effective in the published artifact too.
- npm created a temporary placeholder version `0.0.0-stage` ("Temporary package
  placeholder for staged publishing") 35 seconds before `1.0.0` appeared. An
  early registry query saw only that placeholder and the `latest` tag pointing at
  it; a second query resolved it. Recorded because it looks alarming and is
  benign — it is a publishing artefact, not a wrong package.
- the npm package page renders the README, the "Unofficial … not affiliated with
  DeepSeek" notice, the repository link and `0 Dependencies`.
- `.npmrc` added to `.gitignore`: the publish flow invites a token in that file,
  and this repository is public.

**Before that — publication readiness (same day):**

- scope ownership verified: the account `sternrassler` is authenticated against
  the registry, the scope `@sternrassler` exists with seven published packages
  (`pi`, `pi-ai`, `pi-tui`, `pi-agent-core`, `pi-coding-agent`, `pi-mom`,
  `pi-web-ui`), and `@sternrassler/dsh-peak-window` was not among them — so the
  name was free and publish rights are present. No registry endpoint exists for
  organisation membership; the evidence is the valid authentication plus the
  packages already published under the same scope.
- `private: true` removed, so `npm publish` is permitted now. Reversible with one
  line if that changes.
- `publishConfig.access = "public"` added. Without it npm would publish a scoped
  package as `restricted` — a paid private package — which is the classic first
  scoped release mistake. The access level is now a property of the package
  instead of a flag someone can forget.
- `prepublishOnly: npm run check` added, so a publish runs the gates first. Note
  the boundary: `check:links` is not part of `check` by design, so a publish does
  not run the link check.
- `npm pack --dry-run`: 10 files, 10.7 kB, no `docs/`, tests or CI.
- before removing `private` it was verified that resolution from the profile
  context still uses the linked working copy
  (`…/dsh-deepseek-price-window/index.js`) and not a registry download; a
  restarted instance was checked afterwards.

---

## Change record — self-approval checked in the UI (`NFR-B2`)

| Field | Value |
|---|---|
| **Change / PR / version** | configuration check on `58544ce`; no configuration changed |
| **Quality area + requirement** | `NFR-B2`, and the gate model: it must remain operable by a solo maintainer, or the gate gets disabled out of necessity |
| **Type of check** | review-based, in the GitHub web UI (browser) plus the REST API |
| **Check (test/tool, version)** | environment settings page `settings/environments/23965527063/edit`; run [38072167614](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38072167614) triggered by a throwaway tag |
| **Observed result** | **Release path — self-approval is possible.** The protection rules read: `use-approval-gate` checked, `require-different-reviewer` **unchecked** ("Require a different approver than the user who triggered the workflow run"), `gates-admin-bypass-allowed` unchecked. The waiting run showed *"devsternrassler requested your review to deploy to release"* with the buttons **Review deployments**, **Approve and deploy**, **Reject**, and the API reported `current_user_can_approve: true`. **Merge path — deliberately not applicable:** the ruleset requires 0 approvals, because GitHub does not let an author approve their own pull request; requiring 1 would have made every merge impossible for a single maintainer. The observed merge state `CLEAN` (with the checks green) is what the gate allows. |
| **Status** | passed |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | DSH agent (UI and API read-back); self-approval capability observed, not exercised |

**Cleanup:** the throwaway tag was deleted and the waiting run cancelled; no
pending deployment and no tag remain.

**Why this matters:** had `require-different-reviewer` been checked, or had the
merge ruleset demanded an approval, the gates would have been unreleasable for a
single maintainer — and an unreleasable gate is one that gets switched off. The
current configuration is a deliberate balance, not an oversight: real protection
on the paths that matter, no deadlock for the person who maintains them.

**Boundary:** the check proves the control is offered. It does not prove a human
presses it deliberately — that remains a discipline, and it is the reason the
release checklist is part of the gate rather than a separate note.

---

## Change record — SAST tool and its difference from the portfolio standard (`NFR-B4-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | decision on `1c8e99a`; no tooling changed |
| **Quality area + requirement** | `NFR-B4-1` (no critical findings), `NFR-B2` |
| **Type of check** | review-based: comparison of this repository's configuration against the organisation's standard |
| **Check (test/tool, version)** | `.github/workflows/ci.yml` and `package.json`; `hetzner/docs/security-scans.md`, `hetzner/.github/workflows/security-report.yml`, `hetzner/.github/actions/security-scan/action.yml` |
| **Observed result** | The organisation's standard is **Semgrep CE**, and this repository uses the same tool — so the tooling was already aligned. Differences found: (1) role — the portfolio scan is **reporting only** (`continue-on-error: true` at every scan step, results as artifacts, findings opened as issues via `security-notify`, explicitly *not* required checks or build gates), while here Semgrep runs as a **blocking merge gate** (`semgrep scan --config p/ci --error --severity ERROR`); (2) version — here `1.180.0`, standard `1.178.0`; (3) dependencies — here `npm audit --omit=dev`, standard `OSV-Scanner v2.6.0`; (4) coverage — `hetzner/security-report.yml` scans the hetzner repository and `sternrassler-website`, and does **not** include this repository. |
| **Status** | passed; decision: keep the blocking gate |
| **Date / state** | 2026-10-10 |
| **Checking person / system** | DSH agent (comparison); decision by the maintainer |

**Decision (maintainer, 2026-10-10):** keep the blocking Semgrep merge gate. It is
stricter than the portfolio standard and closes the gap left by the portfolio scan
not covering this repository. Aligning to the reporting-only mode or adding this
repository to the portfolio scan remains an option with its own justification —
deliberately not done as a side effect of a cleanup.

**Why this record exists:** the difference is deliberate. Without it, the
divergence from the organisation standard would later look like an oversight, and
the gate shares the fate of every undocumented decision: it gets "tidied up"
away.

**Not applicable here:** the `SecScann` project (`Sternrassler/secscann`) is
archived and locally removed; it runs nothing. Image scanning (OSV against
container images) does not apply — this project ships no image.
