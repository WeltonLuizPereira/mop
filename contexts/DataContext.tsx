import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  appData,
  type AppDataStore,
  type ResourceData,
  type ResourceName,
} from '../data/appData';
import type { ResourceCache, ResourceSnapshot } from '../lib/resourceCache';

const DataContext = createContext<AppDataStore | undefined>(undefined);

export function DataProvider({ children, store = appData }: {
  children: ReactNode;
  store?: AppDataStore;
}) {
  return <DataContext.Provider value={store}>{children}</DataContext.Provider>;
}

export function useAppData(): AppDataStore {
  const store = useContext(DataContext);
  if (!store) throw new Error('useAppData must be used within a DataProvider');
  return store;
}

export function useResource<Name extends ResourceName>(
  name: Name,
): ResourceSnapshot<ResourceData[Name]> {
  const resource: ResourceCache<ResourceData[Name]> = useAppData()[name];
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.read,
    resource.read,
  );

  useEffect(() => {
    void resource.refresh().catch(() => undefined);
  }, [resource]);

  return snapshot;
}
