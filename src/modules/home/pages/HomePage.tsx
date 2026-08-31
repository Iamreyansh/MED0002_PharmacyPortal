import { useEffect, useState } from 'react';
import { hostApi } from '@/modules/api';
import { NAV_GROUP_LABEL } from '@/modules/navigation';
import { NavItemControl } from '@/modules/shell';
import {
  groupNavItems,
  homeShortcuts,
  resolveNavItems,
} from '@/modules/navigation';
import { useSession } from '@/modules/session';

type OrderCounts = {
  pending_acceptance?: number;
  accepted?: number;
  packing?: number;
  ready_for_pickup?: number;
  out_for_delivery?: number;
};

const KPI_LABELS: { key: keyof OrderCounts; label: string }[] = [
  { key: 'pending_acceptance', label: 'Awaiting accept' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'packing', label: 'Packing' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
];

export function HomePage() {
  const session = useSession();
  const items = homeShortcuts(resolveNavItems(session));
  const groups = groupNavItems(items);
  const [orders, setOrders] = useState<OrderCounts | null>(null);

  useEffect(() => {
    if (!session.authenticated || session.tokenScope === 'pos') {
      return;
    }
    let cancelled = false;
    void hostApi
      .request<{ orders?: OrderCounts }>({
        path: '/api/v1/pharmacy/dashboard/summary',
        method: 'GET',
      })
      .then((result) => {
        if (cancelled || !result.ok || !result.data?.orders) {
          return;
        }
        setOrders(result.data.orders);
      });
    return () => {
      cancelled = true;
    };
  }, [session.authenticated, session.tokenScope]);

  return (
    <section className="page" data-testid="portal-home">
      <p className="eyebrow">NammaMedMate</p>
      <h1>Pharmacy console</h1>
      <p>Open a module from the shortcuts below. Amounts use ₹ when shown.</p>
      {orders ? (
        <ul className="home-kpis" data-testid="home-kpis">
          {KPI_LABELS.map((item) => (
            <li key={item.key}>
              <span>{item.label}</span>
              <strong>{orders[item.key] ?? 0}</strong>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="home-grid">
        {groups.map((group) => (
          <section key={group.group}>
            <h2 className="home-group__title">
              {NAV_GROUP_LABEL[group.group]}
            </h2>
            <ul className="home-cards">
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavItemControl item={item} variant="home" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
