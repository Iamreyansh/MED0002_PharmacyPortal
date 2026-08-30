import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  settingsErrorCopy,
} from '@/modules/settings/lib/errors';

describe('settings errors', () => {
  it('maps details, codes, and copy', () => {
    expect(
      fieldErrorsFromDetails('INVALID_GSTIN', 'Bad GSTIN', {
        gstin: 'In use',
      }),
    ).toEqual({ gstin: 'In use' });
    expect(fieldErrorsFromDetails('INVALID_IFSC', 'Bad IFSC', null)).toEqual({
      ifsc_code: 'Bad IFSC',
    });
    expect(
      fieldErrorsFromDetails('INVALID_LOGO', 'Logo must be PNG or JPG', null),
    ).toEqual({ logo_url: 'Logo must be PNG or JPG' });
    expect(fieldErrorsFromDetails(undefined, 'x', null)).toBeUndefined();
    expect(fieldErrorsFromDetails('UNKNOWN', 'x', null)).toBeUndefined();
    expect(fieldErrorsFromDetails('INVALID_GSTIN', 'Bad GSTIN', [])).toEqual({
      gstin: 'Bad GSTIN',
    });
    expect(
      fieldErrorsFromDetails('MISSING_REQUIRED_FIELD', 'Required', {}),
    ).toBeUndefined();
    expect(settingsErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(settingsErrorCopy('FORBIDDEN', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(settingsErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(settingsErrorCopy('MODULE_NOT_IN_PLAN', undefined)).toBe(
      'Roles are not included in this plan.',
    );
    expect(
      settingsErrorCopy('CANNOT_DISABLE_MANDATORY_CATEGORY', undefined),
    ).toBe('This alert cannot be turned off.');
    expect(settingsErrorCopy('ROLE_NOT_FOUND', undefined)).toBe(
      'This role is no longer available.',
    );
    expect(settingsErrorCopy('ROLE_NAME_CONFLICT', undefined)).toBe(
      'A role with this name already exists.',
    );
    expect(settingsErrorCopy('ROLE_IN_USE', undefined)).toBe(
      'This role is assigned to staff and cannot be deleted.',
    );
    expect(
      settingsErrorCopy('INSUFFICIENT_PERMISSIONS', undefined),
    ).not.toMatch(/upgrade/i);
    expect(settingsErrorCopy('ADMIN_OVERRIDE_ACTIVE', undefined)).toBe(
      'Admin has forced this pharmacy offline. Contact support.',
    );
    expect(settingsErrorCopy('PHARMACY_NOT_ACTIVE', undefined)).toBe(
      'This pharmacy is not active.',
    );
    expect(settingsErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(settingsErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(settingsErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
