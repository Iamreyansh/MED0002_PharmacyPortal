import type {
  ExpiryAlert,
  InventoryCommand,
  InventorySubmitResult,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/inventory/lib/download';
import { failureResult } from '@/modules/inventory/lib/errors';
import { asCollection, withQuery } from '@/modules/inventory/lib/query';

const ALERTS_PATH = '/api/v1/pharmacy/inventory/expiry-alerts';
const REPORT_PATH = '/api/v1/pharmacy/inventory/expiry-report';

export async function submitExpiry(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen !== 'expiry') {
    return { ok: false, formError: 'This screen cannot load expiry.' };
  }
  if (command.action === 'loadAlerts') {
    const result = await hostApi.request<unknown>({
      path: ALERTS_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      alerts: asCollection<ExpiryAlert>(result.data, ['alerts']),
    };
  }
  if (command.action === 'loadReport') {
    const result = await hostApi.request<unknown>({
      path: REPORT_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      report: asCollection<ExpiryAlert>(result.data, ['report', 'alerts']),
    };
  }
  if (command.action !== 'exportReport') {
    return { ok: false, formError: 'This screen cannot load expiry.' };
  }
  const result = await hostApi.request<Blob>({
    path: withQuery(REPORT_PATH, { format: 'xlsx' }),
    method: 'GET',
    binary: true,
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  if (result.data instanceof Blob) {
    downloadBlob(result.data, 'expiry-report.xlsx');
  }
  return { ok: true, downloaded: true };
}
