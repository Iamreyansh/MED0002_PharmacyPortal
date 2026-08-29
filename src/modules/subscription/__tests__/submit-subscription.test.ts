import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { submitBilling } from '@/modules/subscription/lib/submit-billing';
import { submitPlans } from '@/modules/subscription/lib/submit-plans';

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T, status = 200): HostApiResponse<T> {
  return { ok: true, status, data };
}

function fail(
  code: string,
  message = code,
  status = 403,
): HostApiResponse<never> {
  return { ok: false, status, data: undefined as never, code, message };
}

describe('subscription submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitPlans({
        screen: 'billing',
        action: 'load',
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitBilling({ screen: 'plans', action: 'load' }),
    ).toMatchObject({ ok: false });
  });

  it('loads plans for owners and treats staff catalogue 403 as forbidden', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok({
          plans: [{ id: 'plan-free', name: 'FREE', seat_limit: 1 }],
        }),
      )
      .mockResolvedValueOnce(ok({ current_plan: 'FREE' }));
    const loaded = await submitPlans({ screen: 'plans', action: 'load' });
    expect(loaded).toMatchObject({
      ok: true,
      plansForbidden: false,
      subscription: { current_plan: 'FREE' },
    });

    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('FORBIDDEN'))
      .mockResolvedValueOnce(ok({ current_plan: 'STARTER' }));
    const staff = await submitPlans({ screen: 'plans', action: 'load' });
    expect(staff).toMatchObject({
      ok: true,
      plans: [],
      plansForbidden: true,
      subscription: { current_plan: 'STARTER' },
    });

    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('FORBIDDEN'))
      .mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(
      await submitPlans({ screen: 'plans', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(fail('FORBIDDEN'))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: undefined as never,
      });
    expect(
      await submitPlans({ screen: 'plans', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('normalizes plan arrays and subscribe idempotency', async () => {
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok([{ id: 'p1', name: 'STARTER' }]))
      .mockResolvedValueOnce(ok({ current_plan: 'FREE' }));
    const listed = await submitPlans({ screen: 'plans', action: 'load' });
    expect(listed).toMatchObject({ ok: true, plans: [{ id: 'p1' }] });

    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(ok({ current_plan: 'STARTER' }));
    await submitPlans({
      screen: 'plans',
      action: 'subscribe',
      values: { plan_id: 'plan-starter', idempotencyKey: 'intent-1' },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/subscription/subscribe',
        idempotencyKey: 'intent-1',
        body: { plan_id: 'plan-starter' },
      }),
    );
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'upgrade',
        values: { plan_id: 'plan-growth' },
      }),
    ).toMatchObject({ ok: true });
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'downgrade',
        values: { plan_id: 'plan-free' },
      }),
    ).toMatchObject({ ok: true });
    expect(
      await submitPlans({ screen: 'plans', action: 'cancel' }),
    ).toMatchObject({ ok: true });
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'autoRenew',
        values: { enabled: false },
      }),
    ).toMatchObject({ ok: true, subscription: { current_plan: 'STARTER' } });
  });

  it('returns Core codes when plan mutations fail', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue(fail('VALIDATION_ERROR'));
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'subscribe',
        values: { plan_id: 'x' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'autoRenew',
        values: { enabled: true },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });

  it('loads invoices, invoice detail, and public pay fields only', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ invoices: [{ id: 'inv-1', status: 'unpaid' }] }),
    );
    expect(
      await submitBilling({ screen: 'billing', action: 'load' }),
    ).toMatchObject({
      ok: true,
      invoices: [{ id: 'inv-1' }],
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ items: [{ id: 'inv-2' }] }),
    );
    expect(
      await submitBilling({ screen: 'billing', action: 'load' }),
    ).toMatchObject({
      ok: true,
      invoices: [{ id: 'inv-2' }],
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({ id: 'inv-1' }));
    expect(
      await submitBilling({
        screen: 'billing',
        action: 'loadInvoice',
        values: { id: 'inv-1' },
      }),
    ).toMatchObject({ ok: true, invoice: { id: 'inv-1' } });

    const request = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({
        payment_link: 'https://pay.example/a',
        cashfree_secret: 'nope',
      }),
    );
    const paid = await submitBilling({
      screen: 'billing',
      action: 'pay',
      values: { invoice_id: 'inv-1', idempotencyKey: 'pay-1' },
    });
    expect(paid).toEqual({
      ok: true,
      pay: { payment_link: 'https://pay.example/a' },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/billing/pay',
        idempotencyKey: 'pay-1',
      }),
    );
  });

  it('maps billing failures and empty lists', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitBilling({ screen: 'billing', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('INVOICE_NOT_FOUND'),
    );
    expect(
      await submitBilling({
        screen: 'billing',
        action: 'loadInvoice',
        values: { id: 'missing' },
      }),
    ).toMatchObject({ ok: false, code: 'INVOICE_NOT_FOUND' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR'),
    );
    expect(
      await submitBilling({
        screen: 'billing',
        action: 'pay',
        values: { invoice_id: 'inv-1' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitBilling({ screen: 'billing', action: 'load' }),
    ).toMatchObject({ ok: true, invoices: [] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitBilling({
        screen: 'billing',
        action: 'loadInvoice',
        values: { id: 'inv-1' },
      }),
    ).toMatchObject({ ok: true, invoice: null });
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({}))
      .mockResolvedValueOnce(ok(null as never));
    expect(
      await submitPlans({ screen: 'plans', action: 'load' }),
    ).toMatchObject({
      ok: true,
      plans: [],
      subscription: null,
    });
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ items: [{ id: 'p2', name: 'FREE' }] }))
      .mockResolvedValueOnce(ok({ current_plan: 'FREE' }));
    expect(
      await submitPlans({ screen: 'plans', action: 'load' }),
    ).toMatchObject({
      ok: true,
      plans: [{ id: 'p2' }],
    });
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok([{ id: 'p3', name: 'FREE' }]))
      .mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitPlans({ screen: 'plans', action: 'load' }),
    ).toMatchObject({
      ok: true,
      plans: [{ id: 'p3' }],
      subscription: null,
      plansForbidden: false,
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ id: 'inv-3', status: 'paid' }]),
    );
    expect(
      await submitBilling({ screen: 'billing', action: 'load' }),
    ).toMatchObject({
      ok: true,
      invoices: [{ id: 'inv-3' }],
    });
    expect(
      await submitPlans({
        screen: 'plans',
        action: 'pay',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitBilling({
        screen: 'billing',
        action: 'subscribe',
      } as never),
    ).toMatchObject({ ok: false });
  });
});
