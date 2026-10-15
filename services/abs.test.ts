import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('./supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }));

import { ABS_REFRESH_TIMEOUT_MESSAGE, triggerAbsImport } from './abs';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('triggerAbsImport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    rpc.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('usa a resposta JSON do caminho de dev quando o endpoint existe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { success: true, message: 'ok local' })));
    await expect(triggerAbsImport()).resolves.toEqual({ success: true, message: 'ok local' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('em produção (404) pede a fila e devolve o resultado real do agente', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })));
    let statusCalls = 0;
    rpc.mockImplementation(async (name: string) => {
      if (name === 'mop_abs_request_refresh') return { data: 'req-1', error: null };
      statusCalls += 1;
      if (statusCalls === 1) return { data: { id: 'req-1', status: 'processando', result: null, error_message: null, finished_at: null }, error: null };
      return { data: { id: 'req-1', status: 'concluida', result: 'Importadas 42 linhas', error_message: null, finished_at: '2026-10-15T10:00:00Z' }, error: null };
    });
    const promise = triggerAbsImport();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ success: true, message: 'Importadas 42 linhas' });
    expect(rpc).toHaveBeenCalledWith('mop_abs_refresh_status', { p_id: 'req-1' });
  });

  it('propaga erro do agente (status erro) sem fingir sucesso', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })));
    rpc.mockImplementation(async (name: string) => {
      if (name === 'mop_abs_request_refresh') return { data: 'req-2', error: null };
      return { data: { id: 'req-2', status: 'erro', result: null, error_message: 'rede indisponível', finished_at: null }, error: null };
    });
    const promise = triggerAbsImport();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ success: false, message: 'rede indisponível' });
  });

  it('em timeout devolve mensagem honesta de pedido enviado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })));
    rpc.mockImplementation(async (name: string) => {
      if (name === 'mop_abs_request_refresh') return { data: 'req-3', error: null };
      return { data: { id: 'req-3', status: 'pendente', result: null, error_message: null, finished_at: null }, error: null };
    });
    const promise = triggerAbsImport();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ success: false, message: ABS_REFRESH_TIMEOUT_MESSAGE });
  });

  it('erro ao solicitar a RPC aparece como falha', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not Found', { status: 404 })));
    rpc.mockResolvedValue({ data: null, error: { message: 'forbidden' } });
    await expect(triggerAbsImport()).resolves.toEqual({
      success: false,
      message: 'Não foi possível solicitar a atualização do ABS: forbidden',
    });
  });
});
