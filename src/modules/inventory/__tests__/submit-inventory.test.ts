import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { withQuery } from '@/modules/inventory/lib/query';
import { submitBatches } from '@/modules/inventory/lib/submit-batches';
import { submitExpiry } from '@/modules/inventory/lib/submit-expiry';
import { submitList } from '@/modules/inventory/lib/submit-list';
import { submitProduct } from '@/modules/inventory/lib/submit-product';
import { submitRacks } from '@/modules/inventory/lib/submit-racks';

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

describe('inventory query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { search: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
  });
});

describe('inventory submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitList({
        screen: 'detail',
        action: 'load',
        values: { product_id: 'p1' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitProduct({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitBatches({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitExpiry({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitRacks({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitList({
        screen: 'list',
        action: 'create',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'loadBatches',
        values: { product_id: 'p1' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'load',
        values: { product_id: 'p1' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitExpiry({
        screen: 'expiry',
        action: 'load',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'loadSummary',
      } as never),
    ).toMatchObject({ ok: false });
  });

  it('maps list pagination, summary cards, and export', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          { products: [{ product_id: 'prod-1', name: 'Crocin' }] },
          { page: 2, has_next: true, total: 40 },
        ),
      );
    expect(
      await submitList({
        screen: 'list',
        action: 'load',
        values: { page: 2, limit: 20, search: 'cro' },
      }),
    ).toMatchObject({
      ok: true,
      products: [{ product_id: 'prod-1' }],
      meta: { page: 2, has_next: true },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/inventory?page=2&limit=20&search=cro',
      }),
    );

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ product_id: 'prod-2', name: 'Augmentin' }]),
    );
    expect(await submitList({ screen: 'list', action: 'load' })).toMatchObject({
      ok: true,
      products: [{ product_id: 'prod-2' }],
    });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(await submitList({ screen: 'list', action: 'load' })).toMatchObject({
      ok: true,
      products: [],
      meta: {},
    });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ summary: { total_products: 12, low_stock: 2 } }),
    );
    expect(
      await submitList({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: true, summary: { total_products: 12 } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ total_products: 3, near_expiry: 1 }),
    );
    expect(
      await submitList({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: true, summary: { total_products: 3 } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitList({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: true, summary: null });

    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:list',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(new Blob(['xlsx'], { type: 'application/vnd.ms-excel' })),
    );
    expect(
      await submitList({
        screen: 'list',
        action: 'export',
        values: { format: 'xlsx' },
      }),
    ).toMatchObject({ ok: true, downloaded: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok('not-a-blob' as never),
    );
    expect(
      await submitList({ screen: 'list', action: 'export' }),
    ).toMatchObject({ ok: true, downloaded: true });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(await submitList({ screen: 'list', action: 'load' })).toMatchObject({
      ok: false,
      code: 'UNAUTHORIZED',
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('MODULE_NOT_IN_PLAN'),
    );
    expect(
      await submitList({ screen: 'list', action: 'loadSummary' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitList({ screen: 'list', action: 'export' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('loads and patches a product including online visibility', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ product_id: 'prod-1', name: 'Crocin', is_online_visible: false }),
    );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'load',
        values: { product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: true, product: { product_id: 'prod-1' } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'load',
        values: { product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: true, product: null });

    const patch = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({ product_id: 'prod-1', is_online_visible: true }),
      );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchProduct',
        values: { product_id: 'prod-1', is_online_visible: true },
      }),
    ).toMatchObject({ ok: true, product: { is_online_visible: true } });
    expect(patch).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/inventory/prod-1',
        method: 'PATCH',
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ product_id: 'prod-1', allow_loose_selling: true }),
    );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchDetails',
        values: { product_id: 'prod-1', allow_loose_selling: true },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ product_id: 'prod-1', rack_location_code: 'A1' }),
    );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchRack',
        values: { product_id: 'prod-1', rack_location_code: 'A1' },
      }),
    ).toMatchObject({ ok: true, product: { rack_location_code: 'A1' } });
  });

  it('maps product contract errors', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PRODUCT_NOT_FOUND'),
    );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'load',
        values: { product_id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PLAN_FEATURE_LOCKED'),
    );
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchProduct',
        values: { product_id: 'prod-1', is_online_visible: true },
      }),
    ).toMatchObject({ ok: false, code: 'PLAN_FEATURE_LOCKED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchDetails',
        values: { product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('RACK_NOT_FOUND'));
    expect(
      await submitProduct({
        screen: 'detail',
        action: 'patchRack',
        values: { product_id: 'prod-1', rack_location_code: 'Z9' },
      }),
    ).toMatchObject({ ok: false, code: 'RACK_NOT_FOUND' });
  });

  it('maps write-off confirm to DELETE and batch CRUD', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ batches: [{ batch_id: 'b1', quantity: 4 }] }),
    );
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'loadBatches',
        values: { product_id: 'prod-1' },
      }),
    ).toMatchObject({ ok: true, batches: [{ batch_id: 'b1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ batch_id: 'b2', quantity: 1 }]),
    );
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'addBatch',
        values: { product_id: 'prod-1', quantity: 1, batch_number: 'B2' },
      }),
    ).toMatchObject({ ok: true, batches: [{ batch_id: 'b2' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'adjustBatch',
        values: { product_id: 'prod-1', batch_id: 'b1', quantity: 8 },
      }),
    ).toMatchObject({ ok: true, batches: [] });
    const writeOff = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'writeOff',
        values: {
          product_id: 'prod-1',
          batch_id: 'b1',
          quantity: 8,
          reason: 'damaged',
        },
      }),
    ).toMatchObject({ ok: true, deleted: true });
    expect(writeOff).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/inventory/prod-1/batches/b1',
        method: 'DELETE',
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('BATCH_NOT_FOUND'));
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'adjustBatch',
        values: { product_id: 'prod-1', batch_id: 'missing', quantity: 1 },
      }),
    ).toMatchObject({ ok: false, code: 'BATCH_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('STAFF_CANNOT_WRITE_OFF'),
    );
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'writeOff',
        values: { product_id: 'prod-1', batch_id: 'b1' },
      }),
    ).toMatchObject({ ok: false, code: 'STAFF_CANNOT_WRITE_OFF' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PRODUCT_NOT_FOUND'),
    );
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'loadBatches',
        values: { product_id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitBatches({
        screen: 'detail',
        action: 'addBatch',
        values: { product_id: 'prod-1', quantity: -1 },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });

  it('loads expiry alerts and owner report export', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ alerts: [{ product_id: 'prod-1', expiry_date: '2026-09-15' }] }),
    );
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadAlerts' }),
    ).toMatchObject({ ok: true, alerts: [{ product_id: 'prod-1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ product_id: 'prod-2' }]),
    );
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadAlerts' }),
    ).toMatchObject({ ok: true, alerts: [{ product_id: 'prod-2' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ report: [{ product_id: 'prod-1' }] }),
    );
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadReport' }),
    ).toMatchObject({ ok: true, report: [{ product_id: 'prod-1' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadReport' }),
    ).toMatchObject({ ok: true, report: [] });
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:expiry',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(new Blob(['xlsx'])));
    expect(
      await submitExpiry({ screen: 'expiry', action: 'exportReport' }),
    ).toMatchObject({ ok: true, downloaded: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok('plain' as never));
    expect(
      await submitExpiry({ screen: 'expiry', action: 'exportReport' }),
    ).toMatchObject({ ok: true, downloaded: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadAlerts' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitExpiry({ screen: 'expiry', action: 'loadReport' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('MODULE_NOT_IN_PLAN'),
    );
    expect(
      await submitExpiry({ screen: 'expiry', action: 'exportReport' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
  });

  it('assigns unlocated stock and prints rack labels', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({
        racks: [{ rack_code: 'A1', description: 'Counter', medicine_count: 3 }],
      }),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'load' }),
    ).toMatchObject({
      ok: true,
      racks: [
        {
          rack_code: 'A1',
          name: 'Counter',
          description: 'Counter',
          product_count: 3,
          medicine_count: 3,
        },
      ],
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ rack_code: 'B1' }]),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'load' }),
    ).toMatchObject({ ok: true, racks: [{ rack_code: 'B1' }] });
    const created = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({ rack_code: 'C1', description: 'Back', zone_name: 'Back' }),
      );
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'create',
        values: { rack_code: 'C1', zone_name: 'Back', name: 'Back' },
      }),
    ).toMatchObject({
      ok: true,
      rack: { rack_code: 'C1', name: 'Back', description: 'Back' },
    });
    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/rack-locations',
        method: 'POST',
        body: {
          rack_code: 'C1',
          zone_name: 'Back',
          description: 'Back',
        },
      }),
    );
    const described = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({ rack_code: 'D1', description: 'Side', zone_name: 'Side' }),
      );
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'create',
        values: { rack_code: 'D1', zone_name: 'Side', description: 'Side' },
      }),
    ).toMatchObject({ ok: true, rack: { rack_code: 'D1' } });
    expect(described).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          rack_code: 'D1',
          zone_name: 'Side',
          description: 'Side',
        },
      }),
    );
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ products: [{ product_id: 'prod-2' }] }),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'loadUnlocated' }),
    ).toMatchObject({ ok: true, unlocated: [{ product_id: 'prod-2' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ unlocated: [{ product_id: 'prod-3' }] }),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'loadUnlocated' }),
    ).toMatchObject({ ok: true, unlocated: [{ product_id: 'prod-3' }] });
    const assign = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'assign',
        values: { product_id: 'prod-2', rack_code: 'A1' },
      }),
    ).toMatchObject({ ok: true });
    expect(assign).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/rack-locations/assign',
        method: 'POST',
        body: { product_ids: ['prod-2'], rack_code: 'A1' },
      }),
    );
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:labels',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    const printed = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({ pdf_url: 'data:application/pdf;base64,JVBERi0=' }),
      );
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'printLabels',
        values: { rack_codes: ['A1'] },
      }),
    ).toMatchObject({ ok: true, printed: true, downloaded: true });
    expect(printed).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/rack-locations/print-labels',
        method: 'POST',
        body: { rack_codes: ['A1'] },
      }),
    );
    expect(printed.mock.calls[0]?.[0]).not.toHaveProperty('binary');
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(new Blob(['pdf'], { type: 'application/pdf' })),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: true, printed: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok('data:application/pdf;base64,JVBERi0='),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: true, printed: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: false, formError: 'Could not download labels.' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({ rack_code: 'A1' }));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'loadOne',
        values: { rack_code: 'A1' },
      }),
    ).toMatchObject({ ok: true, rack: { rack_code: 'A1' } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'create',
        values: { rack_code: 'E1', zone_name: 'Empty' },
      }),
    ).toMatchObject({ ok: true, rack: null });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok([] as never));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'loadOne',
        values: { rack_code: 'E1' },
      }),
    ).toMatchObject({ ok: true, rack: null });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ pdf_url: 'https://example.test/labels.pdf' }),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: false, formError: 'Could not download labels.' });
    vi.stubGlobal('URL', {});
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(new Blob(['pdf'], { type: 'application/pdf' })),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: false, formError: 'Could not download labels.' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'delete',
        values: { rack_code: 'A1' },
      }),
    ).toMatchObject({ ok: true, deleted: true });
  });

  it('maps rack contract errors', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitRacks({ screen: 'racks', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'create',
        values: { rack_code: 'A1', zone_name: 'Counter' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('MODULE_NOT_IN_PLAN'),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'loadUnlocated' }),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'assign',
        values: { product_id: 'p1', rack_code: 'A1' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitRacks({ screen: 'racks', action: 'printLabels' }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('RACK_NOT_FOUND'));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'loadOne',
        values: { rack_code: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'RACK_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitRacks({
        screen: 'racks',
        action: 'delete',
        values: { rack_code: 'A1' },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
