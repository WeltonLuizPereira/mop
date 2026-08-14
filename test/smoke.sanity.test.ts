import { describe, expect, it } from 'vitest';
import { FIXTURES } from './supabaseFixtures';

describe('infraestrutura de teste', () => {
  it('roda no ambiente jsdom', () => {
    expect(typeof document).toBe('object');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
  });

  it('expõe fixtures para as tabelas usadas pelo app', () => {
    for (const t of ['mop_users', 'mop_ilhas', 'mop_collaborators', 'mop_clients']) {
      expect(FIXTURES[t]).toBeDefined();
    }
  });
});
