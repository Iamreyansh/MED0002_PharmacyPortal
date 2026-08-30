import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  asCollection,
  asMeta,
  asNested,
  asObject,
  withQuery,
} from '@/modules/billing/lib/query';
import { submitInvoiceSettings } from '@/modules/billing/lib/submit-invoice-settings';
import { submitInvoices } from '@/modules/billing/lib/submit-invoices';
import { submitSales } from '@/modules/billing/lib/submit-sales';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function ok<T>(data: T, details?: unknown, status = 200): HostApiResponse<T> {
  return { ok: true, status, data, details };
}

function fail(
  code: string,
  message = code,
  status = 403,
): HostApiResponse<never> {
  return { ok: false, status, data: undefined as never, code, message };
}

describe('billing query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { q: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asNested({ period_summary: [] }, 'period_summary')).toBeNull();
    expect(asNested(null, 'period_summary')).toBeNull();
    expect(
      asNested({ period_summary: { bill_count: 1 } }, 'period_summary'),
    ).toEqual({ bill_count: 1 });
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ invoice_id: '1' })).toEqual({ invoice_id: '1' });
    expect(
      asCollection({ invoices: [{ invoice_id: '1' }] }, ['invoices']),
    ).toEqual([{ invoice_id: '1' }]);
    expect(asCollection({ nope: 1 }, ['invoices'])).toEqual([]);
    expect(asCollection(null, ['invoices'])).toEqual([]);
  });
});

