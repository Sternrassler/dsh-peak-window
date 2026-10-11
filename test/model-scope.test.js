import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEEPSEEK_PROVIDER_PREFIXES, MODEL_SCOPE_HINT, computeModelScope } from '../lib/model-scope.js';

/** Directory snapshot as `ctx.modelDirectories` publishes it. */
const snapshot = (overrides = {}) => ({ current: null, routable: null, ...overrides });
const selected = (provider, { routable = true } = {}) =>
  snapshot({
    current: { provider, model: 'some-model' },
    routable,
  });

test('without a resolved selection there is no hint', () => {
  // The projection and the catalog load asynchronously; a hint shown before a
  // selection exists would be a false alarm on every mount.
  const scope = computeModelScope(snapshot());
  assert.equal(scope.applies, null);
  assert.equal(scope.hint, false);
  assert.equal(scope.status, 'neutral');
});

test('DeepSeek selections keep the price window unqualified', () => {
  for (const provider of ['deepseek-account', 'deepseek-official']) {
    const scope = computeModelScope(selected(provider));
    assert.equal(scope.deepseek, true, `${provider} is a DeepSeek provider`);
    assert.equal(scope.applies, true);
    assert.equal(scope.hint, false);
    assert.equal(scope.status, 'applicable');
  }
});

test('a non-DeepSeek selection is qualified instead of hidden', () => {
  const scope = computeModelScope(selected('codex'));
  assert.equal(scope.provider, 'codex');
  assert.equal(scope.deepseek, false);
  assert.equal(scope.applies, false);
  assert.equal(scope.hint, true);
  assert.equal(scope.status, 'other-provider');
});

test('provider matching tolerates case, spacing and future DeepSeek variants', () => {
  assert.equal(computeModelScope(selected('DeepSeek-Account')).deepseek, true);
  assert.equal(computeModelScope(selected('DEEPSEEK-OFFICIAL')).deepseek, true);
  assert.equal(computeModelScope(selected('deepseek')).deepseek, true);
  assert.equal(computeModelScope(selected('  deepseek-account  ')).deepseek, true);
  assert.equal(computeModelScope(selected('deepseek-v99-enterprise')).deepseek, true);
});

test('a provider that merely contains the word is not DeepSeek', () => {
  // No substring match and no prefix boundary violation: a provider that only
  // borrows the name must not silently inherit the price window.
  for (const provider of ['my-deepseek-proxy', 'deepseekx', 'notdeepseek', 'deepseekbot']) {
    assert.equal(computeModelScope(selected(provider)).deepseek, false, provider);
    assert.equal(computeModelScope(selected(provider)).status, 'other-provider', provider);
  }
});

test('an unavailable selection is reported as such, not as another provider', () => {
  // `routable` is only true/false once the catalog is ready (null while
  // loading), so false means the selection is genuinely not in the catalog.
  const scope = computeModelScope(selected('deepseek-account', { routable: false }));
  assert.equal(scope.status, 'unavailable');
  assert.equal(scope.applies, null);
  assert.equal(scope.hint, true);
  assert.equal(scope.deepseek, true);
});

test('a null provider with a resolved selection stays neutral', () => {
  const scope = computeModelScope(snapshot({ current: { provider: null, model: 'x' }, routable: true }));
  assert.equal(scope.applies, null);
  assert.equal(scope.status, 'neutral');
  assert.equal(scope.hint, false);
});

test('callers can narrow the accepted provider prefixes', () => {
  const scope = computeModelScope(selected('deepseek-account'), { prefixes: ['acme'] });
  assert.equal(scope.deepseek, false);
  assert.equal(scope.status, 'other-provider');
});

test('an empty prefix list never matches', () => {
  assert.equal(computeModelScope(selected('deepseek-account'), { prefixes: [] }).deepseek, false);
});

test('the maintained prefixes cover the providers shipped with DSH', () => {
  // Guards the same class of drift as the holiday list: if the harness renames
  // the DeepSeek routes, this turns red instead of the badge going quiet.
  assert.deepEqual([...DEEPSEEK_PROVIDER_PREFIXES], ['deepseek']);
  for (const provider of ['deepseek-account', 'deepseek-official']) {
    assert.equal(computeModelScope(selected(provider)).deepseek, true, provider);
  }
});

test('the hint names the qualification in one place', () => {
  assert.equal(MODEL_SCOPE_HINT, 'DeepSeek pricing only');
});
