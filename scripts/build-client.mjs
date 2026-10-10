#!/usr/bin/env node
/**
 * Erzeugt das selbstenthaltene `client.js` aus `lib/client.template.js`,
 * `lib/price-window.js` und `data/rule.json`.
 *
 * Der Client-Bundle-Loader erlaubt keine relativen Requires, deshalb wird die
 * Logik eingebettet statt importiert. Der Build ist reproduzierbar und wird im
 * Gate `npm run check:client` gegen das eingecheckte Artefakt geprüft.
 *
 *   node scripts/build-client.mjs          # schreibt client.js
 *   node scripts/build-client.mjs --check  # prüft, ob client.js aktuell ist
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
const rule = JSON.parse(read('data/rule.json'));

const output = template
  .replace('/*__LOGIC__*/', logic)
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
    console.error('client.js ist nicht aktuell. Bitte `npm run build:client` ausführen.');
    process.exitCode = 1;
  } else {
    console.log('client.js ist aktuell.');
  }
} else {
  writeFileSync(target, output);
  console.log('client.js erzeugt.');
}
