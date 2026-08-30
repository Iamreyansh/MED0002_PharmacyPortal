import type {
  FinanceCommand,
  FinanceSubmitResult,
  SettlementDetail,
  SettlementListRow,
} from '@medmate/finance-contract';
import { hostApi } from '@/modules/api';
import { isUuid } from '@/modules/auth';
import { failureResult } from '@/modules/finance/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/finance/lib/query';

const SETTLEMENTS_PATH = '/api/v1/pharmacy/finance/settlements';

function invalidId(): FinanceSubmitResult {
  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    formError: 'This settlement id is not a valid UUID.',
  };
}

export async function submitSettlements(
  command: FinanceCommand,
): Promise<FinanceSubmitResult> {
  if (command.screen === 'settlements' && command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(SETTLEMENTS_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      settlements: asCollection<SettlementListRow>(result.data, [
        'settlements',
        'items',
        'rows',
      ]),
      meta: asMeta(result.details),
    };
  }
  if (command.screen === 'settlement-detail' && command.action === 'load') {
    if (!command.values?.settlementId || !isUuid(command.values.settlementId)) {
      return invalidId();
    }
    const result = await hostApi.request<unknown>({
      path: `${SETTLEMENTS_PATH}/${command.values.settlementId}`,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, settlement: asObject<SettlementDetail>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load settlements.' };
}
