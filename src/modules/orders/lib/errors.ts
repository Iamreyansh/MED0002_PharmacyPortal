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

export function ordersErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'PRICE_ABOVE_MRP') {
    return 'Quoted price is above MRP.';
  }
  if (code === 'ORDER_NOT_FOUND') {
    return 'This order was not found.';
  }
  if (code === 'ORDER_ALREADY_ACTIONED') {
    return 'This order was already actioned.';
  }
  if (code === 'INVALID_STATUS_TRANSITION') {
    return 'That status transition is not allowed.';
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
  return {
    ok: false as const,
    code,
    fieldErrors: fieldErrorsFromDetails(details),
    formError: ordersErrorCopy(code, message),
  };
}
