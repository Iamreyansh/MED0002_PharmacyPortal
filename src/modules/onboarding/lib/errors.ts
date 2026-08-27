const FIELD_CODES: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: 'email',
  PHONE_ALREADY_REGISTERED: 'phone',
  GSTIN_ALREADY_REGISTERED: 'gstin',
  PAN_ALREADY_REGISTERED: 'pan_number',
  DRUG_LICENCE_ALREADY_REGISTERED: 'drug_licence_number',
  INVALID_GSTIN: 'gstin',
  INVALID_PHONE: 'phone',
  INVALID_PASSWORD_STRENGTH: 'password',
  INVALID_PINCODE: 'pincode',
  INVALID_STATE: 'state',
  INVALID_FSSAI: 'fssai_number',
  INVALID_PAN: 'pan_number',
  INVALID_OTP: 'otp',
  OTP_EXPIRED: 'otp',
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
      if (key === 'missing_types') {
        continue;
      }
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

export function missingTypesFromDetails(details: unknown): string[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return [];
  }
  const missing = (details as { missing_types?: unknown }).missing_types;
  if (!Array.isArray(missing)) {
    return [];
  }
  return missing.filter((item): item is string => typeof item === 'string');
}

export function onboardingErrorCopy(
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
  if (code === 'INVALID_OTP') {
    return 'That OTP is not valid.';
  }
  if (code === 'OTP_EXPIRED') {
    return 'That OTP has expired. Resend a new code.';
  }
  if (code) {
    return code;
  }
  return 'Unable to continue. Try again.';
}
