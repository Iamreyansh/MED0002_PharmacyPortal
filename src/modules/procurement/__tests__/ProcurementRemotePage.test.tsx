import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ProcurementCommand,
  ProcurementFeatureData,
} from '@medmate/procurement-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { ProcurementRemotePage } from '@/modules/procurement';
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
  session = SESSION_FIXTURES['owner-free'],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/purchases" element={ui} />
            <Route path="/purchases/:grnId" element={ui} />
            <Route path="/distributors" element={ui} />
            <Route path="/reorder" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function purchasesStub(): RemoteImporter {
  return async () => ({
    default: function PurchasesStub(props: Record<string, unknown>) {
      const data = props.data as { feature: ProcurementFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="can-stock">{String(data.feature.canStockIn)}</p>
          <p data-testid="role">{data.feature.role ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'purchases',
                  action: 'load',
                  values: { page: 1 },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.grns?.length ?? 0)
                      : (result.formError ?? 'fail'),
                  );
                });
            }}
          >
            Load purchases
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'purchases',
                  action: 'create',
                  values: {
                    distributor_id: 'd1',
                    invoice_number: 'INV-1',
                    invoice_date: '2026-07-22',
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'created' : (result.code ?? 'fail'));
                });
            }}
          >
            Create GRN
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'purchases',
                  action: 'importCsv',
                  values: {
                    file: new File(['a'], 'ok.csv', { type: 'text/csv' }),
                    distributor_id: 'd1',
                    invoice_number: 'INV-CSV',
                    invoice_date: '2026-07-22',
                  },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? (result.importPreview?.grn_id ?? 'preview')
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'purchases',
                  action: 'confirmImport',
                  values: { grn_id: 'grn-csv' },
                })
                .then((result) => {
                  setLog(result.ok ? 'confirmed' : (result.code ?? 'fail'));
                });
            }}
          >
            Confirm import
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function editorStub(): RemoteImporter {
  return async () => ({
    default: function EditorStub(props: Record<string, unknown>) {
      const data = props.data as { feature: ProcurementFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="grn-id">{data.feature.grnId ?? ''}</p>
          <p data-testid="can-stock">{String(data.feature.canStockIn)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'editor',
                  action: 'saveAndStock',
                  values: { grn_id: data.feature.grnId ?? 'grn-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'stocked' : (result.code ?? 'fail'));
                });
            }}
          >
            Save and stock
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function growthLoadCommand(
  screen: ProcurementFeatureData['screen'],
): ProcurementCommand {
  if (screen === 'distributors') {
    return { screen: 'distributors', action: 'load' };
  }
  return { screen: 'reorder', action: 'load' };
}

function growthStub(): RemoteImporter {
  return async () => ({
    default: function GrowthStub(props: Record<string, unknown>) {
      const data = props.data as { feature: ProcurementFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-growth">{String(data.feature.canAccessGrowth)}</p>
          <p data-testid="can-mutate">
            {String(data.feature.canMutateDistributors)}
          </p>
          <p data-testid="can-send">{String(data.feature.canSendPo)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit(growthLoadCommand(data.feature.screen))
                .then((result) => {
                  setLog(result.ok ? 'loaded' : (result.code ?? 'fail'));
                });
            }}
          >
            Load growth
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'distributors',
                  action: 'create',
                  values: { firm_name: 'New Firm' },
                })
                .then((result) => {
                  setLog(result.ok ? 'created' : (result.code ?? 'fail'));
                });
            }}
          >
            Create distributor
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'distributors',
                  action: 'delete',
                  values: { id: 'd1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'deleted' : (result.code ?? 'fail'));
                });
            }}
          >
            Delete distributor
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'distributors',
                  action: 'setPreferred',
                  values: { id: 'd1', product_id: 'prod-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'preferred' : (result.code ?? 'fail'));
                });
            }}
          >
            Set preferred
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'distributors',
                  action: 'loadPriceCompare',
                })
                .then((result) => {
                  setLog(result.ok ? 'compare' : (result.code ?? 'fail'));
                });
            }}
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'reorder', action: 'refresh' })
                .then((result) => {
                  setLog(result.ok ? 'refreshed' : (result.code ?? 'fail'));
                });
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'reorder',
                  action: 'createPo',
                  values: {
                    distributor_id: 'd1',
                    items: [{ product_id: 'prod-1', quantity: 1 }],
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'po' : (result.code ?? 'fail'));
                });
            }}
          >
            Create PO
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'reorder',
                  action: 'send',
                  values: { po_id: 'po-1', channel: 'WHATSAPP' },
                })
                .then((result) => {
                  setLog(result.ok ? 'sent' : (result.code ?? 'fail'));
                });
            }}
          >
            Send PO
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('ProcurementRemotePage', () => {
  it('lets staff load purchases and blocks stock-in without calling Core', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { grns: [{ grn_id: 'grn-1' }] },
    });
    wrap(
      <ProcurementRemotePage screen="purchases" loadRemote={purchasesStub()} />,
      '/purchases',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('true');
    expect(screen.getByTestId('can-stock')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('pharmacy_staff');
    await user.click(screen.getByRole('button', { name: 'Load purchases' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('1');
    });

    cleanup();
    request.mockClear();
    wrap(
      <ProcurementRemotePage screen="editor" loadRemote={editorStub()} />,
      '/purchases/grn-1',
      SESSION_FIXTURES['staff-star'],
    );
    expect(await screen.findByTestId('can-stock')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Save and stock' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('STAFF_CANNOT_STOCK');
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('lets a Growth owner stock in and toast', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { grn_id: 'grn-1', status: 'STOCKED' },
    });
    wrap(
      <ProcurementRemotePage screen="editor" loadRemote={editorStub()} />,
      '/purchases/grn-1',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    expect(await screen.findByTestId('grn-id')).toHaveTextContent('grn-1');
    await user.click(screen.getByRole('button', { name: 'Save and stock' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('stocked');
    });
    expect(await screen.findByText('Receipt stocked')).toBeTruthy();
  });

  it('locks Free from Growth screens without an API call', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    const sink = vi.fn();
    subscribeTelemetry(sink);
    wrap(
      <ProcurementRemotePage screen="distributors" loadRemote={growthStub()} />,
      '/distributors',
      SESSION_FIXTURES['owner-free'],
    );
    expect(await screen.findByTestId('can-growth')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load growth' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(request).not.toHaveBeenCalled();
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'distributors',
    });

    cleanup();
    sink.mockClear();
    wrap(
      <ProcurementRemotePage screen="reorder" loadRemote={growthStub()} />,
      '/reorder',
      SESSION_FIXTURES['owner-free'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load growth' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', { code: 'reorder' });
  });

  it('tracks PLAN_FEATURE_LOCKED from Core on Growth', async () => {
    const user = userEvent.setup();
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
      <ProcurementRemotePage screen="distributors" loadRemote={growthStub()} />,
      '/distributors',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load growth' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'distributors',
    });

    cleanup();
    sink.mockClear();
    wrap(
      <ProcurementRemotePage screen="reorder" loadRemote={growthStub()} />,
      '/reorder',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load growth' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent(
        'PLAN_FEATURE_LOCKED',
      );
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', { code: 'reorder' });
  });

  it('imports CSV then confirms and toasts create/delete/send/preferred', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockImplementation(async (input) => {
      if (String(input.path).includes('import-csv')) {
        return { ok: true, status: 200, data: { grn_id: 'grn-csv' } };
      }
      if (String(input.path).includes('confirm-import')) {
        return { ok: true, status: 200, data: { items_created: 4 } };
      }
      if (String(input.path).includes('set-preferred')) {
        return { ok: true, status: 200, data: {} };
      }
      if (String(input.path).endsWith('/send')) {
        return { ok: true, status: 200, data: { status: 'SENT' } };
      }
      return { ok: true, status: 200, data: { grn_id: 'grn-2', id: 'd2' } };
    });
    wrap(
      <ProcurementRemotePage screen="purchases" loadRemote={purchasesStub()} />,
      '/purchases',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(await screen.findByRole('button', { name: 'Create GRN' }));
    expect(await screen.findByText('GRN created')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Import CSV' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('grn-csv');
    });
    await user.click(screen.getByRole('button', { name: 'Confirm import' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('confirmed');
    });

    cleanup();
    wrap(
      <ProcurementRemotePage screen="distributors" loadRemote={growthStub()} />,
      '/distributors',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Create distributor' }),
    );
    expect(await screen.findByText('Distributor added')).toBeTruthy();
    await user.click(
      screen.getByRole('button', { name: 'Delete distributor' }),
    );
    expect(await screen.findByText('Distributor removed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Set preferred' }));
    expect(await screen.findByText('Preferred source saved')).toBeTruthy();

    cleanup();
    wrap(
      <ProcurementRemotePage screen="reorder" loadRemote={growthStub()} />,
      '/reorder',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(await screen.findByRole('button', { name: 'Send PO' }));
    expect(await screen.findByText('Purchase order sent')).toBeTruthy();
  });

  it('blocks staff mutations without calling Core, then surfaces 403 if forced', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <ProcurementRemotePage screen="distributors" loadRemote={growthStub()} />,
      '/distributors',
      { ...SESSION_FIXTURES['staff-star'], plan: 'RETAIL_PRO' },
    );
    expect(await screen.findByTestId('can-mutate')).toHaveTextContent('false');
    await user.click(
      screen.getByRole('button', { name: 'Create distributor' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('FORBIDDEN');
    });
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('FORBIDDEN');
    });
    expect(request).not.toHaveBeenCalled();

    cleanup();
    wrap(
      <ProcurementRemotePage screen="reorder" loadRemote={growthStub()} />,
      '/reorder',
      { ...SESSION_FIXTURES['staff-star'], plan: 'RETAIL_PRO' },
    );
    expect(await screen.findByTestId('can-send')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('FORBIDDEN');
    });
    await user.click(screen.getByRole('button', { name: 'Create PO' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('FORBIDDEN');
    });
    expect(request).not.toHaveBeenCalled();

    request.mockResolvedValue({
      ok: false,
      status: 403,
      data: undefined as never,
      code: 'STAFF_CANNOT_STOCK',
      message: 'Nope',
    });
    const { submitEditor } =
      await import('@/modules/procurement/lib/submit-editor');
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'saveAndStock',
        values: { grn_id: 'grn-1' },
      }),
    ).toMatchObject({ ok: false, code: 'STAFF_CANNOT_STOCK' });
    expect(request).toHaveBeenCalled();
  });

  it('uses a null GRN id when the editor param is missing', async () => {
    wrap(
      <ProcurementRemotePage screen="editor" loadRemote={editorStub()} />,
      '/purchases',
    );
    expect(await screen.findByTestId('grn-id')).toHaveTextContent('');
  });

  it('falls back when the remote is missing', async () => {
    wrap(<ProcurementRemotePage screen="purchases" />, '/purchases');
    expect(
      await screen.findByTestId('procurement-purchases-page'),
    ).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_PROCUREMENT_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<ProcurementRemotePage screen="purchases" />, '/purchases');
    expect(
      await screen.findByTestId('procurement-purchases-page'),
    ).toBeTruthy();
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('builds a sparse envelope and tracks MODULE_NOT_IN_PLAN', async () => {
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
      <ProcurementRemotePage screen="reorder" loadRemote={growthStub()} />,
      '/reorder',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load growth' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('MODULE_NOT_IN_PLAN');
    });
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', { code: 'reorder' });

    cleanup();
    wrap(
      <ProcurementRemotePage screen="purchases" loadRemote={purchasesStub()} />,
      '/purchases',
      {
        ...SESSION_FIXTURES.unauthenticated,
        pharmacyId: null,
        staffId: null,
      },
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('');
  });

  it('dispatches mismatched screen actions through the feature hook', async () => {
    const user = userEvent.setup();
    wrap(
      <ProcurementRemotePage
        screen="purchases"
        loadRemote={async () => ({
          default: function MismatchStub(props: Record<string, unknown>) {
            const data = props.data as { feature: ProcurementFeatureData };
            const [log, setLog] = useState('');
            return (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    void data.feature
                      .onSubmit({
                        screen: 'editor',
                        action: 'load',
                        values: { grn_id: 'grn-1' },
                      })
                      .then((result) => {
                        setLog(result.ok ? 'ok' : (result.formError ?? 'fail'));
                      });
                  }}
                >
                  Mismatch
                </button>
                <p data-testid="log">{log}</p>
              </div>
            );
          },
        })}
      />,
      '/purchases',
      SESSION_FIXTURES['owner-retail-pro'],
    );
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { grn_id: 'grn-1' },
    });
    await user.click(await screen.findByRole('button', { name: 'Mismatch' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('ok');
    });
  });
});
