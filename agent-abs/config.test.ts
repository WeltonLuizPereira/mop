import { describe, expect, it } from 'vitest';
import { normalizeSupabaseUrl } from './config.mjs';

describe('normalizeSupabaseUrl', () => {
  it('remove o caminho REST informado por engano', () => {
    expect(normalizeSupabaseUrl('https://projeto.supabase.co/rest/v1/'))
      .toBe('https://projeto.supabase.co');
  });

  it('preserva a origem correta sem barra final', () => {
    expect(normalizeSupabaseUrl('https://projeto.supabase.co/'))
      .toBe('https://projeto.supabase.co');
  });
});
