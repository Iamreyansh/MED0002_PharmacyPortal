const FIELD_CODES: Record<string, string> = {
  INVALID_GSTIN: 'gstin',
  INVALID_PHONE: 'phone',
  INVALID_PINCODE: 'pincode',
  INVALID_PAN: 'pan_number',
  INVALID_FSSAI: 'fssai_number',
  INVALID_IFSC: 'ifsc_code',
  INVALID_ACCOUNT_NUMBER: 'account_number',
  INVALID_OTP: 'otp',
  OTP_EXPIRED: 'otp',
  OTP_LOCKED: 'otp',
  OTP_NOT_FOUND: 'otp',
  NO_PENDING_VERIFICATION: 'otp',
  EMAIL_ALREADY_REGISTERED: 'email',
  PHONE_ALREADY_REGISTERED: 'phone',
  INVALID_OPERATING_HOURS: 'hours',
  INVALID_LOGO: 'logo_url',
  MISSING_REQUIRED_FIELD: '',
};

export function fieldErrorsFromDetails(
  code: string | undefined,
  message: string | undefined,
  details: unknown,
): Record<string, string> | undefined {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      details as Record<string, unknown>,
    )) {
      if (typeof value === 'string' && value.length > 0) {
        out[key] = value;
      }
    }
    if (Object.keys(out).length > 0) {
      return out;
    }
  }
  if (!code) {
    return undefined;
  }
  const field = FIELD_CODES[code];
  if (field && message) {
    return { [field]: message };
  }
  return undefined;
}

export function settingsErrorCopy(
  code: string | undefined,
  message: string | undefined,
): string {
  const core = message?.trim();
  if (core) {
    return core;
  }
  if (code === 'VALIDATION_ERROR') {
    return 'Check the highlighted fields and try again.';
  }
  if (code === 'FORBIDDEN' || code === 'INSUFFICIENT_PERMISSIONS') {
    return 'You do not have permission to do that.';
  }
  if (code === 'MODULE_NOT_IN_PLAN') {
    return 'Roles are not included in this plan.';
  }
  if (code === 'ROLE_NOT_FOUND') {
    return 'This role is no longer available.';
  }
  if (code === 'ROLE_NAME_CONFLICT') {
    return 'A role with this name already exists.';
  }
  if (code === 'ROLE_IN_USE') {
    return 'This role is assigned to staff and cannot be deleted.';
  }
  if (code === 'ADMIN_OVERRIDE_ACTIVE') {
    return 'Admin has forced this pharmacy offline. Contact support.';
  }
  if (code === 'PHARMACY_NOT_ACTIVE') {
    return 'This pharmacy is not active.';
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
    fieldErrors: fieldErrorsFromDetails(code, message, details),
    formError: settingsErrorCopy(code, message),
  };
}
