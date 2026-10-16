/**
 * GENERATED FILE — do not edit directly.
 *
 * Sources: lib/client.template.js + lib/price-window.js + lib/model-scope.js
 * + data/rule.json
 * Build: npm run build:client   Verify: npm run check:client
 */
window.__ModuleLoader__.load({
  id: '@sternrassler/dsh-peak-window',
  factory(require) {
    const React = require('react');

    /**
 * Pure time logic for the DeepSeek PEAK/OFF_PEAK price windows.
 *
 * Authoritative rule: in Beijing time (Asia/Shanghai, UTC+8) Monday to Friday
 * 09:00–12:00 and 14:00–18:00 are PEAK, excluding Chinese public holidays;
 * everything else is OFF_PEAK, including weekends and holidays all day.
 * Source: https://api-docs.deepseek.com/quick_start/pricing/ (footnote 2).
 *
 * This module is the single source of the logic: the tests load it directly
 * and the build step embeds it into the self-contained `client.js` (the client
 * bundle loader does not allow relative requires).
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Default horizon, in local days, for the transition search. */
const DEFAULT_HORIZON_DAYS = 32;

const formatterCache = new Map();

function formatterFor(timeZone) {
  let formatter = formatterCache.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    });
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

/** Splits an instant into the wall-clock fields of the target zone. */
function zonedParts(instantMs, timeZone) {
  const fields = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(instantMs))) {
    fields[part.type] = part.value;
  }
  return {
    year: Number(fields.year),
    month: Number(fields.month),
    day: Number(fields.day),
    weekday: WEEKDAY_INDEX[fields.weekday],
    minutes: Number(fields.hour) * 60 + Number(fields.minute),
  };
}

function offsetMsAt(instantMs, timeZone) {
  const parts = zonedParts(instantMs, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
  );
  return asUtc - instantMs;
}

/** Target-zone wall-clock time -> absolute instant (two offset estimates). */
function zonedTimeToInstant(year, month, day, minutes, timeZone) {
  const wallAsUtc = Date.UTC(year, month - 1, day) + minutes * MS_PER_MINUTE;
  const firstGuess = wallAsUtc - offsetMsAt(wallAsUtc, timeZone);
  return wallAsUtc - offsetMsAt(firstGuess, timeZone);
}

function dayNumberForParts(parts) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY);
}

