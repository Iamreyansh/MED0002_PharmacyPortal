import { useState, type ReactNode } from 'react';
import { AppHeader } from '@/layout/AppHeader';
import { BottomNav, SidebarNav } from '@/layout/NavItems';
import { useViewportMode } from '@/layout/use-viewport';
import { resolveNavItems } from '@/navigation/resolve-nav';
import { useSession } from '@/session/SessionProvider';

export function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const viewport = useViewportMode();
  const [navOpen, setNavOpen] = useState(false);
  const items = resolveNavItems(session);
  const shellClass = [
    'app-shell',
    viewport === 'mobile' ? 'app-shell--mobile' : '',
    viewport === 'tablet' ? 'app-shell--tablet' : '',
    navOpen ? 'app-shell--nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader
        viewport={viewport}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <SidebarNav items={items} />
      <main className="app-main" id="main-content">
        {children}
      </main>
      <BottomNav items={items} />
    </div>
  );
}
