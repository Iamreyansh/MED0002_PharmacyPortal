import { Link } from 'react-router-dom';
import { listConfiguredRemotes } from '@medmate/federation-config';
import { listRemoteRegistry } from '../../config/remotes.registry';

export function HomePage() {
  const configured = listConfiguredRemotes(
    import.meta.env as Record<string, string | undefined>,
  );
  const remotes = listRemoteRegistry();

  return (
    <section className="page">
      <p className="eyebrow">NammaMedMate</p>
      <h1>Pharmacy Portal</h1>
      <p>
        Host shell that composes independently deployed React micro-frontends.
      </p>
      <ul>
        {remotes.map((remote) => (
          <li key={remote.name}>
            <Link to={remote.route}>Open {remote.navLabel} MFE</Link>
          </li>
        ))}
      </ul>
      <p data-testid="configured-remotes">
        Configured remotes:{' '}
        {configured.length > 0 ? configured.join(', ') : 'none'}
      </p>
    </section>
  );
}
