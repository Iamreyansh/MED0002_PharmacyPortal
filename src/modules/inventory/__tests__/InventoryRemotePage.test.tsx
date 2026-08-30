import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InventoryFeatureData } from '@medmate/inventory-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { InventoryRemotePage } from '@/modules/inventory';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import {
  applyStorefrontStatus,
  resetStorefrontStatus,
} from '@/modules/settings';
import { ToastProvider } from '@/modules/shell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetTelemetry();
  resetStorefrontStatus();
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
            <Route path="/inventory" element={ui} />
            <Route path="/inventory/expiry" element={ui} />
            <Route path="/inventory/:productId" element={ui} />
            <Route path="/racks" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function listStub(): RemoteImporter {
  return async () => ({
    default: function ListStub(props: Record<string, unknown>) {
      const data = props.data as { feature: InventoryFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="can-toggle">{String(data.feature.canToggleOnline)}</p>
          <p data-testid="role">{data.feature.role}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'list',
                  action: 'load',
                  values: { page: 1 },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.products?.length ?? 0)
                      : (result.formError ?? 'fail'),
                  );
                });
            }}
          >
            Load list
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
      const data = props.data as { feature: InventoryFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="product-id">{data.feature.productId ?? ''}</p>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="can-toggle">{String(data.feature.canToggleOnline)}</p>
          <p data-testid="can-write-off">{String(data.feature.canWriteOff)}</p>
          <p data-testid="storefront">
            {String(data.feature.storefrontOnline)}
          </p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'detail',
                  action: 'load',
                  values: { product_id: data.feature.productId ?? 'missing' },
                })
                .then((result) => {
                  setLog(result.ok ? 'loaded' : (result.code ?? 'fail'));
                });
            }}
          >
            Load product
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'detail',
                  action: 'patchProduct',
                  values: {
                    product_id: data.feature.productId ?? 'prod-1',
                    is_online_visible: true,
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'patched' : (result.code ?? 'fail'));
                });
            }}
          >
            Toggle online
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'detail',
                action: 'writeOff',
                values: { product_id: 'prod-1', batch_id: 'b1', quantity: 1 },
              });
            }}
          >
            Write off
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function racksStub(): RemoteImporter {
  return async () => ({
    default: function RacksStub(props: Record<string, unknown>) {
      const data = props.data as { feature: InventoryFeatureData };
      return (
        <div>
          <p data-testid="can-manage">{String(data.feature.canManageRacks)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'racks',
                action: 'assign',
                values: { product_id: 'prod-2', rack_code: 'A1' },
              });
            }}
          >
            Assign
          </button>
        </div>
      );
    },
  });
}

describe('InventoryRemotePage', () => {
  it('keeps cashiers read-only and pages list results', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { products: [{ product_id: 'prod-1' }] },
      details: { page: 1, has_next: false },
    });
    wrap(
      <InventoryRemotePage screen="list" loadRemote={listStub()} />,
      '/inventory',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('can-toggle')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('pharmacy_staff');
    await user.click(screen.getByRole('button', { name: 'Load list' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('1');
    });
  });

  it('lets a Growth owner PATCH online visibility', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { product_id: 'prod-1', is_online_visible: true },
    });
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    expect(await screen.findByTestId('can-toggle')).toHaveTextContent('true');
    expect(screen.getByTestId('product-id')).toHaveTextContent('prod-1');
    await user.click(screen.getByRole('button', { name: 'Toggle online' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('patched');
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/inventory/prod-1',
        method: 'PATCH',
      }),
    );
    expect(await screen.findByText('Product updated')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Write off' }));
    expect(await screen.findByText('Batch written off')).toBeTruthy();
  });

  it('blocks Free from enabling online without a PATCH', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    const sink = vi.fn();
    subscribeTelemetry(sink);
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['owner-free'],
    );
    expect(await screen.findByTestId('can-toggle')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Toggle online' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(request).not.toHaveBeenCalled();
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'online_visibility',
    });
  });

  it('blocks staff from enabling online and surfaces a 404', async () => {
    const user = userEvent.setup();
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['staff-star'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Toggle online' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('FORBIDDEN');
    });

    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 404,
      data: undefined as never,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Gone',
    });
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/missing',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load product' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('PRODUCT_NOT_FOUND');
    });
  });

  it('passes a storefront-offline hint and tracks a Core plan lock', async () => {
    const user = userEvent.setup();
    applyStorefrontStatus({ is_online: false });
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    expect(await screen.findByTestId('storefront')).toHaveTextContent('false');

    cleanup();
    const sink = vi.fn();
    subscribeTelemetry(sink);
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 403,
      data: undefined as never,
      code: 'PLAN_FEATURE_LOCKED',
      message: 'Upgrade',
    });
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Toggle online' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'online_visibility',
    });
  });

  it('assigns unlocated stock from racks and toasts', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: {},
    });
    wrap(
      <InventoryRemotePage screen="racks" loadRemote={racksStub()} />,
      '/racks',
    );
    expect(await screen.findByTestId('can-manage')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText('Rack assigned')).toBeTruthy();
  });

  it('tracks MODULE_NOT_IN_PLAN on a Growth toggle and builds a sparse envelope', async () => {
    const user = userEvent.setup();
    const sink = vi.fn();
    subscribeTelemetry(sink);
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 403,
      data: undefined as never,
      code: 'MODULE_NOT_IN_PLAN',
    });
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory/prod-1',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Toggle online' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('MODULE_NOT_IN_PLAN');
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'online_visibility',
    });

    cleanup();
    wrap(
      <InventoryRemotePage screen="list" loadRemote={listStub()} />,
      '/inventory',
      {
        ...SESSION_FIXTURES.unauthenticated,
        pharmacyId: null,
        staffId: null,
      },
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('can-toggle')).toHaveTextContent('false');
  });

  it('loads expiry alerts through the host submitter', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { alerts: [{ product_id: 'prod-1' }] },
    });
    wrap(
      <InventoryRemotePage
        screen="expiry"
        loadRemote={async () => ({
          default: function ExpiryStub(props: Record<string, unknown>) {
            const data = props.data as { feature: InventoryFeatureData };
            const [log, setLog] = useState('');
            return (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    void data.feature
                      .onSubmit({ screen: 'expiry', action: 'loadAlerts' })
                      .then((result) => {
                        setLog(result.ok ? 'alerts' : 'fail');
                      });
                  }}
                >
                  Load alerts
                </button>
                <p data-testid="log">{log}</p>
              </div>
            );
          },
        })}
      />,
      '/inventory/expiry',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load alerts' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('alerts');
    });
  });

  it('uses a null product id when the detail param is missing', async () => {
    wrap(
      <InventoryRemotePage screen="detail" loadRemote={detailStub()} />,
      '/inventory',
    );
    expect(await screen.findByTestId('product-id')).toHaveTextContent('');
  });

  it('falls back when the remote is missing', async () => {
    wrap(<InventoryRemotePage screen="expiry" />, '/inventory/expiry');
    expect(await screen.findByTestId('inventory-expiry-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_INVENTORY_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<InventoryRemotePage screen="list" />, '/inventory');
    expect(await screen.findByTestId('inventory-list-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });
});
