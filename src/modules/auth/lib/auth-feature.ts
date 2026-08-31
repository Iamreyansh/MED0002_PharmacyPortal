import { useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  AuthCommand,
  AuthFeatureData,
  AuthPortalType,
  AuthSubmitResult,
} from '@medmate/auth-contract';
import { useSessionStore } from '@/modules/session';
import { readPosLastIds } from '@/modules/auth/lib/pos-last';
import { submitForgot } from '@/modules/auth/lib/submit-forgot';
import { submitPharmacy } from '@/modules/auth/lib/submit-pharmacy';
import { submitPos } from '@/modules/auth/lib/submit-pos';
import { submitReset } from '@/modules/auth/lib/submit-reset';
import {
  asSessionRows,
  submitSessions,
} from '@/modules/auth/lib/submit-sessions';

export function useAuthFeature(portalType: AuthPortalType): AuthFeatureData {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyLogin, applyPosLogin, clearSession } = useSessionStore();
  const sessionRowsRef = useRef(asSessionRows([]));

  const onSubmit = useCallback(
    async (command: AuthCommand): Promise<AuthSubmitResult> => {
      if (command.portalType === 'pharmacy') {
        return submitPharmacy(command, {
          applyLogin,
          navigate,
          search: location.search,
        });
      }
      if (command.portalType === 'pharmacy-forgot') {
        return submitForgot(command);
      }
      if (command.portalType === 'pharmacy-reset') {
        return submitReset(command, { navigate });
      }
      if (command.portalType === 'pos') {
        return submitPos(command, { applyPosLogin, navigate });
      }
      if (command.portalType === 'sessions') {
        const result = await submitSessions(
          command,
          { navigate, clearSession },
          sessionRowsRef.current,
        );
        if (result.ok && result.mappedRows) {
          sessionRowsRef.current = result.mappedRows;
        }
        const { mappedRows: _mapped, ...safe } = result;
        return safe;
      }
      return {
        ok: false,
        formError: 'This portal does not support that sign-in method.',
      };
    },
    [applyLogin, applyPosLogin, clearSession, location.search, navigate],
  );

  const initialValues = useMemo((): Record<string, string> | undefined => {
    if (portalType === 'pharmacy-reset') {
      const token = new URLSearchParams(location.search).get('token') ?? '';
      return { token, resetToken: token };
    }
    if (portalType !== 'pos') {
      return undefined;
    }
    const last = readPosLastIds();
    return {
      pharmacyId: last.pharmacyId,
      staffId: last.staffId,
    };
  }, [location.search, portalType]);

  const links = useMemo(() => {
    if (portalType === 'pharmacy') {
      return {
        posLogin: '/pos-login',
        register: '/register',
        forgotPassword: '/forgot-password',
      };
    }
    if (portalType === 'pharmacy-forgot' || portalType === 'pharmacy-reset') {
      return { login: '/login' };
    }
    return undefined;
  }, [portalType]);

  return useMemo(
    () => ({
      portalType,
      onSubmit,
      initialValues,
      links,
    }),
    [initialValues, links, onSubmit, portalType],
  );
}
