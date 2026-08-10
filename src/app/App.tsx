import { NavLink, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { TodosPage } from '@/pages/TodosPage';

export function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/todos">Todos</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/todos" element={<TodosPage />} />
      </Routes>
    </div>
  );
}
