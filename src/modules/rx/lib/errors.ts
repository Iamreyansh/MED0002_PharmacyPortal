import { rxLockCopy } from '@medmate/rx-contract';

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

export function rxErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'RX_NOT_FOUND') {
    return 'This prescription is no longer available.';
  }
  if (code === 'INSUFFICIENT_STOCK') {
    return 'Stock is insufficient to dispense.';
  }
  if (code === 'ILLEGAL_STATE') {
    return 'This prescription cannot move to that status.';
  }
  if (code === 'PLAN_FEATURE_LOCKED' || code === 'MODULE_NOT_IN_PLAN') {
    return rxLockCopy();
  }
  if (code === 'VALIDATION_ERROR') {
    return 'Check the highlighted fields and try again.';
  }
  if (code === 'FORBIDDEN' || code === 'INSUFFICIENT_PERMISSIONS') {
    return 'You do not have permission to do that.';
  }
  if (code === 'POS_TOKEN_RESTRICTED') {
    return 'This page needs a full pharmacy session.';
  }
  if (code === 'UNAUTHORIZED') {
    return 'Sign in again to continue.';
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
  const fieldErrors = fieldErrorsFromDetails(details);
  const mapped =
    code === 'VALIDATION_ERROR' && fieldErrors
      ? fieldErrors
      : code === 'INSUFFICIENT_STOCK'
        ? fieldErrors
        : fieldErrors;
  return {
    ok: false as const,
    code,
    fieldErrors: mapped,
    formError: rxErrorCopy(code, message),
  };
}
