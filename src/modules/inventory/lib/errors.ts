import { onlineVisibilityLockCopy } from '@medmate/inventory-contract';

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

export function inventoryErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'PRODUCT_NOT_FOUND') {
    return 'This product is no longer available.';
  }
  if (code === 'BATCH_NOT_FOUND') {
    return 'This batch is no longer available.';
  }
  if (code === 'RACK_NOT_FOUND') {
    return 'This rack is no longer available.';
  }
  if (code === 'STAFF_CANNOT_WRITE_OFF') {
    return 'Only the owner can write off a batch.';
  }
  if (code === 'PLAN_FEATURE_LOCKED' || code === 'MODULE_NOT_IN_PLAN') {
    return onlineVisibilityLockCopy();
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
) {
  return {
    ok: false as const,
    code,
    fieldErrors: fieldErrorsFromDetails(details),
    formError: inventoryErrorCopy(code, message),
  };
}
