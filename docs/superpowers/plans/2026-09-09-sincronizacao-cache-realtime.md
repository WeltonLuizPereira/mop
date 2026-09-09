# Sincronização Cache e Realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compartilhar dados entre telas, eliminar consultas redundantes e refletir alterações do Supabase em tempo real sem apagar dados durante revalidações.

**Architecture:** Um repositório TypeScript independente do React mantém cache, promessa em andamento e geração por recurso. Um provider expõe snapshots tipados à interface; gravações invalidam apenas os recursos afetados e assinaturas Realtime alimentam a mesma invalidação.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest, Testing Library e Supabase JS 2.39.

**Spec:** `docs/superpowers/specs/2026-09-09-sincronizacao-cache-realtime-design.md`

## Global Constraints

- Não adicionar biblioteca de cache externa.
- Validade inicial do cache: 60 segundos.
- Dados existentes permanecem visíveis durante revalidação.
- Realtime complementa, mas não substitui, carga inicial e revalidação.
- Toda escrita migrada deve propagar falhas do Supabase.
- Cada tarefa deve passar por RED, GREEN, suíte relacionada e commit próprio.

---

### Task 1: Repositório de recursos compartilhados

**Files:**
- Create: `lib/resourceCache.ts`
- Test: `lib/resourceCache.test.ts`

**Interfaces:**
- Produces: `createResourceCache<T>(loader, { staleTime }): ResourceCache<T>`.
- Produces: `ResourceSnapshot<T>`, `read()`, `refresh()`, `invalidate()`, `subscribe()` e `apply()`.

- [ ] **Step 1: Escrever testes falhando para deduplicação e cache válido**

```ts
it('compartilha uma leitura concorrente e reutiliza o resultado válido', async () => {
  let resolve!: (value: string[]) => void;
  const loader = vi.fn(() => new Promise<string[]>(r => { resolve = r; }));
  const cache = createResourceCache(loader, { staleTime: 60_000 });
  const first = cache.refresh();
  const second = cache.refresh();
  expect(loader).toHaveBeenCalledTimes(1);
  resolve(['A']);
  await expect(Promise.all([first, second])).resolves.toEqual([['A'], ['A']]);
  await cache.refresh();
  expect(loader).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- lib/resourceCache.test.ts`
Expected: FAIL porque `createResourceCache` ainda não existe.

- [ ] **Step 3: Implementar tipos e deduplicação mínima**

```ts
export type ResourceSnapshot<T> = {
  data?: T;
  loading: boolean;
  refreshing: boolean;
  error?: unknown;
  updatedAt: number;
};

export type ResourceCache<T> = {
  read(): ResourceSnapshot<T>;
  refresh(options?: { force?: boolean }): Promise<T>;
  invalidate(): Promise<T>;
  subscribe(listener: () => void): () => void;
  apply(updater: (current: T | undefined) => T | undefined): void;
};
```

`refresh()` deve devolver a promessa existente, respeitar `staleTime` e notificar assinantes antes e depois da carga.

- [ ] **Step 4: Acrescentar testes falhando para stale-while-revalidate, erro e geração**

```ts
it('conserva dados durante revalidação e ignora resposta anterior', async () => {
  const responses: Array<(value: string[]) => void> = [];
  const cache = createResourceCache(() => new Promise(r => responses.push(r)), { staleTime: 0 });
  const old = cache.refresh({ force: true });
  const newer = cache.invalidate();
  responses[1](['novo']); await newer;
  responses[0](['antigo']); await old;
  expect(cache.read().data).toEqual(['novo']);
});
```

Falha de primeira carga deve preencher `error`; falha de revalidação deve conservar `data`.

- [ ] **Step 5: Implementar invalidação, geração, erro e assinaturas**

Use contador incrementado em `invalidate()` e compare a geração capturada antes de publicar a resposta. `apply()` altera o snapshot e notifica sem realizar I/O.

- [ ] **Step 6: Executar testes e commit**

Run: `npm test -- lib/resourceCache.test.ts`
Expected: PASS.

```bash
git add lib/resourceCache.ts lib/resourceCache.test.ts
git commit -m "feat: adiciona cache compartilhado de recursos"
```

### Task 2: Catálogo central de dados e provider React

**Files:**
- Create: `data/appData.ts`
- Create: `contexts/DataContext.tsx`
- Test: `contexts/DataContext.test.tsx`
- Modify: `index.tsx`

