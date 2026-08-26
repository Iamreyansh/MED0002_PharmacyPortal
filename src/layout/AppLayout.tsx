import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isPublicAuthPathname } from '@/app/route-policy';
import { AppHeader } from '@/layout/AppHeader';
import { BottomNav, SidebarNav } from '@/layout/NavItems';
import { ToastProvider } from '@/layout/Toast';
import { useViewportMode } from '@/layout/use-viewport';
import { resolveNavItems } from '@/navigation/resolve-nav';
import { useSession } from '@/session/SessionProvider';

export function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  const viewport = useViewportMode();
  const [navOpen, setNavOpen] = useState(false);
  const authChrome = isPublicAuthPathname(location.pathname);
  const items = resolveNavItems(session);
  const shellClass = [
    'app-shell',
    authChrome ? 'app-shell--auth' : '',
    !authChrome && viewport === 'mobile' ? 'app-shell--mobile' : '',
    !authChrome && viewport === 'tablet' ? 'app-shell--tablet' : '',
    navOpen ? 'app-shell--nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
        {authChrome ? null : <SidebarNav items={items} />}
        <main className="app-main" id="main-content">
          {session.pharmacyStatus === 'SUSPENDED' && !authChrome ? (
            <p className="banner banner--warn" role="status" data-testid="suspension-banner">
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
