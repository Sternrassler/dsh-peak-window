import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const rule = JSON.parse(readFileSync(new URL('../data/rule.json', import.meta.url), 'utf8'));

test('client.js registriert die Factory unter dem Paketnamen', () => {
  assert.match(client, /window\.__ModuleLoader__\.load\(\{/);
  assert.match(client, /id: '@sternrassler\/dsh-deepseek-price-window'/);
});

test('client.js ist selbstenthalten (keine relativen Requires oder Imports)', () => {
  assert.doesNotMatch(client, /require\(['"]\./);
  assert.doesNotMatch(client, /^\s*import /m);
  assert.match(client, /require\('react'\)/);
});

test('client.js bettet die Regel aus data/rule.json ein', () => {
  assert.ok(client.includes(`"timeZone": "${rule.timeZone}"`));
  for (const range of rule.holidays.ranges) {
    assert.ok(client.includes(`"${range.start}"`), `Feiertagsstart ${range.start} fehlt im Artefakt`);
  }
});

test('client.js registriert sich am Dock-Slot unterhalb des Composers', () => {
  assert.match(client, /conversation\.composer\.dock/);
  assert.match(client, /inject: \['slots'\]/);
});

test('client.js nutzt Theme-Tokens statt fester Zustandsfarben', () => {
  assert.match(client, /--dsw-alias-state-success-primary/);
  assert.match(client, /--dsw-alias-state-error-primary/);
  assert.doesNotMatch(client, /#[0-9a-fA-F]{6}/);
});
