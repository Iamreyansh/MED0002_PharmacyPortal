import { Route, Routes } from 'react-router-dom';
import { isDemoRemotesEnabled, listProductMounts } from '@/mfe/registry';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RemoteModulePage } from '@/pages/RemoteModulePage';
import { TodosPage } from '@/pages/TodosPage';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
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
