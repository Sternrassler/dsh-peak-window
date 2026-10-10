import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const rule = JSON.parse(readFileSync(new URL('../data/rule.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('Manifest ist für den DSH-Client-Loader auflösbar', () => {
  // Der Loader löst `<name>/package.json` und `<name>/client` auf; ohne den
  // package.json-Export schlägt das trotz vorhandener Dateien fehl.
  assert.equal(manifest.exports['./package.json'], './package.json');
  assert.equal(manifest.exports['./client'], './client.js');
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
});

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
