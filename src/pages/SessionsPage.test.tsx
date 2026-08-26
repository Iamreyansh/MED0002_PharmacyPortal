import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { SESSION_FIXTURES } from '@/session/session';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const rows = [
  {
    session_id: 's1',
    ip_address: '1.1.1.1',
    user_agent: 'Chrome',
    last_active_at: '2026-08-26T12:00:00.000Z',
    is_current: false,
  },
];

describe('SessionsPage', () => {
  it('renders rows from GET /auth/sessions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: rows,
              meta: { page: 1, limit: 20, total: 1, has_next: false },
            }),
            { status: 200 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByText('Chrome')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows an empty state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: [],
              meta: { page: 1, limit: 20, total: 0, has_next: false },
            }),
            { status: 200 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByTestId('sessions-empty')).toBeTruthy();
  });

  it('confirms revoke and cancels on Escape', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: rows,
              meta: { page: 1, limit: 20, has_next: false },
            }),
            { status: 200 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    await user.click(await screen.findByRole('button', { name: 'Revoke' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
