import type { ComponentType } from 'react';
import {
  REMOTE_REGISTRY,
  type RemoteName,
  type RemoteRegistryMeta,
} from '../../config/remotes.registry';
import { TodosPage } from '@/pages/TodosPage';

export type RemoteRoute = RemoteRegistryMeta & {
  Page: ComponentType;
};

const REMOTE_PAGES: Record<RemoteName, ComponentType> = {
  todo: TodosPage,
};

export function listRemoteRoutes(): RemoteRoute[] {
  return (Object.keys(REMOTE_REGISTRY) as RemoteName[]).map((name) => ({
    ...REMOTE_REGISTRY[name],
    Page: REMOTE_PAGES[name],
  }));
}
