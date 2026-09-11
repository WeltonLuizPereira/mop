import { describe, expect, it, vi } from 'vitest';
import { startRealtimeSync } from './realtimeSync';

const resources = ['collaborators', 'clients', 'operations', 'ilhas', 'coordinators', 'supervisors'] as const;

describe('startRealtimeSync', () => {
  it('invalida o recurso do evento remoto e remove todos os canais', () => {
    const handlers: Record<string, (payload: unknown) => void> = {};
    const channels: any[] = [];
    const client = {
      channel: vi.fn((name: string) => {
        const channel: any = {
          on: vi.fn((_event: string, config: any, handler: any) => {
            handlers[config.table] = handler;
            return channel;
          }),
          subscribe: vi.fn(() => channel),
        };
        channels.push(channel);
        return channel;
      }),
      removeChannel: vi.fn(),
    };
    const store = Object.fromEntries(resources.map(name => [name, { invalidate: vi.fn() }])) as any;

    const stop = startRealtimeSync(client as any, store);
    handlers.mop_collaborators({ eventType: 'UPDATE' });
    expect(store.collaborators.invalidate).toHaveBeenCalledOnce();

    stop();
    for (const channel of channels) expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });

  it('atualiza todos os recursos depois que um canal reconecta', async () => {
    const subscriptions: Array<(status: string) => void> = [];
    const client = {
      channel: vi.fn(() => {
        const channel: any = {
          on: vi.fn(() => channel),
          subscribe: vi.fn((callback: (status: string) => void) => {
            subscriptions.push(callback);
            return channel;
          }),
        };
        return channel;
      }),
      removeChannel: vi.fn(),
    };
    const store = Object.fromEntries(
      resources.map(name => [name, { invalidate: vi.fn().mockResolvedValue(undefined) }]),
    ) as any;

    startRealtimeSync(client as any, store);
    subscriptions[0]('SUBSCRIBED');
    subscriptions[0]('SUBSCRIBED');
    await vi.waitFor(() => {
      for (const resource of resources) expect(store[resource].invalidate).toHaveBeenCalledOnce();
    });
  });

  it('isola falhas de assinatura e continua criando os demais canais', () => {
    const client = {
      channel: vi.fn((name: string) => {
        if (name.includes('mop_clients')) throw new Error('canal indisponivel');
        const channel: any = {
          on: vi.fn(() => channel),
          subscribe: vi.fn(() => channel),
        };
        return channel;
      }),
      removeChannel: vi.fn(),
    };
    const store = Object.fromEntries(resources.map(name => [name, { invalidate: vi.fn() }])) as any;

    expect(() => startRealtimeSync(client as any, store)).not.toThrow();
    expect(client.channel).toHaveBeenCalledTimes(resources.length);
  });
});
