import type { AppDataStore, ResourceName } from './appData';

const realtimeResources: ReadonlyArray<{ table: string; resource: ResourceName }> = [
  { table: 'mop_collaborators', resource: 'collaborators' },
  { table: 'mop_clients', resource: 'clients' },
  { table: 'mop_operations', resource: 'operations' },
  { table: 'mop_ilhas', resource: 'ilhas' },
  { table: 'mop_coordinators', resource: 'coordinators' },
  { table: 'mop_supervisors', resource: 'supervisors' },
];

type RealtimeChannel = {
  on: (
    event: 'postgres_changes',
    filter: { event: '*'; schema: 'public'; table: string },
    handler: (payload: unknown) => void,
  ) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeChannel;
};

type RealtimeClient = {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => unknown;
};

const ignoreFailure = (operation: () => unknown) => {
  try {
    void Promise.resolve(operation()).catch(() => undefined);
  } catch {
    // Realtime is an optimization. HTTP-backed cache reads remain authoritative.
  }
};

export function startRealtimeSync(client: RealtimeClient, store: AppDataStore): () => void {
  const channels: RealtimeChannel[] = [];
  let refreshInProgress = false;

  const refreshAll = () => {
    if (refreshInProgress) return;
    refreshInProgress = true;

    void Promise.allSettled(
      realtimeResources.map(({ resource }) => store[resource].invalidate()),
    ).finally(() => {
      refreshInProgress = false;
    });
  };

  for (const { table, resource } of realtimeResources) {
    try {
      let hasSubscribed = false;
      const channel = client
        .channel(`mop-cache-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => ignoreFailure(() => store[resource].invalidate()),
        )
        .subscribe(status => {
          if (status !== 'SUBSCRIBED') return;
          if (hasSubscribed) refreshAll();
          hasSubscribed = true;
        });

      channels.push(channel);
    } catch {
      // A failed subscription must not prevent the remaining channels or HTTP reads.
    }
  }

  return () => {
    for (const channel of channels) {
      ignoreFailure(() => client.removeChannel(channel));
    }
  };
}
