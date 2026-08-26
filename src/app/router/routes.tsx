import { Route, Routes } from 'react-router-dom';
import { isDemoRemotesEnabled, listProductMounts } from '@/modules/mfe';
import { HomePage } from '@/modules/home';
import { LoginPage } from '@/modules/auth';
import { NotFoundPage } from '@/modules/not-found';
import { PosLoginPage } from '@/modules/auth';
import { RemoteModulePage } from '@/modules/remote';
import { SessionsPage } from '@/modules/auth';
import { TodosPage } from '@/modules/todos';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts().filter(
    (mount) =>
      mount.route !== '/login' &&
      mount.route !== '/pos-login' &&
      mount.route !== '/sessions',
  );

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pos-login" element={<PosLoginPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
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
