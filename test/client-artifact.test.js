import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const rule = JSON.parse(readFileSync(new URL('../data/rule.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('manifest is resolvable for the DSH client loader', () => {
  // The loader resolves `<name>/package.json` and `<name>/client`; without the
  // package.json export that fails even though the files exist.
  assert.equal(manifest.exports['./package.json'], './package.json');
  assert.equal(manifest.exports['./client'], './client.js');
  assert.equal(manifest.dsh.client.platform, 'web');
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
});

test('client.js registers the factory under the package name', () => {
  assert.match(client, /window\.__ModuleLoader__\.load\(\{/);
  assert.match(client, /id: '@sternrassler\/dsh-peak-window'/);
});

test('client.js is self-contained (no relative requires or imports)', () => {
  assert.doesNotMatch(client, /require\(['"]\./);
  assert.doesNotMatch(client, /^\s*import /m);
  assert.match(client, /require\('react'\)/);
});

test('client.js embeds the rule from data/rule.json', () => {
  assert.ok(client.includes(`"timeZone": "${rule.timeZone}"`));
  for (const range of rule.holidays.ranges) {
    assert.ok(client.includes(`"${range.start}"`), `holiday start ${range.start} missing from the artifact`);
  }
});

test('client.js registers at the dock slot below the composer', () => {
  assert.match(client, /conversation\.composer\.dock/);
  assert.match(client, /inject: \['slots', 'modelDirectories'\]/);
});

test('client.js derives the badge state from the session model directory', () => {
  // The badge must ask which model is active instead of assuming DeepSeek. The
  // store is subscribed to through useSyncExternalStore, because the injected
  // face is the store and not a snapshot (the runtime test covers the effect).
  assert.match(client, /ctx\.modelDirectories\.directoryFor\(sessionId\)/);
  assert.match(client, /directory\.load\(\)\.catch\(/);
  assert.match(client, /return \{ modelState: directory\.store \}/);
  assert.match(client, /React\.useSyncExternalStore\(/);
  assert.match(client, /computeModelScope\(modelSnapshot\)/);
  assert.doesNotMatch(client, /computeModelScope\(modelState\)/);
});

test('client.js keeps the qualification visible instead of hiding the badge', () => {
  // A hidden badge would look like a defect; the hint is part of the artifact
  // and carries the state for screen readers as well (NFR-M3-1).
  assert.match(client, /MODEL_SCOPE_HINT = 'DeepSeek pricing only'/);
  assert.match(client, /MODEL_SCOPE_UNAVAILABLE_HINT = 'model not available'/);
  assert.match(client, /key: 'hint'/);
  assert.match(client, /`\$\{baseName\} — \$\{scope\.hintText\}`/);
});

test('client.js uses theme tokens instead of hard-coded state colors', () => {
  assert.match(client, /--dsw-alias-state-success-primary/);
  assert.match(client, /--dsw-alias-state-error-primary/);
  assert.doesNotMatch(client, /#[0-9a-fA-F]{6}/);
});

test('client.js exposes the state as text and not through colour alone', () => {
  // Required by quality scenario NFR-M3-1: text label plus aria-label, and the
  // badge must be announced as a status region.
  assert.match(client, /role: 'status'/);
  assert.match(client, /'aria-label': accessibleName/);
  assert.match(client, /'aria-label': message/);
  assert.match(client, /state\(now, RULE\)/);
  assert.match(client, /const accessibleName =/);
});
