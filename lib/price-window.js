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
export const DEFAULT_HORIZON_DAYS = 32;

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
export function state(instantMs, rule) {
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
export function nextTransition(instantMs, rule, options = {}) {
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
export function formatCountdown(ms, precision = 'minute') {
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
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateRule(rule) {
  if (rule === null || typeof rule !== 'object' || Array.isArray(rule)) {
    return { ok: false, errors: ['rule: object expected'] };
  }
  const errors = [];
  if (typeof rule.timeZone !== 'string' || rule.timeZone.length === 0) {
    errors.push('timeZone: non-empty IANA name expected');
  } else {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: rule.timeZone });
    } catch {
      errors.push(`timeZone: unknown zone "${rule.timeZone}"`);
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
