import { Route, Routes } from 'react-router-dom';
import { isDemoRemotesEnabled, listProductMounts } from '@/mfe/registry';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PosLoginPage } from '@/pages/PosLoginPage';
import { RemoteModulePage } from '@/pages/RemoteModulePage';
import { TodosPage } from '@/pages/TodosPage';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pos-login" element={<PosLoginPage />} />
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
