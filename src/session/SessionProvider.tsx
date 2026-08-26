import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getTokens } from '@/api/token-store';
import {
  applyRegistrationStatus as mergeRegistrationStatus,
  hydrateInitialSession,
  sessionFromLogin,
  sessionFromMe,
  sessionFromPosPin,
  sessionFromSwitch,
} from '@/session/hydrate';
import {
  UNAUTHENTICATED_SESSION,
  type PharmacyOption,
  type PortalSession,
} from '@/session/session';
import {
  clearSessionSnapshot,
  setSessionSnapshot,
  snapshotFromSession,
} from '@/session/snapshot';

export type BootstrapStatus = 'idle' | 'loading' | 'ready';

type LiveState = {
  session: PortalSession;
  pharmacies: PharmacyOption[];
};

export type SessionStore = {
  session: PortalSession;
  pharmacies: readonly PharmacyOption[];
  bootstrapStatus: BootstrapStatus;
  locked: boolean;
  applyLogin: (data: Record<string, unknown>) => void;
  applyMe: (data: Record<string, unknown>) => void;
  applyRegistrationStatus: (data: Record<string, unknown>) => void;
  applySwitch: (data: Record<string, unknown>) => void;
  applyPosLogin: (data: Record<string, unknown>) => void;
  clearSession: () => void;
  setBootstrapStatus: (status: BootstrapStatus) => void;
};

const SessionContext = createContext<SessionStore | null>(null);

export type SessionProviderProps = {
  children: ReactNode;
  session?: PortalSession;
  pharmacies?: PharmacyOption[];
};

function persist(session: PortalSession, pharmacies: readonly PharmacyOption[]): void {
  if (!session.authenticated) {
    clearSessionSnapshot();
    return;
  }
  setSessionSnapshot(snapshotFromSession(session, pharmacies));
}

export function SessionProvider({
  children,
  session: injected,
  pharmacies: pharmaciesOverride,
}: SessionProviderProps) {
  const locked = Boolean(injected);
  const initial = injected
    ? {
        session: injected,
        pharmacies: pharmaciesOverride ?? ([] as PharmacyOption[]),
      }
    : hydrateInitialSession();
  const [live, setLive] = useState<LiveState>(initial);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>(
    locked || !initial.session.authenticated ? 'ready' : 'idle',
  );

  const applyLogin = useCallback((data: Record<string, unknown>) => {
    const next = sessionFromLogin(data, getTokens().tokenScope);
    persist(next.session, next.pharmacies);
    setLive(next);
    setBootstrapStatus('ready');
  }, []);

  const applyMe = useCallback((data: Record<string, unknown>) => {
    setLive((prev) => {
      const next = sessionFromMe(data, prev.session, prev.pharmacies);
      persist(next.session, next.pharmacies);
      return next;
    });
  }, []);

  const applyRegistrationStatus = useCallback(
    (data: Record<string, unknown>) => {
      setLive((prev) => {
        const session = mergeRegistrationStatus(data, prev.session);
        persist(session, prev.pharmacies);
        return { ...prev, session };
      });
    },
    [],
  );

  const applySwitch = useCallback((data: Record<string, unknown>) => {
    setLive((prev) => {
      const next = sessionFromSwitch(data, prev.session, prev.pharmacies);
      persist(next.session, next.pharmacies);
      return next;
    });
  }, []);

  const applyPosLogin = useCallback((data: Record<string, unknown>) => {
    const next = sessionFromPosPin(data);
    persist(next.session, next.pharmacies);
    setLive(next);
    setBootstrapStatus('ready');
  }, []);

  const clearSession = useCallback(() => {
    clearSessionSnapshot();
    setLive({ session: UNAUTHENTICATED_SESSION, pharmacies: [] });
    setBootstrapStatus('ready');
  }, []);

  const value = useMemo<SessionStore>(
    () => ({
      session: live.session,
      pharmacies: live.pharmacies,
      bootstrapStatus,
      locked,
      applyLogin,
      applyMe,
      applyRegistrationStatus,
      applySwitch,
      applyPosLogin,
      clearSession,
      setBootstrapStatus,
    }),
    [
      live,
      bootstrapStatus,
      locked,
      applyLogin,
      applyMe,
      applyRegistrationStatus,
      applySwitch,
      applyPosLogin,
      clearSession,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionStore(): SessionStore {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}

export function useSession(): PortalSession {
  return useSessionStore().session;
}
