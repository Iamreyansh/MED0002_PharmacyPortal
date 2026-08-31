import { useCallback, useEffect, useState } from 'react';
import { hostApi } from '@/modules/api';

type CustomerRow = {
  customer_id?: string | null;
  name?: string | null;
  phone?: string | null;
  invoices?: number;
  last_purchase_at?: string | null;
};

export function CustomersPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (search.trim()) {
      params.set('q', search.trim());
    }
    const result = await hostApi.request<{ customers?: CustomerRow[] }>({
      path: `/api/v1/pharmacy/customers?${params.toString()}`,
      method: 'GET',
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? result.code ?? 'Unable to load customers.');
      return;
    }
    setRows(result.data?.customers ?? []);
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  return (
    <section className="page" data-testid="customers-page">
      <p className="eyebrow">CRM</p>
      <h1>Customers</h1>
      <p>
        Walk-in and billed customers for this pharmacy. Names and phones stay on
        this page only.
      </p>
      <form
        className="filter-row"
        onSubmit={(event) => {
          event.preventDefault();
          void load(q);
        }}
      >
        <label>
          Search
          <input
            name="q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <button type="submit">Search</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {loading ? <p>Loading customers</p> : null}
      {!loading && rows.length === 0 ? (
        <p data-testid="customers-empty">No customers yet.</p>
      ) : (
        <table className="data-table" data-testid="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Invoices</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.customer_id ?? `${row.phone ?? 'row'}-${index}`}>
                <td>{row.name || '—'}</td>
                <td>{row.phone || '—'}</td>
                <td>{row.invoices ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
