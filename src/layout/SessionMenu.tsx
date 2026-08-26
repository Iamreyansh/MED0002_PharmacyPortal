import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { performLogout } from '@/session/logout';
import { useSession, useSessionStore } from '@/session/SessionProvider';
import { useState } from 'react';

export function SessionMenu() {
  const session = useSession();
  const { clearSession } = useSessionStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (!session.authenticated) {
    return null;
  }

  async function logout(all: boolean) {
    if (pending) {
      return;
    }
    setPending(true);
    const dest = await performLogout({ all });
    flushSync(() => {
      clearSession();
    });
    navigate(dest, { replace: true });
  }

  return (
    <div className="session-menu">
      <button
        type="button"
        className="session-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="session-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {session.staffName || 'Account'}
      </button>
      {open ? (
        <ul className="session-menu__list" role="menu">
          <li>
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => void logout(false)}
            >
              Sign out
            </button>
          </li>
          {session.tokenScope !== 'pos' ? (
            <li>
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => void logout(true)}
              >
                Sign out all devices
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
