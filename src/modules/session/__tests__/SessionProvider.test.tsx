import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  SessionProvider,
  useSession,
  useSessionStore,
} from '@/modules/session';
import { SESSION_FIXTURES } from '@/modules/session';
import { setTokens } from '@/modules/api';

afterEach(() => {
  cleanup();
});

function Probe() {
  const session = useSession();
  return <span data-testid="role">{session.role ?? 'none'}</span>;
}

function StoreProbe() {
  const store = useSessionStore();
  return (
    <div>
      <span data-testid="name">{store.session.staffName}</span>
      <span data-testid="status">{store.session.pharmacyStatus ?? 'none'}</span>
      <span data-testid="bootstrap">{store.bootstrapStatus}</span>
      <button
        type="button"
        onClick={() =>
          store.applyLogin({
            staff: { id: 'u1', name: 'Logged', role: 'pharmacy_owner' },
            active_pharmacy: { id: 'p1', name: 'Shop' },
            pharmacies: [],
          })
        }
      >
        login
      </button>
      <button
        type="button"
        onClick={() =>
          store.applyMe({
            id: 'u1',
            name: 'From me',
            role: 'pharmacy_owner',
          })
        }
      >
        me
      </button>
      <button
        type="button"
        onClick={() =>
          store.applyRegistrationStatus({
            status: 'ACTIVE',
            plan: 'STARTER',
            business_name: 'Named',
          })
        }
      >
        status
      </button>
      <button
        type="button"
        onClick={() =>
          store.applySwitch({
            active_pharmacy: {
              id: 'p2',
              name: 'Other',
              subscription_plan: 'FREE',
            },
            role_in_pharmacy: 'owner',
          })
        }
      >
        switch
      </button>
      <button
        type="button"
        onClick={() =>
          store.applyPosLogin({
            staff: { id: 's1', name: 'Kavya', role: 'cashier' },
            pharmacy: { id: 'p1', name: 'Counter' },
          })
        }
      >
        pos
      </button>
      <button type="button" onClick={() => store.clearSession()}>
        clear
      </button>
      <button type="button" onClick={() => store.setBootstrapStatus('loading')}>
        boot
      </button>
    </div>
  );
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

  it('applies live session mutations', async () => {
    const user = userEvent.setup();
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    render(
      <SessionProvider session={SESSION_FIXTURES['owner-free']}>
        <StoreProbe />
      </SessionProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'login' }));
    expect(screen.getByTestId('name')).toHaveTextContent('Logged');
    await user.click(screen.getByRole('button', { name: 'me' }));
    expect(screen.getByTestId('name')).toHaveTextContent('From me');
    await user.click(screen.getByRole('button', { name: 'status' }));
    expect(screen.getByTestId('status')).toHaveTextContent('ACTIVE');
    await user.click(screen.getByRole('button', { name: 'switch' }));
    expect(screen.getByTestId('name')).toHaveTextContent('From me');
    await user.click(screen.getByRole('button', { name: 'pos' }));
    expect(screen.getByTestId('name')).toHaveTextContent('Kavya');
    await user.click(screen.getByRole('button', { name: 'boot' }));
    expect(screen.getByTestId('bootstrap')).toHaveTextContent('loading');
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByTestId('name')).toHaveTextContent('');
  });
});
