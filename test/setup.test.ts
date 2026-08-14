import { describe, expect, it, vi } from 'vitest';
import { FIXTURES } from './supabaseFixtures';

const URL_PRODUCAO_SUPABASE = 'https://rolbbkazwcgwjtjadrsn.supabase.co/rest/v1/mop_users?select=*';

// vi.mock é hoisted pelo Vitest para o topo do arquivo — precisa vir antes
// do import de '../services/mockDb' abaixo para valer nesse import.
vi.mock('../services/mockDb', () => ({
  db: {
    getUsers: async () => FIXTURES.mop_users,
  },
}));

describe('barreira de rede em test/setup.ts', () => {
  it('fetch para a URL de produção do Supabase rejeita, não completa', async () => {
    await expect(fetch(URL_PRODUCAO_SUPABASE)).rejects.toBeInstanceOf(Error);
  });

  it('a mensagem de erro cita a URL bloqueada e como resolver', async () => {
    await expect(fetch(URL_PRODUCAO_SUPABASE)).rejects.toThrow(
      /Teste tentou alcançar a rede: https:\/\/rolbbkazwcgwjtjadrsn\.supabase\.co.*vi\.mock.*supabaseFixtures/s,
    );
  });

  it('bloqueia também XMLHttpRequest para a mesma URL', () => {
    const xhr = new XMLHttpRequest();
    expect(() => xhr.open('GET', URL_PRODUCAO_SUPABASE)).toThrow(/Teste tentou alcançar a rede/);
  });

  it('um módulo mockado com vi.mock continua funcionando normalmente, sem tocar a rede', async () => {
    const { db } = await import('../services/mockDb');
    const users = await db.getUsers();
    expect(users).toEqual(FIXTURES.mop_users);
  });
});