describe('billing submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitInvoices({ screen: 'sales', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitInvoiceSettings({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitSales({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitInvoices({
        screen: 'invoices',
        action: 'save',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'pdf',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'save',
      } as never),
    ).toMatchObject({ ok: false });
  });

  it('loads invoices, detail, excel, pdf, and share', async () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:file',
      revokeObjectURL: revoke,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          { invoices: [{ invoice_id: 'inv-1', invoice_number: 'INV-1' }] },
          { page: 1, has_next: true },
        ),
      )
      .mockResolvedValueOnce(ok({ invoice_id: 'inv-1', line_items: [] }))
      .mockResolvedValueOnce(ok(new Blob(['xlsx'])))
      .mockResolvedValueOnce(ok(new Blob(['pdf'])))
      .mockResolvedValueOnce(ok({ channel: 'WHATSAPP', message_id: 'm1' }))
      .mockResolvedValueOnce(fail('INVOICE_NOT_FOUND'))
      .mockResolvedValueOnce(fail('CHANNEL_UNAVAILABLE'))
      .mockResolvedValueOnce(ok('not-a-blob' as never));

    expect(
      await submitInvoices({
        screen: 'invoices',
        action: 'load',
        values: { page: 1, q: 'INV', from_date: '2026-08-01' },
      }),
    ).toMatchObject({
      ok: true,
      invoices: [{ invoice_id: 'inv-1' }],
      meta: { page: 1, has_next: true },
    });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'load',
        values: { invoiceId: 'inv-1' },
      }),
    ).toMatchObject({ ok: true, invoice: { invoice_id: 'inv-1' } });
    expect(
      await submitInvoices({
        screen: 'invoices',
        action: 'exportExcel',
        values: { from_date: '2026-08-01' },
      }),
    ).toMatchObject({ ok: true, downloaded: true });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'pdf',
        values: { invoiceId: 'inv-1', template: 'MODERN' },
      }),
    ).toMatchObject({ ok: true, downloaded: true });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'share',
        values: {
          invoiceId: 'inv-1',
          channel: 'WHATSAPP',
          recipient_phone_or_email: '+919999999999',
        },
      }),
    ).toMatchObject({ ok: true, share: { channel: 'WHATSAPP' } });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'load',
        values: { invoiceId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'INVOICE_NOT_FOUND' });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'share',
        values: {
          invoiceId: 'inv-1',
          channel: 'SMS',
          recipient_phone_or_email: 'x',
        },
      }),
    ).toMatchObject({ ok: false, code: 'CHANNEL_UNAVAILABLE' });
    expect(
      await submitInvoices({
        screen: 'invoices',
        action: 'exportExcel',
      }),
    ).toMatchObject({ ok: true, downloaded: true });
    expect(request).toHaveBeenCalled();
    expect(
      request.mock.calls.some((call) =>
        String(call[0]?.path).includes('export=EXCEL'),
      ),
    ).toBe(true);
  });

  it('maps invoice binary and list failures', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('MODULE_NOT_IN_PLAN'))
      .mockResolvedValueOnce(fail('EXPORT_RANGE_TOO_LARGE'))
      .mockResolvedValueOnce(fail('INVOICE_NOT_FOUND'));
    expect(
      await submitInvoices({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
    expect(
      await submitInvoices({ screen: 'invoices', action: 'exportExcel' }),
    ).toMatchObject({ ok: false, code: 'EXPORT_RANGE_TOO_LARGE' });
    expect(
      await submitInvoices({
        screen: 'invoice-detail',
        action: 'pdf',
        values: { invoiceId: 'inv-1' },
      }),
    ).toMatchObject({ ok: false, code: 'INVOICE_NOT_FOUND' });
  });

  it('loads and patches invoice settings including staff 403', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ invoice_prefix: 'INV', template: 'MODERN' }))
      .mockResolvedValueOnce(ok({ invoice_prefix: 'GST', template: 'MINIMAL' }))
      .mockResolvedValueOnce(fail('FORBIDDEN'))
      .mockResolvedValueOnce(fail('INVALID_PREFIX_FORMAT'))
      .mockResolvedValueOnce(fail('MODULE_NOT_IN_PLAN'));
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'load',
      }),
    ).toMatchObject({ ok: true, settings: { invoice_prefix: 'INV' } });
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'save',
        values: { invoice_prefix: 'GST' },
      }),
    ).toMatchObject({ ok: true, settings: { invoice_prefix: 'GST' } });
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'save',
        values: { invoice_prefix: 'GST' },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'save',
        values: { invoice_prefix: 'bad' },
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_PREFIX_FORMAT' });
    expect(
      await submitInvoiceSettings({
        screen: 'invoice-settings',
        action: 'load',
      }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
  });

  it('loads sales, summary, detail, excel, and mark-paid', async () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:sales',
      revokeObjectURL: revoke,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          {
            sales: [{ sale_id: 'inv-1', payment_status: 'PENDING' }],
            period_summary: { bill_count: 1 },
          },
          { page: 1 },
        ),
      )
      .mockResolvedValueOnce(ok({ total_bills: 1, total_revenue: 100 }))
      .mockResolvedValueOnce(
        ok({ invoice_id: 'inv-1', sale_id: 'inv-1', grand_total: 100 }),
      )
      .mockResolvedValueOnce(ok(new Blob(['xlsx'])))
      .mockResolvedValueOnce(
        ok({ sale_id: 'inv-1', new_payment_status: 'PAID' }),
      )
      .mockResolvedValueOnce(fail('SALE_NOT_FOUND'))
      .mockResolvedValueOnce(fail('STAFF_CANNOT_MARK_PAID'))
      .mockResolvedValueOnce(fail('SALE_ALREADY_PAID'))
      .mockResolvedValueOnce(ok('plain' as never));

    expect(
      await submitSales({
        screen: 'sales',
        action: 'load',
        values: { from_date: '2026-08-01', payment_status: 'PENDING' },
      }),
    ).toMatchObject({
      ok: true,
      sales: [{ sale_id: 'inv-1' }],
      period_summary: { bill_count: 1 },
    });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'loadSummary',
        values: { from_date: '2026-08-01' },
      }),
    ).toMatchObject({ ok: true, summary: { total_bills: 1 } });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'loadSale',
        values: { saleId: 'inv-1' },
      }),
    ).toMatchObject({ ok: true, sale: { sale_id: 'inv-1' } });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'exportExcel',
        values: {
          from_date: '2026-01-01',
          to_date: '2026-08-01',
          channel: 'COUNTER',
          payment_method: 'CASH',
          payment_status: 'PENDING',
          q: 'INV',
          financial_year: '2026-27',
        },
      }),
    ).toMatchObject({ ok: true, downloaded: true });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'markPaid',
        values: {
          saleId: 'inv-1',
          payment_mode: 'CASH',
          amount: 100,
          reference_number: 'R1',
          note: 'Collected',
        },
      }),
    ).toMatchObject({ ok: true, markPaid: { new_payment_status: 'PAID' } });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'loadSale',
        values: { saleId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'SALE_NOT_FOUND' });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'markPaid',
        values: { saleId: 'inv-1', payment_mode: 'CASH', amount: 100 },
      }),
    ).toMatchObject({ ok: false, code: 'STAFF_CANNOT_MARK_PAID' });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'markPaid',
        values: { saleId: 'inv-1', payment_mode: 'CASH', amount: 100 },
      }),
    ).toMatchObject({ ok: false, code: 'SALE_ALREADY_PAID' });
    expect(
      await submitSales({ screen: 'sales', action: 'exportExcel' }),
    ).toMatchObject({ ok: true, downloaded: true });
  });

  it('maps sales load and export failures', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('MODULE_NOT_IN_PLAN'))
      .mockResolvedValueOnce(fail('UNAUTHORIZED'))
      .mockResolvedValueOnce(fail('EXPORT_RANGE_TOO_LARGE'))
      .mockResolvedValueOnce(fail('POS_TOKEN_RESTRICTED', ''));
    expect(
      await submitSales({ screen: 'sales', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
    expect(
      await submitSales({ screen: 'sales', action: 'loadSummary' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    expect(
      await submitSales({ screen: 'sales', action: 'exportExcel' }),
    ).toMatchObject({ ok: false, code: 'EXPORT_RANGE_TOO_LARGE' });
    expect(
      await submitSales({
        screen: 'sales',
        action: 'markPaid',
        values: { saleId: 'inv-1', payment_mode: 'CASH', amount: 100 },
      }),
    ).toMatchObject({
      ok: false,
      code: 'POS_TOKEN_RESTRICTED',
      formError: expect.stringMatching(/session/),
    });
  });

  it('reads collections from arrays and nested objects', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ invoice_id: 'inv-2' }]),
    );
    expect(
      await submitInvoices({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ invoices: [{ invoice_id: 'inv-2' }] });
  });
});
