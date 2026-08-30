import type {
  BillingCommand,
  BillingSubmitResult,
  OfferDeleteResult,
  OfferKpi,
  OfferRow,
  OfferToggleResult,
  OfferValidateResult,
} from '@medmate/billing-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/billing/lib/errors';
import {
  asCollection,
  asMeta,
  asNested,
  asObject,
  withQuery,
} from '@/modules/billing/lib/query';

const LIST_PATH = '/api/v1/pharmacy/offers';

export async function submitOffers(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen !== 'offers') {
    return { ok: false, formError: 'This screen cannot load offers.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        status: command.values?.status,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      offers: asCollection<OfferRow>(result.data, ['offers']),
      kpi: asNested<OfferKpi>(result.data, 'kpi'),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'create') {
    const result = await hostApi.request<unknown>({
      path: LIST_PATH,
      method: 'POST',
      body: command.values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, offer: asObject<OfferRow>(result.data) };
  }
  if (command.action === 'patch') {
    const { offerId, ...values } = command.values;
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${offerId}`,
      method: 'PATCH',
      body: values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, offer: asObject<OfferRow>(result.data) };
  }
  if (command.action === 'toggle') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.offerId}/toggle`,
      method: 'PATCH',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, offerToggle: asObject<OfferToggleResult>(result.data) };
  }
  if (command.action === 'delete') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.offerId}`,
      method: 'DELETE',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, offerDelete: asObject<OfferDeleteResult>(result.data) };
  }
  if (command.action === 'validate') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/validate`,
      method: 'POST',
      body: command.values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      offerValidate: asObject<OfferValidateResult>(result.data),
    };
  }
  return { ok: false, formError: 'This screen cannot load offers.' };
}
