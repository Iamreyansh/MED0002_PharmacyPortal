import { describe, expect, it } from 'vitest';
import {
  fieldErrorsFromDetails,
  missingTypesFromDetails,
  onboardingErrorCopy,
} from '@/modules/onboarding/lib/errors';

describe('onboarding errors', () => {
  it('maps details, codes, and copy', () => {
    expect(
      fieldErrorsFromDetails('EMAIL_ALREADY_REGISTERED', 'Taken', {
        email: 'In use',
      }),
    ).toEqual({ email: 'In use' });
    expect(
      fieldErrorsFromDetails('INVALID_GSTIN', 'Bad GSTIN', {
        missing_types: ['PAN_CARD'],
      }),
    ).toEqual({ gstin: 'Bad GSTIN' });
    expect(fieldErrorsFromDetails(undefined, 'x', null)).toBeUndefined();
    expect(fieldErrorsFromDetails('UNKNOWN', 'x', null)).toBeUndefined();
    expect(missingTypesFromDetails({ missing_types: ['PAN_CARD', 1] })).toEqual(
      ['PAN_CARD'],
    );
    expect(missingTypesFromDetails(null)).toEqual([]);
    expect(missingTypesFromDetails({ missing_types: 'PAN_CARD' })).toEqual([]);
    expect(fieldErrorsFromDetails('INVALID_GSTIN', 'Bad GSTIN', [])).toEqual({
      gstin: 'Bad GSTIN',
    });
    expect(
      fieldErrorsFromDetails('MISSING_REQUIRED_FIELD', 'Required', {
        missing_types: ['PAN_CARD'],
      }),
    ).toBeUndefined();
    expect(onboardingErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(onboardingErrorCopy('INVALID_OTP', undefined)).toBe(
      'That OTP is not valid.',
    );
    expect(onboardingErrorCopy('OTP_EXPIRED', undefined)).toBe(
      'That OTP has expired. Resend a new code.',
    );
    expect(onboardingErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(onboardingErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(onboardingErrorCopy('X', ' From Core ')).toBe('From Core');
  });
});
