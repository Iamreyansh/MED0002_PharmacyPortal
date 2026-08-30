import {
  distributorsLockCopy,
  reorderLockCopy,
} from '@medmate/procurement-contract';

export function fieldErrorsFromDetails(
  details: unknown,
): Record<string, string> | undefined {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(
    details as Record<string, unknown>,
  )) {
    if (typeof value === 'string' && value.length > 0) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function procurementErrorCopy(
  code: string | undefined,
  message: string | undefined,
  lockScreen?: 'distributors' | 'reorder',
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'GRN_NOT_FOUND') {
    return 'This receipt is no longer available.';
  }
  if (code === 'STAFF_CANNOT_STOCK') {
    return 'Only the owner can stock this receipt.';
  }
  if (code === 'DUPLICATE_INVOICE_NUMBER') {
    return 'This invoice number is already on file.';
  }
  if (code === 'DISTRIBUTOR_NOT_FOUND') {
    return 'This distributor is no longer available.';
  }
  if (code === 'PO_NOT_FOUND') {
    return 'This purchase order is no longer available.';
  }
  if (code === 'PLAN_FEATURE_LOCKED' || code === 'MODULE_NOT_IN_PLAN') {
    return lockScreen === 'reorder'
      ? reorderLockCopy()
      : distributorsLockCopy();
  }
  if (code === 'VALIDATION_ERROR') {
    return 'Check the highlighted fields and try again.';
  }
  if (code === 'FORBIDDEN' || code === 'INSUFFICIENT_PERMISSIONS') {
    return 'You do not have permission to do that.';
  }
  if (code) {
    return code;
  }
  return 'Unable to continue. Try again.';
}

export function failureResult(
  code: string | undefined,
  message: string | undefined,
  details: unknown,
  lockScreen?: 'distributors' | 'reorder',
) {
  return {
    ok: false as const,
    code,
    fieldErrors: fieldErrorsFromDetails(details),
    formError: procurementErrorCopy(code, message, lockScreen),
  };
}
