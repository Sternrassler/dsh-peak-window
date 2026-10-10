/**
 * GENERATED FILE — do not edit directly.
 *
 * Sources: lib/client.template.js + lib/price-window.js + data/rule.json
 * Build: npm run build:client   Verify: npm run check:client
 */
window.__ModuleLoader__.load({
  id: '@sternrassler/dsh-deepseek-price-window',
  factory(require) {
    const React = require('react');

    /*__LOGIC__*/

    const RULE = /*__RULE__*/;
    const TITLE = 'DeepSeek price window';
    const REFRESH_MS = 30_000;

    function useNow() {
      const [now, setNow] = React.useState(() => Date.now());
      React.useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), REFRESH_MS);
        return () => clearInterval(interval);
      }, []);
      React.useEffect(() => {
        const transition = nextTransition(now, RULE);
        if (transition === null) return undefined;
        const delay = Math.min(Math.max(transition.at - Date.now(), 0) + 250, 2_147_483_000);
        const timeout = setTimeout(() => setNow(Date.now()), delay);
        return () => clearTimeout(timeout);
      }, [now]);
      return now;
    }

    function ErrorBadge({ errors }) {
      const message = `${TITLE}: invalid rule — ${errors[0]}`;
      return React.createElement('div', {
        role: 'status',
        'aria-label': message,
        title: message,
        style: { fontSize: '11px', lineHeight: '1.4', padding: '2px 0', color: 'var(--dsw-alias-state-warn-primary)' },
      }, message);
    }

    function Badge() {
      const now = useNow();
      const validation = validateRule(RULE);
      if (!validation.ok) return React.createElement(ErrorBadge, { errors: validation.errors });

      const current = state(now, RULE);
      const transition = nextTransition(now, RULE);
      const isPeak = current === 'PEAK';
      const stateColor = isPeak
        ? 'var(--dsw-alias-state-error-primary)'
        : 'var(--dsw-alias-state-success-primary)';
      const countdown = transition === null ? '' : formatCountdown(transition.at - now, RULE.countdown);
      const accessibleName = transition === null
        ? `${TITLE}: ${current} (${RULE.timeZone})`
        : `${TITLE}: ${current}, switching to ${transition.next} in ${countdown} (${RULE.timeZone})`;

      const children = [
        React.createElement('span', {
          key: 'dot',
          'aria-hidden': true,
          style: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: stateColor,
            flex: '0 0 auto',
          },
        }),
        React.createElement('span', {
          key: 'label',
          style: { fontWeight: 600, letterSpacing: '0.04em', color: stateColor },
        }, current),
      ];
      if (transition !== null) {
        children.push(React.createElement('span', {
          key: 'countdown',
          style: { whiteSpace: 'nowrap' },
        }, `→ ${transition.next} in ${countdown}`));
      }

      return React.createElement('div', {
        role: 'status',
        'aria-label': accessibleName,
        title: accessibleName,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 0',
          fontSize: '11px',
          lineHeight: '1.4',
          color: 'var(--dsw-alias-label-secondary)',
          userSelect: 'none',
        },
      }, children);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: '@sternrassler/dsh-deepseek-price-window',
          order: 20,
          label: 'DeepSeek PEAK/OFF_PEAK',
        }, Badge));
      },
    };
  },
});
