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

export function posErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'INSUFFICIENT_STOCK') {
    return 'Requested quantity exceeds batch stock.';
  }
  if (code === 'CART_NOT_FOUND' || code === 'CART_EXPIRED') {
    return 'This cart is no longer available. A new cart was started.';
  }
  if (code === 'EMPTY_CART') {
    return 'Add a product before taking payment.';
  }
  if (code === 'POS_TOKEN_RESTRICTED') {
    return 'This action needs a full login.';
  }
  if (code === 'MODULE_NOT_IN_PLAN') {
    return 'POS is not on this plan.';
  }
  if (code === 'CREDIT_REQUIRES_NAMED_CUSTOMER') {
    return 'Attach a customer before charging to khata.';
  }
  if (code === 'RX_PRESCRIBER_REQUIRED') {
    return 'Enter the prescribing doctor for Rx items.';
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
    formError: posErrorCopy(code, message),
  };
}
