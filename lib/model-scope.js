/**
 * Decides whether the DeepSeek price window applies to the model that is
 * currently selected in the session — pure logic, no DOM and no DSH dependency.
 *
 * The badge is rendered only when the current selection identifies a DeepSeek
 * model that is not known to be unavailable.
 * Since the `codex` route can be mounted next to the DeepSeek routes, rendering
 * the badge for another provider could claim a price window that does not apply.
 * The caller uses `applies` to hide the badge until a valid DeepSeek model is
 * active.
 *
 * Input is the snapshot of the session's model directory
 * (`ctx.modelDirectories.directoryFor(sessionId).store`), whose fields this
 * module treats as untrusted:
 *
 *   { current: { provider, model } | null, routable: boolean | null }
 *
 * `routable` is only ever `true` or `false` once the catalog is loaded and the
 * session projection is resolved; it stays `null` while loading. A `null`
 * snapshot therefore means "not resolved yet" and must not be treated as applicable.
 */

/**
 * Provider prefixes that denote a DeepSeek route.
 *
 * The harness registers two of them: `deepseek-account` (subscription) and
 * `deepseek-official` (API key). The prefix also covers future variants such as
 * `deepseek-v99-enterprise`. The match requires a prefix boundary: either the
 * id reads exactly `deepseek`, or a hyphen follows. That keeps `my-deepseek-proxy`
 * and `deepseekx` out — they are different providers and must not silently
 * inherit the price window.
 */
export const DEEPSEEK_PROVIDER_PREFIXES = ['deepseek'];

/**
 * @param {unknown} value - candidate provider id.
 * @returns {string} trimmed provider id, or `''` when it is not a usable string.
 */
function providerId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {string} provider - trimmed provider id.
 * @param {readonly string[]} prefixes - accepted prefixes.
 * @returns {boolean} whether the provider names a DeepSeek route.
 */
function matchesPrefix(provider, prefixes) {
  if (provider === '') return false;
  const lowered = provider.toLowerCase();
  return prefixes.some((prefix) => {
    if (typeof prefix !== 'string') return false;
    const normalized = prefix.trim().toLowerCase();
    if (normalized === '') return false;
    return lowered === normalized || lowered.startsWith(`${normalized}-`);
  });
}

/**
 * Classifies the active model against the price window.
 *
 * @param {{ current?: { provider?: unknown, model?: unknown } | null, routable?: unknown }} [snapshot]
 *   - model directory snapshot (fields are validated, not trusted).
 * @param {{ prefixes?: readonly string[] }} [options]
 *   - `prefixes` overrides the accepted DeepSeek prefixes.
 * @returns {{ provider: string, deepseek: boolean, applies: boolean | null, status: 'applicable' | 'other-provider' | 'unavailable' | 'neutral' }}
 *   `applies` is `null` while the answer is not derivable yet.
 */
export function computeModelScope(snapshot = {}, options = {}) {
  const prefixes = options.prefixes === undefined ? DEEPSEEK_PROVIDER_PREFIXES : options.prefixes;
  const provider = providerId(snapshot?.current?.provider);

  if (provider === '') {
    return { provider: '', deepseek: false, applies: null, status: 'neutral' };
  }

  const deepseek = matchesPrefix(provider, prefixes);

  if (!deepseek) {
    return {
      provider,
      deepseek: false,
      applies: false,
      status: 'other-provider',
    };
  }

  if (snapshot.routable === false) {
    return {
      provider,
      deepseek: true,
      applies: null,
      status: 'unavailable',
    };
  }

  return { provider, deepseek: true, applies: true, status: 'applicable' };
}
