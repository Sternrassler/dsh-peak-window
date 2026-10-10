# Quality scenarios

At least one scenario per active quality area, with goal, trigger, metric,
threshold (with unit and comparison direction), measurement method, owner and
gate (NFR specification section 5).

## NFR-B1/2-1 — Comprehensibility (review-based)

| Field | Value |
|---|---|
| **Goal** | Readability and maintainability without a verbal handover |
| **Trigger** | Review before the merge; a person gets up to speed on the code |
| **Metric** | Number of open "unclear" findings (definition and criteria below) |
| **Threshold** | `= 0` open findings |
| **Measurement** | Code review against the criteria list, findings list in the evidence record |
| **Owner** | sternrassler (quality owner maintainability) |

**Assigned gate:** Merge

An "unclear" finding is any place that cannot be understood without a verbal
handover, or whose intent can only be guessed. Criteria:
purpose recognisable · responsibility clear · contract explicit · edge case
justified · number/text derivable (09:00/12:00/14:00/18:00 with source
reference) · no personal dependency · docs up to date. Every finding is fixed or
filed as a documented exception (NFR specification section 8).

## NFR-B3-1 — Defined state on an invalid rule configuration

| Field | Value |
|---|---|
| **Goal** | No silent fallbacks on an invalid rule |
| **Trigger** | `data/rule.json` contains an invalid window, an invalid holiday date or an unknown time zone |
| **Metric** | Failing validation cases in `test/price-window.test.js` |
| **Threshold** | `= 0` failures |
| **Measurement** | automated: `npm test` (node:test), fast gate |
| **Owner** | sternrassler (quality owner resilience) |

**Assigned gate:** Fast / pre-merge

## NFR-B3-2 — Correct boundary and time zone logic

| Field | Value |
|---|---|
| **Goal** | Correct PEAK/OFF_PEAK assignment at window, weekend and holiday boundaries |
| **Trigger** | Instant exactly on a window edge, or in a zone other than Asia/Shanghai |
| **Metric** | Failing time logic tests in `test/price-window.test.js` |
| **Threshold** | `= 0` failures |
| **Measurement** | automated: `npm test`, merge gate |
| **Owner** | sternrassler |

**Assigned gate:** Merge

## NFR-B4-1 — No secrets, no critical findings

| Field | Value |
|---|---|
| **Goal** | No secrets in the repository, no critical vulnerabilities |
| **Trigger** | Commit/PR or release |
| **Metric** | Findings per scan |
| **Threshold** | `= 0` secrets, `= 0` SAST critical/high, `= 0` exploitable dependency gaps (production dependencies) |
| **Measurement** | automated: `npm run secret` (gitleaks, hard), `npm run sast` (Semgrep), `npm run deps` (npm audit) |
| **Owner** | sternrassler (quality owner information security) |

**Assigned gate:** Fast (secrets) / Merge (SAST, dependencies)

Note: the package has **no** production dependencies (`require('react')` comes
from the DSH module table), so the attack surface is small — that does not
replace the check.

## NFR-B5-1 — No personal data

| Field | Value |
|---|---|
| **Goal** | No processing or transmission of personal data |
| **Trigger** | Runtime of the plugin in the browser |
| **Metric** | Confirmed data flows |
| **Threshold** | `= 0` personal data, `= 0` network targets |
| **Measurement** | Review of the runtime path + automated: artifact test forbids network/storage calls |
| **Owner** | sternrassler (quality owner data protection) |

**Assigned gate:** Merge

## NFR-M3-1 — State not conveyed by colour alone, contrast in both themes

| Field | Value |
|---|---|
| **Goal** | State recognisable without colour perception; readable in light and dark |
| **Trigger** | Colour vision deficiency; theme switch |
| **Metric** | Accessibility violations; presence of a text label and `aria-label` |
| **Threshold** | `= 0` violations; text label `PEAK`/`OFF_PEAK` and `aria-label` must be present |
| **Measurement** | automated: artifact test checks text label, `role="status"`, `aria-label` and theme tokens; plus a manual visual check in light and dark |
| **Owner** | sternrassler (quality owner usability) |

**Assigned gate:** Merge / Release

## NFR-M4-1 — Clean registration in the DSH slot

| Field | Value |
|---|---|
| **Goal** | Bundle registers at the dock slot without errors |
| **Trigger** | Installation/update of the bundle in the profile |
| **Metric** | Slot registration present; console errors |
| **Threshold** | Registration present, `= 0` slot entry crashes |
| **Measurement** | automated/manual: `plugin_manager install_bundle` → `application: applied`; `cordis_inspect_query` `Slots.listSubTree` with `root: conversation.composer.dock`; visual check |
| **Owner** | sternrassler (quality owner compatibility) |

**Assigned gate:** Release

## Inactive areas

`NFR-M1`, `NFR-M2`, `NFR-M5` are inactive; justification in the
[risk profile](risikoprofil.md). Inactive modules need no scenario.
