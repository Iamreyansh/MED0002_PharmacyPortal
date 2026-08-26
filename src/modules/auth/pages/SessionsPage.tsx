import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { hostApi } from '@/modules/api';
import { useToast } from '@/modules/shell';
import { formatIst } from '@/modules/session';
import { performLogout } from '@/modules/session';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/modules/session';

type SessionRow = {
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  city?: string;
  country?: string;
  created_at?: string;
  last_active_at?: string;
  is_current?: boolean;
  device?: { platform?: string; device_id?: string; app_version?: string };
};

function asRows(value: unknown): SessionRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((row): row is SessionRow =>
    Boolean(
      row &&
      typeof row === 'object' &&
      typeof (row as SessionRow).session_id === 'string',
    ),
  );
}

export function SessionsPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { clearSession } = useSessionStore();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(
    async (nextPage: number) => {
      setStatus('loading');
      setError(null);
      const result = await hostApi.request<SessionRow[]>({
        path: `/api/v1/auth/sessions?page=${nextPage}&limit=20`,
        method: 'GET',
      });
      if (!result.ok) {
        if (result.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setStatus('error');
        setError(result.code ?? 'UNKNOWN');
        return;
      }
      setRows(asRows(result.data));
      const meta = result.details as
        { has_next?: unknown; page?: unknown } | undefined;
      setHasNext(meta?.has_next === true);
      setPage(typeof meta?.page === 'number' ? meta.page : nextPage);
      setStatus('ready');
    },
    [navigate],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  async function confirmRevoke() {
    const id = pendingId!;
    setRevoking(true);
    const result = await hostApi.request({
      path: `/api/v1/auth/sessions/${id}`,
      method: 'DELETE',
    });
    setRevoking(false);
    setPendingId(null);
    if (!result.ok) {
      showToast(result.code ?? 'UNKNOWN');
      return;
    }
    const row = rows.find((item) => item.session_id === id);
    if (row?.is_current) {
      const dest = await performLogout();
      flushSync(() => {
        clearSession();
      });
      navigate(dest, { replace: true });
      return;
    }
    await load(page);
  }

  useEffect(() => {
    if (!pendingId) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPendingId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingId]);

  return (
    <section className="page" data-testid="sessions-page">
      <h1>Sessions</h1>
      <p>Devices signed in with this account.</p>
      {status === 'loading' ? <p>Loading sessions…</p> : null}
      {status === 'error' ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {status === 'ready' && rows.length === 0 ? (
        <p data-testid="sessions-empty">No active sessions.</p>
      ) : null}
      {status === 'ready' && rows.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Device</th>
                <th scope="col">IP</th>
                <th scope="col">Location</th>
                <th scope="col">Last active</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.session_id}>
                  <td>
                    {row.device?.platform ?? row.user_agent ?? 'Unknown device'}
                    {row.is_current ? ' (this device)' : ''}
                  </td>
                  <td>{row.ip_address ?? '—'}</td>
                  <td>
                    {[row.city, row.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>{formatIst(row.last_active_at) ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setPendingId(row.session_id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="pager">
        <button
          type="button"
          disabled={page <= 1 || status === 'loading'}
          onClick={() => void load(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || status === 'loading'}
          onClick={() => void load(page + 1)}
        >
          Next
        </button>
      </div>
      {pendingId ? (
        <div
          className="dialog-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
        >
          <div className="dialog">
            <h2 id="revoke-title">Revoke this session?</h2>
            <p>The device will be signed out.</p>
            <div className="dialog__actions">
              <button type="button" onClick={() => setPendingId(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmRevoke()}
                disabled={revoking}
              >
                {revoking ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
