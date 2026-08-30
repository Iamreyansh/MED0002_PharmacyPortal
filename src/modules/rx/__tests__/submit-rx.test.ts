import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/rx/lib/query';
import { submitDrugRegister } from '@/modules/rx/lib/submit-drug-register';
import { submitPrescriptions } from '@/modules/rx/lib/submit-prescriptions';

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

describe('rx query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { q: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ rx_id: '1' })).toEqual({ rx_id: '1' });
    expect(
      asCollection({ prescriptions: [{ rx_id: '1' }] }, ['prescriptions']),
    ).toEqual([{ rx_id: '1' }]);
    expect(asCollection([{ rx_id: '1' }], ['prescriptions'])).toEqual([
      { rx_id: '1' },
    ]);
    expect(asCollection({ nope: 1 }, ['prescriptions'])).toEqual([]);
    expect(asCollection(null, ['prescriptions'])).toEqual([]);
  });
});

describe('rx submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitPrescriptions({ screen: 'drug-register', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitDrugRegister({ screen: 'queue', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitPrescriptions({
        screen: 'queue',
        action: 'approve',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitDrugRegister({
        screen: 'drug-register',
        action: 'approve',
      } as never),
    ).toMatchObject({ ok: false });
  });

  it('loads the queue and detail', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ prescriptions: [{ rx_id: 'rx-1' }] }, { page: 1 }),
    );
    expect(
      await submitPrescriptions({
        screen: 'queue',
        action: 'load',
        values: { page: 1, status: 'PENDING_REVIEW' },
      }),
    ).toMatchObject({
      ok: true,
      prescriptions: [{ rx_id: 'rx-1' }],
      meta: { page: 1 },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/prescriptions?page=1&status=PENDING_REVIEW',
      method: 'GET',
    });
    request.mockResolvedValueOnce(
      ok({ rx_id: 'rx-1', status: 'PENDING_REVIEW' }),
    );
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'load',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({
      ok: true,
      prescription: { rx_id: 'rx-1' },
    });
  });

  it('approves, rejects, and dispenses', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(ok({ rx_id: 'rx-1', status: 'APPROVED' }));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'approve',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: true, approve: { status: 'APPROVED' } });
    request.mockResolvedValueOnce(ok({ rx_id: 'rx-1', status: 'REJECTED' }));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'reject',
        values: { rxId: 'rx-1', reason: 'Illegible' },
      }),
    ).toMatchObject({ ok: true, reject: { status: 'REJECTED' } });
    expect(request.mock.calls.at(-1)?.[0]).toMatchObject({
      path: '/api/v1/pharmacy/prescriptions/rx-1/reject',
      body: { reason: 'Illegible' },
    });
    request.mockResolvedValueOnce(ok({ rx_id: 'rx-1', status: 'DISPENSED' }));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'dispense',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: true, dispense: { status: 'DISPENSED' } });
  });

  it('returns cart_id from dispense-to-billing', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ cart_id: 'cart-9', status: 'DISPENSED' }),
    );
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'dispenseToBilling',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: true, cart_id: 'cart-9' });
  });

  it('maps prescription failures', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('RX_NOT_FOUND', 'Gone', 404));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'load',
        values: { rxId: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'RX_NOT_FOUND' });
    request.mockResolvedValueOnce(fail('INSUFFICIENT_STOCK'));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'dispense',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: false, code: 'INSUFFICIENT_STOCK' });
  });

  it('loads the register and retention rules', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ entries: [{ entry_id: 'reg-1' }] }, { page: 1 }),
    );
    expect(
      await submitDrugRegister({
        screen: 'drug-register',
        action: 'load',
        values: { page: 1, schedule: 'H1' },
      }),
    ).toMatchObject({
      ok: true,
      register: [{ entry_id: 'reg-1' }],
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/compliance/drug-register?page=1&schedule=H1',
      method: 'GET',
    });
    request.mockResolvedValueOnce(ok({ guidance: 'Keep two years.' }));
    expect(
      await submitDrugRegister({
        screen: 'drug-register',
        action: 'loadRetention',
      }),
    ).toMatchObject({
      ok: true,
      retention: { guidance: 'Keep two years.' },
    });
  });

  it('maps mutation failures', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('VALIDATION_ERROR', 'Bad'));
    expect(
      await submitPrescriptions({
        screen: 'queue',
        action: 'load',
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    request.mockResolvedValueOnce(fail('ILLEGAL_STATE'));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'approve',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: false, code: 'ILLEGAL_STATE' });
    request.mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'reject',
        values: { rxId: 'rx-1', reason: '' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    request.mockResolvedValueOnce(fail('PLAN_UPGRADE_REQUIRED'));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'dispenseToBilling',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: false, code: 'PLAN_UPGRADE_REQUIRED' });
    request.mockResolvedValueOnce(ok({ status: 'DISPENSED' }));
    expect(
      await submitPrescriptions({
        screen: 'detail',
        action: 'dispenseToBilling',
        values: { rxId: 'rx-1' },
      }),
    ).toMatchObject({ ok: true, cart_id: null });
  });

  it('maps register failures', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitDrugRegister({ screen: 'drug-register', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    request.mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitDrugRegister({
        screen: 'drug-register',
        action: 'loadRetention',
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