**Interfaces:**
- Consumes: `createResourceCache<T>` da Task 1 e os loaders de `db`.
- Produces: `AppDataStore`, `appData`, `DataProvider`, `useResource(name)` e `useAppData()`.

- [ ] **Step 1: Escrever teste falhando do provider**

```tsx
it('entrega o cache carregado a dois consumidores com uma consulta', async () => {
  getClients.mockResolvedValue([{ id: '1', nome: 'Vivo', status: EntityStatus.ACTIVE }]);
  render(<DataProvider store={store}><Consumer/><Consumer/></DataProvider>);
  expect(await screen.findAllByText('Vivo')).toHaveLength(2);
  expect(getClients).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- contexts/DataContext.test.tsx`
Expected: FAIL por módulo inexistente.

- [ ] **Step 3: Criar o catálogo tipado**

```ts
export type ResourceName = 'collaborators' | 'clients' | 'operations' | 'ilhas' | 'coordinators' | 'supervisors';

export const createAppData = (source = db) => ({
  collaborators: createResourceCache(() => source.getCollaborators(), { staleTime: 60_000 }),
  clients: createResourceCache(() => source.getClients(), { staleTime: 60_000 }),
  operations: createResourceCache(() => source.getOperations(), { staleTime: 60_000 }),
  ilhas: createResourceCache(() => source.getIlhas(), { staleTime: 60_000 }),
  coordinators: createResourceCache(() => source.getCoordinators(), { staleTime: 60_000 }),
  supervisors: createResourceCache(() => source.getSupervisors(), { staleTime: 60_000 }),
});
```

- [ ] **Step 4: Implementar provider e hooks com `useSyncExternalStore`**

`useResource(name)` deve assinar `subscribe`, ler `read()` e chamar `refresh()` em efeito. `DataProvider` aceita `store` opcional para testes.

- [ ] **Step 5: Instalar o provider no ponto de entrada**

Em `index.tsx`, envolver `<App />` com `<DataProvider>` dentro dos providers existentes.

- [ ] **Step 6: Verificar e commit**

Run: `npm test -- contexts/DataContext.test.tsx test/smoke.sanity.test.ts`
Expected: PASS.

```bash
git add data/appData.ts contexts/DataContext.tsx contexts/DataContext.test.tsx index.tsx
git commit -m "feat: disponibiliza dados compartilhados no React"
```

### Task 3: Migrar Colaboradores e Detalhes

**Files:**
- Modify: `pages/CollaboratorsPage.tsx`
- Modify: `pages/CollaboratorDetailsPage.tsx`
- Modify: `pages/CollaboratorsPage.test.tsx`
- Modify: `pages/CollaboratorDetailsPage.test.tsx`

**Interfaces:**
- Consumes: `useResource()` e `useAppData()` da Task 2.
- Produces: telas que reutilizam dados auxiliares e invalidam somente `collaborators`.

- [ ] **Step 1: Escrever teste falhando de navegação com cache**

Renderize as duas telas sob o mesmo provider e troque a tela no componente de teste. Afirme que `getClients`, `getOperations`, `getIlhas`, `getCoordinators` e `getSupervisors` foram chamados uma vez, e que os nomes permanecem visíveis na tela de detalhe.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- pages/CollaboratorsPage.test.tsx pages/CollaboratorDetailsPage.test.tsx`
Expected: FAIL porque ambas ainda chamam `db` diretamente.

- [ ] **Step 3: Substituir cargas locais pelos snapshots compartilhados**

Use os seis recursos do provider. Preserve filtros, ordenação e estados de falha existentes. Histórico e férias continuam independentes no detalhe.

- [ ] **Step 4: Invalidar colaboradores depois de salvar ou excluir**

Depois de escrita confirmada, execute `await store.collaborators.invalidate()` em vez de `setCollabs(await db.getCollaborators())` ou remontagem global.

- [ ] **Step 5: Verificar e commit**

Run: `npm test -- pages/CollaboratorsPage.test.tsx pages/CollaboratorDetailsPage.test.tsx`
Expected: PASS.

```bash
git add pages/CollaboratorsPage.tsx pages/CollaboratorDetailsPage.tsx pages/CollaboratorsPage.test.tsx pages/CollaboratorDetailsPage.test.tsx
git commit -m "perf: reutiliza cache em colaboradores e detalhes"
```

### Task 4: Migrar Dashboard e formulário de colaborador

**Files:**
- Modify: `pages/DashboardPage.tsx`
- Modify: `components/collaborators/CollaboratorFormModal.tsx`
- Modify: `pages/DashboardPage.test.tsx`
- Modify: `components/collaborators/CollaboratorFormModal.test.tsx`

**Interfaces:**
- Consumes: os recursos da Task 2.
- Produces: Dashboard e formulário sem cargas duplicadas.

- [ ] **Step 1: Escrever teste falhando que abre o formulário após o Dashboard**

Sob um provider comum, carregue o Dashboard e abra o formulário. Afirme que cada tabela auxiliar foi consultada uma vez e que as opções estão disponíveis.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- pages/DashboardPage.test.tsx components/collaborators/CollaboratorFormModal.test.tsx`
Expected: FAIL pelas consultas diretas do modal.

