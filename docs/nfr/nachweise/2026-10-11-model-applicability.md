# Evidence — model applicability of the price window (`NFR-M4-1`, `NFR-B1/2-1`, `NFR-M3-1`)

> Historical evidence for release 1.1.0. Its grayed-out/qualified behavior was superseded on 2026-10-16 by [the hide-when-not-applicable change](2026-10-16-model-applicability-hide.md); the observations below remain accurate for the 1.1.0 release only.

| Field | Value |
|---|---|
| **Change / PR / version** | `@sternrassler/dsh-peak-window` **1.1.0** (release of the change on `2412673`) |
| **Quality area + requirement** | `NFR-M4` / `NFR-M4-1` (the bundle registers cleanly and behaves in the delivered runtime), `NFR-B1/2-1` (criterion 7: documentation matches the behaviour), `NFR-M3-1` (the state is not conveyed by colour alone) |
| **Type of check** | automated: unit, artifact and runtime tests; review-based for the source of the provider knowledge |
| **Check (test/tool, version)** | `npm run check` (Node v26.7.0, ESLint 9.39.5, Prettier 3, `node:test`), `npm run check:links`, `npm pack --dry-run` |
| **Observed result** | `npm run check` green: artifact current, lint and format clean, **45/45 tests** (was 25). `test/model-scope.test.js` 11, `test/client-runtime.test.js` 7, `test/client-artifact.test.js` 9, `test/price-window.test.js` 18. `npm run check:links`: 38 of 38 relative links resolvable. `npm pack --dry-run`: 11 files, `lib/model-scope.js` included. |
| **Status** | passed |
| **Date / state** | 2026-10-11 16:58 UTC; released as `1.1.0` 17:09–17:20 UTC |
| **Checking person / system** | DSH agent (implementation and checks), results observed above |

## Release trail (observed)

