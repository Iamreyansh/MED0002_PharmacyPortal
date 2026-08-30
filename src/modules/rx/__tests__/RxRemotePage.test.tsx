import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RxFeatureData } from '@medmate/rx-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { RxRemotePage } from '@/modules/rx';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetTelemetry();
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
            <Route path="/prescriptions" element={ui} />
            <Route path="/prescriptions/:rxId" element={ui} />
            <Route path="/compliance/drug-register" element={ui} />
            <Route path="/pos" element={<p data-testid="pos-target">POS</p>} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function queueStub(): RemoteImporter {
  return async () => ({
    default: function QueueStub(props: Record<string, unknown>) {
      const data = props.data as { feature: RxFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-mutate">{String(data.feature.canMutateRx)}</p>
          <p data-testid="handoff">
            {String(data.feature.canDispenseToBilling)}
          </p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'queue', action: 'load' })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.prescriptions?.length ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load queue
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function detailStub(): RemoteImporter {
  return async () => ({
    default: function DetailStub(props: Record<string, unknown>) {
      const data = props.data as { feature: RxFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="rx-id">{data.feature.rxId ?? ''}</p>
          <p data-testid="can-mutate">{String(data.feature.canMutateRx)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'detail',
                  action: 'approve',
                  values: { rxId: 'rx-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'approved' : (result.code ?? 'fail'));
                });
            }}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'detail',
                  action: 'reject',
                  values: { rxId: 'rx-1', reason: 'Illegible' },
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
                  screen: 'detail',
                  action: 'dispense',
                  values: { rxId: 'rx-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'dispensed' : (result.code ?? 'fail'));
                });
            }}
          >
            Dispense
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'detail',
                  action: 'dispenseToBilling',
                  values: { rxId: 'rx-1' },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? (result.cart_id ?? 'ok')
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Handoff
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function registerStub(): RemoteImporter {
  return async () => ({
    default: function RegisterStub(props: Record<string, unknown>) {
      const data = props.data as { feature: RxFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-retain">
            {String(data.feature.canViewRetention)}
          </p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'drug-register', action: 'load' })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.register?.length ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load register
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'drug-register', action: 'loadRetention' })
                .then((result) => {
                  setLog(result.ok ? 'rules' : (result.code ?? 'fail'));
                });
            }}
          >
            Load retention
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('RxRemotePage', () => {
  it('locks the queue on FREE and keeps the handoff flag off', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    subscribeTelemetry((event) => events.push(event));
    wrap(
      <RxRemotePage screen="queue" loadRemote={queueStub()} />,
      '/prescriptions',
      SESSION_FIXTURES['owner-free'],
    );
    expect(screen.getByTestId('rx-queue-page')).toBeTruthy();
    expect(await screen.findByTestId('can-mutate')).toHaveTextContent('false');
    expect(screen.getByTestId('handoff')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load queue' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'PLAN_FEATURE_LOCKED',
    );
    expect(events).toContain('plan_lock_shown');
  });

  it('loads the queue for Starter+ owners', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { prescriptions: [{ rx_id: 'rx-1' }] },
      details: { page: 1 },
    });
    wrap(
      <RxRemotePage screen="queue" loadRemote={queueStub()} />,
      '/prescriptions',
    );
    await user.click(await screen.findByRole('button', { name: 'Load queue' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
  });

  it('renders a degraded outlet without a remote loader', async () => {
    wrap(<RxRemotePage screen="queue" />, '/prescriptions');
    expect(await screen.findByTestId('rx-queue-page')).toBeTruthy();
  });

  it('clears rxId off the detail contract and uses a configured remote URL', async () => {
    vi.stubEnv('VITE_REMOTE_RX_URL', 'https://example.test/mf-manifest.json');
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('rx-id')).toHaveTextContent('');
    expect(screen.getByTestId('can-mutate')).toHaveTextContent('false');
  });

  it('lets a Starter pharmacist mutate', async () => {
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions/rx-1',
      { ...SESSION_FIXTURES.pharmacist, plan: 'STARTER' },
    );
    expect(await screen.findByTestId('can-mutate')).toHaveTextContent('true');
  });

  it('hides cashier mutations and blocks approve', async () => {
    const user = userEvent.setup();
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions/rx-1',
      { ...SESSION_FIXTURES.cashier, plan: 'STARTER' },
    );
    expect(await screen.findByTestId('rx-id')).toHaveTextContent('rx-1');
    expect(screen.getByTestId('can-mutate')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
  });

  it('approves, rejects, and dispenses with generic toasts', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { rx_id: 'rx-1', status: 'APPROVED' },
    });
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions/rx-1',
    );
    await user.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('approved');
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('rejected');
    await user.click(screen.getByRole('button', { name: 'Dispense' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('dispensed');
  });

  it('navigates to POS when dispense-to-billing returns cart_id', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { cart_id: 'cart-9' },
    });
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions/rx-1',
    );
    await user.click(await screen.findByRole('button', { name: 'Handoff' }));
    expect(await screen.findByTestId('pos-target')).toBeTruthy();
  });

  it('stays on detail when handoff has no cart_id', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: 'DISPENSED' },
    });
    wrap(
      <RxRemotePage screen="detail" loadRemote={detailStub()} />,
      '/prescriptions/rx-1',
    );
    await user.click(await screen.findByRole('button', { name: 'Handoff' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('ok');
    expect(screen.queryByTestId('pos-target')).toBeNull();
  });

  it('tracks a Core plan lock and loads the register for Free', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    subscribeTelemetry((event) => events.push(event));
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        data: undefined as never,
        code: 'MODULE_NOT_IN_PLAN',
        message: 'Upgrade',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { entries: [{ entry_id: 'reg-1' }] },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { guidance: 'Keep two years.' },
      });
    wrap(
      <RxRemotePage screen="queue" loadRemote={queueStub()} />,
      '/prescriptions',
    );
    await user.click(await screen.findByRole('button', { name: 'Load queue' }));
    await waitFor(() => {
      expect(events).toContain('plan_lock_shown');
    });
    cleanup();
    wrap(
      <RxRemotePage screen="drug-register" loadRemote={registerStub()} />,
      '/compliance/drug-register',
      SESSION_FIXTURES['owner-free'],
    );
    expect(await screen.findByTestId('can-retain')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load register' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Load retention' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('rules');
  });

  it('denies staff retention', async () => {
    const user = userEvent.setup();
    wrap(
      <RxRemotePage screen="drug-register" loadRemote={registerStub()} />,
      '/compliance/drug-register',
      SESSION_FIXTURES['staff-active'],
    );
    expect(await screen.findByTestId('can-retain')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load retention' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
  });
});
