# Specification — DeepSeek PEAK/OFF-PEAK status (DSH plugin)

| Field | Value |
|---|---|
| Status | Accepted (owner decision 2026-10-11); implemented and published as `1.0.2` |
| Date | 2026-10-10 (status corrected 2026-10-11) |
| Package name | `@sternrassler/dsh-peak-window` |
| Target platform | DSH web UI (client plugin, Cordis bundle) |
| Affiliation | Unofficial community plugin; not affiliated with DeepSeek |

**Status record (2026-10-11):** the row above read *"Draft, pending approval"*
while the package was already implemented and published. The owner's explicit
instruction to publish, plus the tracked release run
([38079733589](https://github.com/Sternrassler/dsh-peak-window/actions/runs/38079733589),
green) and the public version `1.0.2` on npm, are the observable basis for
"Accepted". The acceptance covers this specification: the implementation follows
§3 and deviates only where §4.1 documents it. It says nothing about the NFR
criteria — those carry their own evidence in
[`docs/nfr/nachweise/`](nfr/nachweise/), per the NFR rule that an included
requirement is not evidence of its fulfilment. Delivery was **not** approved by
this specification (§6); it rests on the owner's explicit decision.

**Naming rationale:** the package name deliberately avoids a third-party mark as
its distinctive element. `@sternrassler` is the origin (see the brand manual in
the cooperated-design repository); the package part describes the function. The
name "DeepSeek" appears only descriptively in this specification, in the README,
in `description` and in the keywords — it names the pricing scheme whose windows
the plugin displays, and does not claim any affiliation.

## 1. Purpose and target picture

In the DSH status line **below the prompt input** the plugin continuously shows
whether the **PEAK** or **OFF_PEAK** period of the DeepSeek API pricing table
currently applies, including a countdown to the next change.

- **PEAK** → red, **OFF_PEAK** → green.
- Exactly two states; no prices, no model selection.
- Time shift China ↔ client: the rule applies in **Beijing time**
  (Asia/Shanghai, UTC+8, no daylight saving). The client converts its local time
  to Beijing time automatically.

## 2. Normative sources

1. **Domain rule** (authoritative): DeepSeek API Docs, "Models & Pricing",
   <https://api-docs.deepseek.com/quick_start/pricing/> (as of 2026-10-10).
   Footnote (2) says in substance:

   > OFF_PEAK costs half of PEAK. Beijing time Mon–Fri
   > **09:00–12:00 and 14:00–18:00** (excluding Chinese public holidays) is PEAK;
   > all other times — including weekends and Chinese public holidays all day —
   > are OFF_PEAK.

   The English page expresses the same windows in UTC
   (01:00–04:00 and 06:00–10:00 UTC); identical in substance.

2. **NFR**: NFR specification package v1.0 (reference state 2026-10-10).
   Mode **new project**.

## 3. Domain requirements

### 3.1 Evaluation rule (function `state(nowUtc, config)`)

Given a UTC instant `now` and the config:

1. Convert `now` into the target time zone `config.timeZone` (default
   `Asia/Shanghai`). Determine the local date, weekday and time of day there.
2. **Weekend** (Sat/Sun) → `OFF_PEAK` (when `config.weekendOffPeak === true`).
3. **Holiday** (local date inside a range in `config.holidays`)
   → `OFF_PEAK` (all day).
4. Otherwise: time of day inside a PEAK window → `PEAK`, otherwise `OFF_PEAK`.

**Window semantics:** half-open `[start, end)`. `09:00` counts as PEAK,
`12:00` and `18:00` already count as OFF_PEAK.

**Countdown:** the next state transition is determined from a sorted list of
upcoming boundary events (window start/end, holiday start 00:00, holiday end
00:00, Monday 00:00 after a weekend) over a horizon of ≥ 31 days. The remaining
duration until the first event whose resulting state differs from the current one
is displayed.

### 3.2 Time shift

- Always evaluate against the **target time zone**, never against the client zone.
- Implemented via `Intl.DateTimeFormat(..., { timeZone })` or equivalent IANA
  time zone logic — no manual offset, no assumption about the client zone's DST.
  `Asia/Shanghai` is UTC+8 without DST; `Intl` remains the robust choice so that
  other target zones are correct too.

### 3.3 Holidays

- Chinese public holidays come from the config (static, no network request).
- Date ranges inclusive, format `YYYY-MM-DD`.
- `config.holidays === []` explicitly means "holiday exception disabled"
  (Mon–Fri windows only). That is defined, but **not** a silent fallback: the
  meaning is stated in the README and the config schema.
- Defaults are maintained from the official announcement (State Council of
  China, 国务院办公厅) and documented in the repository with source + date.
  Maintenance is a recurring task, not a runtime fetch.

### 3.4 Display

- State badge: colour dot + text label `PEAK` (red) or `OFF_PEAK` (green).
- Countdown: `→ PEAK in 3h 02m`.
- `config.countdown` = `"minute"` (default) or `"second"`.
- Accessibility: the state is recognisable **not only** through colour (text
  label); additionally `aria-label`/`title`, e.g.
  `DeepSeek price window: PEAK, switching to OFF_PEAK in 1h 23m (Asia/Shanghai)`.

### 3.5 Refresh

- Computation on mount, then periodically (`setInterval` 30 s) **and** an exact
  `setTimeout` to the next boundary for a precise state flip.
- Countdown accuracy "minute": recomputation at least every minute (the 30 s
  interval covers that); "second": interval 1 s.

## 4. Technical classification

- **Slot:** `conversation.composer.dock` (list slot, "ambient entries below the
  composer card", scope `session`). Registration: `id`, `order`, `label`.
- **Plugin type:** client UI plugin (Cordis bundle, template
  `cordis-plugin-development` → `templates/decoration/`).
- **Theming:** state colours via theme tokens
  `--dsw-alias-state-success-primary` (green) and
  `--dsw-alias-state-error-primary` (red); neutral surfaces/text via
  `--dsw-alias-bg-layer-1`, `--dsw-alias-label-secondary`,
  `--dsw-alias-border-l1`. No hard-coded colours; light/dark comes from the
  theme.
- **No network, storage or host dependency** on the runtime path: pure time
  computation in the client.

### 4.1 Rule data (implemented)

The rule lives as maintained JSON in `data/rule.json` and is embedded into the
self-contained `client.js` at build time.

```jsonc
{
  "timeZone": "Asia/Shanghai",                                  // IANA target time zone
  "peakWindows": [{ "start": "09:00", "end": "12:00" },          // half-open, in timeZone
                  { "start": "14:00", "end": "18:00" }],
  "weekendOffPeak": true,                                        // Sat/Sun always OFF_PEAK
  "countdown": "minute",                                         // "minute" | "second"
  "holidays": {                                                  // inclusive date ranges
    "source": "… e.g. 国办发明电〔2025〕7号 …",
    "ranges": [{ "start": "2026-10-01", "end": "2026-10-07" }]
  }
}
```

**Deviation from the original design (justified):** the plan was to keep the rule
as the `config` of the bundle line in `cordis.patch.yml`. The harness
demonstrably delivers line config only to the host half (`ui-settings-general`
reads it in `lib/index.js`); the client half does not receive it. Since the
display lives entirely in the client, the settings therefore live as editable
JSON in `data/rule.json`, which is embedded into the artifact by
`npm run build:client`. The check `npm run check:client` keeps artifact and
source in sync (no silent deviation).

## 5. NFR — risk profile, roles, quality scenarios

### 5.1 Risk profile

| Module | Status | Justification |
|---|---|---|
| NFR-B1 Clean code | active | always active |
| NFR-B2 Maintainability | active | always active |
| NFR-B3 Resilience | active | always active |
| NFR-B4 Information security | active | always active |
| NFR-B5 Data protection | active | always active |
| NFR-M1 Performance | **inactive** | pure local time computation, no perceptible latency, no data volume |
| NFR-M2 Scalability | **inactive** | one badge per client, no variable load |
| NFR-M3 Usability/accessibility | **active** | end-user interface (badge) |
| NFR-M4 Compatibility/interoperability | **active** | distributed bundle, depends on the DSH slot/theme/config API |
| NFR-M5 Compliance | **inactive** | no legal or industry-specific requirements |

### 5.2 Roles

| Role | Person | Note |
|---|---|---|
| NFR owner | sternrassler | exactly one person |
| Quality owner (all active areas) | sternrassler | solo → carried in a documented way |
| Implementation team | sternrassler + DSH agent | |
| Reviewer | sternrassler | DoD check in the merge gate |
| Operations | N/A | no operated service (client UI) |

### 5.3 Quality scenarios (summary)

| Identifier | Goal | Metric | Threshold | Measurement | Gate |
|---|---|---|---|---|---|
| NFR-B1/2-1 | comprehensibility without a verbal handover | open "unclear" findings (§5.4) | = 0 | code review against the criteria list (§5.4) | Merge |
| NFR-B3-1 | defined state on an invalid config | config validation tests | 0 failures | unit tests | Fast+Merge |
| NFR-B3-2 | correct boundary/time zone logic | time logic tests (cases in §3.1) | 0 failures | unit tests | Merge |
| NFR-B4-1 | no secrets, no critical findings | secret/SAST/dependency scan | 0 secrets, 0 critical/high, 0 exploitable gaps | CI scans | Fast+Merge |
| NFR-B5-1 | no personal data | confirmed data flows | = 0 | review + static check (no fetch/XHR/storage) | Merge |
| NFR-M3-1 | state not by colour alone, contrast | accessibility/contrast violations | = 0 | artifact test + visual check light/dark | Merge+Release |
| NFR-M4-1 | bundle registers cleanly | slot registration + console errors | 0 failures | install_bundle + cordis_inspect_query + visual check | Release |

### 5.4 Review scenario NFR-B1/2-1 (explicit criteria)

Readability and clean code cannot be measured automatically. The "threshold" is
therefore the fulfilment of the following criteria in the review (NFR
specification §5.5). An **"unclear" finding** is any place a person **without a
verbal handover** does not understand, or whose intent they can only guess.

**Criteria (to be checked per finding):**

| # | Criterion | Finding if … |
|---|---|---|
| 1 | Purpose recognisable | name/function does not reveal what the unit does |
| 2 | Responsibility clear | a unit visibly handles several unrelated things |
| 3 | Contract explicit | input/output or error case is not recognisable (`state`, `nextTransition`, `validateConfig`) |
| 4 | Edge case justified | `[start, end)` semantics or holiday/weekend logic is not explained |
| 5 | Number/text derivable | 09:00/12:00/14:00/18:00 or config defaults sit in the code without a reference to the source |
| 6 | No personal dependency | knowledge like "only the author knows" is not documented in the repository |
| 7 | Docs up to date | README/config schema contradicts the behaviour |

**Counting rule:**

- **Trigger:** review before the merge, or a person getting up to speed.
- **Metric:** number of open, unfixed "unclear" findings.
- **Threshold:** `= 0` open findings; every finding is fixed **or** filed as a
  documented exception with owner and review date (NFR §8).
- **Evidence:** findings list in the evidence record (checked version, number of
  findings, status). With a solo implementation the reviewer checks the list
  against the code, not against their own memory.
- **Owner:** NFR owner (sternrassler) · **Gate:** Merge.

## 6. Boundaries

- **No** price/cost display, no model selection, no Flash/v4-pro comparison.
- **No** live fetch of the pricing page (the page is HTML without an API
  contract; rule and holidays are config data).
- **No** handling of "调休" (shifted working days): the rule only distinguishes
  Mon–Fri vs. weekend vs. holiday.
- Delivery (push/PR/publish of the bundle) is **not** approved by this
  specification; the implementation needs its own approval.
