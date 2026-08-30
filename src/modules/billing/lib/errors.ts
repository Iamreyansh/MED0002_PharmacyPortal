import { billingLockCopy } from '@medmate/billing-contract';

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

export function billingErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'INVOICE_NOT_FOUND') {
    return 'This invoice is no longer available.';
  }
  if (code === 'SALE_NOT_FOUND') {
    return 'This sale is no longer available.';
  }
  if (code === 'STAFF_CANNOT_MARK_PAID') {
    return 'Only the owner can mark a sale paid.';
  }
  if (code === 'SALE_ALREADY_PAID') {
    return 'This sale is already paid.';
  }
  if (code === 'AMOUNT_MISMATCH') {
    return 'The amount does not match the outstanding balance.';
  }
  if (code === 'POS_TOKEN_RESTRICTED') {
    return 'This page needs a full pharmacy session.';
  }
  if (code === 'INVALID_PREFIX_FORMAT') {
    return 'Invoice prefix must be 1–6 letters or numbers.';
  }
  if (code === 'INVALID_ACCENT_COLOR') {
    return 'Accent colour must be a hex value.';
  }
  if (code === 'INVALID_IFSC_CODE') {
    return 'IFSC must be 11 characters.';
  }
  if (code === 'INVALID_RECIPIENT') {
    return 'Check the phone or email and try again.';
  }
  if (code === 'CHANNEL_UNAVAILABLE') {
    return 'That share channel is unavailable.';
  }
  if (code === 'EXPORT_RANGE_TOO_LARGE') {
    return 'Choose a range of 12 months or less.';
  }
  if (code === 'PLAN_FEATURE_LOCKED' || code === 'MODULE_NOT_IN_PLAN') {
    return billingLockCopy();
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
  const fieldErrors = fieldErrorsFromDetails(details);
  const mapped =
    code === 'INVALID_PREFIX_FORMAT'
      ? { ...fieldErrors, invoice_prefix: billingErrorCopy(code, message) }
      : code === 'INVALID_ACCENT_COLOR'
        ? { ...fieldErrors, accent_color: billingErrorCopy(code, message) }
        : code === 'INVALID_IFSC_CODE'
          ? { ...fieldErrors, ifsc_code: billingErrorCopy(code, message) }
          : fieldErrors;
  return {
    ok: false as const,
    code,
    fieldErrors: mapped,
    formError: billingErrorCopy(code, message),
  };
}
