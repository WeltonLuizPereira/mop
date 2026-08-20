# Provimento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce PA Contratada (per ilha, per month) and switch the Visão
Geral card's headline metric from "em operação" (ativos ÷ quadro) to
"provimento" (ativos ÷ PA Contratada), with an admin-only cadastro screen and
automatic month-start carry-forward.

**Architecture:** One new Supabase table (`mop_provimento`), one pure
decision function for the month-rollover copy (testable without touching
Supabase), an extension of the existing `computeIlhaStats` pure function to
fold PA Contratada into every ilha's stats, a redesigned `IlhaTile` that
opens on hover/focus instead of always showing its breakdown, and a new
admin-only page built the same way `ResetDataPage`/`ScheduledTasksPage` are
(hand-rolled, not `CrudPage` — this isn't a named-entity CRUD).

**Tech Stack:** React + TypeScript, Vitest + Testing Library, Supabase
(via the existing hand-rolled `SupabaseService` in `services/mockDb.ts`),
Tailwind v4 utility classes (no new CSS files).

**Spec:** `docs/superpowers/specs/2026-08-20-provimento-design.md`

## Global Constraints

- DB columns are `snake_case`; every TS-facing field is `camelCase`, mapped
  by hand in `services/mockDb.ts` (no generic mapper — matches every
  existing method in that file).
- `ilha_id` is a **text** FK, not `uuid` — this system's ids are generated
  by `generateId()` in `utils.ts`, not Postgres `uuid`.
- `referencia` is always the first day of the month, `YYYY-MM-01`, so two
  references compare correctly with plain string `<`/`>`/`===`.
- Auto-cadastro runs **client-side**, on app load, next to
  `db.processDueTasks()` in `App.tsx` — no cron, no Edge Function.
- `paContratada` of `0` and `paContratada` absent are treated identically:
  both mean "no valid target," both render as "—", never as `0%`.
- New nav entry lives in the **Cadastros** group, `roles: SO_ADMIN` only
  (same restriction as `ilhas`, `clients`, etc. in `lib/navigation.ts`).

---

### Task 1: Provimento type, SQL migration, and the pure auto-cadastro logic

**Files:**
- Modify: `types.ts`
- Create: `mop_db_changes_v3.sql`
- Create: `lib/provimentoStats.ts`
- Test: `lib/provimentoStats.test.ts`

**Interfaces:**
- Produces: `interface Provimento { id: string; ilhaId: string; referencia: string; paContratada: number }` (in `types.ts`)
- Produces: `referenciaDoMes(data: Date): string` (in `lib/provimentoStats.ts`)
- Produces: `provimentoParaAutoCadastro(ilhasAtivas: Ilha[], provimentoExistente: Provimento[], referenciaAtual: string): Array<{ ilhaId: string; paContratada: number }>` (in `lib/provimentoStats.ts`)

- [ ] **Step 1: Add the `Provimento` type**

In `types.ts`, add after the `HistoryLog` interface:

```ts
export interface Provimento {
  id: string;
  ilhaId: string;
  /** Sempre o dia 1 do mês, "YYYY-MM-01". */
  referencia: string;
  paContratada: number;
}
```

- [ ] **Step 2: Write the SQL migration**

Create `mop_db_changes_v3.sql` at the repo root, next to `mop_db_changes.sql`
and `mop_db_changes_v2.sql`:

```sql
-- Tabela de PA Contratada por ilha, por mês de referência.
-- ilha_id é FK textual: os ids do sistema não são uuid (ver mop_ilhas).
CREATE TABLE mop_provimento (
  id text PRIMARY KEY,
  ilha_id text NOT NULL REFERENCES mop_ilhas(id),
  referencia date NOT NULL,
  pa_contratada integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ilha_id, referencia)
);
```

This file is a one-off script the project owner runs by hand against
Supabase (same pattern as `mop_db_changes.sql` / `_v2.sql`) — it is not
executed by this plan or by any test.

- [ ] **Step 3: Write the failing tests for the pure auto-cadastro logic**

Create `lib/provimentoStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EntityStatus } from '../types';
import { provimentoParaAutoCadastro, referenciaDoMes } from './provimentoStats';

describe('referenciaDoMes', () => {
  it('trunca a data no dia 1 do mês, em YYYY-MM-01', () => {
    expect(referenciaDoMes(new Date(2026, 7, 20))).toBe('2026-08-01');
  });

  it('preenche mês e ano corretamente na virada do ano', () => {
    expect(referenciaDoMes(new Date(2026, 0, 5))).toBe('2026-01-01');
    expect(referenciaDoMes(new Date(2025, 11, 31))).toBe('2025-12-01');
  });
});

const ilha = (id: string) => ({
  id, nome: `Ilha ${id}`, clientId: 'c1', operationId: 'o1',
  coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE,
});

describe('provimentoParaAutoCadastro', () => {
  it('copia a referência mais recente anterior ao mês vigente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [
        { id: 'p1', ilhaId: 'i1', referencia: '2026-06-01', paContratada: 8 },
        { id: 'p2', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 },
      ],
      '2026-08-01',
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 10 }]);
  });

  it('atravessa um mês pulado: usa a última referência que existir, não só a anterior', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-05-01', paContratada: 6 }],
      '2026-08-01', // junho e julho não têm registro
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 6 }]);
  });

  it('entra com 0 quando a ilha não tem nenhum histórico', () => {
    const resultado = provimentoParaAutoCadastro([ilha('i1')], [], '2026-08-01');
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 0 }]);
  });

  it('não repete ilha que já tem linha no mês vigente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 12 }],
      '2026-08-01',
    );
    expect(resultado).toEqual([]);
  });

  it('ignora referências futuras ao decidir a "mais recente"', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1')],
      [
        { id: 'p1', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 },
        { id: 'p2', ilhaId: 'i1', referencia: '2026-09-01', paContratada: 99 },
      ],
      '2026-08-01',
    );
    expect(resultado).toEqual([{ ilhaId: 'i1', paContratada: 10 }]);
  });

  it('trata cada ilha de forma independente', () => {
    const resultado = provimentoParaAutoCadastro(
      [ilha('i1'), ilha('i2')],
      [{ id: 'p1', ilhaId: 'i1', referencia: '2026-07-01', paContratada: 10 }],
      '2026-08-01',
    );
    expect(resultado).toEqual(expect.arrayContaining([
      { ilhaId: 'i1', paContratada: 10 },
      { ilhaId: 'i2', paContratada: 0 },
    ]));
    expect(resultado).toHaveLength(2);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -- lib/provimentoStats.test.ts`
Expected: FAIL — `Cannot find module './provimentoStats'`

- [ ] **Step 5: Implement `lib/provimentoStats.ts`**

```ts
import type { Ilha, Provimento } from '../types';

/** Referência do mês de uma data, sempre no dia 1: "2026-08-01". */
export function referenciaDoMes(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}-01`;
}

