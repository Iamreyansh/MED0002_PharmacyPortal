import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RemoteModulePage } from '@/modules/remote';
import { SessionProvider } from '@/modules/session';
import { SESSION_FIXTURES } from '@/modules/session';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('RemoteModulePage', () => {
  it('shows not-found for an unknown remote', () => {
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <RemoteModulePage remoteName="missing" />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('not-found')).toBeTruthy();
  });

  it('mounts a known remote through MfeOutlet', async () => {
    vi.stubEnv('VITE_REMOTE_POS_URL', 'https://example.test/mf-manifest.json');
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <RemoteModulePage
            remoteName="pos"
            loadRemote={async () => ({
              default: function Ok() {
                return <div data-testid="pos-ok">pos</div>;
              },
            })}
          />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('pos-ok')).toBeTruthy();
  });
});
