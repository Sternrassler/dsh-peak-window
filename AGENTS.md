# Project rules — @sternrassler/dsh-peak-window

DSH client plugin that shows the current DeepSeek price window (`PEAK` red /
`OFF_PEAK` green) with a countdown in the status line below the composer.

- **Target:** [docs/spezifikation.md](docs/spezifikation.md)
- **Plan:** [docs/plans/2026-10-10-deepseek-peak-offpeak-status.md](docs/plans/2026-10-10-deepseek-peak-offpeak-status.md)
- **NFR:** [docs/specs/nfr/README.md](docs/specs/nfr/README.md), risk profile [docs/nfr/risikoprofil.md](docs/nfr/risikoprofil.md), scenarios [docs/nfr/qualitaetsszenarien.md](docs/nfr/qualitaetsszenarien.md)
- **Rule/holidays:** [data/rule.json](data/rule.json) — apply changes with `npm run build:client`
- **Model applicability:** [lib/model-scope.js](lib/model-scope.js) — the single list of DeepSeek provider prefixes
- **Check:** `npm run check` (artifact freshness + tests)

## Bootstrap rules

- Truth tiers: (1) source code, (2) repo documentation, (3) brain.
- Local changes and tests are handled independently; external delivery (push, PR,
  publish) only on explicit instruction.
- Skill artifacts of this project: client bundles in DSH allow **no relative
  requires**; `client.js` is generated and self-contained.

<!-- nfr-template:v1 begin -->
<a id="nichtfunktionale-anforderungen"></a>
<a id="non-functional-requirements"></a>
## Non-functional requirements

These requirements apply to new and changed work in the project scope. Stricter
local rules remain binding. Including this section is not evidence that the
existing system already meets the requirements.

- **Clean code — white grade:** apply the entire
  [Clean Code Developer value system](https://clean-code-developer.de/die-grade/weisser-grad/)
  (reference state 2026-10-04) as continuous practice: understandable names,
  small coherent units, clear responsibilities, explicit contracts,
  KISS/DRY/SOLID with a sense of proportion, fitting tests, refactoring and
  regular reflection. No unnecessary abstractions; white is not a certification
  or a rating.
- **Maintainability:** keep changes locally contained, keep interfaces and
  dependencies traceable. Maintain decisions and operational knowledge in the
  repository; update the documentation along with changes. Use reproducible
  builds and fitting format, analysis and regression checks for existing
  software.
- **Resilience:** handle invalid input and failures explicitly; no silent
  fallbacks or success messages. Limit external calls (timeouts, finite retries;
  repetition only with safe semantics). Contain partial failures, protect data
  integrity and make failures observable. For persistent user data and operated
  services, define and verify recovery, backup/restore and, where applicable,
  rollback in proportion to the risk.
- **Information security:** validate input at trust boundaries, use least
  privilege and secure defaults. Keep secrets out of Git, logs and output. Check
  dependencies and affected attack surfaces; assess new security findings and fix
  them before delivery, or document a justified, explicitly accepted exception in
  the repository.
- **Data protection:** process and store only purpose-bound, necessary data.
  Record data flows, access, retention and deletion in the project where personal
  data is involved. Prefer synthetic test data; minimise logs and telemetry. Pass
  real personal or confidential data to external services or AI only within the
  provider, contract and approval limits that concretely apply.

**Evidence for changes:** name the affected quality areas and document fitting
checks with an observed result. For runtime effects, also check the relevant
failure/restart paths; for security or data protection effects, also check trust
boundaries and data flows. Justify not applicable criteria; name missing checks
and remaining risks openly. No blanket claim of conformity without evidence.
Keep evidence data-sparing: prefer test/version, status and concise results;
include no secrets, real personal data, confidential payloads or complete logs.
Redact necessary excerpts or use synthetic values; reference protected artifacts
only within their access and retention limits.
<!-- nfr-template:v1 end -->

## Relationship to the NFR specification

This block is the compact, applied instance of the template
`agents-nichtfunktionale-anforderungen.md` (reference state 2026-10-04). The
extended specification is referenced as a package, not copied:
[docs/specs/nfr/README.md](docs/specs/nfr/README.md).

**Provenance note:** the block above is an English rendering of that template,
whose reference version is German. Requirement content and the markers
`nfr-template:v1` are unchanged; only the language was adapted so that the
project documentation is readable for an international audience. The German
anchor `#nichtfunktionale-anforderungen` is kept for existing references, and
`#non-functional-requirements` is added for the English heading.