- [ ] **Step 3: Consumir snapshots compartilhados**

O Dashboard usa `collaborators`, `clients`, `operations` e `ilhas`; somente `getProvimento(referencia)` permanece como leitura especializada. O modal usa os cinco cadastros auxiliares do provider.

- [ ] **Step 4: Verificar e commit**

Run: `npm test -- pages/DashboardPage.test.tsx components/collaborators/CollaboratorFormModal.test.tsx`
Expected: PASS.

```bash
git add pages/DashboardPage.tsx components/collaborators/CollaboratorFormModal.tsx pages/DashboardPage.test.tsx components/collaborators/CollaboratorFormModal.test.tsx
git commit -m "perf: compartilha dados no dashboard e formulario"
```

### Task 5: Propagar falhas das gravações

**Files:**
- Modify: `services/mockDb.ts`
- Modify: `services/mockDb.test.ts`
- Modify: `pages/CollaboratorDetailsPage.test.tsx`
- Modify: `pages/CollaboratorsPage.test.tsx`

**Interfaces:**
- Produces: toda Promise de escrita rejeita com o erro retornado pelo Supabase.

- [ ] **Step 1: Escrever testes falhando de erro de escrita**

```ts
it('rejeita quando o Supabase falha ao salvar colaborador', async () => {
  upsert.mockResolvedValue({ error: new Error('sem conexão') });
  await expect(db.saveCollaborator(collab)).rejects.toThrow('sem conexão');
});
```

No mesmo arquivo, adicione casos nomeados `rejeita falha ao salvar histórico`, `rejeita falha ao salvar férias`, `rejeita falha no CRUD genérico`, `rejeita falha ao salvar supervisor`, `rejeita falha ao salvar operação`, `rejeita falha ao salvar ilha` e `rejeita falha ao salvar provimento`. Em cada caso, configure `{ error: new Error('<recurso> indisponível') }` na operação Supabase e afirme `rejects.toThrow('<recurso> indisponível')`.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- services/mockDb.test.ts`
Expected: FAIL nos métodos que hoje apenas registram o erro.

- [ ] **Step 3: Trocar erros silenciosos por rejeição**

Após cada chamada Supabase:

```ts
if (error) throw error;
```

Para leituras compartilhadas, `getAll` também deve lançar o erro retornado por `buscarTudo`.

- [ ] **Step 4: Testar a interface em falha**

Simule `saveCollaborator` rejeitando; afirme que o modal continua aberto, `invalidate()` não é chamado e uma mensagem de falha é exibida.

- [ ] **Step 5: Verificar e commit**

Run: `npm test -- services/mockDb.test.ts pages/CollaboratorsPage.test.tsx pages/CollaboratorDetailsPage.test.tsx`
Expected: PASS.

```bash
git add services/mockDb.ts services/mockDb.test.ts pages/CollaboratorsPage.test.tsx pages/CollaboratorDetailsPage.test.tsx
git commit -m "fix: propaga falhas de sincronizacao do Supabase"
```

### Task 6: Migrar telas analíticas e remover sequências

**Files:**
- Modify: `pages/DesligadosPage.tsx`
- Modify: `pages/TurnoverPage.tsx`
- Modify: `pages/VacationManagementPage.tsx`
- Modify: `pages/BirthdaysPage.tsx`
- Modify: `pages/AfastadosPage.tsx`
- Modify: `pages/DistribuicaoPage.tsx`
- Modify: `pages/OrganogramPage.tsx`
- Modify: `pages/SafraPage.tsx`
- Create: `pages/DesligadosPage.test.tsx`
- Create: `pages/TurnoverPage.test.tsx`
- Create: `pages/VacationManagementPage.test.tsx`
- Modify: `pages/BirthdaysPage.test.tsx`
- Modify: `pages/AfastadosPage.test.tsx`
- Modify: `pages/DistribuicaoPage.test.tsx`
- Modify: `pages/OrganogramPage.test.tsx`
- Modify: `pages/SafraPage.test.tsx`

**Interfaces:**
- Consumes: recursos compartilhados da Task 2.
- Produces: telas analíticas sem leituras integrais duplicadas.

- [ ] **Step 1: Adicionar teste de integração do cache entre duas telas analíticas**

Navegue de Turnover para Desligados sob o mesmo provider e afirme uma chamada por recurso compartilhado.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- pages/TurnoverPage.test.tsx pages/DesligadosPage.test.tsx`
Expected: FAIL pelas cargas locais atuais.

