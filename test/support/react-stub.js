/**
 * Minimal `react` stand-in for exercising the generated client artifact.
 *
 * The artifact is loaded with `require('react')`; providing that single module
 * is all the runtime test needs. Only the surface the badge uses is
 * implemented, so a new React API in the client fails loudly here instead of
 * silently doing nothing.
 */

/** Elements created during a render, in creation order. */
export const created = [];

/** Snapshot returning the badge state for one render. */
export function createReactStub() {
  return {
    createElement(type, props, ...children) {
      const element = {
        type: typeof type === 'function' ? type.name : type,
        props: props ?? {},
        // React passes the children of a component as one array argument; keep
        // the shape so the rendered text can be flattened the same way.
        children,
      };
      created.push(element);
      return element;
    },
    useState(initial) {
      return [typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect() {},
    useSyncExternalStore(subscribe, getSnapshot) {
      if (typeof subscribe !== 'function' || typeof getSnapshot !== 'function') {
        throw new Error('useSyncExternalStore requires subscribe and getSnapshot functions');
      }
      // React subscribes in an effect; the stub subscribes during render so a
      // test can observe the subscription side of the contract.
      subscribe(() => {});
      return getSnapshot();
    },
  };
}

/**
 * Flatten a created element tree into its text content.
 *
 * @param {unknown} node - element, string, or nested array.
 * @returns {string} concatenated text nodes.
 */
export function textOf(node) {
  if (node === null || node === undefined || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return (node.children ?? []).map(textOf).join('');
}
