#!/usr/bin/env node
/**
 * Builds the self-contained `client.js` from `lib/client.template.js`,
 * `lib/price-window.js`, `lib/model-scope.js` and `data/rule.json`.
 *
 * The client bundle loader does not allow relative requires, so the logic is
 * embedded instead of imported. The build is reproducible and is checked
 * against the committed artifact by the `npm run check:client` gate.
 *
 *   node scripts/build-client.mjs          # writes client.js
 *   node scripts/build-client.mjs --check  # checks whether client.js is current
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');

const template = read('lib/client.template.js');
const logic = read('lib/price-window.js')
  .replace(/^export /gm, '')
  .trimEnd();
const modelScopeLogic = read('lib/model-scope.js')
  .replace(/^export /gm, '')
  .trimEnd();
const rule = JSON.parse(read('data/rule.json'));

const output = template
  .replace('/*__LOGIC__*/', logic)
  .replace('/*__MODEL_SCOPE_LOGIC__*/', modelScopeLogic)
  .replace('/*__RULE__*/', JSON.stringify(rule, null, 2));

const target = join(root, 'client.js');

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    current = '';
  }
  if (current !== output) {
    console.error('client.js is out of date. Run `npm run build:client`.');
    process.exitCode = 1;
  } else {
    console.log('client.js is up to date.');
  }
} else {
  writeFileSync(target, output);
  console.log('client.js generated.');
}
