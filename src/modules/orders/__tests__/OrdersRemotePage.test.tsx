import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OrdersFeatureData } from '@medmate/orders-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi } from '@/modules/api';
import { OrdersRemotePage } from '@/modules/orders';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

const ORDER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const RIDER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function wrap(
  ui: ReactElement,
  path: string,
  session = SESSION_FIXTURES['owner-retail-pro'],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/rx-quotes" element={ui} />
            <Route path="/orders" element={ui} />
            <Route path="/orders/:orderId" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function quotesStub(): RemoteImporter {
  return async () => ({
    default: function QuotesStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OrdersFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-mutate">{String(data.feature.canMutateOrders)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'rx-quotes', action: 'load' })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.quotes?.length ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load quotes
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'rx-quotes',
                  action: 'quote',
                  values: { quoteId: 'q-1', price: 120 },
                })
                .then((result) => {
                  setLog(result.ok ? 'quoted' : (result.code ?? 'fail'));
                });
            }}
          >
            Quote
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'rx-quotes',
                  action: 'decline',
                  values: { quoteId: 'q-1', reason: 'No stock' },
                })
                .then((result) => {
                  setLog(result.ok ? 'declined' : (result.code ?? 'fail'));
                });
            }}
          >
            Decline
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function homeStub(): RemoteImporter {
  return async () => ({
    default: function HomeStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OrdersFeatureData };
      const [log, setLog] = useState('idle');
      return (
        <div>
          <p data-testid="order-id">{data.feature.orderId ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'orders-home', action: 'noop' })
                .then((result) => {
                  setLog(result.ok ? 'guidance' : 'fail');
                });
            }}
          >
            Ping home
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function actionsStub(): RemoteImporter {
  return async () => ({
    default: function ActionsStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OrdersFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="order-id">{data.feature.orderId ?? ''}</p>
          <p data-testid="can-mutate">{String(data.feature.canMutateOrders)}</p>
          <p data-testid="token-scope">{data.feature.tokenScope ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'order-actions',
                  action: 'accept',
                  values: { orderId: ORDER_ID },
                })
                .then((result) => {
                  setLog(result.ok ? 'accepted' : (result.code ?? 'fail'));
                });
            }}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'order-actions',
                  action: 'reject',
                  values: { orderId: ORDER_ID, reason: 'No stock' },
                })
                .then((result) => {
                  setLog(result.ok ? 'rejected' : (result.code ?? 'fail'));
                });
            }}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'order-actions',
                  action: 'advanceStatus',
                  values: { orderId: ORDER_ID, status: 'PACKED' },
                })
                .then((result) => {
                  setLog(result.ok ? 'packed' : (result.code ?? 'fail'));
                });
            }}
          >
            Pack
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'order-actions',
                  action: 'assignRider',
                  values: { orderId: ORDER_ID, rider_id: RIDER_ID },
                })
                .then((result) => {
                  setLog(result.ok ? 'assigned' : (result.code ?? 'fail'));
                });
            }}
          >
            Assign
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('OrdersRemotePage', () => {
  it('loads quotes and mutates for Free owners', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { quotes: [{ quote_id: 'q-1' }] },
      details: { page: 1 },
    });
    wrap(
      <OrdersRemotePage screen="rx-quotes" loadRemote={quotesStub()} />,
      '/rx-quotes',
      SESSION_FIXTURES['owner-free'],
    );
    expect(screen.getByTestId('orders-rx-quotes-page')).toBeTruthy();
    expect(await screen.findByTestId('can-mutate')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load quotes' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Quote' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('quoted');
    await user.click(screen.getByRole('button', { name: 'Decline' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('declined');
    expect(
      request.mock.calls.some((call) =>
        String(call[0]?.path ?? '').includes('/pharmacy/orders'),
      ),
    ).toBe(false);
  });

  it('maps PRICE_ABOVE_MRP on quote', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 422,
      data: undefined as never,
      code: 'PRICE_ABOVE_MRP',
      message: 'Above MRP',
    });
    wrap(
      <OrdersRemotePage screen="rx-quotes" loadRemote={quotesStub()} />,
      '/rx-quotes',
    );
    await user.click(await screen.findByRole('button', { name: 'Quote' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'PRICE_ABOVE_MRP',
    );
  });

  it('renders guidance on /orders without fetching a list', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <OrdersRemotePage screen="orders-home" loadRemote={homeStub()} />,
      '/orders',
    );
    expect(screen.getByTestId('orders-orders-home-page')).toBeTruthy();
    expect(await screen.findByTestId('order-id')).toHaveTextContent('');
    await user.click(screen.getByRole('button', { name: 'Ping home' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('guidance');
    expect(request).not.toHaveBeenCalled();
  });

  it('renders a degraded outlet without a remote loader', async () => {
    wrap(<OrdersRemotePage screen="rx-quotes" />, '/rx-quotes');
    expect(await screen.findByTestId('orders-rx-quotes-page')).toBeTruthy();
  });

  it('clears orderId off the home contract and uses a configured remote URL', async () => {
    vi.stubEnv(
      'VITE_REMOTE_ORDERS_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(
      <OrdersRemotePage screen="order-actions" loadRemote={actionsStub()} />,
      '/orders',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('order-id')).toHaveTextContent('');
    expect(screen.getByTestId('can-mutate')).toHaveTextContent('false');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
  });

  it('lets staff accept and blocks POS tokens', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { order_id: ORDER_ID, status: 'ACCEPTED' },
    });
    wrap(
      <OrdersRemotePage screen="order-actions" loadRemote={actionsStub()} />,
      `/orders/${ORDER_ID}`,
      SESSION_FIXTURES['staff-active'],
    );
    expect(await screen.findByTestId('order-id')).toHaveTextContent(ORDER_ID);
    expect(screen.getByTestId('can-mutate')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('accepted');
    cleanup();
    wrap(
      <OrdersRemotePage screen="order-actions" loadRemote={actionsStub()} />,
      `/orders/${ORDER_ID}`,
      SESSION_FIXTURES['pos-scope'],
    );
    expect(await screen.findByTestId('can-mutate')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Pack' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'POS_TOKEN_RESTRICTED',
    );
  });

  it('accepts, rejects, packs, and assigns with generic toasts', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { order_id: ORDER_ID, status: 'ACCEPTED' },
    });
    wrap(
      <OrdersRemotePage screen="order-actions" loadRemote={actionsStub()} />,
      `/orders/${ORDER_ID}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('accepted');
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('rejected');
    await user.click(screen.getByRole('button', { name: 'Pack' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('packed');
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('assigned');
  });

  it('maps already-actioned conflicts', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 409,
      data: undefined as never,
      code: 'ORDER_ALREADY_ACTIONED',
      message: 'Taken',
    });
    wrap(
      <OrdersRemotePage screen="order-actions" loadRemote={actionsStub()} />,
      `/orders/${ORDER_ID}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'ORDER_ALREADY_ACTIONED',
    );
  });
});
