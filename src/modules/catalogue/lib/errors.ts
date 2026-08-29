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

export function catalogueErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'QUERY_TOO_SHORT' || code === 'VALIDATION_ERROR') {
    return 'Check the search or highlighted fields and try again.';
  }
  if (code === 'PRICE_ABOVE_MRP') {
    return 'Price cannot exceed master MRP.';
  }
  if (code === 'SCHEDULE_X_NOT_AVAILABLE_ONLINE') {
    return 'Schedule X medicines cannot be sold online.';
  }
  if (code === 'MAPPING_NOT_FOUND') {
    return 'This mapping is no longer available.';
  }
  if (code === 'MAPPING_ALREADY_EXISTS') {
    return 'This medicine is already mapped.';
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
    formError: catalogueErrorCopy(code, message),
  };
}
