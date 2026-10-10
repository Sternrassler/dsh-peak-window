import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DEFAULT_HORIZON_DAYS,
  formatCountdown,
  nextTransition,
  state,
  validateRule,
} from '../lib/price-window.js';

const RULE = JSON.parse(readFileSync(new URL('../data/rule.json', import.meta.url), 'utf8'));

/** UTC instant; for hours 00–15 the UTC weekday matches the Beijing weekday. */
const utc = (year, month, day, hour, minute = 0) => Date.UTC(year, month - 1, day, hour, minute);

test('embedded rule is valid and documents its source', () => {
  const result = validateRule(RULE);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.match(RULE.holidays.source, /gov\.cn/);
  assert.ok(RULE.holidays.ranges.length > 0);
});

test('chosen test data falls on the expected weekday', () => {
  assert.equal(new Date(utc(2026, 10, 12, 2)).getUTCDay(), 1, '2026-10-12 must be a Monday');
  assert.equal(new Date(utc(2026, 10, 17, 2)).getUTCDay(), 6, '2026-10-17 must be a Saturday');
  assert.equal(new Date(utc(2026, 10, 5, 2)).getUTCDay(), 1, '2026-10-05 must be a Monday');
  assert.equal(new Date(utc(2026, 10, 16, 11)).getUTCDay(), 5, '2026-10-16 must be a Friday');
  assert.equal(new Date(utc(2026, 10, 8, 1)).getUTCDay(), 4, '2026-10-08 must be a Thursday');
});

test('PEAK windows in Beijing time', () => {
  assert.equal(state(utc(2026, 10, 12, 1, 0), RULE), 'PEAK', 'Mon 09:00 Beijing is PEAK (half-open start)');
  assert.equal(state(utc(2026, 10, 12, 2, 0), RULE), 'PEAK', 'Mon 10:00 Beijing is PEAK');
  assert.equal(state(utc(2026, 10, 12, 7, 0), RULE), 'PEAK', 'Mon 15:00 Beijing is PEAK');
});

test('window edges are half-open [start, end)', () => {
  assert.equal(state(utc(2026, 10, 12, 0, 59), RULE), 'OFF_PEAK', 'Mon 08:59 Beijing is OFF_PEAK');
  assert.equal(state(utc(2026, 10, 12, 4, 0), RULE), 'OFF_PEAK', 'Mon 12:00 Beijing is OFF_PEAK');
  assert.equal(state(utc(2026, 10, 12, 10, 0), RULE), 'OFF_PEAK', 'Mon 18:00 Beijing is OFF_PEAK');
});

test('midday gap between the windows', () => {
  assert.equal(state(utc(2026, 10, 12, 4, 30), RULE), 'OFF_PEAK', 'Mon 12:30 Beijing is OFF_PEAK');
});

test('weekend is OFF_PEAK all day', () => {
  assert.equal(state(utc(2026, 10, 17, 2, 0), RULE), 'OFF_PEAK', 'Sat 10:00 Beijing is OFF_PEAK');
  assert.equal(state(utc(2026, 10, 18, 2, 0), RULE), 'OFF_PEAK', 'Sun 10:00 Beijing is OFF_PEAK');
});

test('Chinese public holiday is OFF_PEAK all day', () => {
  assert.equal(state(utc(2026, 10, 5, 2, 0), RULE), 'OFF_PEAK', 'Mon 2026-10-05 (National Day) is OFF_PEAK');
  assert.equal(
    state(utc(2026, 2, 17, 2, 0), RULE),
    'OFF_PEAK',
    'Tue 2026-02-17 (Spring Festival) is OFF_PEAK',
  );
});

test('the rule time zone applies, not the client zone', () => {
  const instant = utc(2026, 10, 12, 2, 0);
  assert.equal(state(instant, RULE), 'PEAK');
  assert.equal(state(instant, { ...RULE, timeZone: 'UTC' }), 'OFF_PEAK');
  assert.equal(state(instant, { ...RULE, timeZone: 'America/New_York' }), 'OFF_PEAK');
});

