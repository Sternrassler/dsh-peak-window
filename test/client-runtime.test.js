import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { createReactStub, textOf } from './support/react-stub.js';

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

/**
 * Load the generated artifact the way the DSH web client loads it: through the
 * module loader, with `react` as its only require. `vm` is used instead of
 * `new Function` because the project lints against dynamic code.
 *
 * @returns {{ id: string, plugin: object, react: object }} captured factory.
 */
function loadClient() {
  let captured = null;
  const sandbox = {
    console,
    Date,
    Intl,
    Map,
    Set,
    Math,
    JSON,
    Promise,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Error,
    RegExp,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  };
  sandbox.window = {
    __ModuleLoader__: {
      load(module) {
        captured = module;
      },
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'client.js' });

  assert.ok(captured !== null, 'client.js must call window.__ModuleLoader__.load');
  const react = createReactStub();
  const require = (name) => {
    if (name === 'react') return react;
    throw new Error(`client.js required an unexpected module: ${name}`);
  };
  return { id: captured.id, plugin: captured.factory(require), react };
}

/**
 * Register the plugin against a stub context and expose the slot entry.
 *
 * @param {object} plugin - plugin body returned by the factory.
 * @param {object} initial - first model-directory snapshot.
 * @returns {{ entry: object, setSnapshot: (snapshot: object) => void, subscribers: Function[], loadCalls: number }}
 */
function mount(plugin, initial) {
  let snapshot = initial;
  let loadCalls = 0;
  const subscribers = [];
  const store = {
    sessionId: 'session-1',
    getSnapshot: () => snapshot,
    subscribe: (onChange) => {
      subscribers.push(onChange);
      return () => {
        const index = subscribers.indexOf(onChange);
        if (index >= 0) subscribers.splice(index, 1);
      };
    },
  };
  let entry = null;
  const ctx = {
    slots: {
      inject: (_name, register) => register(),
      register: (spec, component) => {
        entry = { spec, component };
        return () => {};
      },
    },
    modelDirectories: {
      directoryFor: (sessionId) => {
        assert.equal(sessionId, 'session-1', 'the directory is resolved for the session the slot belongs to');
        return {
          store,
          load: () => {
            loadCalls += 1;
            return Promise.resolve(snapshot);
          },
        };
      },
    },
  };
  plugin.apply(ctx);
  assert.ok(entry !== null, 'the plugin must register a slot entry');
  return {
    entry,
    subscribers,
    setSnapshot: (next) => {
      snapshot = next;
    },
    get loadCalls() {
      return loadCalls;
    },
  };
}

/** Render the registered entry for one snapshot. */
function renderBadge(entry, snapshot) {
  const injected = entry.spec.inject('session-1');
  assert.deepEqual(Object.keys(injected), ['modelState'], 'the entry injects the model-directory store');
  injected.modelState.getSnapshot = () => snapshot;
  const element = entry.component({ ...injected });
  if (element === null) return null;
  return { text: textOf(element), aria: element.props['aria-label'] };
}

const snapshot = (current, routable) => ({ current, routable, status: 'ready' });

test('artifact registers the plugin with slots and modelDirectories', () => {
  const { id, plugin } = loadClient();
  assert.equal(id, '@sternrassler/dsh-peak-window');
  assert.deepEqual([...plugin.inject], ['slots', 'modelDirectories']);
});

test('badge renders the price window for a DeepSeek model', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot({ provider: 'deepseek-account', model: 'deepseek-v4-pro' }, true));
  const rendered = renderBadge(
    mounted.entry,
    snapshot({ provider: 'deepseek-account', model: 'deepseek-v4-pro' }, true),
  );
  assert.match(rendered.text, /^(PEAK|OFF_PEAK)/);
  assert.match(rendered.aria, /^DeepSeek price window: (PEAK|OFF_PEAK)/);
  assert.ok(!rendered.text.includes('DeepSeek pricing only'), rendered.text);
});

test('badge is completely hidden for another provider', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot({ provider: 'codex', model: 'gpt-5-codex' }, true));
  const rendered = renderBadge(mounted.entry, snapshot({ provider: 'codex', model: 'gpt-5-codex' }, true));
  assert.equal(rendered, null);
});

test('badge is hidden when the selected DeepSeek model is unavailable', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot({ provider: 'deepseek-account', model: 'removed' }, false));
  const rendered = renderBadge(
    mounted.entry,
    snapshot({ provider: 'deepseek-account', model: 'removed' }, false),
  );
  assert.equal(rendered, null);
});

test('badge is completely hidden before a model selection is resolved', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot(null, null));
  const rendered = renderBadge(mounted.entry, snapshot(null, null));
  assert.equal(rendered, null);
});

test('badge reacts to a model switch within the session', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot({ provider: 'deepseek-account', model: 'deepseek-v4-pro' }, true));
  const first = renderBadge(
    mounted.entry,
    snapshot({ provider: 'deepseek-account', model: 'deepseek-v4-pro' }, true),
  );
  assert.ok(!first.text.includes('DeepSeek pricing only'));

  // The subscription is the contract that makes a mid-session switch visible.
  assert.equal(mounted.subscribers.length, 1, 'the badge subscribes to the model directory once');
  const switched = renderBadge(mounted.entry, snapshot({ provider: 'codex', model: 'gpt-5-codex' }, true));
  assert.equal(switched, null);

  const switchedBack = renderBadge(
    mounted.entry,
    snapshot({ provider: 'deepseek-official', model: 'deepseek-v4-pro' }, true),
  );
  assert.match(switchedBack.text, /^(PEAK|OFF_PEAK)/);
});

test('the injected face loads the directory instead of assuming a selection', () => {
  const { plugin } = loadClient();
  const mounted = mount(plugin, snapshot(null, null));
  mounted.entry.spec.inject('session-1');
  assert.equal(mounted.loadCalls, 1, 'the session selection is resolved on registration');
});
