import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostApi, setSessionDeathHandler } from '@/api/client';
import { hasStoredSession } from '@/api/token-store';

export function HostApiLifecycle() {
  const navigate = useNavigate();

  useEffect(() => {
    setSessionDeathHandler((path) => {
      navigate(path, { replace: true });
    });
    return () => {
      setSessionDeathHandler(null);
    };
  }, [navigate]);

  useEffect(() => {
    if (!hasStoredSession()) {
      return;
    }
    void hostApi.request({ path: '/api/v1/auth/me', method: 'GET' });
  }, []);

  return null;
}
