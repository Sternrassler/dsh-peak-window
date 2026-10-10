# Definition of Done

A change is only complete when **all** of the following points are met:

- [ ] Affected quality areas are named (`NFR-B1…B5`, and `M1…M5` if relevant).
- [ ] For every affected requirement there is evidence with an observed result
      ([docs/nfr/nachweise/](nfr/nachweise/), evidence-record template
      from the NFR specification package v1.0).
- [ ] Automated checks of the assigned gate pass
      (`npm run check` green, CI gates green).
- [ ] If the rule changed: `npm run build:client` was run, `client.js` is
      committed and `npm run check:client` is green.
- [ ] Not applicable criteria are justified; missing checks and remaining risks
      are named.
- [ ] Evidence is data-sparing (no secrets, no real personal data, no complete
      logs).

Unmet points block the merge.

Normatively defined in the referenced NFR specification, section 6.3.
