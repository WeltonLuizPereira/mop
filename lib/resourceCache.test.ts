import { describe, expect, it, vi } from 'vitest';
import { createResourceCache } from './resourceCache';

describe('createResourceCache', () => {
  it('compartilha uma leitura concorrente e reutiliza o resultado válido', async () => {
    let resolve!: (value: string[]) => void;
    const loader = vi.fn(() => new Promise<string[]>(r => { resolve = r; }));
    const cache = createResourceCache(loader, { staleTime: 60_000 });

    const first = cache.refresh();
    const second = cache.refresh();

    expect(loader).toHaveBeenCalledTimes(1);

    resolve(['A']);
    await expect(Promise.all([first, second])).resolves.toEqual([['A'], ['A']]);

    await cache.refresh();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('conserva dados durante revalidação e ignora resposta anterior', async () => {
    const responses: Array<(value: string[]) => void> = [];
    const cache = createResourceCache(
      () => new Promise<string[]>(resolve => responses.push(resolve)),
      { staleTime: 0 },
    );

    const old = cache.refresh({ force: true });
    const newer = cache.invalidate();

    responses[1](['novo']);
    await newer;
    responses[0](['antigo']);
    await old;

    expect(cache.read().data).toEqual(['novo']);
  });

  it('guarda o erro quando a primeira carga falha', async () => {
    const error = new Error('sem conexão');
    const cache = createResourceCache(() => Promise.reject(error), { staleTime: 60_000 });

    await expect(cache.refresh()).rejects.toBe(error);

    expect(cache.read().data).toBeUndefined();
    expect(cache.read()).toMatchObject({
      loading: false,
      refreshing: false,
      error,
    });
  });

  it('conserva os dados quando a revalidação falha', async () => {
    const error = new Error('sem conexão');
    const loader = vi.fn()
      .mockResolvedValueOnce(['atual'])
      .mockRejectedValueOnce(error);
    const cache = createResourceCache(loader, { staleTime: 0 });

    await cache.refresh();
    await expect(cache.refresh()).rejects.toBe(error);

    expect(cache.read()).toMatchObject({
      data: ['atual'],
      loading: false,
      refreshing: false,
      error,
    });
  });
  it('reutiliza a carga pendente quando a invalidação ocorre sobre dado ainda válido', async () => {
    const responses: Array<(value: string[]) => void> = [];
    const cache = createResourceCache(
      () => new Promise<string[]>(resolve => responses.push(resolve)),
      { staleTime: 60_000 },
    );

    const initial = cache.refresh();
    responses[0](['anterior']);
    await initial;

    const invalidated = cache.invalidate();
    const concurrentRefresh = cache.refresh();

    expect(concurrentRefresh).toBe(invalidated);

    responses[1](['atual']);
    await expect(concurrentRefresh).resolves.toEqual(['atual']);
  });

  it('não deixa um assinante que lança impedir uma carga bem-sucedida', async () => {
    const listenerError = new Error('assinante falhou');
    const loader = vi.fn(() => Promise.resolve(['novo']));
    const cache = createResourceCache(loader, { staleTime: 60_000 });
    cache.subscribe(() => { throw listenerError; });

    await expect(cache.refresh()).resolves.toEqual(['novo']);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.read().data).toEqual(['novo']);
  });

  it('não deixa um assinante que lança substituir o erro do loader', async () => {
    const listenerError = new Error('assinante falhou');
    const loaderError = new Error('sem conexão');
    const cache = createResourceCache(() => Promise.reject(loaderError), { staleTime: 60_000 });
    cache.subscribe(() => { throw listenerError; });

    await expect(cache.refresh()).rejects.toBe(loaderError);

    expect(cache.read().error).toBe(loaderError);
  });

  it('mantém os dados anteriores visíveis enquanto revalida', async () => {
    let resolve!: (value: string[]) => void;
    const loader = vi.fn()
      .mockResolvedValueOnce(['anterior'])
      .mockImplementationOnce(() => new Promise<string[]>(r => { resolve = r; }));
    const cache = createResourceCache(loader, { staleTime: 60_000 });

    await cache.refresh();
    const revalidation = cache.refresh({ force: true });

    expect(cache.read()).toMatchObject({
      data: ['anterior'],
      loading: false,
      refreshing: true,
    });

    resolve(['novo']);
    await revalidation;
  });

  it('notifica assinantes ativos e apply não dispara o loader', () => {
    const loader = vi.fn(() => Promise.resolve(['remoto']));
    const cache = createResourceCache(loader, { staleTime: 60_000 });
    const snapshots: Array<string[] | undefined> = [];
    const unsubscribe = cache.subscribe(() => snapshots.push(cache.read().data));

    cache.apply(() => ['local']);
    unsubscribe();
    cache.apply(current => [...(current ?? []), 'ignorado']);

    expect(snapshots).toEqual([['local']]);
    expect(cache.read().data).toEqual(['local', 'ignorado']);
    expect(loader).not.toHaveBeenCalled();
  });
});
