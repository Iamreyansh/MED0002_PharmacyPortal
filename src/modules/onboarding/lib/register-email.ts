const REGISTER_EMAIL_KEY = 'medmate.portal.register.email';

export function readRegisterEmail(): string {
  try {
    const value = sessionStorage.getItem(REGISTER_EMAIL_KEY);
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

export function writeRegisterEmail(email: string): void {
  try {
    sessionStorage.setItem(REGISTER_EMAIL_KEY, email);
  } catch {
    // Ignore quota / private-mode failures; verify can still resend if email is typed.
  }
}

export function clearRegisterEmail(): void {
  try {
    sessionStorage.removeItem(REGISTER_EMAIL_KEY);
  } catch {
    // Ignore.
  }
}
