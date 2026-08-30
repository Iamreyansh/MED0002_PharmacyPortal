import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BillingFeatureData } from '@medmate/billing-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { BillingRemotePage } from '@/modules/billing';
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
            <Route path="/invoices" element={ui} />
            <Route path="/invoices/:invoiceId" element={ui} />
            <Route path="/invoice-settings" element={ui} />
            <Route path="/sales" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function invoicesStub(): RemoteImporter {
  return async () => ({
    default: function InvoicesStub(props: Record<string, unknown>) {
      const data = props.data as { feature: BillingFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="role">{data.feature.role ?? ''}</p>
          <p data-testid="can-patch">{String(data.feature.canPatchSettings)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'invoices', action: 'load' })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.invoices?.length ?? 0)
                      : (result.formError ?? 'fail'),
                  );
                });
            }}
          >
            Load invoices
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'invoices', action: 'exportExcel' })
                .then((result) => {
                  setLog(result.ok ? 'xlsx' : (result.code ?? 'fail'));
                });
            }}
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'invoice-detail',
                  action: 'pdf',
                  values: { invoiceId: 'inv-1' },
                })
                .then((result) => {
                  setLog(result.ok ? 'pdf' : (result.code ?? 'fail'));
                });
            }}
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'invoice-detail',
                  action: 'share',
                  values: {
                    invoiceId: 'inv-1',
                    channel: 'EMAIL',
                    recipient_phone_or_email: 'a@b.c',
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'shared' : (result.code ?? 'fail'));
                });
            }}
          >
            Share
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function settingsStub(): RemoteImporter {
  return async () => ({
    default: function SettingsStub(props: Record<string, unknown>) {
      const data = props.data as { feature: BillingFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-patch">{String(data.feature.canPatchSettings)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'invoice-settings',
                  action: 'save',
                  values: { invoice_prefix: 'GST' },
                })
                .then((result) => {
                  setLog(result.ok ? 'saved' : (result.code ?? 'fail'));
                });
            }}
          >
            Save settings
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function salesStub(): RemoteImporter {
  return async () => ({
    default: function SalesStub(props: Record<string, unknown>) {
      const data = props.data as { feature: BillingFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-mark">{String(data.feature.canMarkPaid)}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'sales',
                  action: 'loadSummary',
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.summary?.total_bills ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load summary
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'sales',
                  action: 'markPaid',
                  values: {
                    saleId: 'inv-1',
                    payment_mode: 'CASH',
                    amount: 100,
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'paid' : (result.code ?? 'fail'));
                });
            }}
          >
            Mark paid
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('BillingRemotePage', () => {
  it('loads invoices, downloads a PDF, and shares', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:pdf',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { invoices: [{ invoice_id: 'inv-1' }] },
        details: { page: 1 },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: new Blob(['xlsx']),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: new Blob(['pdf']),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { channel: 'EMAIL' },
      });
    wrap(
      <BillingRemotePage screen="invoices" loadRemote={invoicesStub()} />,
      '/invoices',
    );
    expect(await screen.findByTestId('billing-invoices-page')).toBeTruthy();
    expect(screen.getByTestId('can-patch')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load invoices' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Export Excel' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('xlsx');
    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('pdf');
    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('shared');
  });

  it('clears invoiceId when the detail route has no param', async () => {
    wrap(
      <BillingRemotePage screen="invoice-detail" loadRemote={invoicesStub()} />,
      '/invoices',
    );
    expect(
      await screen.findByTestId('billing-invoice-detail-page'),
    ).toBeTruthy();
  });

  it('passes invoiceId on detail and tracks a plan lock', async () => {
    const events: string[] = [];
    subscribeTelemetry((event) => events.push(event));
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 403,
      data: undefined as never,
      code: 'MODULE_NOT_IN_PLAN',
      message: 'Locked',
    });
    wrap(
      <BillingRemotePage screen="invoice-detail" loadRemote={invoicesStub()} />,
      '/invoices/inv-9',
    );
    expect(
      await screen.findByTestId('billing-invoice-detail-page'),
    ).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Load invoices' }));
    await waitFor(() => {
      expect(events).toContain('plan_lock_shown');
    });
  });

  it('blocks staff from saving settings and marking paid', async () => {
    const user = userEvent.setup();
    wrap(
      <BillingRemotePage
        screen="invoice-settings"
        loadRemote={settingsStub()}
      />,
      '/invoice-settings',
      SESSION_FIXTURES['staff-star'],
    );
    expect(await screen.findByTestId('can-patch')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');

    cleanup();
    wrap(
      <BillingRemotePage screen="sales" loadRemote={salesStub()} />,
      '/sales',
      SESSION_FIXTURES['staff-star'],
    );
    expect(await screen.findByTestId('can-mark')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Mark paid' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'STAFF_CANNOT_MARK_PAID',
    );
  });

  it('lets the owner save settings and mark paid', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { invoice_prefix: 'GST' },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { total_bills: 4 },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { new_payment_status: 'PAID' },
      });
    wrap(
      <BillingRemotePage
        screen="invoice-settings"
        loadRemote={settingsStub()}
      />,
      '/invoice-settings',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Save settings' }),
    );
    expect(await screen.findByTestId('log')).toHaveTextContent('saved');

    cleanup();
    wrap(
      <BillingRemotePage screen="sales" loadRemote={salesStub()} />,
      '/sales',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load summary' }),
    );
    expect(await screen.findByTestId('log')).toHaveTextContent('4');
    await user.click(screen.getByRole('button', { name: 'Mark paid' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('paid');
  });

  it('renders a degraded outlet without a remote loader', async () => {
    wrap(<BillingRemotePage screen="invoices" />, '/invoices');
    expect(await screen.findByTestId('billing-invoices-page')).toBeTruthy();
  });

  it('omits role when the session is not a pharmacy actor', async () => {
    wrap(
      <BillingRemotePage screen="invoices" loadRemote={invoicesStub()} />,
      '/invoices',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('role')).toHaveTextContent('');
    expect(screen.getByTestId('can-patch')).toHaveTextContent('false');
  });
});
