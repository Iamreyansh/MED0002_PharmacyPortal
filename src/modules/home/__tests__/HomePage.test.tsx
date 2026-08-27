import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFederationRemotes,
  getRemoteUrl,
  listConfiguredRemotes,
} from '@medmate/federation-config';
import { HomePage } from '@/modules/home';
import { SessionProvider } from '@/modules/session';
import { SESSION_FIXTURES } from '@/modules/session';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('federation remotes helpers', () => {
  it('builds remotes from env', () => {
    const remotes = buildFederationRemotes({
      VITE_REMOTE_TODO_URL:
        'https://todo.mfe.nammamedmate.com/mf-manifest.json',
      VITE_REMOTE_EMPTY_URL: '',
      IGNORED: 'x',
    });
    expect(remotes.todo?.entry).toContain('todo.mfe');
    expect(Object.keys(remotes)).toEqual(['todo']);
  });

  it('reads runtime remote urls', () => {
    const env = {
      VITE_REMOTE_TODO_URL: 'https://example.test/mf-manifest.json',
    };
    expect(getRemoteUrl('todo', env)).toBe(
      'https://example.test/mf-manifest.json',
    );
    expect(listConfiguredRemotes(env)).toContain('todo');
  });

  it('returns undefined for missing remote urls', () => {
    expect(getRemoteUrl('todo', { VITE_REMOTE_TODO_URL: '' })).toBeUndefined();
    expect(getRemoteUrl('auth', {})).toBeUndefined();
  });

  it('builds convention URLs from VITE_MFE_DOMAIN_SUFFIX', () => {
    const env = { VITE_MFE_DOMAIN_SUFFIX: 'mfe.nammamedmate.com' };
    expect(getRemoteUrl('auth', env)).toBe(
      'https://auth.mfe.nammamedmate.com/mf-manifest.json',
    );
    expect(getRemoteUrl('todo', env)).toBe(
      'https://todo.mfe.nammamedmate.com/mf-manifest.json',
    );
    expect(getRemoteUrl('onboarding', env)).toBe(
      'https://onboarding.mfe.nammamedmate.com/mf-manifest.json',
    );
    expect(
      getRemoteUrl('auth', {
        VITE_MFE_DOMAIN_SUFFIX: 'mfe.nammamedmate.com',
        VITE_REMOTE_AUTH_URL: 'https://example.test/mf-manifest.json',
      }),
    ).toBe('https://example.test/mf-manifest.json');
  });
});

describe('HomePage', () => {
  it('renders grouped IA shortcuts without Todo', () => {
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <HomePage />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('portal-home')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'POS' })).toHaveAttribute(
      'href',
      '/pos',
    );
    expect(screen.queryByRole('link', { name: /todos/i })).toBeNull();
  });
});
