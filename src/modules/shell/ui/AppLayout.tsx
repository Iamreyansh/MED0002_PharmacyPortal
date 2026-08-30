import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  isPublicAuthPathname,
  isPublicContentPathname,
} from '@/app/router/route-policy';
import { AppHeader } from '@/modules/shell/ui/AppHeader';
import { BottomNav, SidebarNav } from '@/modules/shell/ui/NavItems';
import { ToastProvider } from '@/modules/shell/ui/Toast';
import { useViewportMode } from '@/modules/shell/lib/use-viewport';
import { resolveNavItems } from '@/modules/navigation';
import { useSession } from '@/modules/session';

export function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  const viewport = useViewportMode();
  const [navOpen, setNavOpen] = useState(false);
  const authChrome =
    isPublicAuthPathname(location.pathname) ||
    (isPublicContentPathname(location.pathname) && !session.authenticated);
  const items = resolveNavItems(session);
  const mobileDrawer = !authChrome && viewport === 'mobile';
  const shellClass = [
    'app-shell',
    authChrome ? 'app-shell--auth' : '',
    !authChrome && viewport === 'mobile' ? 'app-shell--mobile' : '',
    !authChrome && viewport === 'tablet' ? 'app-shell--tablet' : '',
    navOpen ? 'app-shell--nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <ToastProvider>
      <div className={shellClass}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {authChrome ? (
          <header className="app-header" role="banner">
            <p className="app-header__brand">NammaMedMate</p>
          </header>
        ) : (
          <AppHeader
            viewport={viewport}
            navOpen={navOpen}
            onToggleNav={() => setNavOpen((open) => !open)}
          />
        )}
        {mobileDrawer ? (
          <button
            type="button"
            className="app-nav-scrim"
            data-testid="nav-scrim"
            aria-label="Dismiss navigation"
            tabIndex={navOpen ? 0 : -1}
            aria-hidden={!navOpen}
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        {authChrome ? null : (
          <SidebarNav items={items} inert={mobileDrawer && !navOpen} />
        )}
        <main className="app-main" id="main-content">
          {session.pharmacyStatus === 'SUSPENDED' && !authChrome ? (
            <p
              className="banner banner--warn"
              role="status"
              data-testid="suspension-banner"
            >
              This pharmacy is suspended. Marketplace actions are blocked.
            </p>
          ) : null}
          {children}
        </main>
        {authChrome ? null : <BottomNav items={items} />}
      </div>
    </ToastProvider>
  );
}
