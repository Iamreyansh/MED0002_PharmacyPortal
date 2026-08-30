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
import { submitKhata } from '@/modules/billing/lib/submit-khata';
import { submitOffers } from '@/modules/billing/lib/submit-offers';
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
    expect(
      await submitKhata({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitOffers({ screen: 'invoices', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitKhata({
        screen: 'khata',
        action: 'save',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'pdf',
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

  it('loads khata list, history, detail, excel, repay, and remind', async () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:khata',
      revokeObjectURL: revoke,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          {
            customers: [{ customer_id: 'cust-1', outstanding: 8500 }],
            kpi: { total_outstanding: 8500 },
            aging_chart: { current_0_30d: 5500 },
          },
          { page: 1 },
        ),
      )
      .mockResolvedValueOnce(
        ok(
          {
            repayments: [{ receipt_id: 'r1', amount: 5000 }],
            period_total_collected: 5000,
          },
          { page: 1 },
        ),
      )
      .mockResolvedValueOnce(
        ok({ customer: { customer_id: 'cust-1' }, total_outstanding: 8500 }),
      )
      .mockResolvedValueOnce(ok(new Blob(['xlsx'])))
      .mockResolvedValueOnce(
        ok({ receipt_number: 'RCPT-1', new_outstanding: 3500 }),
      )
      .mockResolvedValueOnce(ok({ message_id: 'wa_1', channel: 'WHATSAPP' }))
      .mockResolvedValueOnce(fail('CUSTOMER_NOT_FOUND'))
      .mockResolvedValueOnce(fail('REPAYMENT_EXCEEDS_OUTSTANDING'))
      .mockResolvedValueOnce(fail('STAFF_CANNOT_REMIND'))
      .mockResolvedValueOnce(ok('plain' as never));

    expect(
      await submitKhata({
        screen: 'khata',
        action: 'load',
        values: { page: 1, overdue_only: true, sort: 'outstanding_desc' },
      }),
    ).toMatchObject({
      ok: true,
      customers: [{ customer_id: 'cust-1' }],
      kpi: { total_outstanding: 8500 },
      aging: { current_0_30d: 5500 },
    });
    expect(
      await submitKhata({
        screen: 'khata',
        action: 'loadHistory',
        values: {
          page: 2,
          limit: 10,
          from_date: '2026-07-01',
          to_date: '2026-07-31',
          payment_mode: 'CASH',
          q: 'Ramesh',
        },
      }),
    ).toMatchObject({
      ok: true,
      repayments: [{ receipt_id: 'r1' }],
      period_total_collected: 5000,
    });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'load',
        values: { customerId: 'cust-1' },
      }),
    ).toMatchObject({
      ok: true,
      khata: { customer: { customer_id: 'cust-1' } },
    });
    expect(
      await submitKhata({ screen: 'khata', action: 'exportExcel' }),
    ).toMatchObject({ ok: true, downloaded: true });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'repay',
        values: {
          customerId: 'cust-1',
          amount: 5000,
          payment_mode: 'CASH',
          idempotencyKey: 'repay-1',
        },
      }),
    ).toMatchObject({ ok: true, repayment: { receipt_number: 'RCPT-1' } });
    expect(
      request.mock.calls.some((call) => call[0]?.idempotencyKey === 'repay-1'),
    ).toBe(true);
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'remind',
        values: {
          customerId: 'cust-1',
          channel: 'WHATSAPP',
          message_template: 'POLITE',
        },
      }),
    ).toMatchObject({ ok: true, remind: { message_id: 'wa_1' } });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'load',
        values: { customerId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'CUSTOMER_NOT_FOUND' });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'repay',
        values: { customerId: 'cust-1', amount: 9999, payment_mode: 'CASH' },
      }),
    ).toMatchObject({
      ok: false,
      code: 'REPAYMENT_EXCEEDS_OUTSTANDING',
      fieldErrors: { amount: expect.any(String) },
    });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'remind',
        values: {
          customerId: 'cust-1',
          channel: 'SMS',
          message_template: 'FIRM',
        },
      }),
    ).toMatchObject({ ok: false, code: 'STAFF_CANNOT_REMIND' });
    expect(
      await submitKhata({ screen: 'khata', action: 'exportExcel' }),
    ).toMatchObject({ ok: true, downloaded: true });
  });

  it('maps khata load and export failures', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('PLAN_FEATURE_LOCKED'))
      .mockResolvedValueOnce(fail('MODULE_NOT_IN_PLAN'))
      .mockResolvedValueOnce(fail('EXPORT_RANGE_TOO_LARGE'));
    expect(
      await submitKhata({ screen: 'khata', action: 'load' }),
    ).toMatchObject({
      ok: false,
      code: 'PLAN_FEATURE_LOCKED',
    });
    expect(
      await submitKhata({ screen: 'khata', action: 'loadHistory' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
    expect(
      await submitKhata({ screen: 'khata', action: 'exportExcel' }),
    ).toMatchObject({ ok: false, code: 'EXPORT_RANGE_TOO_LARGE' });
  });

  it('treats missing khata history totals as null and generates a repay key', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ repayments: [] }))
      .mockResolvedValueOnce(ok({ receipt_number: 'RCPT-2' }))
      .mockResolvedValueOnce(ok(new Blob(['xlsx'])));
    expect(
      await submitKhata({ screen: 'khata', action: 'loadHistory' }),
    ).toMatchObject({ ok: true, period_total_collected: null });
    expect(
      await submitKhata({
        screen: 'khata-detail',
        action: 'repay',
        values: {
          customerId: 'cust-1',
          amount: 10,
          payment_mode: 'UPI',
        },
      }),
    ).toMatchObject({ ok: true });
    expect(request.mock.calls[1]?.[0]?.idempotencyKey).toBeTruthy();
    expect(
      await submitKhata({
        screen: 'khata',
        action: 'exportExcel',
        values: {
          from_date: '2026-01-01',
          to_date: '2026-08-01',
          payment_mode: 'CARD',
          q: 'RCPT',
        },
      }),
    ).toMatchObject({ ok: true, downloaded: true });
  });

  it('loads offers and runs owner mutations plus validate', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          {
            offers: [{ offer_id: 'off-1', title: '10% Off' }],
            kpi: { active_count: 1 },
          },
          { page: 1 },
        ),
      )
      .mockResolvedValueOnce(ok({ offer_id: 'off-2', title: 'New' }))
      .mockResolvedValueOnce(ok({ offer_id: 'off-1', title: 'Edited' }))
      .mockResolvedValueOnce(ok({ offer_id: 'off-1', is_active: false }))
      .mockResolvedValueOnce(ok({ offer_id: 'off-1', action: 'HARD_DELETED' }))
      .mockResolvedValueOnce(ok({ is_valid: true, discount_amount: 42 }))
      .mockResolvedValueOnce(fail('OFFER_NOT_FOUND'))
      .mockResolvedValueOnce(fail('DISCOUNT_EXCEEDS_PLATFORM_LIMIT'))
      .mockResolvedValueOnce(fail('OFFER_EXPIRED'))
      .mockResolvedValueOnce(fail('FORBIDDEN'))
      .mockResolvedValueOnce(fail('PLAN_FEATURE_LOCKED'));

    expect(
      await submitOffers({
        screen: 'offers',
        action: 'load',
        values: { status: 'ACTIVE' },
      }),
    ).toMatchObject({
      ok: true,
      offers: [{ offer_id: 'off-1' }],
      kpi: { active_count: 1 },
    });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'create',
        values: {
          title: 'New',
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          applies_to: 'ALL',
          valid_from: '2026-08-01',
          valid_until: '2026-08-31',
        },
      }),
    ).toMatchObject({ ok: true, offer: { offer_id: 'off-2' } });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'patch',
        values: { offerId: 'off-1', title: 'Edited' },
      }),
    ).toMatchObject({ ok: true, offer: { title: 'Edited' } });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'toggle',
        values: { offerId: 'off-1' },
      }),
    ).toMatchObject({ ok: true, offerToggle: { is_active: false } });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'delete',
        values: { offerId: 'off-1' },
      }),
    ).toMatchObject({ ok: true, offerDelete: { action: 'HARD_DELETED' } });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'validate',
        values: { coupon_code: 'AB12CD', cart_total: 420 },
      }),
    ).toMatchObject({ ok: true, offerValidate: { is_valid: true } });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'toggle',
        values: { offerId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'OFFER_NOT_FOUND' });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'create',
        values: {
          title: 'Too big',
          discount_type: 'PERCENTAGE',
          discount_value: 60,
          applies_to: 'ALL',
          valid_from: '2026-08-01',
          valid_until: '2026-08-31',
        },
      }),
    ).toMatchObject({
      ok: false,
      code: 'DISCOUNT_EXCEEDS_PLATFORM_LIMIT',
      fieldErrors: { discount_value: expect.any(String) },
    });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'patch',
        values: { offerId: 'off-1', title: 'Nope' },
      }),
    ).toMatchObject({ ok: false, code: 'OFFER_EXPIRED' });
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'delete',
        values: { offerId: 'off-1' },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(
      await submitOffers({ screen: 'offers', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'PLAN_FEATURE_LOCKED' });
  });

  it('maps offer validate failures', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitOffers({
        screen: 'offers',
        action: 'validate',
        values: { coupon_code: '', cart_total: 0 },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });
});
