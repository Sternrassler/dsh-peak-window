/**
 * GENERATED FILE — do not edit directly.
 *
 * Sources: lib/client.template.js + lib/price-window.js + lib/model-scope.js
 * + data/rule.json
 * Build: npm run build:client   Verify: npm run check:client
 */
window.__ModuleLoader__.load({
  id: '@sternrassler/dsh-peak-window',
  factory(require) {
    const React = require('react');

    /*__LOGIC__*/

    /*__MODEL_SCOPE_LOGIC__*/

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

    function Badge({ modelState }) {
      const now = useNow();
      // `modelState` is the session's model-directory store; subscribing keeps
      // the badge in step when the model is switched mid-session.
      const modelSnapshot = React.useSyncExternalStore(
        (onChange) => modelState.subscribe(onChange),
        () => modelState.getSnapshot(),
      );
      const scope = computeModelScope(modelSnapshot);

      const validation = validateRule(RULE);
      if (!validation.ok) return React.createElement(ErrorBadge, { errors: validation.errors });

      // `applies === false` means the rule is known but does not cover the
      // active model; the state stays visible and grayed out with the hint, so
      // the badge neither lies nor silently disappears.
      const active = scope.applies !== false;
      const current = state(now, RULE);
      const shownState = active ? current : '—';
      const isPeak = current === 'PEAK';
      const stateColor = !active
        ? 'var(--dsw-alias-state-idle-primary)'
        : isPeak
          ? 'var(--dsw-alias-state-error-primary)'
          : 'var(--dsw-alias-state-success-primary)';
      const transition = active ? nextTransition(now, RULE) : null;
      const countdown = transition === null ? '' : formatCountdown(transition.at - now, RULE.countdown);
      const baseName = transition === null
        ? `${TITLE}: ${shownState} (${RULE.timeZone})`
        : `${TITLE}: ${shownState}, switching to ${transition.next} in ${countdown} (${RULE.timeZone})`;
      const accessibleName = scope.hintText === '' ? baseName : `${baseName} — ${scope.hintText}`;

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
        }, shownState),
      ];
      if (transition !== null) {
        children.push(React.createElement('span', {
          key: 'countdown',
          style: { whiteSpace: 'nowrap' },
        }, `→ ${transition.next} in ${countdown}`));
      }
      if (scope.hintText !== '') {
        children.push(React.createElement('span', {
          key: 'hint',
          'aria-hidden': true,
          style: { color: 'var(--dsw-alias-label-secondary)' },
        }, `· ${scope.hintText}`));
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
      // `modelDirectories` only exists when the harness model-selection plugin
      // is mounted; without it no session model can be resolved, so the badge
      // does not register at all instead of guessing a provider.
      inject: ['slots', 'modelDirectories'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: '@sternrassler/dsh-peak-window',
          order: 20,
          label: 'DeepSeek PEAK/OFF_PEAK',
          inject: (sessionId) => {
            const directory = ctx.modelDirectories.directoryFor(sessionId);
            // Loading the directory also resolves the selection of a session
            // that has not been opened through the model picker yet.
            directory.load().catch(() => {});
            return { modelState: directory.store };
          },
        }, Badge));
      },
    };
  },
});
