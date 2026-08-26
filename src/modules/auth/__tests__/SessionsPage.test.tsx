import { cleanup, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/shared/test/render';
import { SESSION_FIXTURES } from '@/modules/session';
import { resetTokenStore } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetTokenStore();
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
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('revokes the current session, 401s to login, and surfaces other errors', async () => {
    const user = userEvent.setup();
    resetTokenStore();
    const fetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        if (method === 'DELETE' && url.includes('/auth/sessions/s1')) {
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
          });
        }
        if (url.includes('/auth/logout')) {
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
          });
        }
        return new Response(
          JSON.stringify({
            success: true,
            data: [
              {
                session_id: 's1',
                ip_address: '1.1.1.1',
                is_current: true,
                device: { platform: 'iOS' },
                city: 'Bengaluru',
                country: 'IN',
              },
            ],
            meta: { page: 1, limit: 20, has_next: true },
          }),
          { status: 200 },
        );
      },
    );
    vi.stubGlobal('fetch', fetch);
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByText(/iOS/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    await user.click(screen.getAllByRole('button', { name: 'Revoke' }).at(-1)!);
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeTruthy();
    });
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED' },
            }),
            { status: 401 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    await waitFor(() => {
      expect(screen.getByTestId('portal-home')).toBeTruthy();
    });
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DOWNSTREAM' },
            }),
            { status: 500 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByRole('alert')).toHaveTextContent('DOWNSTREAM');
    cleanup();
    const paged = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const page = url.includes('page=2') ? 2 : 1;
      return new Response(
        JSON.stringify({
          success: true,
          data:
            page === 1
              ? [
                  {
                    session_id: 's2',
                    user_agent: 'Firefox',
                    is_current: false,
                  },
                  { session_id: 's-unknown' },
                  { nope: true },
                  'skip',
                ]
              : [{ session_id: 's3', user_agent: 'Safari' }],
          meta: { page, has_next: page === 1 },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', paged);
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByText('Firefox')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Safari')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('Firefox')).toBeTruthy();
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if ((init?.method ?? 'GET') === 'DELETE') {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'FORBIDDEN' },
            }),
            { status: 403 },
          );
        }
        return new Response(
          JSON.stringify({
            success: true,
            data: [{ session_id: 's9', user_agent: 'Edge' }],
            meta: { page: 1, has_next: false },
          }),
          { status: 200 },
        );
      }),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    await user.click(await screen.findByRole('button', { name: 'Revoke' }));
    await user.click(screen.getAllByRole('button', { name: 'Revoke' }).at(-1)!);
    expect(await screen.findByTestId('toast')).toHaveTextContent('FORBIDDEN');
    cleanup();
    const { hostApi } = await import('@/modules/api');
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 500,
      data: [],
    });
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByRole('alert')).toHaveTextContent('UNKNOWN');
    cleanup();
    vi.restoreAllMocks();
    const api = await import('@/modules/api');
    vi.spyOn(api.hostApi, 'request').mockImplementation(async (input) => {
      if (input.method === 'DELETE') {
        return { ok: false, status: 500, data: null };
      }
      return {
        ok: true,
        status: 200,
        data: [{ session_id: 's9', user_agent: 'Edge' }],
        details: { page: 1, has_next: false },
      };
    });
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    await user.click(await screen.findByRole('button', { name: 'Revoke' }));
    await user.click(screen.getAllByRole('button', { name: 'Revoke' }).at(-1)!);
    expect(await screen.findByTestId('toast')).toHaveTextContent('UNKNOWN');
    cleanup();
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { not: 'rows' },
            }),
            { status: 200 },
          ),
      ),
    );
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(await screen.findByTestId('sessions-empty')).toBeTruthy();
    cleanup();
    let finishDelete: ((value: Response) => void) | undefined;
    let deleted = false;
    const hanging = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if ((init?.method ?? 'GET') === 'DELETE') {
          return new Promise<Response>((resolve) => {
            finishDelete = resolve;
          });
        }
        return new Response(
          JSON.stringify({
            success: true,
            data: deleted
              ? []
              : [{ session_id: 's8', user_agent: 'Brave', is_current: false }],
            meta: { page: 1, has_next: false },
          }),
          { status: 200 },
        );
      },
    );
    vi.stubGlobal('fetch', hanging);
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    await user.click(await screen.findByRole('button', { name: 'Revoke' }));
    const confirm = screen.getAllByRole('button', { name: 'Revoke' }).at(-1)!;
    fireEvent.click(confirm);
    await waitFor(() => {
      expect(confirm).toBeDisabled();
    });
    fireEvent.click(confirm);
    deleted = true;
    finishDelete?.(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
      }),
    );
    expect(await screen.findByTestId('sessions-empty')).toBeTruthy();
  });
});
