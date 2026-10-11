# Evidence — model applicability of the price window (`NFR-M4-1`, `NFR-B1/2-1`, `NFR-M3-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | working state 2026-10-11 on `8976bc5` (unreleased; `1.0.2` remains the published version) |
| **Quality area + requirement** | `NFR-M4` / `NFR-M4-1` (the bundle registers cleanly and behaves in the delivered runtime), `NFR-B1/2-1` (criterion 7: documentation matches the behaviour), `NFR-M3-1` (the state is not conveyed by colour alone) |
| **Type of check** | automated: unit, artifact and runtime tests; review-based for the source of the provider knowledge |
| **Check (test/tool, version)** | `npm run check` (Node v26.7.0, ESLint 9.39.5, Prettier 3, `node:test`), `npm run check:links`, `npm pack --dry-run` |
| **Observed result** | `npm run check` green: artifact current, lint and format clean, **45/45 tests** (was 25). `test/model-scope.test.js` 11, `test/client-runtime.test.js` 7, `test/client-artifact.test.js` 9, `test/price-window.test.js` 18. `npm run check:links`: 35 of 35 relative links resolvable. `npm pack --dry-run`: 11 files, `lib/model-scope.js` included. |
| **Status** | passed |
| **Date / state** | 2026-10-11 16:58 UTC |
| **Checking person / system** | DSH agent (implementation and checks), results observed above |

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

- **No visual check yet in the running profile.** The grayed-out state and the
  two hints were verified through tests and the generated artifact, not through
  the eye. The badge in the `web` profile still runs the published `1.0.2` until
  the change is reinstalled there; the light/dark check of the new state remains
  open and is part of `NFR-M4-1` at the release gate.
- **The prefix list is maintained knowledge**, like the holiday list. A DeepSeek
  route registered under a name without the `deepseek` prefix would be treated as
  a foreign provider. A test guards the list, but it cannot discover a rename in
  the harness.
- **Not released.** No version bump, no tag and no publication belong to this
  working state; `1.0.2` stays the published version until a release is decided.

## Files

- `lib/model-scope.js` (pure logic, embedded into the artifact)
- `lib/client.template.js` (badge states, injection of `modelDirectories`)
- `scripts/build-client.mjs` (embeds the second logic module)
- `test/model-scope.test.js`, `test/client-runtime.test.js`,
  `test/support/react-stub.js`, `test/client-artifact.test.js`
- `docs/spezifikation.md` §3.5, `README.md` (Known limitations), `AGENTS.md`
