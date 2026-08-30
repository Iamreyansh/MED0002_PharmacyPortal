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

export function analyticsErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'REPORT_NOT_FOUND') {
    return 'This report was not found.';
  }
  if (code === 'PLAN_UPGRADE_REQUIRED' || code === 'PLAN_FEATURE_LOCKED') {
    return 'Analytics requires the Growth plan.';
  }
  if (code === 'VALIDATION_ERROR' || code === 'INVALID_PERIOD') {
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
    formError: analyticsErrorCopy(code, message),
  };
}
