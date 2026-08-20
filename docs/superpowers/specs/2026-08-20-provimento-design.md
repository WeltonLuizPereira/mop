# MOP — Provimento

**Data:** 2026-08-20
**Status:** Implementado e mesclado em `redesign/leva-1` (ver §7 para a única divergência deliberada do texto original)

## 1. Contexto

O MOP mede hoje "em operação" como Ativos ÷ Quadro (todo mundo da ilha que não
foi desligado). Esse número diz o quanto da equipe atual está trabalhando, mas
não diz nada sobre se a equipe é do **tamanho contratado**. Não existe, no
banco, nenhum registro do que foi contratado por ilha — só o que está
cadastrado como pessoa.

Sem esse dado, ninguém enxerga no MOP se uma ilha está estruturalmente
desguarnecida (contratou 14 PAs, só têm 9 pessoas) ou só de folga temporária
(contratou 8, tem 8, mas 1 está de férias). As duas situações hoje produzem a
mesma leitura de tela.

## 2. Objetivo

Introduzir **PA Contratada** como grandeza própria, por ilha e por mês, e
trocar o indicador central do Mapa Operacional de "em operação" para
**Provimento** (Ativos ÷ PA Contratada) — a métrica que realmente importa para
gestão de headcount contratual.

## 3. Escopo

### 3.1 Incluído

- Tabela `mop_provimento`: PA Contratada por ilha, por mês de referência.
- Rotina de auto-cadastro do mês vigente, rodando no load do app.
- Novo indicador "Provimento" nos cards da Visão Geral (anel + %), substituindo
  a leitura atual de "em operação".
- Card fechado por padrão (cabeçalho + anel + %); expande no hover/foco
  revelando PA Contratada, Ativos e o detalhamento por status; recolhe ao
  sair. Substitui os badges de status hoje sempre visíveis no rodapé do card.
- Tela de cadastro "Provimento" em Cadastros, só ADM.
- Testes unitários dos novos módulos, seguindo o padrão do repositório
  (`*.test.ts` ao lado de cada arquivo).

### 3.2 Excluído

- Mudança na definição de "quadro" ou nos status de colaborador existentes.
- Qualquer automação server-side (cron, Edge Function). O auto-cadastro roda
  client-side, no mesmo padrão que `db.processDueTasks()` já usa hoje.
- Edição de PA Contratada de meses passados por usuários não-ADM.
- Metas de provimento por cliente/operação (agregação continua só por ilha).

## 4. Modelo de dados

Nova tabela, seguindo o padrão do projeto (prefixo `mop_`, colunas em
snake_case, FK textual — os ids do sistema não são uuid):

```sql
CREATE TABLE mop_provimento (
  id text PRIMARY KEY,
  ilha_id text NOT NULL REFERENCES mop_ilhas(id),
  referencia date NOT NULL,        -- sempre dia 1 do mês, ex: 2026-08-01
  pa_contratada integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ilha_id, referencia)
);
```

`ilha_id` é FK por id, não por nome em texto livre: evita duplicar a mesma
ilha sob grafias diferentes e acompanha renomeação de ilha sem quebrar
histórico. `referencia` fica sempre truncada no dia 1 do mês, então o
cruzamento com "mês vigente" é uma comparação de data direta.

Tipo correspondente em `types.ts`:

```ts
export interface Provimento {
  id: string;
  ilhaId: string;
  referencia: string;      // YYYY-MM-01
  paContratada: number;
}
```

Métodos novos em `services/mockDb.ts`, no mesmo estilo dos já existentes:

- `getProvimento(referencia: string): Promise<Provimento[]>` — linhas do mês.
- `saveProvimento(item: Provimento): Promise<void>` — upsert por `(ilhaId, referencia)`.
- `ensureProvimentoMesAtual(): Promise<void>` — rotina de auto-cadastro (§5).

## 5. Cruzamento e auto-cadastro do mês

No load do app (`App.tsx`), ao lado do `db.processDueTasks()` que já roda
hoje, entra `db.ensureProvimentoMesAtual()`:

1. Calcula a referência do mês vigente (dia 1 do mês corrente).
2. Lista as ilhas ativas (`EntityStatus.ACTIVE`).
3. Para cada ilha sem linha em `mop_provimento` nessa referência, busca a
   referência mais recente que existir para aquela ilha (não necessariamente
   o mês calendário anterior — cobre o caso de o ADM pular um mês) e insere
   uma nova linha copiando `pa_contratada` de lá.
4. Ilha sem nenhum histórico entra com `pa_contratada = 0`.

Isso também cobre ilha nova criada no meio do mês: ela não tem linha nem
antiga nem nova, então fica no estado "sem PA Contratada" (§6) até o ADM
preencher.

`computeIlhaStats` (`lib/ilhaStats.ts`) passa a receber a lista de
`Provimento` do mês vigente e calcular, por ilha:

```ts
paContratada: number | null;   // null = sem linha no mês vigente
provimento: number | null;     // ativos / paContratada; null se paContratada for null ou 0
```

