import type { RemoteImporter } from '@medmate/host-kit';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { REMOTE_REGISTRY, resolveRemoteUrl } from '@/config';
import type { TodoFeatureData } from '../config/types';
import { MfeOutlet, buildHostContext, useMfeEnvelope } from '@/modules/mfe';

export type TodosPageProps = {
  loadRemote?: RemoteImporter;
};

export function TodosPage({ loadRemote }: TodosPageProps = {}) {
  const [lastCount, setLastCount] = useState(1);
  const remote = REMOTE_REGISTRY.todo;
  const remoteUrl = resolveRemoteUrl(remote.name);

  const onChange = useCallback((next: readonly { id: string }[]) => {
    setLastCount(next.length);
  }, []);

  const feature = useMemo<TodoFeatureData>(
    () => ({
      title: 'Pharmacy Todos',
      initialItems: [
        {
          id: 'seed-1',
          title: 'Review pharmacy dashboard',
          completed: false,
        },
      ],
      onChange,
    }),
    [onChange],
  );

  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: ['todo:read', 'todo:write'],
    }),
  );

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Remote MFE</p>
          <h1>Todos</h1>
          <p>
            Loaded from the Todo remote via Module Federation. Host count:{' '}
            <strong data-testid="host-todo-count">{lastCount}</strong>
          </p>
        </div>
        <Link to="/">Back home</Link>
      </header>

      <MfeOutlet
        remote={remote.name}
        module={remote.module}
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