/** "HH:MM" -> minutes since midnight, or null. */
function parseClock(text) {
  if (typeof text !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  if (match === null) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** "YYYY-MM-DD" -> day number, or null for an invalid date. */
function dayNumberFromIso(text) {
  if (typeof text !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const asUtc = Date.UTC(year, month - 1, day);
  const check = new Date(asUtc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  return Math.floor(asUtc / MS_PER_DAY);
}

function holidayRanges(rule) {
  const ranges = rule?.holidays?.ranges;
  return Array.isArray(ranges) ? ranges : [];
}

function isHolidayDay(dayNumber, rule) {
  return holidayRanges(rule).some((range) => {
    const start = dayNumberFromIso(range?.start);
    const end = dayNumberFromIso(range?.end);
    return start !== null && end !== null && dayNumber >= start && dayNumber <= end;
  });
}

function isPeakTime(minutes, rule) {
  const windows = Array.isArray(rule?.peakWindows) ? rule.peakWindows : [];
  return windows.some((window) => {
    const start = parseClock(window?.start);
    const end = parseClock(window?.end);
    return start !== null && end !== null && minutes >= start && minutes < end;
  });
}

/** Weekday, holiday and windows -> state. */
function stateForParts(parts, rule) {
  const isWeekend = parts.weekday === 0 || parts.weekday === 6;
  if (rule.weekendOffPeak !== false && isWeekend) return 'OFF_PEAK';
  if (isHolidayDay(dayNumberForParts(parts), rule)) return 'OFF_PEAK';
  return isPeakTime(parts.minutes, rule) ? 'PEAK' : 'OFF_PEAK';
}

/**
 * Current price window.
 * @param {number} instantMs - Instant in milliseconds since the epoch.
 * @param {object} rule - Rule (timeZone, peakWindows, weekendOffPeak, holidays).
 * @returns {'PEAK'|'OFF_PEAK'}
 */
function state(instantMs, rule) {
  return stateForParts(zonedParts(instantMs, rule.timeZone), rule);
}

/** Boundary minutes of a local day: midnight and the window edges. */
function boundaryMinutes(year, month, day, timeZone, rule) {
  const noonProbe = zonedParts(zonedTimeToInstant(year, month, day, 12 * 60, timeZone), timeZone);
  const isWeekend = noonProbe.weekday === 0 || noonProbe.weekday === 6;
  const offAllDay =
    (rule.weekendOffPeak !== false && isWeekend) || isHolidayDay(dayNumberForParts(noonProbe), rule);
  const minutes = [0];
  if (offAllDay) return minutes;
  for (const window of Array.isArray(rule?.peakWindows) ? rule.peakWindows : []) {
    const start = parseClock(window?.start);
    const end = parseClock(window?.end);
    if (start !== null && end !== null) minutes.push(start, end);
  }
  return minutes;
}

/**
 * Next state transition after `instantMs`.
 * @returns {{at: number, from: string, next: string}|null}
 */
function nextTransition(instantMs, rule, options = {}) {
  const horizonDays = options.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const timeZone = rule.timeZone;
  const from = state(instantMs, rule);
  const start = zonedParts(instantMs, timeZone);
  const baseDayUtc = Date.UTC(start.year, start.month - 1, start.day);
  let best = null;
  for (let dayOffset = 0; dayOffset <= horizonDays; dayOffset += 1) {
    const date = new Date(baseDayUtc + dayOffset * MS_PER_DAY);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    for (const minute of boundaryMinutes(year, month, day, timeZone, rule)) {
      const at = zonedTimeToInstant(year, month, day, minute, timeZone);
      if (at <= instantMs) continue;
      const next = state(at + 1_000, rule);
      if (next === from) continue;
      if (best === null || at < best.at) best = { at, from, next };
    }
  }
  return best;
}

/**
 * Remaining duration as text.
 * @param {number} ms - Remaining duration in milliseconds.
 * @param {'minute'|'second'} [precision]
 * @returns {string}
 */
function formatCountdown(ms, precision = 'minute') {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, '0');
  if (precision === 'second') return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  return `${pad(minutes)}m`;
}

/**
 * Validates a rule and reports every finding (no silent fallbacks).
 * @param {object} rule - Rule to check.
 * @param {number} [nowUtc] - Instant used to judge expiry; defaults to the clock.
 * @returns {{ok: boolean, errors: string[]}}
 */
function validateRule(rule, nowUtc = Date.now()) {
  if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
    return { ok: false, errors: ['rule: object expected'] };
  }
  const errors = [];
  // Time zone first: the expiry check needs it, and an unusable zone must be
  // reported rather than thrown (an invalid zone otherwise crashes the check).
  const timeZoneUsable = (() => {
    if (typeof rule.timeZone !== 'string' || rule.timeZone.length === 0) {
      errors.push('timeZone: non-empty IANA name expected');
      return false;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: rule.timeZone });
      return true;
    } catch {
      errors.push(`timeZone: unknown zone "${rule.timeZone}"`);
      return false;
    }
  })();
  if (rule.validUntil !== undefined) {
    const validUntil = dayNumberFromIso(rule.validUntil);
    if (validUntil === null) {
      errors.push('validUntil: "YYYY-MM-DD" expected');
    } else if (timeZoneUsable && dayNumberForParts(zonedParts(nowUtc, rule.timeZone)) > validUntil) {
      errors.push(`holidays expired: maintained until ${rule.validUntil} — update data/rule.json`);
    }
  }
  if (!Array.isArray(rule.peakWindows) || rule.peakWindows.length === 0) {
    errors.push('peakWindows: non-empty list expected');
  } else {
    rule.peakWindows.forEach((window, index) => {
      const start = parseClock(window?.start);
      const end = parseClock(window?.end);
      if (start === null) errors.push(`peakWindows[${index}].start: "HH:MM" expected`);
      if (end === null) errors.push(`peakWindows[${index}].end: "HH:MM" expected`);
      if (start !== null && end !== null && end <= start) {
        errors.push(`peakWindows[${index}]: end must come after start`);
      }
    });
  }
  if (rule.weekendOffPeak !== undefined && typeof rule.weekendOffPeak !== 'boolean') {
    errors.push('weekendOffPeak: boolean expected');
  }
  if (rule.countdown !== undefined && rule.countdown !== 'minute' && rule.countdown !== 'second') {
    errors.push('countdown: "minute" or "second" expected');
  }
  const holidays = rule.holidays;
  if (holidays !== undefined) {
    if (holidays === null || typeof holidays !== 'object' || Array.isArray(holidays)) {
      errors.push('holidays: object with source and ranges expected');
    } else {
      if (typeof holidays.source !== 'string' || holidays.source.length === 0) {
        errors.push('holidays.source: source expected');
      }
      if (!Array.isArray(holidays.ranges)) {
        errors.push('holidays.ranges: list expected');
      } else {
        holidays.ranges.forEach((range, index) => {
          const start = dayNumberFromIso(range?.start);
          const end = dayNumberFromIso(range?.end);
          if (start === null) errors.push(`holidays.ranges[${index}].start: "YYYY-MM-DD" expected`);
          if (end === null) errors.push(`holidays.ranges[${index}].end: "YYYY-MM-DD" expected`);
          if (start !== null && end !== null && end < start) {
            errors.push(`holidays.ranges[${index}]: end is before start`);
          }
        });
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

    /**
 * Decides whether the DeepSeek price window applies to the model that is
 * currently selected in the session — pure logic, no DOM and no DSH dependency.
 *
 * The badge is rendered only when the current selection identifies a DeepSeek
 * model that is not known to be unavailable.
 * Since the `codex` route can be mounted next to the DeepSeek routes, rendering
 * the badge for another provider could claim a price window that does not apply.
 * The caller uses `applies` to hide the badge until a valid DeepSeek model is
 * active.
 *
 * Input is the snapshot of the session's model directory
 * (`ctx.modelDirectories.directoryFor(sessionId).store`), whose fields this
 * module treats as untrusted:
 *
 *   { current: { provider, model } | null, routable: boolean | null }
 *
 * `routable` is only ever `true` or `false` once the catalog is loaded and the
 * session projection is resolved; it stays `null` while loading. A `null`
 * snapshot therefore means "not resolved yet" and must not be treated as applicable.
 */

/**
 * Provider prefixes that denote a DeepSeek route.
 *
 * The harness registers two of them: `deepseek-account` (subscription) and
 * `deepseek-official` (API key). The prefix also covers future variants such as
 * `deepseek-v99-enterprise`. The match requires a prefix boundary: either the
 * id reads exactly `deepseek`, or a hyphen follows. That keeps `my-deepseek-proxy`
 * and `deepseekx` out — they are different providers and must not silently
 * inherit the price window.
 */
const DEEPSEEK_PROVIDER_PREFIXES = ['deepseek'];

/**
 * @param {unknown} value - candidate provider id.
 * @returns {string} trimmed provider id, or `''` when it is not a usable string.
 */
function providerId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {string} provider - trimmed provider id.
 * @param {readonly string[]} prefixes - accepted prefixes.
 * @returns {boolean} whether the provider names a DeepSeek route.
 */
function matchesPrefix(provider, prefixes) {
  if (provider === '') return false;
  const lowered = provider.toLowerCase();
  return prefixes.some((prefix) => {
    if (typeof prefix !== 'string') return false;
    const normalized = prefix.trim().toLowerCase();
    if (normalized === '') return false;
    return lowered === normalized || lowered.startsWith(`${normalized}-`);
  });
}

/**
 * Classifies the active model against the price window.
 *
 * @param {{ current?: { provider?: unknown, model?: unknown } | null, routable?: unknown }} [snapshot]
 *   - model directory snapshot (fields are validated, not trusted).
 * @param {{ prefixes?: readonly string[] }} [options]
 *   - `prefixes` overrides the accepted DeepSeek prefixes.
 * @returns {{ provider: string, deepseek: boolean, applies: boolean | null, status: 'applicable' | 'other-provider' | 'unavailable' | 'neutral' }}
 *   `applies` is `null` while the answer is not derivable yet.
 */
function computeModelScope(snapshot = {}, options = {}) {
  const prefixes = options.prefixes === undefined ? DEEPSEEK_PROVIDER_PREFIXES : options.prefixes;
  const provider = providerId(snapshot?.current?.provider);

  if (provider === '') {
    return { provider: '', deepseek: false, applies: null, status: 'neutral' };
  }

  const deepseek = matchesPrefix(provider, prefixes);

  if (!deepseek) {
    return {
      provider,
      deepseek: false,
      applies: false,
      status: 'other-provider',
    };
  }

  if (snapshot.routable === false) {
    return {
      provider,
      deepseek: true,
      applies: null,
      status: 'unavailable',
    };
  }

  return { provider, deepseek: true, applies: true, status: 'applicable' };
}

    const RULE = {
  "$comment": "Static rule for the DeepSeek price windows. Changes here require `npm run build:client`. Authoritative source for the time windows: https://api-docs.deepseek.com/quick_start/pricing/ (footnote 2).",
  "timeZone": "Asia/Shanghai",
  "peakWindows": [
    {
      "start": "09:00",
      "end": "12:00"
    },
    {
      "start": "14:00",
      "end": "18:00"
    }
  ],
  "weekendOffPeak": true,
  "countdown": "minute",
  "validUntil": "2026-12-31",
  "holidays": {
    "source": "国务院办公厅关于2026年部分节假日安排的通知, 国办发明电〔2025〕7号, 2025-11-04, https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
    "note": "Bereiche inklusive. Wochenendtage in den Bereichen sind ohnehin OFF_PEAK; 调休-Arbeitstage sind Wochenenden und daher ebenfalls OFF_PEAK.",
    "ranges": [
      {
        "start": "2026-01-01",
        "end": "2026-01-03"
      },
      {
        "start": "2026-02-15",
        "end": "2026-02-23"
      },
      {
        "start": "2026-04-04",
        "end": "2026-04-06"
      },
      {
        "start": "2026-05-01",
        "end": "2026-05-05"
      },
      {
        "start": "2026-06-19",
        "end": "2026-06-21"
      },
      {
        "start": "2026-09-25",
        "end": "2026-09-27"
      },
      {
        "start": "2026-10-01",
        "end": "2026-10-07"
      }
    ]
  }
};
    const TITLE = 'DeepSeek price window';
    const REFRESH_MS = 30_000;

    function useNow() {
      const [now, setNow] = React.useState(() => Date.now());
      React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), REFRESH_MS);
        return () => clearInterval(interval);
      }, []);
      React.useEffect(() => {
        const transition = nextTransition(now, RULE);
        if (transition === null) return undefined;
        const delay = Math.min(Math.max(transition.at - Date.now(), 0) + 250, 2_147_483_000);
        const timeout = setTimeout(() => setNow(Date.now()), delay);
        return () => clearTimeout(timeout);
      }, [now]);
      return now;
    }

    function ErrorBadge({ errors }) {
      const message = `${TITLE}: invalid rule — ${errors[0]}`;
      return React.createElement('div', {
        role: 'status',
        'aria-label': message,
        title: message,
        style: { fontSize: '11px', lineHeight: '1.4', padding: '2px 0', color: 'var(--dsw-alias-state-warn-primary)' },
      }, message);
    }

    function Badge({ modelState }) {
      const now = useNow();
      // `modelState` is the session's model-directory store; subscribing keeps
      // the badge in step when the model is switched mid-session.
      const modelSnapshot = React.useSyncExternalStore(
        (onChange) => modelState.subscribe(onChange),
        () => modelState.getSnapshot(),
      );
      const scope = computeModelScope(modelSnapshot);
      if (scope.applies !== true) return null;

      const validation = validateRule(RULE);
      if (!validation.ok) return React.createElement(ErrorBadge, { errors: validation.errors });

      const current = state(now, RULE);
      const stateColor = current === 'PEAK'
        ? 'var(--dsw-alias-state-error-primary)'
        : 'var(--dsw-alias-state-success-primary)';
      const transition = nextTransition(now, RULE);
      const countdown = transition === null ? '' : formatCountdown(transition.at - now, RULE.countdown);
      const accessibleName = transition === null
        ? `${TITLE}: ${current} (${RULE.timeZone})`
        : `${TITLE}: ${current}, switching to ${transition.next} in ${countdown} (${RULE.timeZone})`;

      const children = [
        React.createElement('span', {
          key: 'dot',
          'aria-hidden': true,
          style: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stateColor,
            flex: '0 0 auto',
          },
        }),
        React.createElement('span', {
          key: 'label',
          style: { fontWeight: 600, letterSpacing: '0.04em', color: stateColor },
        }, current),
      ];
      if (transition !== null) {
        children.push(React.createElement('span', {
          key: 'countdown',
          style: { whiteSpace: 'nowrap' },
        }, `→ ${transition.next} in ${countdown}`));
      }
      return React.createElement('div', {
        role: 'status',
        'aria-label': accessibleName,
        title: accessibleName,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 0',
          fontSize: '11px',
          lineHeight: '1.4',
          color: 'var(--dsw-alias-label-secondary)',
          userSelect: 'none',
        },
      }, children);
    }

    return {
      // `modelDirectories` only exists when the harness model-selection plugin
      // is mounted; without it no session model can be resolved, so the badge
      // does not register at all instead of guessing a provider.
      inject: ['slots', 'modelDirectories'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: '@sternrassler/dsh-peak-window',
          order: 20,
          label: 'DeepSeek PEAK/OFF_PEAK',
          inject: (sessionId) => {
            const directory = ctx.modelDirectories.directoryFor(sessionId);
            // Loading the directory also resolves the selection of a session
            // that has not been opened through the model picker yet.
            directory.load().catch(() => {});
            return { modelState: directory.store };
          },
        }, Badge));
      },
    };
  },
});
