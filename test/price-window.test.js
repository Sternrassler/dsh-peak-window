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

/** UTC-Zeitpunkt; bei Stunden 00–15 entspricht der UTC-Wochentag dem Beijing-Wochentag. */
const utc = (year, month, day, hour, minute = 0) => Date.UTC(year, month - 1, day, hour, minute);

test('eingebaute Regel ist gültig und dokumentiert ihre Quelle', () => {
  const result = validateRule(RULE);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.match(RULE.holidays.source, /gov\.cn/);
  assert.ok(RULE.holidays.ranges.length > 0);
});

test('gewählte Testdaten liegen am erwarteten Wochentag', () => {
  assert.equal(new Date(utc(2026, 10, 12, 2)).getUTCDay(), 1, '12.10.2026 muss Montag sein');
  assert.equal(new Date(utc(2026, 10, 17, 2)).getUTCDay(), 6, '17.10.2026 muss Samstag sein');
  assert.equal(new Date(utc(2026, 10, 5, 2)).getUTCDay(), 1, '05.10.2026 muss Montag sein');
  assert.equal(new Date(utc(2026, 10, 16, 11)).getUTCDay(), 5, '16.10.2026 muss Freitag sein');
  assert.equal(new Date(utc(2026, 10, 8, 1)).getUTCDay(), 4, '08.10.2026 muss Donnerstag sein');
});

test('PEAK-Fenster in Beijing-Zeit', () => {
  assert.equal(state(utc(2026, 10, 12, 1, 0), RULE), 'PEAK', 'Mo 09:00 Beijing ist PEAK (halboffener Start)');
  assert.equal(state(utc(2026, 10, 12, 2, 0), RULE), 'PEAK', 'Mo 10:00 Beijing ist PEAK');
  assert.equal(state(utc(2026, 10, 12, 7, 0), RULE), 'PEAK', 'Mo 15:00 Beijing ist PEAK');
});

test('Fenstergrenzen sind halboffen [start, ende)', () => {
  assert.equal(state(utc(2026, 10, 12, 0, 59), RULE), 'OFF_PEAK', 'Mo 08:59 Beijing ist OFF_PEAK');
  assert.equal(state(utc(2026, 10, 12, 4, 0), RULE), 'OFF_PEAK', 'Mo 12:00 Beijing ist OFF_PEAK');
  assert.equal(state(utc(2026, 10, 12, 10, 0), RULE), 'OFF_PEAK', 'Mo 18:00 Beijing ist OFF_PEAK');
});

test('Mittagslücke zwischen den Fenstern', () => {
  assert.equal(state(utc(2026, 10, 12, 4, 30), RULE), 'OFF_PEAK', 'Mo 12:30 Beijing ist OFF_PEAK');
});

test('Wochenende ist ganz OFF_PEAK', () => {
  assert.equal(state(utc(2026, 10, 17, 2, 0), RULE), 'OFF_PEAK', 'Sa 10:00 Beijing ist OFF_PEAK');
  assert.equal(state(utc(2026, 10, 18, 2, 0), RULE), 'OFF_PEAK', 'So 10:00 Beijing ist OFF_PEAK');
});

test('chinesischer Feiertag ist ganz OFF_PEAK', () => {
  assert.equal(
    state(utc(2026, 10, 5, 2, 0), RULE),
    'OFF_PEAK',
    'Mo 05.10.2026 (Nationalfeiertag) ist OFF_PEAK',
  );
  assert.equal(state(utc(2026, 2, 17, 2, 0), RULE), 'OFF_PEAK', 'Di 17.02.2026 (Frühlingsfest) ist OFF_PEAK');
});

test('Zeitzone wird angewendet, nicht die Client-Zone', () => {
  const instant = utc(2026, 10, 12, 2, 0);
  assert.equal(state(instant, RULE), 'PEAK');
  assert.equal(state(instant, { ...RULE, timeZone: 'UTC' }), 'OFF_PEAK');
  assert.equal(state(instant, { ...RULE, timeZone: 'America/New_York' }), 'OFF_PEAK');
});

test('nächster Wechsel: Fensteranfang', () => {
  const transition = nextTransition(utc(2026, 10, 12, 0, 59), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 1, 0));
  assert.equal(transition.next, 'PEAK');
});

test('nächster Wechsel: Fensterende vor der Mittagslücke', () => {
  const transition = nextTransition(utc(2026, 10, 12, 3, 30), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 4, 0));
  assert.equal(transition.next, 'OFF_PEAK');
});

test('nächster Wechsel: Tagesende des zweiten Fensters', () => {
  const transition = nextTransition(utc(2026, 10, 12, 9, 30), RULE);
  assert.equal(transition.at, utc(2026, 10, 12, 10, 0));
  assert.equal(transition.next, 'OFF_PEAK');
});

test('nächster Wechsel: Freitagabend springt über das Wochenende', () => {
  const transition = nextTransition(utc(2026, 10, 16, 11, 0), RULE);
  assert.equal(transition.at, utc(2026, 10, 19, 1, 0), 'nächster PEAK ist Montag 09:00 Beijing');
  assert.equal(transition.next, 'PEAK');
});

test('nächster Wechsel: Feiertagsmontag springt über den Feiertagsblock', () => {
  const transition = nextTransition(utc(2026, 10, 5, 2, 0), RULE);
  assert.equal(transition.at, utc(2026, 10, 8, 1, 0), 'nächster PEAK ist Donnerstag 09:00 Beijing');
  assert.equal(transition.next, 'PEAK');
});

test('Wechselsuche bleibt im Horizont und endet ohne Treffer nicht', () => {
  assert.ok(DEFAULT_HORIZON_DAYS >= 8);
  const transition = nextTransition(utc(2026, 10, 12, 2, 0), RULE);
  assert.ok(transition !== null);
  assert.equal(transition.from, 'PEAK');
});

test('Countdown-Format', () => {
  assert.equal(formatCountdown(90 * 60_000, 'minute'), '1h 30m');
  assert.equal(formatCountdown(60 * 60_000, 'minute'), '1h 00m');
  assert.equal(formatCountdown(45_000, 'minute'), '00m');
  assert.equal(formatCountdown(45_000, 'second'), '0h 00m 45s');
  assert.equal(formatCountdown(3_661_000, 'second'), '1h 01m 01s');
  assert.equal(formatCountdown(-5, 'minute'), '00m');
});

test('Validierung meldet konkrete Befunde statt stiller Ersatzwerte', () => {
  assert.equal(validateRule(null).ok, false);
  assert.deepEqual(validateRule(null).errors, ['rule: Objekt erwartet']);

  const badWindow = validateRule({ ...RULE, peakWindows: [{ start: '12:00', end: '09:00' }] });
  assert.equal(badWindow.ok, false);
  assert.ok(badWindow.errors.some((error) => error.includes('peakWindows[0]')));

  const badClock = validateRule({ ...RULE, peakWindows: [{ start: '9:00', end: '12:00' }] });
  assert.equal(badClock.ok, false);
  assert.ok(badClock.errors.some((error) => error.includes('peakWindows[0].start')));

  const badZone = validateRule({ ...RULE, timeZone: 'Mars/Olympus' });
  assert.equal(badZone.ok, false);
  assert.ok(badZone.errors.some((error) => error.includes('unbekannte Zone')));

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
