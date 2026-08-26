import { createContext, useContext, type ReactNode } from 'react';
import { readSessionFixture, type PortalSession } from '@/session/session';

const SessionContext = createContext<PortalSession | null>(null);

export type SessionProviderProps = {
  children: ReactNode;
  session?: PortalSession;
};

export function SessionProvider({ children, session }: SessionProviderProps) {
  const value = session ?? readSessionFixture();
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): PortalSession {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
