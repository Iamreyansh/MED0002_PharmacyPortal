import { Route, Routes } from 'react-router-dom';
import { AuthRemotePage } from '@/modules/auth';
import { OnboardingRemotePage } from '@/modules/onboarding';
import { isDemoRemotesEnabled, listProductMounts } from '@/modules/mfe';
import { HomePage } from '@/modules/home';
import { NotFoundPage } from '@/modules/not-found';
import { RemoteModulePage } from '@/modules/remote';
import { TodosPage } from '@/modules/todos';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts().filter(
    (mount) =>
      mount.route !== '/login' &&
      mount.route !== '/pos-login' &&
      mount.route !== '/sessions' &&
      mount.route !== '/onboarding' &&
      mount.route !== '/register',
  );

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<AuthRemotePage key="pharmacy" portalType="pharmacy" />}
      />
      <Route
        path="/pos-login"
        element={<AuthRemotePage key="pos" portalType="pos" />}
      />
      <Route
        path="/sessions"
        element={<AuthRemotePage key="sessions" portalType="sessions" />}
      />
      <Route
        path="/register"
        element={<OnboardingRemotePage key="register" screen="register" />}
      />
      <Route
        path="/register/verify"
        element={<OnboardingRemotePage key="verify" screen="verify" />}
      />
      <Route
        path="/onboarding"
        element={<OnboardingRemotePage key="status-root" screen="status" />}
      />
      <Route
        path="/onboarding/status"
        element={<OnboardingRemotePage key="status" screen="status" />}
      />
      <Route
        path="/onboarding/kyc"
        element={<OnboardingRemotePage key="kyc" screen="kyc" />}
      />
      {mounts.map((mount) => (
        <Route
          key={`${mount.remoteName}:${mount.route}`}
          path={`${mount.route}/*`}
          element={<RemoteModulePage remoteName={mount.remoteName} />}
        />
      ))}
      {demoEnabled ? (
        <Route path="/todos/*" element={<TodosPage />} />
      ) : (
        <Route path="/todos" element={<NotFoundPage />} />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
