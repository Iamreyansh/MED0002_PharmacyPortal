import type {
  SupportCommand,
  SupportSubmitResult,
  SupportTicket,
} from '@medmate/support-contract';
import { isSupportUuid } from '@medmate/support-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/support/lib/errors';
import { ticketFrom, ticketIdFrom } from '@/modules/support/lib/query';

const TICKETS_PATH = '/api/v1/support/tickets';

function invalidId(): SupportSubmitResult {
  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    formError: 'This ticket id is not a valid UUID.',
  };
}

async function loadTicket(ticketId: string): Promise<SupportSubmitResult> {
  const result = await hostApi.request<unknown>({
    path: `${TICKETS_PATH}/${ticketId}`,
    method: 'GET',
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return {
    ok: true,
    ticket: ticketFrom(result.data),
    ticketId,
  };
}

export async function submitTickets(
  command: SupportCommand,
): Promise<SupportSubmitResult> {
  if (command.screen === 'ticket-new' && command.action === 'create') {
    const result = await hostApi.request<unknown>({
      path: TICKETS_PATH,
      method: 'POST',
      body: {
        subject: command.values.subject,
        description: command.values.description,
        category: command.values.category ?? 'PHARMACY',
      },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    const ticket = ticketFrom(result.data);
    return {
      ok: true,
      ticket,
      ticketId: ticketIdFrom(result.data),
    };
  }

  if (command.screen !== 'ticket-detail') {
    return { ok: false, formError: 'This screen cannot load tickets.' };
  }
  if (!command.values?.ticketId || !isSupportUuid(command.values.ticketId)) {
    return invalidId();
  }
  const ticketId = command.values.ticketId;

  if (command.action === 'load') {
    return loadTicket(ticketId);
  }

  if (command.action === 'reply') {
    const result = await hostApi.request<unknown>({
      path: `${TICKETS_PATH}/${ticketId}/reply`,
      method: 'POST',
      body: { body: command.values.body },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return loadTicket(ticketId);
  }

  if (command.action === 'csat') {
    const result = await hostApi.request<unknown>({
      path: `${TICKETS_PATH}/${ticketId}/csat`,
      method: 'POST',
      body: { rating: command.values.rating },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return loadTicket(ticketId);
  }

  if (command.action === 'reopen') {
    const result = await hostApi.request<unknown>({
      path: `${TICKETS_PATH}/${ticketId}/reopen`,
      method: 'POST',
      body: { reason: command.values.reason },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return loadTicket(ticketId);
  }

  return { ok: false, formError: 'This screen cannot action a ticket.' };
}

export type { SupportTicket };
