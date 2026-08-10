import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MFE_CONTRACT_VERSION,
  RemoteLoader,
  type MfeProps,
  type RemoteImporter,
  type TodoFeatureData,
} from '@/mfe';

export type TodosPageProps = {
  loadRemote?: RemoteImporter;
};

export function TodosPage({ loadRemote }: TodosPageProps = {}) {
  const [lastCount, setLastCount] = useState(1);

  const data = useMemo<MfeProps<TodoFeatureData>['data']>(
    () => ({
      contractVersion: MFE_CONTRACT_VERSION,
      context: {
        hostId: 'pharmacy-portal',
        locale: 'en-IN',
        pharmacyId: 'demo-pharmacy',
        userId: 'demo-user',
        permissions: ['todo:read', 'todo:write'],
      },
      feature: {
        title: 'Pharmacy Todos',
        initialItems: [
          {
            id: 'seed-1',
            title: 'Review pharmacy dashboard',
            completed: false,
          },
        ],
        onChange: (next) => {
          setLastCount(next.length);
        },
      },
      capabilities: {
        navigate: (path) => {
          window.history.pushState({}, '', path);
        },
        telemetry: {
          track: () => undefined,
        },
      },
    }),
    [],
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

      <RemoteLoader
        remote="todo"
        module="./Mfe"
        componentProps={{ data }}
        loadRemote={loadRemote}
      />
    </section>
  );
}
