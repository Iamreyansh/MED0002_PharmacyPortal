import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LockGlyph, SignOutGlyph, navGlyph } from '@/modules/shell/lib/icons';
import { NAV_GROUP_LABEL } from '@/modules/navigation';
import { groupNavItems, type ResolvedNavItem } from '@/modules/navigation';
import { performLogout } from '@/modules/session';
import { useSession, useSessionStore } from '@/modules/session';

export type NavItemControlProps = {
  item: ResolvedNavItem;
  variant: 'sidebar' | 'home' | 'bottom';
};

function NavItemBody({
  item,
  showLockBadge = false,
}: {
  item: ResolvedNavItem;
  showLockBadge?: boolean;
}) {
  return (
    <>
      <span className="nav-item__icon">{navGlyph(item.id)}</span>
      <span className="nav-item__label">{item.label}</span>
      {showLockBadge ? (
        <span className="nav-lock__badge">
          <LockGlyph /> Locked
        </span>
      ) : null}
    </>
  );
}

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
          title={item.label}
          onClick={() => explanationRef.current?.focus()}
        >
          {variant === 'home' ? (
            item.label
          ) : (
            <NavItemBody item={item} showLockBadge={variant === 'sidebar'} />
          )}
          {variant === 'home' ? (
            <span className="nav-lock__badge">
              <LockGlyph /> Locked
            </span>
          ) : null}
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
      <NavLink className="bottom-nav__item" to={item.path} title={item.label}>
        <NavItemBody item={item} />
      </NavLink>
    );
  }

  return (
    <NavLink to={item.path} end={item.path === '/'} title={item.label}>
      <NavItemBody item={item} />
    </NavLink>
  );
}

export function SidebarNav({
  items,
  inert: hideFromTree = false,
}: {
  items: readonly ResolvedNavItem[];
  inert?: boolean;
}) {
  const groups = groupNavItems(items);
  const session = useSession();
  const { clearSession } = useSessionStore();
  const navigate = useNavigate();
  let navIndex = 0;

  return (
    <nav
      className="app-sidebar"
      id="portal-nav"
      data-testid="portal-nav"
      aria-label="Primary"
      aria-hidden={hideFromTree || undefined}
      {...(hideFromTree ? { inert: '' } : {})}
    >
      {groups.map((group) => (
        <section className="nav-group" key={group.group}>
          <h2 className="nav-group__title">{NAV_GROUP_LABEL[group.group]}</h2>
          <ul className="nav-list">
            {group.items.map((item) => {
              const index = navIndex;
              navIndex += 1;
              return (
                <li key={item.id} style={{ ['--nav-i' as string]: index }}>
                  <NavItemControl item={item} variant="sidebar" />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {session.tokenScope === 'pos' ? (
        <button
          type="button"
          className="pos-logout"
          title="Sign out"
          onClick={() => {
            void performLogout().then((dest) => {
              flushSync(() => {
                clearSession();
              });
              navigate(dest, { replace: true });
            });
          }}
        >
          <span className="nav-item__icon">
            <SignOutGlyph />
          </span>
          <span className="nav-item__label">Sign out</span>
        </button>
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
