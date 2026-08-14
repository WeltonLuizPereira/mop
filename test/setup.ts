import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

// jsdom não implementa matchMedia, e o ThemeContext depende dele
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// --- Bloqueio padrão de rede ---
// `services/supabase.ts` embute URL e chave reais de produção. Sem esta
// barreira, qualquer teste que renderize um componente ou exercite
// `services/mockDb.ts` sem mockar o módulo dispara chamada HTTP real contra
// o Supabase de produção — e `SupabaseService` expõe `addUser`, `deleteUser`
// e `resetDatabase`. Alcançar a rede em teste tem que ser opt-in explícito
// (mockar o módulo de serviço com vi.mock, ou usar as fixtures de
// test/supabaseFixtures.ts), nunca opt-out.
function mensagemRedeBloqueada(url: string): string {
  return `Teste tentou alcançar a rede: ${url}. Mocke o módulo com vi.mock('../services/mockDb') ou use as fixtures de test/supabaseFixtures.ts.`;
}

/** Extrai a URL de uma chamada de fetch/XHR, se for absoluta http(s). */
function urlHttpAbsoluta(input: unknown): string | null {
  const bruta =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input && typeof input === 'object' && 'url' in (input as Record<string, unknown>)
          ? String((input as { url: unknown }).url)
          : null;
  return bruta && /^https?:\/\//i.test(bruta) ? bruta : null;
}

const fetchOriginal = globalThis.fetch?.bind(globalThis);

async function fetchComBloqueio(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const alvo = urlHttpAbsoluta(input);
  if (alvo) {
    throw new Error(mensagemRedeBloqueada(alvo));
  }
  return fetchOriginal(input, init);
}

globalThis.fetch = fetchComBloqueio as typeof fetch;
window.fetch = fetchComBloqueio as typeof fetch;

// jsdom implementa XMLHttpRequest de verdade (caminho separado do fetch);
// bloquear é barato — só sobrescrever open() na subclasse.
const XMLHttpRequestOriginal = window.XMLHttpRequest;

class XMLHttpRequestComBloqueio extends XMLHttpRequestOriginal {
  open(method: string, url: string | URL, ...resto: unknown[]): void {
    const alvo = urlHttpAbsoluta(url);
    if (alvo) {
      throw new Error(mensagemRedeBloqueada(alvo));
    }
    // @ts-expect-error - repassa a assinatura variádica (async, user, password) ao XHR original
    super.open(method, url, ...resto);
  }
}

window.XMLHttpRequest = XMLHttpRequestComBloqueio as unknown as typeof XMLHttpRequest;
globalThis.XMLHttpRequest = window.XMLHttpRequest;
