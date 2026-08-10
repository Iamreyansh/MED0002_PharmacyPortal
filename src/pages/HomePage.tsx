import { Link } from 'react-router-dom';
import { listConfiguredRemotes } from '@/mfe';

export function HomePage() {
  const remotes = listConfiguredRemotes();

  return (
    <section className="page">
      <p className="eyebrow">NammaMedMate</p>
      <h1>Pharmacy Portal</h1>
      <p>
        Host shell that composes independently deployed React micro-frontends.
      </p>
      <ul>
        <li>
          <Link to="/todos">Open Todo MFE</Link>
        </li>
      </ul>
      <p data-testid="configured-remotes">
        Configured remotes: {remotes.length > 0 ? remotes.join(', ') : 'none'}
      </p>
    </section>
  );
}
