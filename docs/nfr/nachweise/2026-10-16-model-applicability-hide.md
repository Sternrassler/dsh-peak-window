# Evidence — hide the price window without an applicable DeepSeek model

| Field | Value |
|---|---|
| **Change** | Working-tree behavior update for `@sternrassler/dsh-peak-window` (base `17c9b85594d33e3af1027aa90700f2ceaf2f4eea`; not released) |
| **Quality areas + requirements** | `NFR-B1` (contained rendering logic and regression coverage), `NFR-B2` (source, generated bundle, tests, and docs agree), `NFR-B3` (unresolved/unavailable model states are handled without a misleading price window), `NFR-M3` (no misleading placeholder; DeepSeek state retains text and accessible name), `NFR-M4` (model-directory subscription and composer dock contract) |
| **Type of check** | automated artifact/runtime tests, lint, format, link check, and independent read-only review |
| **Checks** | `npm run build:client`; `npm run check`; `npm run check:links`; reviewer `dsh` via `~/vscode/brain/scripts/deepseek-read-only-review.sh` |
| **Observed result** | `build:client` generated `client.js`; `check` passed (bundle fresh, lint/format clean, 44/44 tests); `check:links` passed (39 relative links, all resolvable). Runtime tests cover valid DeepSeek, non-DeepSeek, no current model, unavailable model, and switching away/back. Independent review verdict: `erfuellt`; its actionable documentation findings were addressed in this working-tree revision. |
| **Status** | passed |
| **Date / state** | 2026-10-16; local working tree only |
| **Checking system** | DSH implementation session; read-only reviewer used effective `deepseek-flash` model |

## Behavior evidence

`lib/client.template.js` returns `null` when `computeModelScope(modelSnapshot).applies` is not `true`. The existing `useSyncExternalStore` subscription remains active, so a model switch updates rendering without remounting the plugin. `test/client-runtime.test.js` verifies no component output for another provider, a null current model, and an unavailable selection, plus reappearance when switching back to DeepSeek; `test/model-scope.test.js` separately verifies the neutral classification for a missing current selection. `test/client-artifact.test.js` verifies the generated artifact contains the same early return. The DSH dock receives the plugin component output; no badge node or placeholder is emitted for hidden states.

## Not applicable criteria and data boundaries

- `NFR-M1` performance and `NFR-M2` capacity are inactive in the project risk profile; this is one local status component with no additional polling or state.
- `NFR-M5` compliance is inactive for this change.
- `NFR-B4` information security and `NFR-B5` data protection are not materially changed: the patch adds no network, storage, credential, or host access. It only evaluates the session-local model-directory snapshot and emits a component or `null`; provider/model data is not logged or transmitted.

## Remaining verification limits

The component-level test uses the repository's React stub and generated client artifact; a live browser screenshot/interaction in the DSH host was not run. `null` means the plugin contributes no badge element or placeholder, while the dock may still render unrelated host content. The change has not been installed, published, or deployed; no external delivery was requested.

The historical evidence for release 1.1.0 remains in [2026-10-11-model-applicability.md](2026-10-11-model-applicability.md); that report is explicitly marked as superseded for current display semantics.
