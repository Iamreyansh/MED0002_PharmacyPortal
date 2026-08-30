import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { CSV_MAX_BYTES } from '@medmate/procurement-contract';
import { hostApi } from '@/modules/api';
import { asMeta, asNested, withQuery } from '@/modules/procurement/lib/query';
import { submitDistributors } from '@/modules/procurement/lib/submit-distributors';
import { submitEditor } from '@/modules/procurement/lib/submit-editor';
import { submitPurchases } from '@/modules/procurement/lib/submit-purchases';
import { submitReorder } from '@/modules/procurement/lib/submit-reorder';

afterEach(() => {
  vi.restoreAllMocks();
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

const csvFile = new File(['a,b'], 'ok.csv', { type: 'text/csv' });

describe('procurement query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { status: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asNested({ kpi: [] }, 'kpi')).toBeNull();
    expect(asNested(null, 'kpi')).toBeNull();
  });
});

describe('procurement submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitPurchases({
        screen: 'editor',
        action: 'load',
        values: { grn_id: 'g1' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitEditor({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitDistributors({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitReorder({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'refresh',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'loadPurchaseOrders',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'refresh',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'create',
      } as never),
    ).toMatchObject({ ok: false });
  });

  it('maps purchases list, create, CSV FormData, confirm, and 10MB', async () => {
    const request = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(
        {
          kpi: { total_grns: 2 },
          grns: [{ grn_id: 'grn-1', status: 'DRAFT' }],
        },
        { page: 1, has_next: true },
      ),
    );
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'load',
        values: { page: 1, limit: 20, status: 'DRAFT', q: 'inv' },
      }),
    ).toMatchObject({
      ok: true,
      grns: [{ grn_id: 'grn-1' }],
      kpi: { total_grns: 2 },
      meta: { page: 1 },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/purchases?page=1&limit=20&status=DRAFT&q=inv',
      }),
    );

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok([]));
    expect(
      await submitPurchases({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: true, grns: [], kpi: null });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitPurchases({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: true, grns: [], meta: {} });

    const created = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ grn_id: 'grn-2', status: 'DRAFT' }));
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'create',
        values: {
          distributor_id: 'd1',
          invoice_number: 'INV-1',
          invoice_date: '2026-07-22',
        },
      }),
    ).toMatchObject({ ok: true, grn: { grn_id: 'grn-2' } });
    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/purchases',
        method: 'POST',
        idempotencyKey: expect.any(String),
      }),
    );

    const imported = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({
        grn_id: 'grn-csv',
        unmatched_items: [{ row_number: 12 }],
      }),
    );
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'importCsv',
        values: {
          file: csvFile,
          distributor_id: 'd1',
          invoice_number: 'INV-CSV',
          invoice_date: '2026-07-22',
        },
      }),
    ).toMatchObject({ ok: true, importPreview: { grn_id: 'grn-csv' } });
    const form = imported.mock.calls[0]?.[0]?.body as FormData;
    expect(form.get('distributor_id')).toBe('d1');
    expect(form.get('invoice_number')).toBe('INV-CSV');
    expect(form.get('invoice_date')).toBe('2026-07-22');
    expect((form.get('csv_file') as File).name).toBe('ok.csv');

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ items_created: 4, grn_id: 'grn-csv' }),
    );
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'confirmImport',
        values: { grn_id: 'grn-csv' },
      }),
    ).toMatchObject({ ok: true, itemsCreated: 4 });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'confirmImport',
        values: { grn_id: 'grn-csv' },
      }),
    ).toMatchObject({ ok: true, itemsCreated: null });

    const blocked = vi.spyOn(hostApi, 'request');
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'importCsv',
        values: {
          file: new File([new Uint8Array(CSV_MAX_BYTES + 1)], 'big.csv', {
            type: 'text/csv',
          }),
          distributor_id: 'd1',
          invoice_number: 'INV',
          invoice_date: '2026-07-22',
        },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(blocked).not.toHaveBeenCalled();

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitPurchases({ screen: 'purchases', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('DUPLICATE_INVOICE_NUMBER'),
    );
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'create',
        values: {
          distributor_id: 'd1',
          invoice_number: 'INV-1',
          invoice_date: '2026-07-22',
        },
      }),
    ).toMatchObject({ ok: false, code: 'DUPLICATE_INVOICE_NUMBER' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'importCsv',
        values: {
          file: csvFile,
          distributor_id: 'd1',
          invoice_number: 'INV',
          invoice_date: '2026-07-22',
        },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('GRN_NOT_FOUND'));
    expect(
      await submitPurchases({
        screen: 'purchases',
        action: 'confirmImport',
        values: { grn_id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'GRN_NOT_FOUND' });
  });

  it('maps editor load, item CRUD, and owner stock-in', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({
        grn_id: 'grn-1',
        items: [{ item_id: 'item-1' }],
        totals: { grand_total: 10 },
      }),
    );
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'load',
        values: { grn_id: 'grn-1' },
      }),
    ).toMatchObject({ ok: true, grn: { grn_id: 'grn-1' } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'load',
        values: { grn_id: 'grn-1' },
      }),
    ).toMatchObject({ ok: true, grn: null });

    const added = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ item_id: 'item-2', quantity: 5 }));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'addItem',
        values: {
          grn_id: 'grn-1',
          product_id: 'prod-1',
          quantity: 5,
          free_quantity: 1,
        },
      }),
    ).toMatchObject({ ok: true, item: { item_id: 'item-2' } });
    expect(added).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/purchases/grn-1/items',
        method: 'POST',
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ item_id: 'item-1', quantity: 8 }),
    );
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'patchItem',
        values: { grn_id: 'grn-1', item_id: 'item-1', quantity: 8 },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'deleteItem',
        values: { grn_id: 'grn-1', item_id: 'item-1' },
      }),
    ).toMatchObject({ ok: true, deleted: true });
    const stocked = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ grn_id: 'grn-1', status: 'STOCKED' }));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'saveAndStock',
        values: { grn_id: 'grn-1' },
      }),
    ).toMatchObject({ ok: true, grn: { status: 'STOCKED' } });
    expect(stocked).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/purchases/grn-1/save-and-stock',
        method: 'POST',
        idempotencyKey: expect.any(String),
      }),
    );

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('GRN_NOT_FOUND'));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'load',
        values: { grn_id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'GRN_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'addItem',
        values: { grn_id: 'grn-1', quantity: -1 },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'patchItem',
        values: { grn_id: 'grn-1', item_id: 'item-1', quantity: 1 },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'deleteItem',
        values: { grn_id: 'grn-1', item_id: 'item-1' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('STAFF_CANNOT_STOCK'),
    );
    expect(
      await submitEditor({
        screen: 'editor',
        action: 'saveAndStock',
        values: { grn_id: 'grn-1' },
      }),
    ).toMatchObject({ ok: false, code: 'STAFF_CANNOT_STOCK' });
  });

  it('maps distributor CRUD, supply-list, preferred, and compare', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(
        {
          kpi: { distributor_count: 1 },
          distributors: [{ id: 'd1', firm_name: 'Medico' }],
        },
        { page: 1 },
      ),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'load',
        values: { page: 1, is_active: true },
      }),
    ).toMatchObject({ ok: true, distributors: [{ id: 'd1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok([{ id: 'd2' }]));
    expect(
      await submitDistributors({ screen: 'distributors', action: 'load' }),
    ).toMatchObject({ ok: true, distributors: [{ id: 'd2' }] });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ id: 'd3', firm_name: 'New' }),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'create',
        values: { firm_name: 'New', phone: '+91', gstin: '27A' },
      }),
    ).toMatchObject({ ok: true, distributor: { id: 'd3' } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ id: 'd1', is_active: false }),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'patch',
        values: { id: 'd1', is_active: false },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({ id: 'd-missing' }));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'patch',
        values: { firm_name: 'X' },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'delete',
        values: { id: 'd1' },
      }),
    ).toMatchObject({ ok: true, deleted: true });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ supply_items: [{ product_id: 'prod-1' }] }),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'loadSupply',
        values: { id: 'd1', page: 1 },
      }),
    ).toMatchObject({ ok: true, supplyItems: [{ product_id: 'prod-1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'setPreferred',
        values: { id: 'd1', product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: true, supplyItems: [] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ products: [{ product_id: 'prod-1' }] }),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'loadPriceCompare',
        values: { only_multi_source: true },
      }),
    ).toMatchObject({ ok: true, compare: [{ product_id: 'prod-1' }] });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PLAN_FEATURE_LOCKED'),
    );
    expect(
      await submitDistributors({ screen: 'distributors', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'PLAN_FEATURE_LOCKED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'create',
        values: { firm_name: 'X' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('DISTRIBUTOR_NOT_FOUND'),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'patch',
        values: { id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'DISTRIBUTOR_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'delete',
        values: { id: 'd1' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('DISTRIBUTOR_NOT_FOUND'),
    );
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'loadSupply',
        values: { id: 'missing' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'setPreferred',
        values: { id: 'd1', product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitDistributors({
        screen: 'distributors',
        action: 'loadPriceCompare',
      }),
    ).toMatchObject({ ok: false });
  });

  it('maps reorder suggestions, PO draft, send, and record-grn', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(
        {
          kpi: { items_below_reorder_level: 2 },
          suggestion_groups: [{ distributor_id: 'd1', items: [] }],
        },
        { page: 1 },
      ),
    );
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'load',
        values: { group_by: 'distributor', page: 1 },
      }),
    ).toMatchObject({
      ok: true,
      suggestionGroups: [{ distributor_id: 'd1' }],
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ last_refreshed_at: '2026-07-24T12:30:00Z' }),
    );
    expect(
      await submitReorder({ screen: 'reorder', action: 'refresh' }),
    ).toMatchObject({ ok: true, refreshedAt: '2026-07-24T12:30:00Z' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitReorder({ screen: 'reorder', action: 'refresh' }),
    ).toMatchObject({ ok: true, refreshedAt: null });

    const created = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({ po_id: 'po-2', status: 'DRAFT', items_count: 1 }),
      );
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'createPo',
        values: {
          distributor_id: 'd1',
          items: [{ product_id: 'prod-1', quantity: 2 }],
        },
      }),
    ).toMatchObject({ ok: true, purchaseOrder: { po_id: 'po-2' } });
    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/reorder/create-po',
        idempotencyKey: expect.any(String),
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ purchase_orders: [{ po_id: 'po-1', status: 'DRAFT' }] }),
    );
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'loadPurchaseOrders',
        values: { status: 'DRAFT', page: 1 },
      }),
    ).toMatchObject({ ok: true, purchaseOrders: [{ po_id: 'po-1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ po_id: 'po-2', items_count: 2 }),
    );
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'patchPo',
        values: {
          po_id: 'po-2',
          add_items: [{ product_id: 'prod-9', quantity: 4 }],
        },
      }),
    ).toMatchObject({ ok: true, purchaseOrder: { items_count: 2 } });
    const sent = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ po_id: 'po-2', status: 'SENT' }));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'send',
        values: { po_id: 'po-2' },
      }),
    ).toMatchObject({ ok: true, purchaseOrder: { status: 'SENT' } });
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/reorder/purchase-orders/po-2/send',
        body: { channel: 'WHATSAPP' },
        idempotencyKey: expect.any(String),
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ grn_id: 'grn-9', grn_status: 'DRAFT' }),
    );
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'recordGrn',
        values: {
          po_id: 'po-2',
          invoice_number: 'INV-PO',
          invoice_date: '2026-08-09',
        },
      }),
    ).toMatchObject({ ok: true, recordGrn: { grn_id: 'grn-9' } });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PLAN_FEATURE_LOCKED'),
    );
    expect(
      await submitReorder({ screen: 'reorder', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'PLAN_FEATURE_LOCKED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitReorder({ screen: 'reorder', action: 'refresh' }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'createPo',
        values: { distributor_id: 'd1', items: [] },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'loadPurchaseOrders',
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('PO_NOT_FOUND'));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'patchPo',
        values: { po_id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'PO_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'send',
        values: { po_id: 'po-2', channel: 'WHATSAPP' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('PO_NOT_FOUND'));
    expect(
      await submitReorder({
        screen: 'reorder',
        action: 'recordGrn',
        values: {
          po_id: 'missing',
          invoice_number: 'INV',
          invoice_date: '2026-08-09',
        },
      }),
    ).toMatchObject({ ok: false });
  });
});
