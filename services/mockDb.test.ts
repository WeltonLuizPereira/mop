import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Teto do PostgREST. O Supabase recusa devolver mais que isso numa requisição,
 * e — o detalhe que custa caro — não avisa: a resposta vem 200 com a lista
 * cortada. Sem paginação, a aplicação lê o pedaço achando que leu tudo.
 */
const TETO = 1000;

/** Linhas servidas pelo banco falso, por tabela. */
const tabelas: Record<string, any[]> = {};
const errosEscrita: Record<string, Error | undefined> = {};
const errosLeitura: Record<string, Error | undefined> = {};

/**
 * Construtor que imita o encadeamento do supabase-js: leitura paginada e
 * filtrada por `.eq()`, e escrita por `.insert()`/`.update()`/`.single()`.
 */
function construtor(tabela: string) {
  let de = 0;
  let ate = TETO - 1;
  const filtros: Record<string, any> = {};
  let alternativas: Array<[string, string]> = [];

  const linhas = () => tabelas[tabela] ?? [];
  const filtradas = () => linhas().filter(row =>
    Object.entries(filtros).every(([coluna, valor]) => row[coluna] === valor) &&
    (alternativas.length === 0 || alternativas.some(([coluna, valor]) => row[coluna] === valor)));

  const alvo: any = {
    select: () => alvo,
    order: () => alvo,
    limit: (quantidade: number) => { ate = de + quantidade - 1; return alvo; },
    or: (expressao: string) => {
      alternativas = expressao.split(',').map(parte => {
        const [coluna, _operador, ...valor] = parte.split('.');
        let val = decodeURIComponent(valor.join('.'));
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        return [coluna, val];
      });
      return alvo;
    },
    eq: (coluna: string, valor: any) => { filtros[coluna] = valor; return alvo; },
    range: (inicio: number, fim: number) => {
      de = inicio;
      ate = Math.min(fim, inicio + TETO - 1); // o teto vale mesmo com range
      return alvo;
    },
    single: () => Promise.resolve({ data: filtradas()[0] ?? null, error: null }),
    insert: (payload: any) => {
      if (errosEscrita[tabela]) return Promise.resolve({ error: errosEscrita[tabela] });
      if (!tabelas[tabela]) tabelas[tabela] = [];
      tabelas[tabela].push(...(Array.isArray(payload) ? payload : [payload]));
      return Promise.resolve({ error: null });
    },
    upsert: (payload: any) => alvo.insert(payload),
    update: (payload: any) => ({
      eq: (coluna: string, valor: any) => {
        if (errosEscrita[tabela]) return Promise.resolve({ error: errosEscrita[tabela] });
        const idx = linhas().findIndex(row => row[coluna] === valor);
        if (idx >= 0) linhas()[idx] = { ...linhas()[idx], ...payload };
        return Promise.resolve({ error: null });
      },
    }),
    then: (resolver: (r: { data: any[] | null; error: Error | null }) => unknown) =>
      Promise.resolve(resolver({
        data: errosLeitura[tabela] ? null : filtradas().slice(de, ate + 1),
        error: errosLeitura[tabela] ?? null,
      })),
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
  for (const k of Object.keys(errosEscrita)) delete errosEscrita[k];
  for (const k of Object.keys(errosLeitura)) delete errosLeitura[k];
});

describe('falhas de escrita', () => {
  const falhar = (tabela: string, mensagem: string) => {
    errosEscrita[tabela] = new Error(mensagem);
  };

  it.each([
    ['salvar colaborador', 'mop_collaborators', () => db.saveCollaborator({ matricula: '1', nome: 'Ana', status: 'ATIVO' } as any)],
    ['salvar histÃ³rico', 'mop_history', () => db.addHistory({ action: 'Teste', target: 'Ana', user: 'Welton', date: 'agora', type: 'update' } as any)],
    ['salvar fÃ©rias', 'mop_vacation_history', () => db.addVacationHistory('1', '2026-09-01', '2026-09-10')],
    ['CRUD genÃ©rico', 'mop_coordinators', () => db.saveCoordinator({ id: 'co1', nome: 'Coord', status: 'ATIVO' } as any)],
    ['salvar supervisor', 'mop_supervisors', () => db.saveSupervisor({ id: 's1', nome: 'Super', status: 'ATIVO', coordinatorIds: [] } as any)],
    ['salvar operaÃ§Ã£o', 'mop_operations', () => db.saveOperation({ id: 'o1', nome: 'OperaÃ§Ã£o', status: 'ATIVO', clientId: 'c1' } as any)],
    ['salvar ilha', 'mop_ilhas', () => db.saveIlha({ id: 'i1', nome: 'Ilha', status: 'ATIVO', coordinatorIds: [], supervisorIds: [] } as any)],
    ['salvar provimento', 'mop_provimento', () => db.saveProvimento({ id: 'p1', ilhaId: 'i1', referencia: '2026-09-01', paContratada: 10 })],
  ])('rejeita falha ao %s', async (_nome, tabela, executar) => {
    falhar(tabela, `${tabela} indisponÃ­vel`);
    await expect(executar()).rejects.toThrow(`${tabela} indisponÃ­vel`);
  });
});

describe('agendamento', () => {
  it('rejeita agendamento sem data antes de chamar o banco', async () => {
    await expect(db.scheduleTask('1', { nome: 'Ana' }, '', 'Welton')).rejects.toThrow('data');
    expect(tabelas['mop_scheduled_tasks']).toBeUndefined();
  });

  it('mescla alterações na tarefa pendente da mesma matrícula e data', async () => {
    tabelas['mop_scheduled_tasks'] = [{
      id: 't1', matricula: '1', scheduled_date: '2026-10-01', status: 'PENDING',
      created_by: 'Welton', created_at: '2026-09-21', changes: { nome: 'Ana' },
    }];
    await db.scheduleOrMergeTask('1', { status: 'AVISO PRÉVIO' } as any, '2026-10-01', 'Welton');
    expect(tabelas['mop_scheduled_tasks']).toHaveLength(1);
    expect(tabelas['mop_scheduled_tasks'][0].changes).toEqual({ nome: 'Ana', status: 'AVISO PRÉVIO' });
  });
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

describe('consultas especializadas de histÃ³rico', () => {
  it('limita o histÃ³rico recente', async () => {
    tabelas['mop_history'] = Array.from({ length: 8 }, (_, i) => ({ id: String(i), target: 'Ana', created_at: `2026-09-0${i + 1}` }));
    expect(await db.getRecentHistory(5)).toHaveLength(5);
  });

  it('filtra o histÃ³rico por matrÃ­cula ou nome legado exato', async () => {
    tabelas['mop_history'] = [
      { id: '1', collaborator_matricula: '10', target: 'Nome antigo' },
      { id: '2', collaborator_matricula: null, target: 'Ana' },
      { id: '3', collaborator_matricula: '20', target: 'Outra' },
    ];
    const logs = await db.getCollaboratorHistory('10', 'Ana');
    expect(logs.map((log: any) => log.id)).toEqual(['1', '2']);
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

  it('getProvimento propaga a falha real da leitura', async () => {
    errosLeitura['mop_provimento'] = new Error('provisionamento indisponível');

    await expect(db.getProvimento('2026-08-01')).rejects.toThrow('provisionamento indisponível');
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
