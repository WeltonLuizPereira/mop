import { createResourceCache, type ResourceCache } from '../lib/resourceCache';
import { db } from '../services/mockDb';

export type ResourceName =
  | 'collaborators'
  | 'clients'
  | 'operations'
  | 'ilhas'
  | 'coordinators'
  | 'supervisors';

type AppDataSource = Pick<typeof db,
  | 'getCollaborators'
  | 'getClients'
  | 'getOperations'
  | 'getIlhas'
  | 'getCoordinators'
  | 'getSupervisors'
>;

export type ResourceData = {
  [Name in ResourceName]: Awaited<ReturnType<AppDataSource[
    `get${Capitalize<Name>}`
  ]>>;
};

export type AppDataStore = {
  [Name in ResourceName]: ResourceCache<ResourceData[Name]>;
};

export const createAppData = (source: AppDataSource = db): AppDataStore => ({
  collaborators: createResourceCache(() => source.getCollaborators(), { staleTime: 60_000 }),
  clients: createResourceCache(() => source.getClients(), { staleTime: 60_000 }),
  operations: createResourceCache(() => source.getOperations(), { staleTime: 60_000 }),
  ilhas: createResourceCache(() => source.getIlhas(), { staleTime: 60_000 }),
  coordinators: createResourceCache(() => source.getCoordinators(), { staleTime: 60_000 }),
  supervisors: createResourceCache(() => source.getSupervisors(), { staleTime: 60_000 }),
});

export const appData = createAppData();
