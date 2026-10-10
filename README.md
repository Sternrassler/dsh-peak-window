# @sternrassler/dsh-peak-window

DSH client plugin: shows the current DeepSeek price window together with a
countdown to the next change, in the status line **below the prompt input**.

> **Unofficial.** This is an independent community plugin. It is not affiliated
> with, endorsed by or maintained by DeepSeek. "DeepSeek" is used descriptively
> to name the pricing scheme this plugin displays.

```
OFF_PEAK  → PEAK in 2h 14m
   ^green
PEAK      → OFF_PEAK in 0h 47m
   ^red
```

## Pricing rule

The authoritative source is the DeepSeek pricing page, footnote (2):
<https://api-docs.deepseek.com/quick_start/pricing/>

> **PEAK** is Beijing time (UTC+8) Monday to Friday **09:00–12:00** and
> **14:00–18:00**, **excluding Chinese public holidays**.
> **OFF_PEAK** is everything else — including weekends and Chinese public
> holidays all day.

Details: windows are half-open `[start, end)`; `12:00` and `18:00` are already
OFF_PEAK. The display always converts to Beijing time, regardless of the
client's time zone.

## Installation

The plugin is a Cordis bundle. Install it into a profile through the harness
plugin manager (`install_bundle` with this package directory) — not by writing
profile files by hand.

After installation the badge appears below the composer; the profile patch line
reads:

```yaml
- insert:
    - id: deepseek-price-window
      name: '@sternrassler/dsh-peak-window'
```

## Maintaining the rule and the holidays

All time data lives in **[data/rule.json](data/rule.json)** — the pricing page is
never fetched at runtime (it is HTML without an API contract).

```json
{
  "timeZone": "Asia/Shanghai",
  "peakWindows": [
    { "start": "09:00", "end": "12:00" },
    { "start": "14:00", "end": "18:00" }
  ],
  "weekendOffPeak": true,
  "countdown": "minute"
}
```

Regenerate the embedded artifact after every change:

```bash
npm run build:client   # writes client.js
npm run check          # checks artifact, lint, format and tests
```

### Holidays

`data/rule.json` → `holidays.ranges` holds the Chinese public holidays as
inclusive date ranges, with `holidays.source` as the source.

- **Maintenance:** yearly, as soon as the State Council of China
  (国务院办公厅) publishes the holiday schedule for the following year (usually
  in November). Owner: NFR owner.
- **Current state:** 2026, source
  [国办发明电〔2025〕7号](https://www.gov.cn/zhengce/content/202511/content_7047090.htm)
  (2025-11-04).
- For **2027** no announcement exists yet; until then the block is missing and
  the holiday exception does not apply to 2027.
- **Important:** if `holidays.ranges` is empty, the holiday exception is
  explicitly disabled (Monday–Friday windows only). That is defined behaviour
  but wrong on holidays — the list must be maintained before a release.

**Expiry is signalled, not silent.** `validUntil` (top level in
`data/rule.json`) names the last local day, **in the rule's time zone**, that the
maintained holiday data covers. From the following day on, `validateRule`
reports a finding and the badge shows the error state instead of a PEAK/OFF_PEAK
value — because without current holiday data the module would report PEAK during
a holiday peak window. The field is deliberately not required: a rule without it
enforces nothing, so the value should be maintained together with the list.

`调休` (shifted working days) needs no special handling: the rule only
distinguishes Monday–Friday, weekend and holiday; shifted working days are
weekends and therefore OFF_PEAK anyway.

## Releases

Releases are published from CI through **trusted publishing (OIDC)** — no npm
token is stored in this repository or in any secret. The workflow is
[.github/workflows/publish.yml](.github/workflows/publish.yml):

1. bump `version` in `package.json` and merge it (gates run as usual)
2. tag it: `git tag -a v1.0.1 -m "v1.0.1" && git push origin v1.0.1`
3. the tag starts the workflow, which runs the checks and waits for approval in
   the protected `release` environment
4. after approval it publishes, then verifies the version is retrievable

The tag itself is protected: it cannot be moved or deleted without an explicit
admin bypass. A manual run of the workflow (`workflow_dispatch`) performs the
checks and packages the tarball without publishing.

Trusted publishing is configured on npmjs.com for this package; without that
configuration a publish is refused. It requires npm CLI ≥ 11.5.1 and Node ≥ 22.14
on a GitHub-hosted runner — the workflow checks the npm version before publishing.

## Development

```bash
npm run check          # fast gate: artifact, lint, format, tests
npm run check:links    # relative links and anchors in the Markdown
npm run test           # tests only (node:test)
npm run lint           # ESLint
npm run format:check   # Prettier
npm run deps           # npm audit
```

### Layout

| Path | Role |
|---|---|
| [lib/price-window.js](lib/price-window.js) | Pure time logic; single source, tested directly |
| [lib/client.template.js](lib/client.template.js) | UI template with placeholders (not a standalone module) |
| [data/rule.json](data/rule.json) | Time rule and holidays (maintained data) |
| [client.js](client.js) | **Generated** self-contained client bundle |
| [scripts/build-client.mjs](scripts/build-client.mjs) | Builds `client.js` reproducibly |
| [test/](test/) | Unit tests of the logic plus artifact guards |
| [index.js](index.js) | Host half (inert) |

`client.js` is generated because the DSH client bundle loader **does not allow
relative requires**. The logic is therefore embedded instead of imported; the
template is not a runnable module and is excluded from lint/Prettier.

## Known limitations

- **No live fetch** of the pricing page: if DeepSeek changes the windows,
  `data/rule.json` has to follow.
- **No runtime configuration through `cordis.patch.yml`:** per the harness, the
  config of a bundle line only reaches the host half; the client half does not
  receive it. The settings therefore live as data in `data/rule.json` (a JSON
  file, not code) and are embedded at build time.
- **No localization:** the labels `PEAK`/`OFF_PEAK` are domain terms independent
  of language. All other user-facing text is English.
- Colours come exclusively from theme tokens
  (`--dsw-alias-state-success-primary`, `--dsw-alias-state-error-primary`); the
  state is additionally exposed as text and in `aria-label`.

## Non-functional requirements

Project rules: [AGENTS.md](AGENTS.md#nichtfunktionale-anforderungen) ·
Risk profile: [docs/nfr/risikoprofil.md](docs/nfr/risikoprofil.md) ·
Scenarios: [docs/nfr/qualitaetsszenarien.md](docs/nfr/qualitaetsszenarien.md) ·
Evidence: [docs/nfr/nachweise/](docs/nfr/nachweise/) ·
Definition of Done: [docs/definition-of-done.md](docs/definition-of-done.md).

## License

MIT
