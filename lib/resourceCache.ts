export type ResourceSnapshot<T> = {
  data?: T;
  loading: boolean;
  refreshing: boolean;
  error?: unknown;
  updatedAt: number;
};

export type ResourceCache<T> = {
  read(): ResourceSnapshot<T>;
  refresh(options?: { force?: boolean }): Promise<T>;
  invalidate(): Promise<T>;
  subscribe(listener: () => void): () => void;
  apply(updater: (current: T | undefined) => T | undefined): void;
};

export function createResourceCache<T>(
  loader: () => Promise<T> | T,
  { staleTime }: { staleTime: number },
): ResourceCache<T> {
  let snapshot: ResourceSnapshot<T> = {
    loading: false,
    refreshing: false,
    updatedAt: 0,
  };
  let pending: Promise<T> | undefined;
  let generation = 0;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach(listener => listener());

  const startLoad = (): Promise<T> => {
    const requestGeneration = generation;

    snapshot = {
      ...snapshot,
      loading: snapshot.data === undefined,
      refreshing: snapshot.data !== undefined,
      error: undefined,
    };
    notify();

    let request: Promise<T>;
    try {
      request = Promise.resolve(loader());
    } catch (error) {
      request = Promise.reject(error);
    }

    const result = request.then(
      data => {
        if (requestGeneration === generation) {
          snapshot = { data, loading: false, refreshing: false, updatedAt: Date.now() };
          notify();
        }
        return data;
      },
      error => {
        if (requestGeneration === generation) {
          snapshot = { ...snapshot, loading: false, refreshing: false, error };
          notify();
        }
        throw error;
      },
    );

    pending = result;
    result.then(
      () => { if (pending === result) pending = undefined; },
      () => { if (pending === result) pending = undefined; },
    );
    return result;
  };

  const refresh = (options?: { force?: boolean }): Promise<T> => {
    if (!options?.force && snapshot.data !== undefined && Date.now() - snapshot.updatedAt < staleTime) {
      return Promise.resolve(snapshot.data);
    }

    if (!options?.force && pending) {
      return pending;
    }

    if (options?.force) generation += 1;
    return startLoad();
  };

  return {
    read: () => ({ ...snapshot }),
    refresh,
    invalidate: () => {
      generation += 1;
      return startLoad();
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    apply: updater => {
      snapshot = { ...snapshot, data: updater(snapshot.data), updatedAt: Date.now() };
      notify();
    },
  };
}
