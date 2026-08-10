import { NavLink, Route, Routes } from 'react-router-dom';
import { listRemoteRoutes } from '@/app/routes';
import { HomePage } from '@/pages/HomePage';

export function App() {
  const remotes = listRemoteRoutes();

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <NavLink to="/" end>
          Home
        </NavLink>
        {remotes.map((remote) => (
          <NavLink key={remote.name} to={remote.route}>
            {remote.navLabel}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {remotes.map((remote) => {
          const Page = remote.Page;
          return (
            <Route key={remote.name} path={remote.route} element={<Page />} />
          );
        })}
      </Routes>
    </div>
  );
}