| Step | Observed result |
|---|---|
| Pull request | [#29](https://github.com/Sternrassler/dsh-peak-window/pull/29), fast / pre-merge **success**, merge gate **success** ([run 38158397530](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38158397530)) |
| Merge | squash-merged to `main` as `38d88b0` |
| Gates on `main` and on the tag | [run 38158490351](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38158490351) and [run 38158507711](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38158507711), both **success** |
| Tag | `v1.1.0` → `38d88b0`, annotated and protected against moving (`protect-release-tags`) |
| Release approval | the owner approved in the protected `release` environment; that click is a deliberate human act that the automated check neither performs nor replaces |
| Publication | [run 38158507724](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38158507724) — **success**, every step green, `Dry run only?` skipped as intended |
| Registry | `latest: 1.1.0`; provenance `slsa.dev/provenance/v1`, attestation HTTP 200, `_npmUser: GitHub Actions` |
| Published artifact checked, not assumed | The tarball from the registry is **byte-identical** with the tagged `client.js` and `lib/model-scope.js`; executing the **published** `client.js` for the three snapshots reproduces the three display states (`OFF_PEAK → PEAK in 7h 46m`, `— · DeepSeek pricing only`, `… · model not available`) |

**Note on the first PR attempt:** the pull request produced no check suite at all
(0 check suites, `mergeable_state: blocked`), although the workflow file was
untouched and syntactically intact. A follow-up push to the branch delivered the
`synchronize` event and the gates then ran normally. Recorded, because "no checks
reported" otherwise reads like a missing gate rather than a dropped event. The
extra empty commit was squashed away with the merge, so `main` carries one commit.

## What changed and why

The badge showed PEAK/OFF_PEAK regardless of the active model. Since the `codex`
route can be mounted next to the DeepSeek routes, the same session could show a
price window for a model that it does not cover. The badge now reads the active
model from the session's model directory and has three display states
(specification §3.5): normal for DeepSeek, grayed out with `· DeepSeek pricing
only` for another provider, and `· model not available` when the selection is
resolved but absent from the catalog.

## Observed inputs (not assumed)

| Fact | How it was observed |
|---|---|
| The active model is reachable in the client | `ctx.modelDirectories.directoryFor(sessionId)` → `ModelDirectory.store` (`SnapshotStore` with `subscribe`/`getSnapshot`), read from `@deepseek-ai/dsh-client-ui-model-selection` in the installed harness |
| The value is reactive | The harness's own composer seat uses `useSyncExternalStore(directory.subscribe, directory.getSnapshot)`; the badge uses the same contract |
| The injected face is the store, not a snapshot | `inject: (sessionId) => ({ modelState: directory.store })`; the renderer spreads the returned object as props |
| DeepSeek has **two** provider ids | `deepseek-account` (`dsh-llm-deepseek-account`) and `deepseek-official` (`dsh-llm-deepseek-api-key`); `codex` comes from the codex connector |
| `routable` is `null` until resolved | `routable` is only `true`/`false` once the catalog is `ready` and the projection exists (source of the model directory) |

## Deliberate decisions

- **Qualified, not hidden.** A disappearing badge would look like a defect; the
  qualification travels in the visible text *and* in `aria-label`/`title`, so it
  is not colour-only (`NFR-M3-1`).
- **No hint before the selection is resolved.** `routable: null` means "not
  derivable yet"; a hint there would be a false alarm on every mount.
- **Prefix rule with a boundary**, not a substring rule: exactly `deepseek`, or
  `deepseek-…`. Mutation-proved below — the plain prefix version accepted
  `deepseekx`.
- **Not applicable is not an error.** The error state stays reserved for an
  invalid rule; a foreign provider is a defined state.
- **Dependency named openly:** without the harness model-selection plugin the
  service is absent and the plugin does not register. That is contained (no
  crash) but it means the badge is not independent of that plugin — a limit of
  `NFR-M4-1`, recorded rather than glossed over.

## Mutation checks (the checks can fail)

| Mutation | Expected | Observed |
|---|---|---|
| `lowered === prefix \|\| startsWith(prefix + '-')` → `includes(prefix)` | prefix-boundary tests turn red | 3 tests red, incl. `a provider that merely contains the word is not DeepSeek` |
| neutral branch returns `applies: false` + hint (hint before resolution) | "no hint before a selection is resolved" turns red | 1 test red |
| `computeModelScope(modelSnapshot)` → `computeModelScope(modelState)` (store instead of snapshot — the defect actually built during implementation) | runtime tests turn red | 3 tests red in `client-runtime.test.js` |

The third mutation is the reason `test/client-runtime.test.js` exists: the static
artifact assertions could not see it, because the wiring was present and only the
value passed to the logic was wrong. That test loads the generated `client.js`
through the module loader, replaces only `react`, and renders the registered slot
entry for four model-directory snapshots. It uses `node:vm` rather than
`new Function` because the project lints against dynamic code.

## Not applicable criteria (justification)

- Load/performance (`NFR-M1`) and capacity (`NFR-M2`): modules inactive.
- Compliance (`NFR-M5`): inactive, no legal requirement.
- Security/data protection (`NFR-B4`, `NFR-B5`): the change adds no network,
  storage or host access; the provider id is session-local data and is not
  logged or transmitted.

## Missing checks / remaining risks

- **Visual check: performed by the owner (observed result).** The owner installed
  the change in the `web` profile and confirmed the new state by eye — the grayed
  badge with the qualification, in **both light and dark** — and reported the
  result. The observer records that statement; the DSH agent did not repeat the
  visual check itself, so the evidence is a human observation, not an automated
  one.
- **The prefix list is maintained knowledge**, like the holiday list. A DeepSeek
  route registered under a name without the `deepseek` prefix would be treated as
  a foreign provider. A test guards the list, but it cannot discover a rename in
  the harness.
- **Consequence of the new dependency, stated openly:** if the harness
  model-selection plugin is absent, the badge does not render at all. That is
  contained (no crash, documented), but it is a visible regression in that
  constellation and the reason the version is a **minor** bump rather than a
  patch.

## Files

- `lib/model-scope.js` (pure logic, embedded into the artifact)
- `lib/client.template.js` (badge states, injection of `modelDirectories`)
- `scripts/build-client.mjs` (embeds the second logic module)
- `test/model-scope.test.js`, `test/client-runtime.test.js`,
  `test/support/react-stub.js`, `test/client-artifact.test.js`
- `docs/spezifikation.md` §3.5, `README.md` (Known limitations), `AGENTS.md`