- [ ] **Step 3: Migrar cada tela preservando leituras especializadas**

Em cada arquivo listado, substitua apenas `getCollaborators`, `getClients`, `getOperations`, `getIlhas`, `getSupervisors` e `getCoordinators` pelo snapshot de `useResource`. Nos três novos testes, renderize a tela sob `DataProvider`, aguarde um nome do fixture e afirme que a tela seguinte reutiliza o mesmo loader. `getVacationHistory` e `getProvimento` permanecem locais e devem iniciar em paralelo com o cache.

- [ ] **Step 4: Executar todos os testes das telas migradas**

Run: `npm test -- pages/DesligadosPage.test.tsx pages/TurnoverPage.test.tsx pages/VacationManagementPage.test.tsx pages/BirthdaysPage.test.tsx pages/AfastadosPage.test.tsx pages/DistribuicaoPage.test.tsx pages/OrganogramPage.test.tsx pages/SafraPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pages
git commit -m "perf: migra telas analiticas para cache compartilhado"
```

### Task 7: Remover remontagem global por `dataVersion`

**Files:**
- Modify: `App.tsx`
- Create: `App.test.tsx`
- Modify: `pages/CollaboratorsPage.test.tsx`
- Modify: `pages/CollaboratorDetailsPage.test.tsx`
- Modify: `pages/CrudPage.test.tsx`

**Interfaces:**
- Consumes: invalidação seletiva do `AppDataStore`.
- Produces: `onRefresh(resources: ResourceName[])` temporário durante a migração, sem `key={dataVersion}`.

- [ ] **Step 1: Escrever teste falhando de preservação da tela**

Renderize uma tela com estado local, execute uma gravação e afirme que o estado local permanece e somente o loader afetado é chamado novamente.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- pages/CollaboratorsPage.test.tsx`
Expected: FAIL porque `dataVersion` remonta a página.

- [ ] **Step 3: Remover `dataVersion` e todas as keys associadas**

Troque `refreshData` por uma função que chama `store[name].invalidate()` para os nomes recebidos. Remova a carga global de dropdowns do App quando seus consumidores já usarem o provider.

- [ ] **Step 4: Verificar e commit**

Run: `npm test -- App.test.tsx pages/CollaboratorsPage.test.tsx pages/CrudPage.test.tsx`
Expected: PASS.

```bash
git add App.tsx App.test.tsx pages components
git commit -m "refactor: substitui refresh global por invalidacao seletiva"
```

### Task 8: Consultas especializadas de histórico

**Files:**
- Modify: `services/mockDb.ts`
- Modify: `services/mockDb.test.ts`
- Modify: `pages/CollaboratorDetailsPage.tsx`
- Modify: `components/shell/NotificationCenter.tsx`
- Modify: `pages/CollaboratorDetailsPage.test.tsx`
- Modify: `components/shell/NotificationCenter.test.tsx`
- Create: `mop_history_sync_indexes.sql`

**Interfaces:**
- Produces: `getCollaboratorHistory(matricula: string, nome: string)`.
- Produces: `getRecentHistory(limit: number)`.

- [ ] **Step 1: Escrever testes falhando das consultas filtradas**

Afirme que `getRecentHistory(5)` emite `.order('created_at', { ascending: false }).limit(5)` e que `getCollaboratorHistory` filtra por `collaborator_matricula`.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- services/mockDb.test.ts`
Expected: FAIL porque os métodos não existem.