/**
 * Decide, para o mês vigente, quais ilhas ativas ainda não têm uma linha de
 * PA Contratada e com que valor cadastrá-las.
 *
 * Copia sempre da referência mais recente que existir para aquela ilha —
 * não necessariamente o mês calendário anterior — para não deixar a ilha
 * sem PA só porque o ADM pulou um mês sem editar. Ilha sem nenhum
 * histórico entra com 0, para o ADM preencher.
 */
export function provimentoParaAutoCadastro(
  ilhasAtivas: Ilha[],
  provimentoExistente: Provimento[],
  referenciaAtual: string,
): Array<{ ilhaId: string; paContratada: number }> {
  const jaTemNoMes = new Set(
    provimentoExistente
      .filter(p => p.referencia === referenciaAtual)
      .map(p => p.ilhaId),
  );

  const ultimaPorIlha = new Map<string, Provimento>();
  for (const p of provimentoExistente) {
    if (p.referencia >= referenciaAtual) continue; // só o passado conta como "última referência"
    const atual = ultimaPorIlha.get(p.ilhaId);
    if (!atual || p.referencia > atual.referencia) ultimaPorIlha.set(p.ilhaId, p);
  }

  return ilhasAtivas
    .filter(i => !jaTemNoMes.has(i.id))
    .map(i => ({ ilhaId: i.id, paContratada: ultimaPorIlha.get(i.id)?.paContratada ?? 0 }));
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- lib/provimentoStats.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 7: Commit**

```bash
git add types.ts mop_db_changes_v3.sql lib/provimentoStats.ts lib/provimentoStats.test.ts
git commit -m "feat: add Provimento type and the pure month-rollover logic"
```

---

### Task 2: Fold PA Contratada into `computeIlhaStats`

**Files:**
- Modify: `lib/ilhaStats.ts`
- Modify: `lib/ilhaStats.test.ts`

**Interfaces:**
- Consumes: `Provimento` (from Task 1, `types.ts`)
- Produces: `IlhaStat` gains `ativos: number`, `paContratada: number | null`,
  `provimento: number | null`; loses `emOperacao`.
- Produces: `computeIlhaStats(ilhas, collabs, clients, operations, provimentoDoMes: Provimento[], ordem?: Ordem): IlhaStat[]`
  — note the new required 5th parameter, inserted before `ordem`.

- [ ] **Step 1: Rewrite the failing/changed tests**

Replace the full contents of `lib/ilhaStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CollaboratorStatus, EntityStatus, type Provimento } from '../types';
import { computeIlhaStats, totaisGerais } from './ilhaStats';

const clients = [{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }];
const operations = [{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }];
const ilhas = [
  { id: 'i1', nome: 'Ilha 01', clientId: 'c1', operationId: 'o1',
    coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
  { id: 'i2', nome: 'Ilha 02', clientId: 'c1', operationId: 'o1',
    coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
];
const colab = (matricula: string, ilhaId: string, status: CollaboratorStatus) =>
  ({ matricula, ilhaId, status } as any);
const pa = (ilhaId: string, paContratada: number): Provimento =>
  ({ id: `p-${ilhaId}`, ilhaId, referencia: '2026-08-01', paContratada });

describe('computeIlhaStats', () => {
  it('conta o quadro e os ativos, sem contar desligado', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.DESLIGADO),
    ], clients, operations, []);
    expect(i1.total).toBe(3);
    expect(i1.ativos).toBe(2);
  });

  it('calcula provimento como ativos sobre PA Contratada', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.AFASTADO),
    ], clients, operations, [pa('i1', 4)]);
    expect(i1.paContratada).toBe(4);
    expect(i1.provimento).toBeCloseTo(0.5);
  });

  it('provimento fica nulo quando não há PA Contratada cadastrada', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
    ], clients, operations, []);
    expect(i1.paContratada).toBeNull();
    expect(i1.provimento).toBeNull();
  });

  it('provimento fica nulo quando a PA Contratada é zero, sem dividir por zero', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
    ], clients, operations, [pa('i1', 0)]);
    expect(i1.provimento).toBeNull();
    expect(Number.isNaN(i1.provimento as any)).toBe(false);
  });

  it('devolve total e ativos 0 para ilha vazia, sem dividir por zero', () => {
    const [, i2] = computeIlhaStats(ilhas, [colab('1', 'i1', CollaboratorStatus.ATIVO)], clients, operations, []);
    expect(i2.total).toBe(0);
    expect(i2.ativos).toBe(0);
    expect(i2.provimento).toBeNull();
  });

  it('resolve cliente e operação da ilha', () => {
    const [i1] = computeIlhaStats(ilhas, [], clients, operations, []);
    expect(i1.cliente).toBe('Vivo');
    expect(i1.operacao).toBe('Móvel');
  });

  it('agrupa a contagem por status, omitindo os zerados', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.FERIAS),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
    ], clients, operations, []);
    expect(i1.porStatus).toEqual([
      { status: CollaboratorStatus.ATIVO, count: 1 },
      { status: CollaboratorStatus.FERIAS, count: 2 },
    ]);
  });

  it('ordena por nome quando ninguém pede outra ordem', () => {
    const foraDeOrdem = [ilhas[1], ilhas[0]];
    const r = computeIlhaStats(foraDeOrdem, [], clients, operations, []);
    expect(r.map(i => i.nome)).toEqual(['Ilha 01', 'Ilha 02']);
  });

  it('ordena da ilha mais crítica para a mais tranquila', () => {
    const r = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.FERIAS),
    ], clients, operations, [pa('i1', 1), pa('i2', 2)], 'asc');
    // i1: 1/1 = 100%; i2: 1/2 = 50% — 50% é mais crítico, vem primeiro em 'asc'
    expect(r.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('inverte a ordem quando a pessoa pede decrescente', () => {
    const r = computeIlhaStats(ilhas, [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.FERIAS),
    ], clients, operations, [pa('i1', 1), pa('i2', 2)], 'desc');
    expect(r.map(i => i.id)).toEqual(['i1', 'i2']);
  });

  it('conta quem está com o status escrito fora do padrão', () => {
    const [i1] = computeIlhaStats(ilhas, [
      colab('1', 'i1', 'Ativo' as CollaboratorStatus),
      colab('2', 'i1', 'FERIAS' as CollaboratorStatus),
    ], clients, operations, [pa('i1', 2)]);
    expect(i1.total).toBe(2);
    expect(i1.provimento).toBe(0.5);
    expect(i1.porStatus).toEqual([
      { status: CollaboratorStatus.ATIVO, count: 1 },
      { status: CollaboratorStatus.FERIAS, count: 1 },
    ]);
  });

  it('mantém a ilha vazia no fim nas duas direções', () => {
    const colabs = [colab('1', 'i1', CollaboratorStatus.ATIVO)];
    const provimento = [pa('i1', 1)];
    expect(computeIlhaStats(ilhas, colabs, clients, operations, provimento, 'asc').at(-1)!.id).toBe('i2');
    expect(computeIlhaStats(ilhas, colabs, clients, operations, provimento, 'desc').at(-1)!.id).toBe('i2');
  });

  it('manda pro fim a ilha com gente mas sem PA Contratada, mesmo tendo gente de sobra', () => {
    // i2 tem mais gente que i1, mas sem PA não há o que comparar — vai pro fim mesmo assim
    const colabs = [
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i2', CollaboratorStatus.ATIVO),
      colab('3', 'i2', CollaboratorStatus.ATIVO),
    ];
    const r = computeIlhaStats(ilhas, colabs, clients, operations, [pa('i1', 1)], 'asc');
    expect(r.at(-1)!.id).toBe('i2');
  });
});

describe('totaisGerais', () => {
  it('conta cada estado do quadro', () => {
    const t = totaisGerais([
      colab('1', 'i1', CollaboratorStatus.ATIVO),
      colab('2', 'i1', CollaboratorStatus.ATIVO),
      colab('3', 'i1', CollaboratorStatus.FERIAS),
      colab('4', 'i1', CollaboratorStatus.AVISO_PREVIO),
      colab('5', 'i1', CollaboratorStatus.AFASTADO),
      colab('6', 'i1', CollaboratorStatus.DESLIGADO),
    ]);
    expect(t).toEqual({ ativos: 2, ferias: 1, aviso: 1, afastados: 1 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/ilhaStats.test.ts`
Expected: FAIL — `computeIlhaStats` still has the old signature/fields.

- [ ] **Step 3: Rewrite `lib/ilhaStats.ts`**

Replace the full contents:

```ts
import {
  CollaboratorStatus, type Client, type Collaborator, type Ilha, type Operation, type Provimento,
} from '../types';
import { normalizarStatus } from './status';

export interface IlhaStat {
  id: string;
  nome: string;
  cliente: string;
  operacao: string;
  /** Quadro da ilha, sem os desligados. */
  total: number;
  /** Quantos, dentro do quadro, estão ATIVO. */
  ativos: number;
  /** PA Contratada do mês vigente; `null` quando a ilha não tem linha (ou ela é 0). */
  paContratada: number | null;
  /** Ativos ÷ PA Contratada; `null` quando `paContratada` é `null`. */
  provimento: number | null;
  porStatus: Array<{ status: CollaboratorStatus; count: number }>;
}

/** Ordem fixa dos status nos pontos do tile. */
const ORDEM = [
  CollaboratorStatus.ATIVO,
  CollaboratorStatus.FERIAS,
  CollaboratorStatus.AFASTADO,
  CollaboratorStatus.LICENCA_MATERNIDADE,
  CollaboratorStatus.AVISO_PREVIO,
  CollaboratorStatus.REALOCADO,
];

/** `nome` põe as ilhas em ordem alfabética; `asc`/`desc` ordenam pelo
 *  provimento, crescente ou decrescente. */
export type Ordem = 'nome' | 'asc' | 'desc';

export function computeIlhaStats(
  ilhas: Ilha[], collabs: Collaborator[], clients: Client[], operations: Operation[],
  provimentoDoMes: Provimento[], ordem: Ordem = 'nome',
): IlhaStat[] {
  const nomeCliente = new Map(clients.map(c => [c.id, c.nome]));
  const nomeOperacao = new Map(operations.map(o => [o.id, o.nome]));
  const paPorIlha = new Map(provimentoDoMes.map(p => [p.ilhaId, p.paContratada]));

  return ilhas
    .map(ilha => {
      // O status vem do banco como texto livre; sem normalizar, "Ferias" some
      // da contagem aqui e vira ponto cinza na tabela — as duas telas
      // discordariam sobre a mesma pessoa.
      const daIlha = collabs
        .filter(c => c.ilhaId === ilha.id)
        .map(c => ({ colaborador: c, status: normalizarStatus(c.status) }));

      // Desligado não é quadro: quem saiu não entra no denominador.
      const doQuadro = daIlha.filter(c => c.status !== CollaboratorStatus.DESLIGADO);
      const ativos = doQuadro.filter(c => c.status === CollaboratorStatus.ATIVO).length;

      // 0 e ausência de linha significam a mesma coisa: nenhum dos dois é
      // uma meta válida pra dividir por ela.
      const paContratada = paPorIlha.get(ilha.id) || null;
      const provimento = paContratada ? ativos / paContratada : null;

      return {
        id: ilha.id,
        nome: ilha.nome,
        cliente: nomeCliente.get(ilha.clientId) ?? '—',
        operacao: nomeOperacao.get(ilha.operationId) ?? '—',
        total: doQuadro.length,
        ativos,
        paContratada,
        provimento,
        porStatus: ORDEM
          .map(status => ({ status, count: doQuadro.filter(c => c.status === status).length }))
          .filter(s => s.count > 0),
      };
    })
    .sort((a, b) => {
      if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');

      // Ilha vazia ou sem PA Contratada não tem provimento para comparar —
      // as duas ficam por último, sem empurrar pra baixo quem de fato mede mal.
      const aSemDado = a.total === 0 || a.provimento === null;
      const bSemDado = b.total === 0 || b.provimento === null;
      if (aSemDado !== bSemDado) return aSemDado ? 1 : -1;
      if (aSemDado && bSemDado) return 0;
      const delta = (a.provimento as number) - (b.provimento as number);
      return ordem === 'asc' ? delta : -delta;
    });
}

export function totaisGerais(collabs: Collaborator[]) {
  const status = collabs.map(c => normalizarStatus(c.status));
  const contar = (s: CollaboratorStatus) => status.filter(atual => atual === s).length;
  return {
    ativos: contar(CollaboratorStatus.ATIVO),
    ferias: contar(CollaboratorStatus.FERIAS),
    aviso: contar(CollaboratorStatus.AVISO_PREVIO),
    afastados: contar(CollaboratorStatus.AFASTADO),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/ilhaStats.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ilhaStats.ts lib/ilhaStats.test.ts
git commit -m "feat: fold PA Contratada and provimento into computeIlhaStats"
```

---

### Task 3: `mockDb.ts` — read/write a Provimento row, and auto-cadastro wiring

**Files:**
- Modify: `services/mockDb.ts`
- Modify: `services/mockDb.test.ts`

**Interfaces:**
- Consumes: `Provimento` (Task 1), `referenciaDoMes`/`provimentoParaAutoCadastro` (Task 1)
- Produces: `db.getProvimento(referencia: string): Promise<Provimento[]>`
- Produces: `db.saveProvimento(item: Provimento): Promise<void>`
- Produces: `db.ensureProvimentoMesAtual(): Promise<void>`

- [ ] **Step 1: Extend the fake Supabase builder in the test file with insert/update/single**

The existing fake in `services/mockDb.test.ts` only supports
`select/order/eq/range/then` — enough for the read-pagination tests it was
built for, but `saveProvimento` and `ensureProvimentoMesAtual` also need
`.single()`, `.insert()`, and `.update()`. Replace the `construtor` function
(and the `eq` no-op) with a version that actually filters, so `.single()`
and the bare `then()` both honor `.eq()`:

```ts
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
```

This is additive: no existing test calls `.eq()`, so making it a real
filter doesn't change any currently-passing behavior.

- [ ] **Step 2: Write the failing tests**

Append to `services/mockDb.test.ts` (after the existing `describe('leitura
de tabela grande', …)` block), and add the import at the top:

```ts
const { db } = await import('./mockDb');
const { referenciaDoMes } = await import('../lib/provimentoStats');
```

(replace the existing single-line `const { db } = await import('./mockDb');`
with the two lines above)

```ts
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- services/mockDb.test.ts`
Expected: FAIL — `db.getProvimento is not a function`

- [ ] **Step 4: Implement the methods in `services/mockDb.ts`**

Add `Provimento` to the type import at the top of the file:

```ts
import { 
  User, Coordinator, Supervisor, Client, Operation, Ilha, Collaborator, 
  UserRole, EntityStatus, HistoryLog, ScheduledTask, Provimento
} from '../types';
```

Add a second import line right below the existing `import { generateId } from '../utils';`:

```ts
import { provimentoParaAutoCadastro, referenciaDoMes } from '../lib/provimentoStats';
```

Add a new section after the `--- Ilhas ---` block (after `findOrCreateIlha`
and before `--- Collaborators ---`, wherever that boundary falls in the
file):

```ts
  // --- Provimento ---
  async getProvimento(referencia: string): Promise<Provimento[]> {
    const { data } = await supabase.from('mop_provimento').select('*').eq('referencia', referencia);
    return (data ?? []).map((p: any) => ({
      id: p.id, ilhaId: p.ilha_id, referencia: p.referencia, paContratada: p.pa_contratada,
    }));
  }

  private async getProvimentoHistorico(): Promise<Provimento[]> {
    const { data } = await buscarTudo<any>((de, ate) =>
      supabase.from('mop_provimento').select('*').range(de, ate));
    return data.map(p => ({
      id: p.id, ilhaId: p.ilha_id, referencia: p.referencia, paContratada: p.pa_contratada,
    }));
  }

  async saveProvimento(item: Provimento) {
    const payload = {
      id: item.id, ilha_id: item.ilhaId, referencia: item.referencia, pa_contratada: item.paContratada,
    };
    const { data: existing } = await supabase.from('mop_provimento').select('id')
      .eq('ilha_id', item.ilhaId).eq('referencia', item.referencia).single();
    if (existing) await supabase.from('mop_provimento').update(payload).eq('id', existing.id);
    else await supabase.from('mop_provimento').insert(payload);
  }

  async ensureProvimentoMesAtual(): Promise<void> {
    const referenciaAtual = referenciaDoMes(new Date());
    const [ilhas, historico] = await Promise.all([this.getIlhas(), this.getProvimentoHistorico()]);
    const ilhasAtivas = ilhas.filter(i => i.status === EntityStatus.ACTIVE);
    const faltantes = provimentoParaAutoCadastro(ilhasAtivas, historico, referenciaAtual);
    for (const item of faltantes) {
      await supabase.from('mop_provimento').insert({
        id: generateId(), ilha_id: item.ilhaId, referencia: referenciaAtual, pa_contratada: item.paContratada,
      });
    }
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- services/mockDb.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 6: Commit**

```bash
git add services/mockDb.ts services/mockDb.test.ts
git commit -m "feat: add Provimento CRUD and month-rollover auto-cadastro to mockDb"
```

---

### Task 4: `IlhaTile` — closed by default, expands on hover/focus

**Files:**
- Modify: `components/dashboard/IlhaTile.tsx`
- Create: `components/dashboard/IlhaTile.test.tsx`

**Interfaces:**
- Consumes: `IlhaStat` (Task 2 — now has `ativos`, `paContratada`, `provimento`, no `emOperacao`)
- Produces: same public shape as before — `IlhaTile({ ilha: IlhaStat, onOpen: () => void })`

- [ ] **Step 1: Write the failing tests**

Create `components/dashboard/IlhaTile.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CollaboratorStatus } from '../../types';
import { IlhaTile } from './IlhaTile';
import type { IlhaStat } from '../../lib/ilhaStats';

