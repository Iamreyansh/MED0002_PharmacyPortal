import { useCallback, useMemo } from 'react';
import type {
  OnboardingCommand,
  OnboardingFeatureData,
  OnboardingScreen,
} from '@medmate/onboarding-contract';
import { useNavigate } from 'react-router-dom';
import { useSession, useSessionStore } from '@/modules/session';
import { readRegisterEmail } from '@/modules/onboarding/lib/register-email';
import { submitKyc } from '@/modules/onboarding/lib/submit-kyc';
import { submitRegister } from '@/modules/onboarding/lib/submit-register';
import { submitStatus } from '@/modules/onboarding/lib/submit-status';
import { submitVerify } from '@/modules/onboarding/lib/submit-verify';

export function useOnboardingFeature(
  screen: OnboardingScreen,
): OnboardingFeatureData {
  const navigate = useNavigate();
  const session = useSession();
  const { applyMe, applyRegistrationStatus } = useSessionStore();

  const onSubmit = useCallback(
    async (command: OnboardingCommand) => {
      if (command.screen === 'register') {
        return submitRegister(command, { navigate });
      }
      if (command.screen === 'verify') {
        return submitVerify(command, {
          applyMe,
          applyRegistrationStatus,
          navigate,
        });
      }
      if (command.screen === 'status') {
        return submitStatus(command, { applyRegistrationStatus });
      }
      return submitKyc(command, { applyRegistrationStatus });
    },
    [applyMe, applyRegistrationStatus, navigate],
  );

  const initialValues = useMemo(() => {
    if (screen !== 'verify') {
      return undefined;
    }
    const email = readRegisterEmail();
    return email ? { email } : undefined;
  }, [screen]);

  return useMemo(
    () => ({
      screen,
      onSubmit,
      role: session.role,
      canWriteKyc: session.role === 'pharmacy_owner',
      initialValues,
      links: { login: '/login' },
      pollIntervalMs: 30_000,
    }),
    [initialValues, onSubmit, screen, session.role],
  );
}
