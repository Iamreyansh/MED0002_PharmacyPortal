import type {
  DrugRegisterRow,
  RetentionRules,
  RxCommand,
  RxSubmitResult,
} from '@medmate/rx-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/rx/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/rx/lib/query';

const REGISTER_PATH = '/api/v1/pharmacy/compliance/drug-register';
const RETENTION_PATH = '/api/v1/admin/compliance/drug-register/retention-rules';

export async function submitDrugRegister(
  command: RxCommand,
): Promise<RxSubmitResult> {
  if (command.screen !== 'drug-register') {
    return {
      ok: false,
      formError: 'This screen cannot load the drug register.',
    };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(REGISTER_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        schedule: command.values?.schedule,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      register: asCollection<DrugRegisterRow>(result.data, [
        'entries',
        'rows',
        'items',
      ]),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'loadRetention') {
    const result = await hostApi.request<unknown>({
      path: RETENTION_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, retention: asObject<RetentionRules>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load the drug register.' };
}
