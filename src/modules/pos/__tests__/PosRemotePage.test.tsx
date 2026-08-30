import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PosFeatureData } from '@medmate/pos-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { PosRemotePage } from '@/modules/pos';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetTelemetry();
});

function wrap(
  ui: ReactElement,
  session = SESSION_FIXTURES['owner-free'],
  path = '/pos',
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/pos" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function counterStub(): RemoteImporter {
  return async () => ({
    default: function CounterStub(props: Record<string, unknown>) {
      const data = props.data as { feature: PosFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="token-scope">{data.feature.tokenScope}</p>
          <p data-testid="can-sell">{String(data.feature.canSell)}</p>
          <p data-testid="cart-id">{data.feature.cartId ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'counter', action: 'createCart' })
                .then((result) => {
                  setLog(result.ok ? (result.cart?.cart_id ?? 'ok') : 'fail');
                });
            }}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'counter',
                  action: 'checkout',
                  values: { payment_method: 'CASH' },
                })
                .then((result) => {
                  setLog(result.ok ? 'paid' : (result.code ?? 'fail'));
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

describe('PosRemotePage', () => {
  it('creates a cart and checks out once per idempotency key', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    subscribeTelemetry((event) => {
      events.push(event);
    });
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { cart_id: 'cart-1', items: [] },
      })
      .mockResolvedValue({
        ok: true,
        status: 201,
        data: { invoice_id: 'inv-1', grand_total: 10 },
      });
    wrap(<PosRemotePage loadRemote={counterStub()} />);
    expect(await screen.findByTestId('pos-page')).toBeTruthy();
    expect(await screen.findByTestId('token-scope')).toHaveTextContent('full');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('cart-1');
    });
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('paid');
    });
    expect(events).toContain('pos_checkout_result');
    const checkout = request.mock.calls.find((call) =>
      String(call[0]?.path).endsWith('/checkout'),
    );
    expect(checkout?.[0]?.idempotencyKey).toBeTruthy();
  });

  it('passes POS scope to the remote', async () => {
    wrap(
      <PosRemotePage loadRemote={counterStub()} />,
      SESSION_FIXTURES['pos-scope'],
    );
    expect(await screen.findByTestId('token-scope')).toHaveTextContent('pos');
    expect(screen.getByTestId('can-sell')).toHaveTextContent('true');
  });

  it('reuses one checkout key until success', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { cart_id: 'cart-1', items: [] },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: undefined as never,
        code: 'INSUFFICIENT_STOCK',
        message: 'short',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { invoice_id: 'inv-1', grand_total: 10 },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { cart_id: 'cart-2', items: [] },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { invoice_id: 'inv-2', grand_total: 10 },
      });
    wrap(<PosRemotePage loadRemote={counterStub()} />);
    await user.click(await screen.findByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('cart-1');
    });
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('INSUFFICIENT_STOCK');
    });
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('paid');
    });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('cart-2');
    });
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('paid');
    });
    const checkoutKeys = request.mock.calls
      .filter((call) => String(call[0]?.path).endsWith('/checkout'))
      .map((call) => call[0]?.idempotencyKey);
    expect(checkoutKeys[0]).toBe(checkoutKeys[1]);
    expect(checkoutKeys[2]).not.toBe(checkoutKeys[0]);
  });

  it('tracks an unknown checkout failure code', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { cart_id: 'cart-1', items: [] },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: undefined as never,
      });
    wrap(<PosRemotePage loadRemote={counterStub()} />);
    await user.click(await screen.findByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('cart-1');
    });
    await user.click(screen.getByRole('button', { name: 'Pay' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('fail');
    });
  });

  it('loads a cart from the query string', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { cart_id: 'cart-handoff', items: [] },
    });
    wrap(
      <PosRemotePage loadRemote={counterStub()} />,
      SESSION_FIXTURES['owner-free'],
      '/pos?cart_id=cart-handoff',
    );
    await waitFor(() => {
      expect(screen.getByTestId('cart-id')).toHaveTextContent('cart-handoff');
    });
  });

  it('does not sell when the session has no counter role', async () => {
    wrap(
      <PosRemotePage loadRemote={counterStub()} />,
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('can-sell')).toHaveTextContent('false');
  });
});