const ilha = (overrides: Partial<IlhaStat> = {}): IlhaStat => ({
  id: 'i1', nome: 'Ilha 01 — SAC', cliente: 'Vivo', operacao: 'Móvel',
  total: 2, ativos: 1, paContratada: 2, provimento: 0.5,
  porStatus: [
    { status: CollaboratorStatus.ATIVO, count: 1 },
    { status: CollaboratorStatus.FERIAS, count: 1 },
  ],
  ...overrides,
});

describe('IlhaTile', () => {
  it('mostra o nome, o cliente/operação e o percentual de provimento fechado', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    expect(screen.getByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByText('Vivo · Móvel')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('não mostra PA Contratada, Ativos nem o detalhamento por status fechado', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    expect(screen.queryByText('PA contratada')).not.toBeInTheDocument();
    expect(screen.queryByText('1 férias')).not.toBeInTheDocument();
  });

  it('revela PA Contratada, Ativos e o detalhamento por status no hover', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);

    await user.hover(screen.getByRole('button', { name: /Ilha 01 — SAC/ }));

    expect(screen.getByText('PA contratada')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // PA contratada
    expect(screen.getByText('1 férias')).toBeInTheDocument();
  });

  it('recolhe de volta quando o mouse sai', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });

    await user.hover(card);
    expect(screen.getByText('PA contratada')).toBeInTheDocument();

    await user.unhover(card);
    expect(screen.queryByText('PA contratada')).not.toBeInTheDocument();
  });

  it('também expande no foco de teclado, não só no mouse', () => {
    render(<IlhaTile ilha={ilha()} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Ilha 01 — SAC/ });

    card.focus();
    expect(screen.getByText('PA contratada')).toBeInTheDocument();
  });

  it('mostra "—" e "sem PA" quando a ilha não tem PA Contratada no mês', async () => {
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha({ paContratada: null, provimento: null })} onOpen={vi.fn()} />);

    expect(screen.getByText('—')).toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: /Ilha 01 — SAC/ }));
    expect(screen.getByText('sem PA')).toBeInTheDocument();
  });

  it('continua clicável em qualquer estado', async () => {
    const abrir = vi.fn();
    const user = userEvent.setup();
    render(<IlhaTile ilha={ilha()} onOpen={abrir} />);

    await user.click(screen.getByRole('button', { name: /Ilha 01 — SAC/ }));
    expect(abrir).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- components/dashboard/IlhaTile.test.tsx`
Expected: FAIL — the tile currently always renders PA/status content and
has no closed state; `ilha.emOperacao` no longer exists on the fixture,
causing type/render mismatches.

- [ ] **Step 3: Rewrite `components/dashboard/IlhaTile.tsx`**

```tsx
import React, { useState } from 'react';
import { AnelQ } from '../brand/AnelQ';
import { Badge } from '../ui';
import type { IlhaStat } from '../../lib/ilhaStats';

export const IlhaTile = ({ ilha, onOpen }: { ilha: IlhaStat; onOpen: () => void }) => {
  const [aberto, setAberto] = useState(false);
  const semPa = !ilha.paContratada;

  return (
    <article
      tabIndex={0}
      role="button"
      aria-expanded={aberto}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      onFocus={() => setAberto(true)}
      onBlur={() => setAberto(false)}
      className="bg-canvas-soft border border-hairline rounded-tile p-[18px] cursor-pointer
                 transition-[border-color,box-shadow,transform] duration-150
                 hover:border-hairline-2 hover:shadow-2 hover:-translate-y-px
                 motion-reduce:hover:translate-y-0"
    >
      <header className="pb-[13px] border-b border-hairline">
        {/* 15px é a medida do mockup: o anel e o percentual são o foco do tile,
            o nome só identifica. Nomes de ilha reais são longos e em caixa alta,
            então acima disso eles quebram em duas linhas e roubam a cena. */}
        <h3 className="font-display font-bold text-[15px] leading-[1.25] tracking-[-.01em] text-ink">
          {ilha.nome}
        </h3>
        <p className="text-xs text-ink-mute mt-0.5">{ilha.cliente} · {ilha.operacao}</p>
      </header>

      <div className="flex items-center gap-3.5 py-3.5">
        <AnelQ
          value={ilha.provimento ?? 0}
          className={`w-[54px] h-[54px] shrink-0 ${semPa ? 'opacity-30' : ''}`}
          label={semPa ? 'sem PA Contratada cadastrada' : undefined}
        />
        <div>
          <div
            className={`font-display font-bold text-[26px] leading-none tracking-tight tabular-nums
                        ${semPa ? 'text-ink-faint' : (ilha.provimento ?? 0) < 0.8 ? 'text-brand-hot' : 'text-ink'}`}
          >
            {semPa ? '—' : `${Math.round((ilha.provimento ?? 0) * 100)}%`}
          </div>
          <div className="text-xs text-ink-mute mt-1.5">provimento</div>
        </div>
      </div>

      {/* fechado por padrão: cresce de 0fr pra 1fr no hover/foco, empurrando o
          resto do grid pra baixo em vez de flutuar por cima de qualquer coisa */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out
                    motion-reduce:transition-none ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 pt-3.5">
          <div className="flex gap-[18px] pb-3.5">
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {semPa ? 'sem PA' : ilha.paContratada}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">PA contratada</span>
            </div>
            <div>
              <span className="block font-display font-bold text-[16px] tracking-[-.01em] text-ink">
                {ilha.ativos}
              </span>
              <span className="block text-[11px] text-ink-faint mt-px">ativos</span>
            </div>
          </div>

          {ilha.total === 0 ? (
            <p className="text-xs text-ink-faint">Nenhum colaborador alocado.</p>
          ) : (
            <div className="flex flex-wrap gap-x-3.5 gap-y-[7px]">
              {ilha.porStatus.map(s => (
                <Badge key={s.status} status={s.status} count={s.count} className="text-xs" />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- components/dashboard/IlhaTile.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/IlhaTile.tsx components/dashboard/IlhaTile.test.tsx
git commit -m "feat: IlhaTile opens on hover/focus instead of always showing its breakdown"
```

---

### Task 5: Wire PA Contratada into `DashboardPage`

**Files:**
- Modify: `pages/DashboardPage.tsx`
- Modify: `pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `db.getProvimento` (Task 3), `referenciaDoMes` (Task 1),
  `computeIlhaStats` new signature (Task 2)

- [ ] **Step 1: Update the test mock and add the new call**

In `pages/DashboardPage.test.tsx`, add `getProvimento` to the mocked `db`
(it needs both ilhas covered, so the existing ordering assertions — which
compare i1 against i2 — still discriminate correctly under the new
provimento-based sort):

```ts
vi.mock('../services/mockDb', () => ({
  db: {
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: CollaboratorStatus.ATIVO },
      { matricula: '2', ilhaId: 'i1', status: CollaboratorStatus.FERIAS },
      { matricula: '3', ilhaId: 'i2', status: CollaboratorStatus.ATIVO },
    ])),
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha 07 — Cobrança', clientId: 'c2', operationId: 'o2',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i3', nome: 'Ilha 02 — Desativada', clientId: 'c1', operationId: 'o3',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.INACTIVE },
    ])),
    getClients: vi.fn(async () => ([
      { id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE },
      { id: 'c2', nome: 'Enel', status: EntityStatus.ACTIVE },
    ])),
    getOperations: vi.fn(async () => ([
      { id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE },
      { id: 'o2', nome: 'Residencial', clientId: 'c2', status: EntityStatus.ACTIVE },
      { id: 'o3', nome: 'Fibra', clientId: 'c1', status: EntityStatus.ACTIVE },
    ])),
    getProvimento: vi.fn(async () => ([
      // i1: 1 ativo / 2 quadro; PA 2 → 50% (mesmo número que o teste antigo
      // já esperava, só que agora medindo provimento em vez de "em operação")
      { id: 'p1', ilhaId: 'i1', referencia: '2026-08-01', paContratada: 2 },
      // i2: 1 ativo / 1 quadro; PA 1 → 100%, continua "mais tranquila" que i1
      { id: 'p2', ilhaId: 'i2', referencia: '2026-08-01', paContratada: 1 },
    ])),
  },
}));
```

The rest of `pages/DashboardPage.test.tsx` (the `usuario` constant and every
`describe`/`it` block) stays exactly as it is — every existing assertion
(the `50%` text, the alphabetical/asc/desc ordering, the client/operation
filters, the click/keyboard behavior) holds with this provimento-based
mock, because the numbers were chosen to reproduce the same relative
outcome the old `emOperacao`-based mock produced.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- pages/DashboardPage.test.tsx`
Expected: FAIL — `DashboardPage` doesn't call `db.getProvimento` yet, and
`computeIlhaStats` is called with the old (now wrong) argument order.

- [ ] **Step 3: Update `pages/DashboardPage.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { EntityStatus, User, type Client, type Collaborator, type Ilha, type Operation, type Provimento } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats, totaisGerais, type Ordem } from '../lib/ilhaStats';
import { referenciaDoMes } from '../lib/provimentoStats';
import { IlhaTile } from '../components/dashboard/IlhaTile';
import { ChipSelect } from '../components/ui';

export const DashboardPage: React.FC<{ currentUser: User, onAbrirIlha: (ilhaId: string) => void }> = ({ onAbrirIlha }) => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [provimento, setProvimento] = useState<Provimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [cliente, setCliente] = useState('');
  const [operacao, setOperacao] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  useEffect(() => {
    const load = async () => {
      const [c, i, cli, op, prov] = await Promise.all([
        db.getCollaborators(),
        db.getIlhas(),
        db.getClients(),
        db.getOperations(),
        db.getProvimento(referenciaDoMes(new Date())),
      ]);
      setCollabs(c);
      setIlhas(i);
      setClients(cli);
      setOperations(op);
      setProvimento(prov);
      setCarregando(false);
    };
    load();
  }, []);

  // Ilha inativa não está em operação: ela sai do mapa, mas continua no
  // cadastro para o histórico não perder a referência.
  const emOperacao = ilhas.filter(i => i.status === EntityStatus.ACTIVE);
  const recortadas = emOperacao
    .filter(i => !cliente || i.clientId === cliente)
    .filter(i => !operacao || i.operationId === operacao);

  // as operações oferecidas seguem o cliente escolhido — combinação
  // impossível não deve nem aparecer na lista
  const operacoesDoCliente = operations.filter(o => !cliente || o.clientId === cliente);

  const stats = computeIlhaStats(recortadas, collabs, clients, operations, provimento, ordem);
  const totais = totaisGerais(collabs);

  if (carregando) {
    return <p className="text-sm text-ink-mute py-20 text-center">Carregando o mapa…</p>;
  }

  if (emOperacao.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="t-display-md text-ink">
          {ilhas.length === 0 ? 'Nenhuma ilha cadastrada ainda.' : 'Nenhuma ilha ativa no momento.'}
        </p>
        <p className="text-sm text-ink-mute mt-2">
          {ilhas.length === 0
            ? 'Cadastre a primeira em Cadastros › Ilhas para ver o mapa.'
            : 'O mapa mostra só as ilhas ativas. Reative uma em Cadastros › Ilhas.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 mb-6">
        {([['ativos', totais.ativos], ['em férias', totais.ferias],
           ['em aviso prévio', totais.aviso], ['afastados', totais.afastados]] as const)
          .map(([rotulo, n], i) => (
          <React.Fragment key={rotulo}>
            {i > 0 && <div className="w-px h-4 bg-hairline-2" aria-hidden="true" />}
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-[21px] tracking-tight tabular-nums text-ink">
                {n.toLocaleString('pt-BR')}
              </span>
              <span className="text-[13px] text-ink-mute">{rotulo}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-3.5 mb-3.5">
        <h2 className="t-eyebrow text-ink-faint flex-1">Ilhas em operação</h2>
        <ChipSelect
          rotulo="Cliente"
          value={cliente}
          // trocar de cliente zera a operação: a anterior é de outro cliente
          onChange={e => { setCliente(e.target.value); setOperacao(''); }}
          aria-label="Filtrar ilhas por cliente"
        >
          <option value="">todos</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </ChipSelect>
        <ChipSelect
          rotulo="Operação"
          value={operacao}
          onChange={e => setOperacao(e.target.value)}
          aria-label="Filtrar ilhas por operação"
        >
          <option value="">todas</option>
          {operacoesDoCliente.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </ChipSelect>
        <ChipSelect
          rotulo="Ordenar"
          value={ordem}
          onChange={e => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar as ilhas"
        >
          <option value="nome">A → Z</option>
          <option value="asc">em operação ↑</option>
          <option value="desc">em operação ↓</option>
        </ChipSelect>
      </div>

      {stats.length === 0 ? (
        <p className="text-sm text-ink-mute py-16 text-center">
          Nenhuma ilha ativa nesse recorte. Volte o cliente ou a operação para todos.
        </p>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(286px, 1fr))' }}>
          {stats.map(ilha => (
            <IlhaTile key={ilha.id} ilha={ilha} onOpen={() => onAbrirIlha(ilha.id)} />
          ))}
        </div>
      )}
    </div>
  );
};
```

The only functional changes from the current file: the new `provimento`
state, the extra `db.getProvimento(...)` call in `load()`, and passing
`provimento` into `computeIlhaStats` before `ordem`. Everything else —
filters, empty states, the summary strip — is untouched.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- pages/DashboardPage.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add pages/DashboardPage.tsx pages/DashboardPage.test.tsx
git commit -m "feat: load PA Contratada into DashboardPage's ilha stats"
```

---

### Task 6: Nav entry for Provimento

**Files:**
- Modify: `lib/navigation.ts`
- Modify: `lib/navigation.test.ts`

- [ ] **Step 1: Update the failing test**

In `lib/navigation.test.ts`, change the admin count (25 screens now, one
more than the current 24):

```ts
  it('mostra as 25 telas para o administrador', () => {
    expect(chaves(UserRole.ADMIN)).toHaveLength(25);
  });
```

Also add a check that non-admins never see it, next to the existing
`'esconde cadastros...'` test:

```ts
  it('esconde provimento de quem não é admin', () => {
    expect(chaves(UserRole.VIEWER)).not.toContain('provimento');
    expect(chaves(UserRole.RH)).not.toContain('provimento');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/navigation.test.ts`
Expected: FAIL — count is still 24, `provimento` key doesn't exist.

- [ ] **Step 3: Add the nav entry in `lib/navigation.ts`**

Add `Target` to the `lucide-react` import list:

```ts
import {
  AlertCircle, AlertTriangle, Briefcase, Building2, Cake, Calendar, Globe,
  History, Info, LayoutDashboard, ListChecks, MapPin, Network, PieChart,
  ShieldCheck, Sprout, Stethoscope, Sun, Target, TrendingUp, Upload, UserCog, UserMinus,
  UserX, Users,
} from 'lucide-react';
```

In the `Cadastros` group, add the new item right after `ilhas`:

```ts
  { group: 'Cadastros', items: [
    { key: 'clients', label: 'Clientes', icon: Building2, roles: SO_ADMIN },
    { key: 'operations', label: 'Operações', icon: Globe, roles: SO_ADMIN },
    { key: 'ilhas', label: 'Ilhas', icon: MapPin, roles: SO_ADMIN },
    { key: 'provimento', label: 'Provimento', icon: Target, roles: SO_ADMIN },
    { key: 'coordinators', label: 'Coordenadores', icon: Briefcase, roles: SO_ADMIN },
    { key: 'supervisors', label: 'Supervisores', icon: UserCog, roles: SO_ADMIN },
  ]},
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/navigation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/navigation.ts lib/navigation.test.ts
git commit -m "feat: add Provimento to the Cadastros nav group, admin only"
```

---

### Task 7: `ProvimentoPage` — the cadastro screen

**Files:**
- Create: `pages/ProvimentoPage.tsx`
- Create: `pages/ProvimentoPage.test.tsx`

**Interfaces:**
- Consumes: `db.getIlhas`, `db.getClients`, `db.getOperations`,
  `db.getCollaborators`, `db.getProvimento`, `db.saveProvimento`,
  `db.addHistory` (all existing/Task 3); `computeIlhaStats` (Task 2);
  `generateId` (`utils.ts`)
- Produces: `ProvimentoPage({ currentUser: User })`

- [ ] **Step 1: Write the failing tests**

Create `pages/ProvimentoPage.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntityStatus, UserRole } from '../types';
import { ProvimentoPage } from './ProvimentoPage';
import { db } from '../services/mockDb';

vi.mock('../services/mockDb', () => ({
  db: {
    getIlhas: vi.fn(async () => ([
      { id: 'i1', nome: 'Ilha 01 — SAC', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
      { id: 'i2', nome: 'Ilha Nova', clientId: 'c1', operationId: 'o1',
        coordinatorIds: [], supervisorIds: [], status: EntityStatus.ACTIVE },
    ])),
    getClients: vi.fn(async () => ([{ id: 'c1', nome: 'Vivo', status: EntityStatus.ACTIVE }])),
    getOperations: vi.fn(async () => ([{ id: 'o1', nome: 'Móvel', clientId: 'c1', status: EntityStatus.ACTIVE }])),
    getCollaborators: vi.fn(async () => ([
      { matricula: '1', ilhaId: 'i1', status: 'ATIVO' },
    ])),
    getProvimento: vi.fn(async () => ([
      { id: 'p1', ilhaId: 'i1', referencia: 'qualquer', paContratada: 10 },
    ])),
    saveProvimento: vi.fn(async () => {}),
    addHistory: vi.fn(async () => {}),
  },
}));

const usuario = { id: '1', matricula: '3924', nome: 'Welton', email: 'w@q.com',
  role: UserRole.ADMIN, status: EntityStatus.ACTIVE };

describe('ProvimentoPage', () => {
  it('lista as ilhas ativas com a PA Contratada do mês selecionado', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    expect(await screen.findByText('Ilha 01 — SAC')).toBeInTheDocument();
    expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(10);
  });

  it('ilha sem PA Contratada no mês entra com o campo vazio', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha Nova');
    expect(screen.getByLabelText('PA Contratada de Ilha Nova')).toHaveValue(null);
  });

  it('mostra os ativos da ilha, calculados a partir dos colaboradores', async () => {
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha 01 — SAC');
    const linha = screen.getByText('Ilha 01 — SAC').closest('tr')!;
    expect(linha).toHaveTextContent('1'); // 1 ativo na Ilha 01
  });

  it('salva a PA Contratada ao perder o foco do campo, e registra no histórico', async () => {
    const user = userEvent.setup();
    render(<ProvimentoPage currentUser={usuario} />);
    const campo = await screen.findByLabelText('PA Contratada de Ilha 01 — SAC');

    await user.clear(campo);
    await user.type(campo, '14');
    await user.tab();

    expect(db.saveProvimento).toHaveBeenCalledWith(
      expect.objectContaining({ ilhaId: 'i1', paContratada: 14 }),
    );
    expect(db.addHistory).toHaveBeenCalled();
  });

  it('trocar o ano recarrega a PA Contratada daquele período', async () => {
    const user = userEvent.setup();
    render(<ProvimentoPage currentUser={usuario} />);
    await screen.findByText('Ilha 01 — SAC');
    expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(10);

    vi.mocked(db.getProvimento).mockResolvedValueOnce([]);

    const anoSelect = screen.getByLabelText('Ano de referência') as HTMLSelectElement;
    const outroAno = anoSelect.options[1].value; // qualquer ano ≠ o selecionado, sem depender da data real
    await user.selectOptions(anoSelect, outroAno);

    await waitFor(() => {
      expect(screen.getByLabelText('PA Contratada de Ilha 01 — SAC')).toHaveValue(null);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- pages/ProvimentoPage.test.tsx`
Expected: FAIL — `Cannot find module './ProvimentoPage'`

- [ ] **Step 3: Implement `pages/ProvimentoPage.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { EntityStatus, type Client, type Collaborator, type Ilha, type Operation, type Provimento, type User } from '../types';
import { db } from '../services/mockDb';
import { computeIlhaStats } from '../lib/ilhaStats';
import { generateId } from '../utils';
import { ChipSelect, Table, Carregando, FalhaAoCarregar } from '../components/ui';

const NOME_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function referenciaDoAnoMes(ano: number, mesIndex: number): string {
  return `${ano}-${String(mesIndex + 1).padStart(2, '0')}-01`;
}

export const ProvimentoPage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());

  const [ilhas, setIlhas] = useState<Ilha[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [provimento, setProvimento] = useState<Provimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhou, setFalhou] = useState(false);

  const referencia = referenciaDoAnoMes(ano, mes);

  const carregar = async () => {
    setCarregando(true);
    setFalhou(false);
    try {
      const [i, cli, op, col, prov] = await Promise.all([
        db.getIlhas(), db.getClients(), db.getOperations(), db.getCollaborators(),
        db.getProvimento(referencia),
      ]);
      setIlhas(i.filter(x => x.status === EntityStatus.ACTIVE));
      setClients(cli);
      setOperations(op);
      setCollabs(col);
      setProvimento(prov);
    } catch {
      setFalhou(true);
    } finally {
      setCarregando(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { carregar(); }, [referencia]);

  const stats = useMemo(
    () => computeIlhaStats(ilhas, collabs, clients, operations, provimento),
    [ilhas, collabs, clients, operations, provimento],
  );

  const porIlha = useMemo(() => new Map(provimento.map(p => [p.ilhaId, p])), [provimento]);

  const salvar = async (ilha: Ilha, paContratada: number) => {
    const existente = porIlha.get(ilha.id);
    const item: Provimento = { id: existente?.id ?? generateId(), ilhaId: ilha.id, referencia, paContratada };
    await db.saveProvimento(item);
    await db.addHistory({
      action: 'Edição de PA Contratada',
      target: ilha.nome,
      user: currentUser.nome,
      date: new Date().toLocaleString('pt-BR'),
      type: existente ? 'update' : 'create',
      details: `PA Contratada de ${referencia.slice(0, 7)} definida em ${paContratada}`,
    });
    setProvimento(prev => [...prev.filter(p => p.ilhaId !== ilha.id), item]);
  };

  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - i);

  if (carregando) return <Carregando o_que="o provimento" />;
  if (falhou) {
    return <FalhaAoCarregar mensagem="Não foi possível carregar o provimento." aoTentar={carregar} rotuloAcao="Tentar novamente" />;
  }

  return (
    <div className="space-y-4 mop-fade-up">
      <div className="flex items-center flex-wrap gap-3.5">
        <h2 className="t-eyebrow text-ink-faint flex-1">PA Contratada por ilha</h2>
        <ChipSelect rotulo="Mês" value={mes} onChange={e => setMes(Number(e.target.value))} aria-label="Mês de referência">
          {NOME_MES.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}
        </ChipSelect>
        <ChipSelect rotulo="Ano" value={ano} onChange={e => setAno(Number(e.target.value))} aria-label="Ano de referência">
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </ChipSelect>
      </div>

      <Table.Card>
        <Table label="PA Contratada por ilha">
          <Table.Head>
            <Table.Th>Ilha</Table.Th>
            <Table.Th>Cliente / Operação</Table.Th>
            <Table.Th className="text-right">Ativos</Table.Th>
            <Table.Th className="text-right">PA Contratada</Table.Th>
          </Table.Head>
          <tbody>
            {stats.map(ilha => {
              const semDado = ilha.paContratada === null;
              return (
                <tr key={ilha.id} className={semDado ? 'bg-brand-wash' : ''}>
                  <Table.Td className="font-medium text-ink">{ilha.nome}</Table.Td>
                  <Table.Td className="text-ink-mute">{ilha.cliente} · {ilha.operacao}</Table.Td>
                  <Table.Td className="text-right t-data">{ilha.ativos}</Table.Td>
                  <Table.Td className="text-right">
                    <input
                      type="number"
                      min={0}
                      defaultValue={ilha.paContratada ?? ''}
                      aria-label={`PA Contratada de ${ilha.nome}`}
                      onBlur={e => {
                        const bruto = ilhas.find(i => i.id === ilha.id)!;
                        const valor = Number(e.target.value);
                        if (!Number.isNaN(valor) && valor >= 0) salvar(bruto, valor);
                      }}
                      className="w-20 text-right t-data rounded-sm border border-hairline-2 bg-canvas px-2 py-1
                                 focus:outline-none focus:border-brand focus:shadow-[0_0_0_1px_var(--brand)]"
                    />
                  </Table.Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Table.Card>
    </div>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- pages/ProvimentoPage.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add pages/ProvimentoPage.tsx pages/ProvimentoPage.test.tsx
git commit -m "feat: add the Provimento cadastro screen"
```

---

### Task 8: Wire `ProvimentoPage` and the month-start auto-cadastro into `App.tsx`

**Files:**
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `ProvimentoPage` (Task 7), `db.ensureProvimentoMesAtual` (Task 3)

There is no `App.test.tsx` in this repository — routing wiring here is
exercised indirectly by the manual smoke check in Step 3, matching how
every other page in this switch was integrated.

- [ ] **Step 1: Add the import**

In `App.tsx`, add next to the other page imports:

```ts
import { ProvimentoPage } from './pages/ProvimentoPage';
```

- [ ] **Step 2: Add the route and the auto-cadastro call**

Add the case, next to `'ilhas'` in the `renderContent` switch:

```tsx
      case 'provimento': return <ProvimentoPage key={dataVersion} currentUser={currentUser!} />;
```

Add `db.ensureProvimentoMesAtual()` to the existing `runChecks` effect,
next to `db.processDueTasks()`:

```tsx
  useEffect(() => {
      const runChecks = async () => {
          await db.processDueTasks();
          await db.ensureProvimentoMesAtual();
          await db.checkVacationReturns();
          await db.checkAvisoPrevioEnds();
      };
      runChecks();
  }, []);
```

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`

Log in as the seeded admin (matrícula `3924`), open **Cadastros ›
Provimento** from the sidebar, confirm the table renders with one row per
active ilha and an editable PA Contratada field, then open **Visão geral**
and confirm each tile is closed by default and expands on hover to show
PA Contratada / Ativos / the status breakdown.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions in any other page's tests.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat: wire the Provimento route and month-start auto-cadastro into App"
```

---

## Self-Review Notes

- **Spec coverage:** §4 (schema) → Task 1. §5 (auto-cadastro) → Tasks 1 & 3.
  §6 (cards) → Tasks 2 & 4 & 5. §7 (cadastro screen) → Task 7, wired in
  Task 8. §8 (tests) → a test step in every task. All covered.
- **Type consistency:** `Provimento.paContratada` (Task 1) stays that exact
  name through `IlhaStat.paContratada` (Task 2), `IlhaTile`'s prop reads
  (Task 4), `DashboardPage` (Task 5), and `ProvimentoPage` (Task 7) — no
  renaming across tasks. `referenciaDoMes`/`provimentoParaAutoCadastro`
  (Task 1) are consumed with the same names and signatures in Task 3.
- **Ordering:** Task 1 has no dependencies. Task 2 depends on Task 1's
  type. Task 3 depends on Tasks 1 (pure logic) and 2 is independent of 3.
  Task 4 depends on Task 2's `IlhaStat` shape. Task 5 depends on Tasks 2, 3
  and 4. Task 6 is independent of everything except existing code. Task 7
  depends on Tasks 1, 2 and 3. Task 8 depends on Tasks 3 and 7. Executing
  in the numbered order satisfies every dependency.
