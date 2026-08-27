import type {
  OnboardingCommand,
  OnboardingSubmitResult,
  RegisterValues,
} from '@medmate/onboarding-contract';
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from '@medmate/onboarding-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import {
  fieldErrorsFromDetails,
  onboardingErrorCopy,
} from '@/modules/onboarding/lib/errors';
import { writeRegisterEmail } from '@/modules/onboarding/lib/register-email';

export type RegisterSubmitDeps = {
  navigate: (path: string, options?: { replace?: boolean }) => void;
};

let registerInFlight = false;

export function resetRegisterSubmit(): void {
  registerInFlight = false;
}

function validateRegister(
  values: RegisterValues,
): Record<string, string> | undefined {
  const fieldErrors: Record<string, string> = {};
  if (!values.owner_name.trim()) {
    fieldErrors.owner_name = 'Enter the owner name.';
  }
  if (!values.business_name.trim()) {
    fieldErrors.business_name = 'Enter the shop name.';
  }
  if (!isValidPhone(normalizePhone(values.phone))) {
    fieldErrors.phone = 'Use a +91 mobile number.';
  }
  if (!isValidEmail(normalizeEmail(values.email))) {
    fieldErrors.email = 'Enter a valid email.';
  }
  if (!isValidPassword(values.password)) {
    fieldErrors.password =
      'Use 8+ characters with an uppercase letter, a number, and a symbol.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return fieldErrors;
  }
  return undefined;
}

export async function submitRegister(
  command: OnboardingCommand,
  deps: RegisterSubmitDeps,
): Promise<OnboardingSubmitResult> {
  if (command.screen !== 'register' || command.action !== 'submit') {
    return { ok: false, formError: 'This screen cannot submit registration.' };
  }
  if (registerInFlight) {
    return { ok: false, formError: 'Registration is already in progress.' };
  }
  const fieldErrors = validateRegister(command.values);
  if (fieldErrors) {
    return { ok: false, fieldErrors };
  }
  registerInFlight = true;
  try {
    const email = normalizeEmail(command.values.email);
    const body: Record<string, unknown> = {
      owner_name: command.values.owner_name.trim(),
      business_name: command.values.business_name.trim(),
      phone: normalizePhone(command.values.phone),
      email,
      password: command.values.password,
      business_type: 'PHARMACY',
      address: command.values.address,
      gstin: command.values.gstin.trim().toUpperCase(),
      drug_licence_number: command.values.drug_licence_number.trim(),
      pan_number: command.values.pan_number.trim().toUpperCase(),
    };
    if (command.values.fssai_number) {
      body.fssai_number = command.values.fssai_number;
    }
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/pharmacy/register',
      method: 'POST',
      body,
      idempotencyKey: createIdempotencyKey(),
    });
    if (result.ok) {
      writeRegisterEmail(email);
      deps.navigate('/register/verify', { replace: true });
      return { ok: true, nextStep: 'verify' };
    }
    return {
      ok: false,
      code: result.code,
      fieldErrors: fieldErrorsFromDetails(
        result.code,
        result.message,
        result.details,
      ),
      formError: onboardingErrorCopy(result.code, result.message),
    };
  } finally {
    registerInFlight = false;
  }
}
