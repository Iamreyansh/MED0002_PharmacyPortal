import { clearRecovery, useRecovery } from '@/modules/api';

export function RecoveryBanner() {
  const recovery = useRecovery();
  if (!recovery) {
    return null;
  }

  if (recovery.kind === 'rate_limited') {
    const seconds = recovery.retryAfterSeconds;
    return (
      <p
        className="banner banner--warn"
        role="status"
        data-testid="rate-limit-wait"
      >
        {seconds > 0
          ? `Too many requests. Retry in ${seconds}s.`
          : 'Too many requests. Wait and try again.'}
      </p>
    );
  }

  return (
    <div
      className="banner banner--warn"
      role="alert"
      data-testid="recovery-banner"
    >
      <p>The server is temporarily unavailable. Retry.</p>
      <div className="remote-panel__actions">
        <button type="button" onClick={() => clearRecovery()}>
          Retry
        </button>
      </div>
    </div>
  );
}
