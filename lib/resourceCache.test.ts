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
});
