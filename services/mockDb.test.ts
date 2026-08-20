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
 * Construtor que imita o encadeamento do supabase-js: leitura paginada e
 * filtrada por `.eq()`, e escrita por `.insert()`/`.update()`/`.single()`.
 */
function construtor(tabela: string) {
  let de = 0;
  let ate = TETO - 1;
  const filtros: Record<string, any> = {};

  const linhas = () => tabelas[tabela] ?? [];
  const filtradas = () => linhas().filter(row =>
    Object.entries(filtros).every(([coluna, valor]) => row[coluna] === valor));

  const alvo: any = {
    select: () => alvo,
    order: () => alvo,
    eq: (coluna: string, valor: any) => { filtros[coluna] = valor; return alvo; },
    range: (inicio: number, fim: number) => {
      de = inicio;
      ate = Math.min(fim, inicio + TETO - 1); // o teto vale mesmo com range
      return alvo;
    },
    single: () => Promise.resolve({ data: filtradas()[0] ?? null, error: null }),
    insert: (payload: any) => {
      if (!tabelas[tabela]) tabelas[tabela] = [];
      tabelas[tabela].push(...(Array.isArray(payload) ? payload : [payload]));
      return Promise.resolve({ error: null });
    },
    update: (payload: any) => ({
      eq: (coluna: string, valor: any) => {
        const idx = linhas().findIndex(row => row[coluna] === valor);
        if (idx >= 0) linhas()[idx] = { ...linhas()[idx], ...payload };
        return Promise.resolve({ error: null });
      },
    }),
    then: (resolver: (r: { data: any[]; error: null }) => unknown) =>
      Promise.resolve(resolver({ data: filtradas().slice(de, ate + 1), error: null })),
  };
  return alvo;
}

vi.mock('./supabase', () => ({
  supabase: { from: (tabela: string) => construtor(tabela) },
}));

const { db } = await import('./mockDb');
const { referenciaDoMes } = await import('../lib/provimentoStats');

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

describe('provimento — leitura e gravação de uma linha', () => {
  it('getProvimento devolve só as linhas do mês pedido', async () => {
    tabelas['mop_provimento'] = [
      { id: 'p1', ilha_id: 'i1', referencia: '2026-07-01', pa_contratada: 8 },
      { id: 'p2', ilha_id: 'i1', referencia: '2026-08-01', pa_contratada: 10 },
    ];

    const doMes = await db.getProvimento('2026-08-01');

    expect(doMes).toEqual([{ id: 'p2', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 10 }]);
  });

  it('saveProvimento insere quando não existe linha para a ilha no mês', async () => {
    tabelas['mop_provimento'] = [];

    await db.saveProvimento({ id: 'novo', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 9 });

    expect(tabelas['mop_provimento']).toEqual([
      { id: 'novo', ilha_id: 'i1', referencia: '2026-08-01', pa_contratada: 9 },
    ]);
  });

  it('saveProvimento atualiza quando já existe linha para a ilha no mês', async () => {
    tabelas['mop_provimento'] = [
      { id: 'p1', ilha_id: 'i1', referencia: '2026-08-01', pa_contratada: 8 },
    ];

    await db.saveProvimento({ id: 'p1', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 11 });

    expect(tabelas['mop_provimento']).toEqual([
      { id: 'p1', ilha_id: 'i1', referencia: '2026-08-01', pa_contratada: 11 },
    ]);
  });
});

describe('provimento — auto-cadastro do mês vigente', () => {
  it('copia a PA Contratada da referência mais recente para o mês vigente', async () => {
    tabelas['mop_ilhas'] = [
      { id: 'i1', nome: 'Ilha 01', status: 'ATIVO', client_id: 'c1', operation_id: 'o1', coordinator_ids: [], supervisor_ids: [] },
    ];
    tabelas['mop_provimento'] = [
      { id: 'p1', ilha_id: 'i1', referencia: '2026-06-01', pa_contratada: 8 },
      { id: 'p2', ilha_id: 'i1', referencia: '2026-07-01', pa_contratada: 10 },
    ];

    await db.ensureProvimentoMesAtual();

    const referenciaAtual = referenciaDoMes(new Date());
    const doMes = tabelas['mop_provimento'].filter((p: any) => p.referencia === referenciaAtual);
    expect(doMes).toHaveLength(1);
    expect(doMes[0].pa_contratada).toBe(10);
  });

  it('entra com PA Contratada 0 quando a ilha não tem nenhum histórico', async () => {
    tabelas['mop_ilhas'] = [
      { id: 'i2', nome: 'Ilha nova', status: 'ATIVO', client_id: 'c1', operation_id: 'o1', coordinator_ids: [], supervisor_ids: [] },
    ];
    tabelas['mop_provimento'] = [];

    await db.ensureProvimentoMesAtual();

    const referenciaAtual = referenciaDoMes(new Date());
    const doMes = tabelas['mop_provimento'].filter((p: any) => p.referencia === referenciaAtual);
    expect(doMes).toHaveLength(1);
    expect(doMes[0].pa_contratada).toBe(0);
  });

  it('não duplica quando a ilha já tem PA Contratada no mês vigente', async () => {
    const referenciaAtual = referenciaDoMes(new Date());
    tabelas['mop_ilhas'] = [
      { id: 'i1', nome: 'Ilha 01', status: 'ATIVO', client_id: 'c1', operation_id: 'o1', coordinator_ids: [], supervisor_ids: [] },
    ];
    tabelas['mop_provimento'] = [
      { id: 'p1', ilha_id: 'i1', referencia: referenciaAtual, pa_contratada: 12 },
    ];

    await db.ensureProvimentoMesAtual();

    expect(tabelas['mop_provimento']).toHaveLength(1);
  });

  it('ignora ilha inativa', async () => {
    tabelas['mop_ilhas'] = [
      { id: 'i3', nome: 'Ilha desativada', status: 'INATIVO', client_id: 'c1', operation_id: 'o1', coordinator_ids: [], supervisor_ids: [] },
    ];
    tabelas['mop_provimento'] = [];

    await db.ensureProvimentoMesAtual();

    expect(tabelas['mop_provimento']).toHaveLength(0);
  });
});
