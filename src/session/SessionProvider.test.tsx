import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import { SESSION_FIXTURES } from '@/session/session';

afterEach(() => {
  cleanup();
});

function Probe() {
  const session = useSession();
  return <span data-testid="role">{session.role ?? 'none'}</span>;
}

describe('SessionProvider', () => {
  it('provides an injected session', () => {
    render(
      <SessionProvider session={SESSION_FIXTURES.cashier}>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByTestId('role')).toHaveTextContent('pharmacy_staff');
  });

  it('falls back to the env fixture', () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });

  it('throws outside a provider', () => {
    expect(() => render(<Probe />)).toThrow(
      'useSession must be used within SessionProvider',
    );
  });
});
