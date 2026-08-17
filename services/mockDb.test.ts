import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Teto do PostgREST. O Supabase recusa devolver mais que isso numa requisição,
 * e — o detalhe que custa caro — não avisa: a resposta vem 200 com a lista
 * cortada. Sem paginação, a aplicação lê o pedaço achando que leu tudo.
 */
const TETO = 1000;

/** Linhas servidas pelo banco falso, por tabela. */
const tabelas: Record<string, any[]> = {};

/**
 * Construtor que imita o encadeamento do supabase-js e, principalmente, o
 * corte em 1000 linhas: sem `.range()` devolve só a primeira fatia.
 */
function construtor(tabela: string) {
  let de = 0;
  let ate = TETO - 1;

  const alvo: any = {
    select: () => alvo,
    order: () => alvo,
    eq: () => alvo,
    range: (inicio: number, fim: number) => {
      de = inicio;
      ate = Math.min(fim, inicio + TETO - 1); // o teto vale mesmo com range
      return alvo;
    },
    then: (resolver: (r: { data: any[]; error: null }) => unknown) =>
      Promise.resolve(resolver({ data: (tabelas[tabela] ?? []).slice(de, ate + 1), error: null })),
  };
  return alvo;
}

vi.mock('./supabase', () => ({
  supabase: { from: (tabela: string) => construtor(tabela) },
}));

const { db } = await import('./mockDb');

beforeEach(() => {
  for (const k of Object.keys(tabelas)) delete tabelas[k];
});

describe('leitura de tabela grande', () => {
  it('traz todos os colaboradores, mesmo passando de 1000', async () => {
    tabelas['mop_collaborators'] = Array.from({ length: 2350 }, (_, i) => ({
      matricula: String(i),
      nome: `Colaborador ${String(i).padStart(4, '0')}`,
    }));

    const colabs = await db.getCollaborators();

    expect(colabs).toHaveLength(2350);
    // o corte apagava o fim do alfabeto: sem paginação este some
    expect(colabs.at(-1)?.nome).toBe('Colaborador 2349');
  });

  it('traz todo o histórico, mesmo passando de 1000', async () => {
    tabelas['mop_history'] = Array.from({ length: 1500 }, (_, i) => ({
      id: String(i),
      action: 'Edição',
      target: `Alvo ${i}`,
      user: 'Welton',
      date: '15/08/2026 10:00:00',
      type: 'update',
    }));

    expect(await db.getHistory()).toHaveLength(1500);
  });

  it('não pagina além do fim: tabela menor que o teto vem inteira, sem repetição', async () => {
    tabelas['mop_collaborators'] = Array.from({ length: 3 }, (_, i) => ({
      matricula: String(i), nome: `Colaborador ${i}`,
    }));

    const colabs = await db.getCollaborators();

    expect(colabs).toHaveLength(3);
    expect(new Set(colabs.map(c => c.matricula)).size).toBe(3);
  });

  it('devolve lista vazia sem entrar em laço quando a tabela está vazia', async () => {
    tabelas['mop_collaborators'] = [];
    expect(await db.getCollaborators()).toEqual([]);
  });
});
