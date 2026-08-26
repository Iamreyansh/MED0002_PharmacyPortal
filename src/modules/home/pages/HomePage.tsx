import { NAV_GROUP_LABEL } from '@/modules/navigation';
import { NavItemControl } from '@/modules/shell';
import {
  groupNavItems,
  homeShortcuts,
  resolveNavItems,
} from '@/modules/navigation';
import { useSession } from '@/modules/session';

export function HomePage() {
  const session = useSession();
  const items = homeShortcuts(resolveNavItems(session));
  const groups = groupNavItems(items);

  return (
    <section className="page" data-testid="portal-home">
      <p className="eyebrow">NammaMedMate</p>
      <h1>Pharmacy console</h1>
      <p>Open a module from the shortcuts below. Amounts use ₹ when shown.</p>
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
