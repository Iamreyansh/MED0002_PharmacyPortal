import type {
  KycListPayload,
  OnboardingCommand,
  OnboardingSubmitResult,
} from '@medmate/onboarding-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import {
  missingTypesFromDetails,
  onboardingErrorCopy,
} from '@/modules/onboarding/lib/errors';

export type KycSubmitDeps = {
  applyRegistrationStatus: (data: Record<string, unknown>) => void;
};

async function loadDocuments(): Promise<OnboardingSubmitResult> {
  const result = await hostApi.request<KycListPayload>({
    path: '/api/v1/pharmacy/kyc/documents',
    method: 'GET',
  });
  if (!result.ok || !result.data) {
    return {
      ok: false,
      code: result.code,
      formError: onboardingErrorCopy(result.code, result.message),
    };
  }
  return { ok: true, documents: result.data };
}

export async function submitKyc(
  command: OnboardingCommand,
  deps: KycSubmitDeps,
): Promise<OnboardingSubmitResult> {
  if (command.screen !== 'kyc') {
    return { ok: false, formError: 'This screen cannot manage KYC.' };
  }
  if (command.action === 'list') {
    return loadDocuments();
  }
  if (command.action === 'upload') {
    const form = new FormData();
    form.append('document_type', command.values.document_type);
    form.append('file', command.values.file, command.values.file.name);
    if (command.values.expiry_date) {
      form.append('expiry_date', command.values.expiry_date);
    }
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/pharmacy/kyc/documents',
      method: 'POST',
      body: form,
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        formError: onboardingErrorCopy(result.code, result.message),
      };
    }
    return loadDocuments();
  }
  if (command.action === 'delete') {
    const result = await hostApi.request<Record<string, unknown>>({
      path: `/api/v1/pharmacy/kyc/documents/${command.values.document_id}`,
      method: 'DELETE',
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        formError: onboardingErrorCopy(result.code, result.message),
      };
    }
    return loadDocuments();
  }
  if (command.action !== 'submit') {
    return { ok: false, formError: 'This screen cannot manage KYC.' };
  }
  const result = await hostApi.request<Record<string, unknown>>({
    path: '/api/v1/pharmacy/kyc/submit',
    method: 'POST',
    body: {},
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      formError: onboardingErrorCopy(result.code, result.message),
      missingTypes: missingTypesFromDetails(result.details),
    };
  }
  const status = await hostApi.request<Record<string, unknown>>({
    path: '/api/v1/pharmacy/registration-status',
    method: 'GET',
  });
  if (status.ok && status.data && typeof status.data === 'object') {
    deps.applyRegistrationStatus(status.data);
  }
  return { ok: true, nextStep: 'status' };
}