test('next transition: start of a window', () => {
  const transition = nextTransition(utc(2026, 10, 12, 0, 59), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 1, 0));
  assert.equal(transition.next, 'PEAK');
});

test('next transition: end of a window before the midday gap', () => {
  const transition = nextTransition(utc(2026, 10, 12, 3, 30), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 4, 0));
  assert.equal(transition.next, 'OFF_PEAK');
});

test('next transition: end of the second window', () => {
  const transition = nextTransition(utc(2026, 10, 12, 9, 30), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 10, 0));
  assert.equal(transition.next, 'OFF_PEAK');
});

test('next transition: Friday evening skips the weekend', () => {
  const transition = nextTransition(utc(2026, 10, 16, 11, 0), RULE);
  assert.equal(transition.at, utc(2026, 10, 19, 1, 0), 'next PEAK is Monday 09:00 Beijing');
  assert.equal(transition.next, 'PEAK');
});

test('next transition: holiday Monday skips the holiday block', () => {
  const transition = nextTransition(utc(2026, 10, 5, 2, 0), RULE);
  assert.equal(transition.at, utc(2026, 10, 8, 1, 0), 'next PEAK is Thursday 09:00 Beijing');
  assert.equal(transition.next, 'PEAK');
});

test('transition search stays within the horizon and does not end without a match', () => {
  assert.ok(DEFAULT_HORIZON_DAYS >= 8);
  const transition = nextTransition(utc(2026, 10, 12, 2, 0), RULE);
  assert.ok(transition !== null);
  assert.equal(transition.from, 'PEAK');
});

test('countdown format', () => {
  assert.equal(formatCountdown(90 * 60_000, 'minute'), '1h 30m');
  assert.equal(formatCountdown(60 * 60_000, 'minute'), '1h 00m');
  assert.equal(formatCountdown(45_000, 'minute'), '00m');
  assert.equal(formatCountdown(45_000, 'second'), '0h 00m 45s');
  assert.equal(formatCountdown(3_661_000, 'second'), '1h 01m 01s');
  assert.equal(formatCountdown(-5, 'minute'), '00m');
});

test('validation reports concrete findings instead of silent fallbacks', () => {
  assert.equal(validateRule(null).ok, false);
  assert.deepEqual(validateRule(null).errors, ['rule: object expected']);

  const badWindow = validateRule({ ...RULE, peakWindows: [{ start: '12:00', end: '09:00' }] });
  assert.equal(badWindow.ok, false);
  assert.ok(badWindow.errors.some((error) => error.includes('peakWindows[0]')));

  const badClock = validateRule({ ...RULE, peakWindows: [{ start: '9:00', end: '12:00' }] });
  assert.equal(badClock.ok, false);
  assert.ok(badClock.errors.some((error) => error.includes('peakWindows[0].start')));

  const badZone = validateRule({ ...RULE, timeZone: 'Mars/Olympus' });
  assert.equal(badZone.ok, false);
  assert.ok(badZone.errors.some((error) => error.includes('unknown zone')));

  const badCountdown = validateRule({ ...RULE, countdown: 'hour' });
  assert.equal(badCountdown.ok, false);
  assert.ok(badCountdown.errors.some((error) => error.includes('countdown')));

  const badDate = validateRule({
    ...RULE,
    holidays: { source: 'x', ranges: [{ start: '2026-13-01', end: '2026-13-02' }] },
  });
  assert.equal(badDate.ok, false);
  assert.ok(badDate.errors.some((error) => error.includes('holidays.ranges[0].start')));

  const missingSource = validateRule({ ...RULE, holidays: { ranges: [] } });
  assert.equal(missingSource.ok, false);
  assert.ok(missingSource.errors.some((error) => error.includes('holidays.source')));

  const emptyWindows = validateRule({ ...RULE, peakWindows: [] });
  assert.equal(emptyWindows.ok, false);
  assert.ok(emptyWindows.errors.some((error) => error.includes('peakWindows')));
});
