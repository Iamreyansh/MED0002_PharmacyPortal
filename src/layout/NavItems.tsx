import { useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LockGlyph } from '@/layout/icons';
import { NAV_GROUP_LABEL } from '@/navigation/nav-catalog';
import { groupNavItems, type ResolvedNavItem } from '@/navigation/resolve-nav';
import { useSession } from '@/session/SessionProvider';

export type NavItemControlProps = {
  item: ResolvedNavItem;
  variant: 'sidebar' | 'home' | 'bottom';
};

export function NavItemControl({ item, variant }: NavItemControlProps) {
  const session = useSession();
  const explanationRef = useRef<HTMLParagraphElement>(null);
  const explanationId = `nav-lock-${item.id}`;

  if (item.locked) {
    const className =
      variant === 'home'
        ? 'home-card nav-lock__trigger'
        : variant === 'bottom'
          ? 'bottom-nav__item'
          : 'nav-lock__trigger';
    return (
      <div className="nav-lock">
        <button
          type="button"
          className={className}
          data-testid="plan-lock"
          aria-describedby={explanationId}
          onClick={() => explanationRef.current?.focus()}
        >
          {item.label}
          <span className="nav-lock__badge">
            <LockGlyph /> Locked
          </span>
        </button>
        <p
          id={explanationId}
          ref={explanationRef}
          tabIndex={-1}
          className="nav-lock__explain"
        >
          {item.lockCopy}
          {session.role !== 'pharmacy_staff' ? (
            <>
              {' '}
              <Link to="/subscription">Upgrade</Link>
            </>
          ) : null}
        </p>
      </div>
    );
  }

  if (variant === 'home') {
    return (
      <Link className="home-card" to={item.path}>
        {item.label}
      </Link>
    );
  }

  if (variant === 'bottom') {
    return (
      <NavLink className="bottom-nav__item" to={item.path}>
        {item.label}
      </NavLink>
    );
  }

  return (
    <NavLink to={item.path} end={item.path === '/'}>
      {item.label}
    </NavLink>
  );
}

export function SidebarNav({ items }: { items: readonly ResolvedNavItem[] }) {
  const groups = groupNavItems(items);
  const session = useSession();

  return (
    <nav
      className="app-sidebar"
      id="portal-nav"
      data-testid="portal-nav"
      aria-label="Primary"
    >
      {groups.map((group) => (
        <section className="nav-group" key={group.group}>
          <h2 className="nav-group__title">{NAV_GROUP_LABEL[group.group]}</h2>
          <ul className="nav-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <NavItemControl item={item} variant="sidebar" />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {session.tokenScope === 'pos' ? (
        <Link className="pos-logout" to="/login">
          Sign out
        </Link>
      ) : null}
    </nav>
  );
}

export function BottomNav({ items }: { items: readonly ResolvedNavItem[] }) {
  const groups = groupNavItems(items);
  const firstByGroup = groups
    .map((group) => group.items[0])
    .filter((item): item is ResolvedNavItem => Boolean(item));

  return (
    <nav
      className="app-bottom-nav"
      data-testid="portal-bottom-nav"
      aria-label="Primary mobile"
    >
      {firstByGroup.map((item) => (
        <NavItemControl key={item.id} item={item} variant="bottom" />
      ))}
    </nav>
  );
}
