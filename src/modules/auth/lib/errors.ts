import { formatIst } from '@/modules/session';

export function loginErrorCopy(
  code: string | undefined,
  message: string | undefined,
  details: unknown,
): string {
  const core = message?.trim();
  if (code === 'ACCOUNT_LOCKED') {
    const unlock =
      details && typeof details === 'object' && 'unlock_at' in details
        ? formatIst((details as { unlock_at?: unknown }).unlock_at)
        : null;
    const base = core || 'Account locked.';
    return unlock ? `${base} Unlocks ${unlock} IST.` : base;
  }
  if (code === 'INVALID_CREDENTIALS') {
    if (core && !/password|email|mobile|phone|identifier/i.test(core)) {
      return core;
    }
    return 'Sign-in details were not recognised.';
  }
  if (core) {
    return core;
  }
  if (code === 'VALIDATION_ERROR') {
    return 'Check the highlighted fields and try again.';
  }
  if (code) {
    return code;
  }
  return 'Unable to sign in. Try again.';
}
