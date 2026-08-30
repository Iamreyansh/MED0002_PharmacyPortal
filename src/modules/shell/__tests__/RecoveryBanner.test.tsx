import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { clearRecovery, setRecovery } from '@/modules/api';
import { RecoveryBanner } from '@/modules/shell';
import { renderApp } from '@/shared/test/render';
import { SESSION_FIXTURES } from '@/modules/session';

afterEach(() => {
  cleanup();
});

describe('RecoveryBanner', () => {
  it('renders unavailable copy and dismisses on Retry', async () => {
    const user = userEvent.setup();
    setRecovery({ kind: 'unavailable', retryAfterSeconds: 0 });
    render(<RecoveryBanner />);
    expect(screen.getByTestId('recovery-banner')).toHaveTextContent(
      /temporarily unavailable/,
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.queryByTestId('recovery-banner')).toBeNull();
  });

  it('renders rate-limit wait with and without seconds', () => {
    setRecovery({ kind: 'rate_limited', retryAfterSeconds: 12 });
    const { rerender } = render(<RecoveryBanner />);
    expect(screen.getByTestId('rate-limit-wait')).toHaveTextContent(
      'Too many requests. Retry in 12s.',
    );
    setRecovery({ kind: 'rate_limited', retryAfterSeconds: 0 });
    rerender(<RecoveryBanner />);
    expect(screen.getByTestId('rate-limit-wait')).toHaveTextContent(
      'Too many requests. Wait and try again.',
    );
    clearRecovery();
    rerender(<RecoveryBanner />);
    expect(screen.queryByTestId('rate-limit-wait')).toBeNull();
  });

  it('stays off public auth chrome and shows in the portal', () => {
    setRecovery({ kind: 'unavailable', retryAfterSeconds: 0 });
    renderApp('/login', SESSION_FIXTURES.unauthenticated);
    expect(screen.queryByTestId('recovery-banner')).toBeNull();
    cleanup();
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('recovery-banner')).toBeTruthy();
  });
});