`emOperacao` (Ativos ÷ Quadro) sai da interface `IlhaStat` — nenhum outro
consumidor no código depende dele além de `DashboardPage` e `IlhaTile`
(confirmado por busca no repositório).

## 6. Cards da Visão Geral

Mockup navegável, aprovado nesta conversa:
`https://claude.ai/code/artifact/8a2a6731-b73a-48ff-9afe-64102939a837`

### 6.1 Estado fechado (padrão)

Cabeçalho (nome da ilha, cliente · operação) e a linha do meio: anel `AnelQ` +
percentual grande, rotulado "provimento". Nada mais — é a leitura de relance
do mapa.

### 6.2 Estado aberto (hover / foco)

O card expande para baixo (altura anima de `0` ao conteúdo, não é overlay
flutuante) e revela:

- Par de números: **PA Contratada** e **Ativos**, lado a lado.
- Painel "Por status": mesma composição que os badges mostram hoje (Ativo,
  Férias, Afastado, Licença Maternidade, Aviso Prévio, Realocado — desligado
  fica fora, como já é hoje em `porStatus`), agora escondida até alguém
  passar o mouse ou focar via teclado.

Ao tirar o mouse/foco, recolhe de volta ao estado fechado. Card continua
clicável (abre a ilha) em qualquer estado.

### 6.3 Cor e limiar

Mesma regra do `AnelQ` atual: anel e % em `--brand` quando provimento ≥ 80%,
em `--brand-hot` abaixo disso. Threshold não muda.

### 6.4 Sem PA Contratada no mês vigente

Quando `paContratada` é `null` (ou `0`): anel renderiza apagado (opacidade
reduzida, sem animação), % vira "—", e o par "PA Contratada / Ativos" mostra
"sem PA" no lugar do número. Não mostra 0%, que sinalizaria uma crise de
provimento em vez de um dado ausente. O painel "Por status" continua
funcionando normalmente — a ausência de PA Contratada não significa ausência
de gente na ilha.

## 7. Tela de Cadastro › Provimento

Nova rota `provimento`, grupo **Cadastros**, visível só para
`UserRole.ADMIN` (mesmo padrão de `ilhas`, `clients` etc. em
`lib/navigation.ts`).

Não reaproveita `CrudPage` — ele foi feito para entidades nomeadas com
criar/editar/excluir, e aqui a unidade é "PA Contratada de uma ilha em um
mês", sem exclusão de registro.

Layout: seletor de mês/ano no topo (default: mês vigente) + tabela com todas
as ilhas do mês selecionado, uma linha por ilha:

| Coluna | Conteúdo |
|---|---|
| Ilha | nome |
| Cliente / Operação | contexto, somente leitura |
| Ativos (hoje) | contagem atual de colaboradores, somente leitura — não há um retrato histórico de colaboradores por mês no sistema, então este número é sempre o quadro de hoje, não o do mês selecionado |
| PA Contratada | campo numérico editável inline |

Edição salva ao perder o foco do campo (`onBlur`), só quando o valor muda —
sair do campo sem editar não grava nem loga nada, e não sobrescreve um valor
com `0` por engano. Linha de ilha sem nenhuma PA cadastrada (ilha nova) fica
destacada com "ilha nova · defina a PA". Toda edição grava em `mop_history`,
no mesmo formato que as demais telas de cadastro.

**Decisão:** a etiqueta "copiado de mês/ano" nas linhas vindas do
auto-cadastro (§5), cogitada nesta versão do spec, não foi implementada —
`mop_provimento` não guarda a origem do valor (auto-cadastro vs. edição
manual), e criar essa distinção exigiria uma coluna nova e migração de dados
existentes. Para uma tela interna de admin, esse ganho não paga o custo
agora; revisitar se algum dia a equipe perceber que confia demais em número
copiado sem revisar. Se voltar à mesa, o formato natural é uma coluna
`origem` (`'auto' | 'manual'`), como migração isolada.

## 8. Testes

- `lib/ilhaStats.test.ts`: casos de `paContratada` presente, ausente e zero;
  cálculo de `provimento`; ordenação não quebra com `provimento` nulo.
- `services/mockDb.test.ts`: `ensureProvimentoMesAtual` cobrindo mês sem
  histórico, mês com gap (pula um mês), e ilha nova sem nenhuma linha.
- Novo componente de card (`components/dashboard/IlhaTile.tsx`): estado
  fechado, estado aberto no hover/foco, estado sem PA Contratada.
- Nova página de cadastro: renderização, edição inline, filtro por mês, e
  visibilidade restrita a ADM (mesmo padrão de `UsersPage.test.tsx`).

## 9. Referências

- Mockup navegável (cards + cadastro): `https://claude.ai/code/artifact/8a2a6731-b73a-48ff-9afe-64102939a837`
- Padrão de auto-rotina no load: `db.processDueTasks()` em `App.tsx`.
- Padrão de tabela `mop_*` e FK textual: `mop_db_changes_v2.sql`.
