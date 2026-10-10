# Evidence — State not conveyed by colour alone (`NFR-M3-1`)

| Field | Value |
|---|---|
| **Change / PR / version** | English migration of the interface and the documentation; confirmed again on `ec0a714` (`@sternrassler/dsh-peak-window` 1.0.0) |
| **Quality area + requirement** | `NFR-M3` (usability/accessibility), `NFR-M3-1` |
| **Type of check** | automated (artifact test) and review-based (visual check) |
| **Check (test/tool, version)** | `npm test` (node:test) against `client.js`; visual check in the running `web` profile |
| **Observed result** | Automated: text label `PEAK`/`OFF_PEAK` derived from `state(now, RULE)`, `role="status"`, `aria-label` (success and error state) and theme tokens instead of hard-coded colours proven; 23/23 tests green (also green in CI, run [38069234550](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38069234550)). Mutation check: changing `role: 'status'` to `'none'` makes the test fail (exit ≠ 0). Visual check after the migration and again in a fresh instance after the package rename: state as text and countdown correct, readable in light and dark, no console errors. Threshold `= 0` violations met. |
| **Status** | passed |
| **Date / state** | 2026-10-10, automated 18:20 local; visual check renewed 18:21 and 18:53 local in a fresh instance (Beijing 2026-10-11 00:21 / 00:53) |
| **Checking person / system** | sternrassler (visual check light/dark); DSH agent (artifact test, mutation check) |

**Gap this evidence closes:** The quality scenario catalogue promised an
automated artifact test for `NFR-M3-1` covering the text label, `role="status"`,
`aria-label` and the theme tokens. Only the theme token checks existed; the other
three assertions were missing, and no `NFR-M3-1` evidence record existed at all.
The assertions were added and their effectiveness was demonstrated with a
mutation check.

**On the visual check after the language migration:** The first visual check
(2026-10-10 18:12) still referred to the German wording. The migration changed
two user-facing strings: the error state and the accessible name. Both were seen
again after the migration. The normal state (`OFF_PEAK`, countdown, green
display) was textually unchanged, and the title is not shown in the normal state.

**After the package rename (18:53):** the check was repeated in a **fresh
instance** under `@sternrassler/dsh-peak-window`. The rename touched the module
id, the slot entry id and the bundle name, all of which are not rendered, so the
display was expected to be unchanged — and was observed to be unchanged. This
entry therefore still reflects the current state; the installation proof itself
lives in the [gate acceptance](2026-10-10-gate-acceptance.md) record.

**Checked and kept:** The slot registration still carries
`label: 'DeepSeek PEAK/OFF_PEAK'`. That field is registration metadata and, per
the harness slot API template, is to be kept in English (`label: 'My entry'`);
the label is already language-neutral and was therefore left unchanged. It is
not visible — the badge does the display, exposing the state as text.
