import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthFeatureData, AuthSessionRow } from '@medmate/auth-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { render } from '@testing-library/react';
import { renderApp } from '@/shared/test/render';
import { AuthRemotePage } from '@/modules/auth';
import { SESSION_FIXTURES, SessionProvider } from '@/modules/session';
import { resetTokenStore } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetTokenStore();
});

function sessionsStub(
  onReady?: (feature: AuthFeatureData) => void,
): RemoteImporter {
  return async () => ({
    default: function SessionsStub(props: Record<string, unknown>) {
      const data = props.data as { feature: AuthFeatureData };
      const [rows, setRows] = useState<AuthSessionRow[]>([]);
      const [error, setError] = useState<string | null>(null);
      const [empty, setEmpty] = useState(false);
      useEffect(() => {
        onReady?.(data.feature);
        void data.feature
          .onSubmit({
            portalType: 'sessions',
            action: 'list',
            values: { page: 1 },
          })
          .then((result) => {
            if (!result.ok) {
              setError(result.formError ?? result.code ?? 'UNKNOWN');
              return;
            }
            const next = result.sessions ?? [];
            setRows(next);
            setEmpty(next.length === 0);
          });
      }, [data.feature]);
      return (
        <div>
          {error ? <p role="alert">{error}</p> : null}
          {empty ? (
            <p data-testid="sessions-empty">No active sessions.</p>
          ) : null}
          {rows.map((row) => (
            <div key={row.sessionId}>
              <span>{row.device ?? 'Unknown device'}</span>
              <button
                type="button"
                onClick={() => {
                  void data.feature
                    .onSubmit({
                      portalType: 'sessions',
                      action: 'revoke',
                      values: { sessionId: row.sessionId },
                    })
                    .then((result) => {
                      if (!result.ok) {
                        setError(result.formError ?? result.code ?? 'UNKNOWN');
                      }
                    });
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      );
    },
  });
}

describe('sessions adapter', () => {
  it('keeps sessions-page when the remote is missing', async () => {
    renderApp('/sessions', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('sessions-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('lists and revokes through onSubmit', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if ((init?.method ?? 'GET') === 'DELETE') {
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
                user_agent: 'Chrome',
                is_current: true,
              },
            ],
            meta: { page: 1, has_next: false },
          }),
          { status: 200 },
        );
      }),
    );
    render(
      <MemoryRouter initialEntries={['/sessions']}>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <Routes>
            <Route
              path="/sessions"
              element={
                <AuthRemotePage
                  portalType="sessions"
                  loadRemote={sessionsStub()}
                />
              }
            />
            <Route
              path="/login"
              element={<AuthRemotePage portalType="pharmacy" />}
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Chrome')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeTruthy();
    });
  });

  it('shows list errors from Core', async () => {
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
    render(
      <MemoryRouter initialEntries={['/sessions']}>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <AuthRemotePage portalType="sessions" loadRemote={sessionsStub()} />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('DOWNSTREAM');
  });
});
