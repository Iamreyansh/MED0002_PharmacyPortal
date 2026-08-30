import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  articleFrom,
  articleIdFrom,
  articlesFrom,
  asCollection,
  asObject,
  ticketFrom,
  ticketIdFrom,
} from '@/modules/support/lib/query';
import { submitTickets } from '@/modules/support/lib/submit-tickets';

const TICKET_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

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

describe('support query helper', () => {
  it('reads tickets, articles, and collections', () => {
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ id: '1' })).toEqual({ id: '1' });
    expect(asCollection([{ id: '1' }], ['articles'])).toEqual([{ id: '1' }]);
    expect(asCollection({ articles: [{ id: '2' }] }, ['articles'])).toEqual([
      { id: '2' },
    ]);
    expect(
      asCollection({ items: [{ id: '3' }] }, ['articles', 'items']),
    ).toEqual([{ id: '3' }]);
    expect(asCollection({ nope: 1 }, ['articles'])).toEqual([]);
    expect(asCollection(null, ['articles'])).toEqual([]);
    expect(ticketFrom({ id: TICKET_ID })).toEqual({ id: TICKET_ID });
    expect(ticketIdFrom({ ticket_id: TICKET_ID })).toBe(TICKET_ID);
    expect(ticketIdFrom(null)).toBeNull();
    expect(articlesFrom({ articles: [{ id: 'hours' }] })).toEqual([
      { id: 'hours' },
    ]);
    expect(articleFrom({ id: 'hours', title: 'Hours' })).toEqual({
      id: 'hours',
      title: 'Hours',
    });
    expect(articleIdFrom({ article_id: 'hours' })).toBe('hours');
  });
});

describe('submitTickets', () => {
  it('creates then loads by id and never lists', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ id: TICKET_ID, subject: 'Printer' }))
      .mockResolvedValue(ok({ id: TICKET_ID, subject: 'Printer' }));
    expect(
      await submitTickets({
        screen: 'ticket-new',
        action: 'create',
        values: {
          subject: 'Printer',
          description: 'Down',
          category: 'PHARMACY',
        },
      }),
    ).toMatchObject({ ok: true, ticketId: TICKET_ID });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/support/tickets',
        method: 'POST',
      }),
    );
    expect(
      request.mock.calls.some(
        (call) => call[0].path === '/api/v1/support/tickets',
      ),
    ).toBe(true);
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'load',
        values: { ticketId: TICKET_ID },
      }),
    ).toMatchObject({ ok: true, ticket: { id: TICKET_ID } });
    expect(request).toHaveBeenCalledWith({
      path: `/api/v1/support/tickets/${TICKET_ID}`,
      method: 'GET',
    });
    expect(
      request.mock.calls.some(
        (call) =>
          call[0].method === 'GET' &&
          call[0].path === '/api/v1/support/tickets',
      ),
    ).toBe(false);
  });

  it('replies, submits CSAT, and reopens then refreshes', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(ok({ id: TICKET_ID, status: 'OPEN' }));
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'reply',
        values: { ticketId: TICKET_ID, body: 'Still down' },
      }),
    ).toMatchObject({ ok: true });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `/api/v1/support/tickets/${TICKET_ID}/reply`,
        method: 'POST',
        body: { body: 'Still down' },
      }),
    );
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'csat',
        values: { ticketId: TICKET_ID, rating: 5 },
      }),
    ).toMatchObject({ ok: true });
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'reopen',
        values: { ticketId: TICKET_ID, reason: 'Failed again' },
      }),
    ).toMatchObject({ ok: true });
  });

  it('maps Core failures and rejects invalid ids', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(fail('TICKET_NOT_FOUND', 'Missing', 404));
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'load',
        values: { ticketId: TICKET_ID },
      }),
    ).toMatchObject({ ok: false, code: 'TICKET_NOT_FOUND' });
    request.mockClear();
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'load',
        values: { ticketId: 'nope' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(request).not.toHaveBeenCalled();
    expect(
      await submitTickets({
        screen: 'help',
        action: 'load',
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitTickets({
        screen: 'ticket-new',
        action: 'create',
        values: { subject: 'Hi' },
      }),
    ).toMatchObject({ ok: false, code: 'TICKET_NOT_FOUND' });
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'reply',
        values: { ticketId: TICKET_ID, body: 'x' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'csat',
        values: { ticketId: TICKET_ID, rating: 1 },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'reopen',
        values: { ticketId: TICKET_ID, reason: 'x' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitTickets({
        screen: 'ticket-detail',
        action: 'quote',
        values: { ticketId: TICKET_ID },
      } as never),
    ).toMatchObject({ ok: false });
  });
});
