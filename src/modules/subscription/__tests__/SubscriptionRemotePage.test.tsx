import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SubscriptionFeatureData } from '@medmate/subscription-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { SubscriptionRemotePage } from '@/modules/subscription';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';
import { hostApi } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function wrap(
  ui: ReactElement,
  path: string,
  session = SESSION_FIXTURES['owner-free'],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/subscription" element={ui} />
            <Route path="/billing" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function plansStub(): RemoteImporter {
  return async () => ({
    default: function PlansStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SubscriptionFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="role">{data.feature.role}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'plans', action: 'load' })
                .then((result) => {
                  setLog(result.ok ? 'loaded' : (result.formError ?? 'fail'));
                });
            }}
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'plans',
                action: 'subscribe',
                values: { plan_id: 'plan-starter' },
              });
            }}
          >
            Subscribe
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function billingStub(): RemoteImporter {
  return async () => ({
    default: function BillingStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SubscriptionFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'billing',
                  action: 'pay',
                  values: { invoice_id: 'inv-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'paid' : (result.formError ?? 'fail'));
                });
            }}
          >
            Pay
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('SubscriptionRemotePage', () => {
  it('loads plans and toasts subscribe for owners', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: [{ id: 'plan-free', name: 'FREE' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { current_plan: 'FREE' },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { current_plan: 'STARTER' },
      });
    wrap(
      <SubscriptionRemotePage screen="plans" loadRemote={plansStub()} />,
      '/subscription',
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('loaded');
    });
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent(
        'Subscription updated',
      );
    });
  });

  it('builds an envelope when session ids are missing', async () => {
    wrap(
      <SubscriptionRemotePage screen="plans" loadRemote={plansStub()} />,
      '/subscription',
      {
        ...SESSION_FIXTURES['owner-free'],
        pharmacyId: null,
        staffId: null,
      },
    );
    expect(await screen.findByTestId('can-write')).toBeTruthy();
  });

  it('hides writes for staff', async () => {
    wrap(
      <SubscriptionRemotePage screen="plans" loadRemote={plansStub()} />,
      '/subscription',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('pharmacy_staff');
  });

  it('pays invoices from the billing screen', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { payment_link: 'https://pay.example' },
    });
    wrap(
      <SubscriptionRemotePage screen="billing" loadRemote={billingStub()} />,
      '/billing',
    );
    expect(await screen.findByRole('button', { name: 'Pay' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('paid');
    });
  });

  it('falls back when the remote is missing', async () => {
    wrap(<SubscriptionRemotePage screen="plans" />, '/subscription');
    expect(await screen.findByTestId('subscription-plans-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_SUBSCRIPTION_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<SubscriptionRemotePage screen="billing" />, '/billing');
    expect(await screen.findByTestId('subscription-billing-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });
});
