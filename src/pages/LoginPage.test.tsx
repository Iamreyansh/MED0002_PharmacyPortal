import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';
import { PosLoginPage } from '@/pages/PosLoginPage';

afterEach(() => {
  cleanup();
});

describe('auth placeholder pages', () => {
  it('renders pharmacy and POS sign-in destinations', () => {
    const { rerender } = render(<LoginPage />);
    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
    rerender(<PosLoginPage />);
    expect(screen.getByTestId('pos-login-page')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'POS sign in' })).toBeTruthy();
  });
});
