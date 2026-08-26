import { MenuGlyph } from '@/modules/shell/lib/icons';
import { PharmacySwitcher } from '@/modules/shell/ui/PharmacySwitcher';
import { SessionMenu } from '@/modules/shell/ui/SessionMenu';
import type { ViewportMode } from '@/modules/shell/lib/use-viewport';
import { useSession } from '@/modules/session';

export type AppHeaderProps = {
  viewport: ViewportMode;
  navOpen: boolean;
  onToggleNav: () => void;
};

export function AppHeader({ viewport, navOpen, onToggleNav }: AppHeaderProps) {
  const session = useSession();
  const showMenu = viewport !== 'desktop';

  return (
    <header className="app-header" role="banner">
      {showMenu ? (
        <button
          type="button"
          className="app-header__menu"
          aria-expanded={navOpen}
          aria-controls="portal-nav"
          aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          onClick={onToggleNav}
        >
          <MenuGlyph />
        </button>
      ) : null}
      <p className="app-header__brand">NammaMedMate</p>
      <PharmacySwitcher />
      <p className="app-header__pharmacy" data-testid="pharmacy-name">
        {session.pharmacyName}
      </p>
      <SessionMenu />
    </header>
  );
}
