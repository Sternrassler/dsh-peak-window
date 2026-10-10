# Risk profile and roles

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| NFR package | v1.0, reference state 2026-10-10 |
| Mode | New project |

## 1. Risk profile

Base modules `NFR-B1…B5` are always active. Risk-based modules `NFR-M1…M5` are
justifiably active or inactive.

| Module | Status | Justification |
|---|---|---|
| NFR-B1 Clean code | active | always active |
| NFR-B2 Maintainability | active | always active |
| NFR-B3 Resilience | active | always active |
| NFR-B4 Information security | active | always active |
| NFR-B5 Data protection | active | always active |
| NFR-M1 Performance | **inactive** | No perceptible latency and no relevant data volume: the display computes purely locally from `Date.now()` and an embedded rule set; no network, storage or host call on the runtime path. |
| NFR-M2 Scalability | **inactive** | No variable load: exactly one badge per browser client; no server component, no concurrency. |
| NFR-M3 Usability/accessibility | **active** | End-user interface: the badge is visible UI in the DSH composer area. |
| NFR-M4 Compatibility/interoperability | **active** | Distributed as a bundle to third parties; depends on the DSH slot/theme API and on the client bundle loader. |
| NFR-M5 Compliance | **inactive** | No legal or industry-specific requirements beyond the base modules; no processing of personal data. |

Active quality areas: `NFR-B1`, `NFR-B2`, `NFR-B3`, `NFR-B4`, `NFR-B5`,
`NFR-M3`, `NFR-M4` — each with at least one quality scenario in
[qualitaetsszenarien.md](qualitaetsszenarien.md).

To be re-assessed when the product scope changes (e.g. live fetch of the pricing
page → M1/M4 re-assessed, or a server component → M2 re-assessed).

## 2. Roles

| Role | Person | Note |
|---|---|---|
| NFR owner | sternrassler | exactly one person; decides on exceptions |
| Quality owner NFR-B1/B2 (maintainability) | sternrassler | solo project |
| Quality owner NFR-B3 (resilience) | sternrassler | solo project |
| Quality owner NFR-B4 (information security) | sternrassler | solo project |
| Quality owner NFR-B5 (data protection) | sternrassler | solo project |
| Quality owner NFR-M3 (usability/accessibility) | sternrassler | solo project |
| Quality owner NFR-M4 (compatibility) | sternrassler | solo project |
| Implementation team | sternrassler, DSH agent (AI) | |
| Reviewer (merge gate, DoD) | sternrassler | checks against the Definition of Done |
| Operations | not applicable | no operated service; client UI without server or storage state |

So that a quality owner is named for every active area, the NFR owner carries the
area responsibility in this solo project; this is documented here (NFR
specification section 3.2).

## 3. Exceptions

Currently none. Exceptions are filed per requirement or check with
justification, owner, review date and, if applicable, a compensating measure,
under `docs/nfr/ausnahmen/` (to be created with the first exception); blanket
exceptions are not permitted.
