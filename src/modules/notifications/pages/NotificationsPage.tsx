import { useCallback, useEffect, useState } from 'react';
import { hostApi } from '@/modules/api';

type NoticeRow = {
  id: string;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  is_read?: boolean;
  created_at?: string | null;
};

export function NotificationsPage() {
  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await hostApi.request<{ notifications?: NoticeRow[] }>({
      path: '/api/v1/pharmacy/notifications?page=1&limit=50',
      method: 'GET',
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? result.code ?? 'Unable to load notices.');
      return;
    }
    setRows(result.data?.notifications ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    const result = await hostApi.request({
      path: `/api/v1/pharmacy/notifications/${id}/read`,
      method: 'POST',
      body: {},
    });
    if (result.ok) {
      setRows((current) =>
        current.map((row) => (row.id === id ? { ...row, is_read: true } : row)),
      );
    }
  }

  return (
    <section className="page" data-testid="notifications-page">
      <p className="eyebrow">Engagement</p>
      <h1>Notifications</h1>
      <p>
        In-app notices for this pharmacy. Push and SMS stay off until vendor
        keys are live.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {loading ? <p>Loading notices</p> : null}
      {!loading && rows.length === 0 ? (
        <p data-testid="notifications-empty">No notices yet.</p>
      ) : (
        <ul className="notice-list" data-testid="notifications-list">
          {rows.map((row) => (
            <li key={row.id} data-read={row.is_read ? 'true' : 'false'}>
              <strong>{row.title || 'Notice'}</strong>
              {row.body ? <p>{row.body}</p> : null}
              {row.is_read ? null : (
                <button type="button" onClick={() => void markRead(row.id)}>
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