- [ ] **Step 3: Criar migração SQL**

```sql
ALTER TABLE mop_history ADD COLUMN IF NOT EXISTS collaborator_matricula text;
ALTER TABLE mop_history ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_mop_history_collaborator ON mop_history(collaborator_matricula);
CREATE INDEX IF NOT EXISTS idx_mop_history_created_at ON mop_history(created_at DESC);
```

- [ ] **Step 4: Implementar consultas e migrar consumidores**

Detalhes usa `getCollaboratorHistory`; notificações usa `getRecentHistory(5)`. Durante compatibilidade com logs antigos sem matrícula, a consulta do colaborador deve incluir registros cujo `target` seja exatamente o nome.

- [ ] **Step 5: Verificar e commit**

Run: `npm test -- services/mockDb.test.ts pages/CollaboratorDetailsPage.test.tsx components/shell/NotificationCenter.test.tsx`
Expected: PASS.

```bash
git add services pages/CollaboratorDetailsPage.tsx components/shell/NotificationCenter.tsx mop_history_sync_indexes.sql
git commit -m "perf: consulta somente historico necessario"
```

### Task 9: Assinaturas Supabase Realtime

**Files:**
- Create: `data/realtimeSync.ts`
- Test: `data/realtimeSync.test.ts`
- Modify: `contexts/DataContext.tsx`
- Modify: `services/supabase.ts`

**Interfaces:**
- Consumes: `AppDataStore` da Task 2.
- Produces: `startRealtimeSync(client, store): () => void`.

- [ ] **Step 1: Escrever testes falhando de evento e limpeza**

```ts
it('invalida colaboradores em evento remoto e remove o canal ao encerrar', async () => {
  const stop = startRealtimeSync(client, store);
  handlers.mop_collaborators({ eventType: 'UPDATE', new: collab, old: {} });
  expect(store.collaborators.invalidate).toHaveBeenCalledOnce();
  stop();
  expect(client.removeChannel).toHaveBeenCalledWith(channel);
});
```

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- data/realtimeSync.test.ts`
Expected: FAIL por módulo inexistente.

- [ ] **Step 3: Implementar uma assinatura por tabela**

Mapeie tabela para recurso e assine `event: '*'`, `schema: 'public'`. Em `SUBSCRIBED` após uma reconexão, force revalidação dos seis recursos. Retorne cleanup que remove todos os canais.

- [ ] **Step 4: Iniciar e encerrar sincronização no provider**

O efeito do `DataProvider` chama `startRealtimeSync(supabase, store)` uma vez e retorna seu cleanup. Falha do canal não deve apagar cache nem impedir leituras HTTP.

- [ ] **Step 5: Verificar e commit**

Run: `npm test -- data/realtimeSync.test.ts contexts/DataContext.test.tsx`
Expected: PASS.

```bash
git add data/realtimeSync.ts data/realtimeSync.test.ts contexts/DataContext.tsx services/supabase.ts
git commit -m "feat: sincroniza cache com Supabase Realtime"
```

### Task 10: Validação integrada e documentação operacional

**Files:**
- Create: `docs/sincronizacao-supabase.md`

**Interfaces:**
- Consumes: toda a implementação anterior.
- Produces: instruções de habilitação, teste e diagnóstico do Realtime.

- [ ] **Step 1: Documentar configuração do banco**

Inclua comandos para aplicar `mop_history_sync_indexes.sql`, adicionar as seis tabelas à publicação `supabase_realtime` e verificar RLS para `SELECT`.

- [ ] **Step 2: Executar verificação completa**

Run: `npm test`
Expected: todas as suítes PASS.

Run: `npm run build`
Expected: exit code 0.

Run: `git diff --check`
Expected: nenhuma saída de erro.

- [ ] **Step 3: Testar manualmente com duas janelas**

Abra o sistema em duas janelas, edite o mesmo colaborador na primeira e confirme que nome, alocação e status aparecem na segunda sem recarregar. Desative temporariamente a rede, navegue entre telas já visitadas e confirme que o cache permanece visível com indicação de desatualização.

- [ ] **Step 4: Commit final**

```bash
git add docs/sincronizacao-supabase.md
git commit -m "docs: registra operacao da sincronizacao Supabase"
```
