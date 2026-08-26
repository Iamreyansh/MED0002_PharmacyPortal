import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostApi, setSessionDeathHandler } from '@/modules/api/api/client';
import {
  clearTokens,
  getTokens,
  hasStoredSession,
} from '@/modules/api/store/token-store';
import { useSessionStore } from '@/modules/session/store/SessionProvider';

export function HostApiLifecycle() {
  const navigate = useNavigate();
  const {
    locked,
    applyMe,
    applyRegistrationStatus,
    clearSession,
    setBootstrapStatus,
  } = useSessionStore();

  useEffect(() => {
    setSessionDeathHandler((path) => {
      clearSession();
      navigate(path, { replace: true });
    });
    return () => {
      setSessionDeathHandler(null);
    };
  }, [navigate, clearSession]);

  useEffect(() => {
    if (locked || !hasStoredSession()) {
      return;
    }
    // POS tokens are rejected on /auth/me (POS_TOKEN_RESTRICTED). Hydrate from PIN only.
    if (getTokens().tokenScope === 'pos') {
      setBootstrapStatus('ready');
      return;
    }
    let cancelled = false;
    setBootstrapStatus('loading');
    void (async () => {
      const me = await hostApi.request<Record<string, unknown>>({
        path: '/api/v1/auth/me',
        method: 'GET',
      });
      if (cancelled) {
        return;
      }
      if (!me.ok || !me.data || typeof me.data !== 'object') {
        if (hasStoredSession()) {
          const dest =
            getTokens().tokenScope === 'pos' ? '/pos-login' : '/login';
          clearTokens();
          clearSession();
          navigate(dest, { replace: true });
        } else {
          clearSession();
        }
        return;
      }
      applyMe(me.data);
      if (getTokens().tokenScope !== 'pos') {
        const status = await hostApi.request<Record<string, unknown>>({
          path: '/api/v1/pharmacy/registration-status',
          method: 'GET',
        });
        if (cancelled) {
          return;
        }
        if (status.ok && status.data && typeof status.data === 'object') {
          applyRegistrationStatus(status.data);
        }
      }
      setBootstrapStatus('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [
    locked,
    applyMe,
    applyRegistrationStatus,
    clearSession,
    navigate,
    setBootstrapStatus,
  ]);

  return null;
}
