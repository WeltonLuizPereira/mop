# MOP Finalização da Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalizar visualmente as 22 rotas do MOP com o design system Quality, paridade claro/escuro, responsividade e acessibilidade, sem alterar regras de negócio.

**Architecture:** Fortalecer primeiro os tokens e componentes compartilhados; migrar depois as páginas por arquétipo, mantendo consultas e mutações nos arquivos atuais; concluir com integração E2E e remoção comprovada dos shims. A execução acontece em três ondas: fundação sequencial, grupos de páginas independentes em paralelo e fechamento global.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS 4, Vite 6, Vitest, Testing Library, Playwright, Recharts, Lucide React.

**Spec:** `docs/superpowers/specs/2026-08-17-mop-finalizacao-interface-design.md`

## Global Constraints

- Preservar consultas, mutações, permissões, filtros, cálculos, exportações e callbacks existentes.
- Não modificar schema SQL, `services/mockDb.ts`, `services/supabase.ts`, `types.ts` ou contratos de `App.tsx`, salvo uma incompatibilidade comprovada por teste.
- Laranja significa somente ação, foco, seleção ou atenção.
- Texto sobre `--brand` usa `--on-brand`; texto laranja sobre canvas usa `--brand-text`.
- `Badge` representa somente `CollaboratorStatus`; categorias neutras usam `Tag`.
- Archivo estrutura; IBM Plex Sans comunica; IBM Plex Mono exibe matrícula, data, horário e número.
- Tabelas continuam densas no mobile e rolam dentro de região nomeada e focável.
- Modais prendem foco, fecham com Escape, restauram foco e bloqueiam o fundo.
- A interface é verificada em 360px, 768px e 1440px, nos temas claro e escuro.
- A alteração preexistente em `index.css` deve ser preservada e incorporada, nunca revertida.
- Nenhuma dependência npm nova será adicionada.
- Agentes de uma mesma onda não editam arquivos compartilhados nem fazem commits simultâneos. O integrador revisa e commita cada entrega com staging por caminhos explícitos.

## Dependency Waves

```text
Wave 1 — sequencial
Task 1 → Task 2 → Task 3

Wave 2 — paralela depois da Task 3
Tasks 4, 5, 6, 7, 8, 9, 10, 11 e 12

Wave 3 — integração
Task 13
```

---

### Task 1: Tokens, botões e campos acessíveis

**Files:**
- Modify: `index.css`
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/Input.tsx`
- Modify: `components/ui/Select.tsx`
- Modify: `components/ui/Button.test.tsx`
- Modify: `lib/contrast.test.ts`
- Create: `components/ui/IconButton.tsx`
- Create: `components/ui/IconButton.test.tsx`
- Create: `components/ui/Field.tsx`
- Create: `components/ui/Field.test.tsx`

**Interfaces:**
- Produces: `ButtonProps`, `ButtonVariant`, `ButtonSize`, `IconButton`, `Field`, `InputProps`, `SelectProps`.
- Consumes: tokens Quality existentes e React HTML attributes.

- [ ] **Step 1: Escrever testes RED de contraste, loading, tamanho e associação de campo**

```tsx
// lib/contrast.test.ts
expect(contrastRatio('#D04200', '#FFFFFF')).toBeGreaterThanOrEqual(3);
expect(contrastRatio('#F27405', '#121110')).toBeGreaterThanOrEqual(3);
expect(contrastRatio('#9A918C', '#FFFFFF')).toBeGreaterThanOrEqual(3);
expect(contrastRatio('#6E6560', '#121110')).toBeGreaterThanOrEqual(3);

// Button.test.tsx
render(<Button loading>Salvar</Button>);
expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-busy', 'true');
expect(screen.getByRole('button')).toHaveClass('text-on-brand');
expect(screen.getByRole('button')).not.toHaveClass('text-white');

// IconButton.test.tsx
render(<IconButton label="Editar cliente" icon={<span />} size="touch" />);
expect(screen.getByRole('button', { name: 'Editar cliente' })).toHaveClass('min-h-11', 'min-w-11');

// Field.test.tsx
render(<Input label="Matrícula" hint="Somente números" error="Campo obrigatório" />);
const input = screen.getByRole('textbox', { name: 'Matrícula' });
expect(input).toHaveAttribute('aria-invalid', 'true');
expect(input).toHaveAccessibleDescription('Somente números Campo obrigatório');
```

- [ ] **Step 2: Rodar os testes e confirmar falha pela ausência das novas APIs**

Run: `npm test -- lib/contrast.test.ts components/ui/Button.test.tsx components/ui/IconButton.test.tsx components/ui/Field.test.tsx`  
Expected: FAIL em `loading`, `IconButton`, `Field` e affordances de `Input`.

- [ ] **Step 3: Adicionar tokens semânticos sem alterar o bloco preexistente de compatibilidade**

```css
:root {
  color-scheme: light;
  --focus-ring: #D04200;
  --control-border: #9A918C;
  --viz-grid: var(--hairline);
  --viz-axis: var(--ink-mute);
  --viz-tooltip-bg: var(--canvas);
  --viz-tooltip-border: var(--hairline-2);
  --viz-tooltip-ink: var(--ink);
  --viz-positive: var(--ok);
  --viz-negative: var(--danger);
  --viz-warning: var(--brand);
  --viz-series: var(--ink-2);
  --viz-track: var(--canvas-sunk);
  --viz-today: var(--brand-text);
  --viz-weekend: var(--canvas-soft);
  --viz-connector: var(--hairline-2);
  --overlay: rgb(12 11 10 / .58);
}

.dark {
  color-scheme: dark;
  --focus-ring: #F27405;
  --control-border: #6E6560;
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline-color: var(--focus-ring);
}
```

- [ ] **Step 4: Implementar contratos de Button, IconButton e Field**

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid-danger';
export type ButtonSize = 'sm' | 'md' | 'touch';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-2',
  md: 'min-h-9 px-4 py-[9px]',
  touch: 'min-h-11 px-4 py-3',
};

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  label: string;
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
```

`Field` deve clonar seu único controle, ligar `id`, `aria-describedby`,
`aria-invalid` e `required`; `Input` e `Select` passam a envolver o controle em
`Field` quando `label` existir. Remover `mb-3` dos componentes e trocar a borda
por `border-[var(--control-border)]`.

- [ ] **Step 5: Rodar testes, TypeScript e commit da entrega**

Run: `npm test -- lib/contrast.test.ts components/ui/Button.test.tsx components/ui/IconButton.test.tsx components/ui/Field.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- index.css components/ui/Button.tsx components/ui/Button.test.tsx components/ui/IconButton.tsx components/ui/IconButton.test.tsx components/ui/Field.tsx components/ui/Field.test.tsx components/ui/Input.tsx components/ui/Select.tsx lib/contrast.test.ts
git commit -m "feat: fortalece tokens e controles Quality"
```

---

### Task 2: Tabela, tags, seleção múltipla e modal

**Files:**
- Modify: `components/ui/Badge.tsx`
- Modify: `components/ui/Badge.test.tsx`
- Modify: `components/ui/MultiSelect.tsx`
- Modify: `components/ui/Table.tsx`
- Modify: `components/ui/Modal.tsx`
- Create: `components/ui/Tag.tsx`
- Create: `components/ui/MultiSelect.test.tsx`
- Create: `components/ui/Table.test.tsx`
- Create: `components/ui/Modal.test.tsx`

**Interfaces:**
- Consumes: `Field`, `IconButton` e tokens da Task 1.
- Produces: `Tag`, `Table` composta, `MultiSelectProps` e `ModalProps` acessíveis.

- [ ] **Step 1: Escrever testes RED dos contratos interativos**

```tsx
render(<Table label="Clientes"><Table.Body><Table.Row onActivate={activate} activationLabel="Abrir Vivo"><Table.Td>Vivo</Table.Td></Table.Row></Table.Body></Table>);
const region = screen.getByRole('region', { name: 'Clientes' });
expect(region).toHaveAttribute('tabindex', '0');
await user.keyboard('{Enter} ');
expect(activate).toHaveBeenCalledTimes(2);

render(<MultiSelect label="Clientes" options={[{ value: 'vivo', label: 'Vivo' }]} value={[]} onChange={onChange} />);
await user.click(screen.getByRole('button', { name: 'Clientes' }));
expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
await user.keyboard('{ArrowDown} ');
expect(onChange).toHaveBeenCalledWith(['vivo']);

render(<><button>Acionador</button><Modal open onClose={close} title="Editar cliente"><button>Primeiro</button><button>Último</button></Modal></>);
expect(screen.getByRole('dialog', { name: 'Editar cliente' })).toBeVisible();
expect(document.body.style.overflow).toBe('hidden');
```

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- components/ui/Badge.test.tsx components/ui/MultiSelect.test.tsx components/ui/Table.test.tsx components/ui/Modal.test.tsx`  
Expected: FAIL por APIs ausentes, listbox incompleto e foco não preso.

- [ ] **Step 3: Implementar os contratos exatos**

```ts
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  label: string;
  toolbar?: React.ReactNode;
  containerClassName?: string;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  onActivate?: () => void;
  activationLabel?: string;
  selected?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export interface MultiSelectOption { value: string; label: string; disabled?: boolean }
export interface MultiSelectProps {
  id?: string;
  label: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}
```

`Table.Row` atribui `tabIndex=0`, `aria-label`, `aria-selected` e trata Enter e
Espaço. `Table.Th` usa `scope="col"`. O scroller recebe `role="region"`,
`aria-label` e `tabIndex=0`. `Modal` usa portal, `aria-labelledby`, foco inicial,
ciclo Tab/Shift+Tab, Escape, retorno ao acionador, `inert` nos irmãos e restaura
`body.style.overflow`. `MultiSelect` usa listbox controlado, índice ativo,
ArrowUp/Down, Espaço, Escape e região live para mudanças. `Badge` aceita somente
`CollaboratorStatus`; `Tag` é um span neutro sem `data-dot`.

- [ ] **Step 4: Rodar testes e TypeScript**

Run: `npm test -- components/ui/Badge.test.tsx components/ui/MultiSelect.test.tsx components/ui/Table.test.tsx components/ui/Modal.test.tsx && npx tsc --noEmit`  
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- components/ui/Badge.tsx components/ui/Badge.test.tsx components/ui/Tag.tsx components/ui/MultiSelect.tsx components/ui/MultiSelect.test.tsx components/ui/Table.tsx components/ui/Table.test.tsx components/ui/Modal.tsx components/ui/Modal.test.tsx
git commit -m "feat: padroniza dados e sobreposicoes Quality"
```

---

### Task 3: Compostos de página, shell e notificações

**Files:**
- Create: `components/ui/PageToolbar.tsx`
- Create: `components/ui/FilterBar.tsx`
- Create: `components/ui/MetricStrip.tsx`
- Create: `components/ui/SegmentedControl.tsx`
- Create: `components/ui/EmptyState.tsx`
- Create: `components/ui/LoadingState.tsx`
- Create: `components/ui/InlineNotice.tsx`
- Create: `components/ui/PageToolbar.test.tsx`
- Create: `components/ui/FilterBar.test.tsx`
- Create: `components/ui/MetricStrip.test.tsx`
- Create: `components/ui/SegmentedControl.test.tsx`
- Create: `components/ui/EmptyState.test.tsx`
- Create: `components/ui/LoadingState.test.tsx`
- Create: `components/ui/InlineNotice.test.tsx`
- Modify: `components/ui/index.ts`
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/shell/Topbar.tsx`
- Modify: `components/shell/Sidebar.tsx`
- Modify: `components/shell/NotificationCenter.tsx`
- Create: `components/shell/AppShell.test.tsx`
- Create: `components/shell/Topbar.test.tsx`
- Create: `components/shell/NotificationCenter.test.tsx`
- Modify: `pages/CollaboratorsPage.tsx`
- Modify: `pages/CollaboratorsPage.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: os compostos exportados pelo barrel e shell acessível estável para todas as páginas.

- [ ] **Step 1: Escrever testes RED dos compostos e do shell**

```tsx
render(<MetricStrip items={[{ label: 'ativos', value: 12 }, { label: 'afastados', value: 2 }]} />);
expect(screen.getAllByRole('term')).toHaveLength(2);
expect(screen.getAllByRole('definition')).toHaveLength(2);

render(<LoadingState label="Carregando férias" />);
expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');

render(<InlineNotice tone="error">Não foi possível carregar.</InlineNotice>);
expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');

render(<AppShell {...props}><button>Conteúdo</button></AppShell>);
expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo-principal');
expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-principal');
```

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- components/ui/PageToolbar.test.tsx components/ui/FilterBar.test.tsx components/ui/MetricStrip.test.tsx components/ui/SegmentedControl.test.tsx components/ui/EmptyState.test.tsx components/ui/LoadingState.test.tsx components/ui/InlineNotice.test.tsx components/shell/AppShell.test.tsx components/shell/Topbar.test.tsx components/shell/NotificationCenter.test.tsx`  
Expected: FAIL porque os compostos ainda não existem e o shell não expõe skip link/gaveta semântica.

- [ ] **Step 3: Implementar APIs mínimas**

```ts
export interface PageToolbarProps { description?: React.ReactNode; filters?: React.ReactElement; actions?: React.ReactNode; className?: string }
export interface FilterBarProps { children: React.ReactNode; hasActiveFilters: boolean; onClear: () => void; clearLabel?: string; className?: string }
export interface MetricItem { label: string; value: string | number }
export interface MetricStripProps { label?: string; items: readonly MetricItem[]; className?: string }
export interface EmptyStateProps { title: string; description?: React.ReactNode; action?: React.ReactElement }
export interface LoadingStateProps { label?: string }
export type NoticeTone = 'info' | 'success' | 'attention' | 'error';
export interface InlineNoticeProps { tone: NoticeTone; title?: string; children: React.ReactNode; action?: React.ReactElement }
export interface SegmentedOption<T extends string> { value: T; label: string; panelId: string; disabled?: boolean }
export interface SegmentedControlProps<T extends string> { label: string; options: readonly SegmentedOption<T>[]; value: T; onChange: (value: T) => void }
```

`SegmentedControl` implementa ArrowLeft/Right, Home/End e `aria-controls`.
`PageToolbar` não cria `h1`. `MetricStrip` usa `dl/dt/dd`. `FilterBar` desabilita
“Limpar filtros” sem filtros ativos. `AppShell` usa `h-[100dvh] min-h-[100svh]`,
skip link, `main#conteudo-principal` e fundo inerte na gaveta. `Topbar` expõe
`aria-expanded`/`aria-controls`; Escape fecha a gaveta e restaura foco.
`NotificationCenter` recebe botão nomeado, painel nomeado, loading/erro/vazio,
Escape e retorno de foco sem mudar cálculos ou intervalo.

- [ ] **Step 4: Atualizar exports e concluir a migração de `CollaboratorsPage`**

```ts
export { IconButton } from './IconButton';
export { Field } from './Field';
export { Tag } from './Tag';
export { PageToolbar } from './PageToolbar';
export { FilterBar } from './FilterBar';
export { MetricStrip } from './MetricStrip';
export { SegmentedControl } from './SegmentedControl';
export { EmptyState } from './EmptyState';
export { LoadingState } from './LoadingState';
export { InlineNotice } from './InlineNotice';
```

Em `CollaboratorsPage`, substituir toolbar, filtros, wrappers `bg-white`, tabela
nativa e estados locais pelos compostos desta Task. Preservar as cinco colunas,
busca, filtros, exportação, permissões, edição e abertura do detalhe já cobertos
por `CollaboratorsPage.test.tsx`. A tabela recebe `label="Colaboradores"` e a
linha usa `Table.Row` com ativação por clique, Enter e Espaço.

- [ ] **Step 5: Rodar testes completos da fundação e commit**

Run: `npm test -- components/ui components/shell pages/CollaboratorsPage.test.tsx && npx tsc --noEmit && npm run build`  
Expected: PASS.

```powershell
git add -- components/ui components/shell pages/CollaboratorsPage.tsx pages/CollaboratorsPage.test.tsx
git commit -m "feat: cria composicao operacional compartilhada"
```

---

### Task 4: CRUDs, usuários e formulário de colaborador

**Files:**
- Modify: `pages/CrudPage.tsx`
- Modify: `pages/UsersPage.tsx`
- Modify: `components/collaborators/CollaboratorFormModal.tsx`
- Create: `pages/CrudPage.test.tsx`
- Create: `pages/UsersPage.test.tsx`
- Create: `components/collaborators/CollaboratorFormModal.test.tsx`

**Interfaces:**
- Consumes: `PageToolbar`, `Table`, `Tag`, `Modal`, `Input`, `Select`, `MultiSelect`, `LoadingState`, `EmptyState`, `InlineNotice`.
- Produces: padrão visual dos seis cadastros e formulário de colaborador sem tokens VERT.

- [ ] **Step 1: Escrever testes RED de estados, permissões e preservação de callbacks**

```tsx
render(<CrudPage title="Clientes" data={pendingPromise} {...crudProps} />);
expect(screen.getByRole('status')).toHaveTextContent('Carregando cadastros');
expect(screen.queryByText('Nenhum registro encontrado')).not.toBeInTheDocument();

render(<CrudPage title="Clientes" data={[clienteB, clienteA]} {...adminProps} />);
expect(screen.getAllByRole('row')[1]).toHaveTextContent('Cliente A');
expect(screen.getByRole('button', { name: 'Editar Cliente A' })).toBeVisible();

render(<CollaboratorFormModal initialData={undefined} {...formProps} />);
expect(screen.getByRole('dialog', { name: 'Novo colaborador' })).toBeVisible();
```

Também testar: busca, retry, ausência de mutações para não ADMIN, criação com
ID gerado, edição preservando ID, troca de cliente limpando operação, confirmação
de exclusão, carregamento dos cinco catálogos, seleção de ilha preenchendo IDs,
campos condicionais por status e agendamento com data.

- [ ] **Step 2: Rodar e confirmar falha nos tokens/overlays legados**

Run: `npm test -- pages/CrudPage.test.tsx pages/UsersPage.test.tsx components/collaborators/CollaboratorFormModal.test.tsx`  
Expected: FAIL em estados, nomes acessíveis e `Modal` compartilhado.

- [ ] **Step 3: Migrar composição sem alterar regras**

Usar `Tag` para `EntityStatus`, `Table` para a lista, `Modal` para edição e
exclusão e `MultiSelect` para schemas multiselect. Preservar literalmente:

```ts
const payload = { ...currentItem, id: currentItem.id || generateId() };
if (field.key === 'clientId') {
  setCurrentItem({ ...currentItem, clientId: newVal, operationId: '' });
}
```

No formulário do colaborador, manter a seleção de ilha:

```ts
setFormData(p => ({
  ...p,
  ilhaId: ilha.id,
  operationId: ilha.operationId,
  clientId: ilha.clientId,
  coordinatorId: ilha.coordinatorIds?.[0] || p.coordinatorId,
  supervisorId: ilha.supervisorIds?.[0] || p.supervisorId,
}));
```

Não converter o botão “Salvar” em validação funcional nova; manter a chamada
direta `onSave(formData)`.

- [ ] **Step 4: Rodar testes e commit**

Run: `npm test -- pages/CrudPage.test.tsx pages/UsersPage.test.tsx components/collaborators/CollaboratorFormModal.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/CrudPage.tsx pages/CrudPage.test.tsx pages/UsersPage.tsx pages/UsersPage.test.tsx components/collaborators/CollaboratorFormModal.tsx components/collaborators/CollaboratorFormModal.test.tsx
git commit -m "feat: finaliza interface dos cadastros"
```

---

### Task 5: Detalhe do colaborador

**Files:**
- Modify: `pages/CollaboratorDetailsPage.tsx`
- Create: `pages/CollaboratorDetailsPage.test.tsx`

**Interfaces:**
- Consumes: `ClientLogo`, `Badge`, `Tag`, `Card`, `Modal`, `LoadingState`, `EmptyState`.
- Produces: detalhe organizado por seções de definição.

- [ ] **Step 1: Escrever testes RED das sete seções e mutações existentes**

```tsx
render(<CollaboratorDetailsPage collab={collab} {...props} />);
for (const name of ['Dados pessoais', 'Contrato', 'Alocação', 'Jornada', 'Dados de acesso', 'Férias', 'Histórico de alterações']) {
  expect(await screen.findByRole('heading', { name })).toBeVisible();
}
expect(screen.getByText('Programado')).not.toHaveAttribute('data-dot');
```

Testar resolução dos relacionamentos, permissões ADMIN/SUPPORT, histórico por
nome ou matrícula, férias por matrícula, criação de histórico e exclusão com
confirmação.

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/CollaboratorDetailsPage.test.tsx`  
Expected: FAIL na semântica de seções e uso de Tag/Modal.

- [ ] **Step 3: Reestruturar somente o JSX**

Substituir o mosaico de cards por seções `Card` rasas com `<dl>`. Usar
`ClientLogo`, `Badge` para status e `Tag` para “Programado”/“Em gozo”. Preservar
integralmente a construção de `changes`, `saveCollaborator`,
`addVacationHistory`, `addHistory`, `deleteCollaborator`, `onRefresh` e `onBack`.

- [ ] **Step 4: Rodar, verificar e commit**

Run: `npm test -- pages/CollaboratorDetailsPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/CollaboratorDetailsPage.tsx pages/CollaboratorDetailsPage.test.tsx
git commit -m "feat: organiza detalhe do colaborador"
```

---

### Task 6: Listas operacionais simples

**Files:**
- Modify/Create test: `pages/BirthdaysPage.tsx`, `pages/BirthdaysPage.test.tsx`
- Modify/Create test: `pages/AvisoPrevioPage.tsx`, `pages/AvisoPrevioPage.test.tsx`
- Modify/Create test: `pages/AfastadosPage.tsx`, `pages/AfastadosPage.test.tsx`
- Modify/Create test: `pages/HistoryPage.tsx`, `pages/HistoryPage.test.tsx`
- Modify/Create test: `pages/ScheduledTasksPage.tsx`, `pages/ScheduledTasksPage.test.tsx`

**Interfaces:**
- Consumes: `PageToolbar`, `FilterBar`, `MetricStrip`, `Table`, `Badge`, `Tag`, `Modal`, estados compartilhados.
- Produces: padrão de lista aplicado a cinco rotas.

- [ ] **Step 1: Escrever testes RED determinísticos**

```ts
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-08-17T12:00:00'));
```

Assertions obrigatórias: aniversário filtra agosto e ordena por dia; aviso
prévio ordena menor prazo e ativa linha por clique/Enter/Espaço; afastados mostra
contagens reais por categoria; histórico separa loading/vazio/erro e preserva
ordem do banco; tarefas preservam fallback de nome, resumo de cinco chaves,
edição, cancelamento individual/todos e histórico com usuário “Sistema”.

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/BirthdaysPage.test.tsx pages/AvisoPrevioPage.test.tsx pages/AfastadosPage.test.tsx pages/HistoryPage.test.tsx pages/ScheduledTasksPage.test.tsx`  
Expected: FAIL em estados, rolagem, teclado e composição compartilhada.

- [ ] **Step 3: Migrar as cinco páginas**

Remover títulos duplicados, wrappers `bg-white`, sombras e cores fixas. Usar
`Table.Row` acionável; impedir propagação em botões internos. Manter as regras:

```ts
// Aviso prévio: cálculo local existente
const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);

// Tarefas: resumo existente
const summary = Object.keys(task.changes).length > 5
  ? 'Alteração completa (cadastro)'
  : Object.keys(task.changes).join(', ');
```

- [ ] **Step 4: Rodar, restaurar timers e commit**

Run: `npm test -- pages/BirthdaysPage.test.tsx pages/AvisoPrevioPage.test.tsx pages/AfastadosPage.test.tsx pages/HistoryPage.test.tsx pages/ScheduledTasksPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/BirthdaysPage.tsx pages/BirthdaysPage.test.tsx pages/AvisoPrevioPage.tsx pages/AvisoPrevioPage.test.tsx pages/AfastadosPage.tsx pages/AfastadosPage.test.tsx pages/HistoryPage.tsx pages/HistoryPage.test.tsx pages/ScheduledTasksPage.tsx pages/ScheduledTasksPage.test.tsx
git commit -m "feat: unifica listas operacionais"
```

---

### Task 7: Desligados e férias

**Files:**
- Modify: `pages/DesligadosPage.tsx`
- Modify: `pages/VacationManagementPage.tsx`
- Create: `pages/DesligadosPage.test.tsx`
- Create: `pages/VacationManagementPage.test.tsx`

**Interfaces:**
- Consumes: `FilterBar`, `SegmentedControl`, `Table`, estados compartilhados.
- Produces: listas complexas responsivas preservando filtros/exportação.

- [ ] **Step 1: Escrever testes RED**

Em Desligados, testar período atual/todo período, busca, cinco filtros AND,
dependências de opções, limpeza, ordenação, teclado, XLSX e nome
`MOP_Colaboradores_Desligados.xlsx`. Em Férias, testar inclusão por status/período,
retorno por `addDays(fim, 1)`, abas semânticas, filtros históricos, contagens e
duas regiões roláveis.

```tsx
expect(screen.getByRole('region', { name: 'Tabela de colaboradores desligados' })).toHaveAttribute('tabindex', '0');
expect(screen.getByRole('tab', { name: 'Mapa de férias' })).toHaveAttribute('aria-selected', 'true');
```

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/DesligadosPage.test.tsx pages/VacationManagementPage.test.tsx`  
Expected: FAIL em regiões, abas e estados.

- [ ] **Step 3: Migrar JSX e preservar cálculos**

Manter `daysUntilReturn >= 0`, filtro histórico pela data de início, exclusão de
matrículas inexistentes e formato exato das colunas XLSX. Não reativar o ramo
morto `isAlert`.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/DesligadosPage.test.tsx pages/VacationManagementPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/DesligadosPage.tsx pages/DesligadosPage.test.tsx pages/VacationManagementPage.tsx pages/VacationManagementPage.test.tsx
git commit -m "feat: finaliza desligados e ferias"
```

---

### Task 8: Importação e atualização em massa

**Files:**
- Modify: `pages/ImportPage.tsx`
- Modify: `pages/BulkUpdatePage.tsx`
- Create: `pages/ImportPage.test.tsx`
- Create: `pages/BulkUpdatePage.test.tsx`

**Interfaces:**
- Consumes: `SegmentedControl`, `Table`, `Modal`, `InlineNotice`, `LoadingState`, `EmptyState`, `IconButton`.
- Produces: fluxos em massa coerentes sem `window.alert` ou modal artesanal.

- [ ] **Step 1: Escrever testes RED dos fluxos reais**

```tsx
expect(screen.getByRole('tab', { name: 'Importar novos' })).toHaveAttribute('aria-selected', 'true');
await user.upload(screen.getByLabelText('Selecionar arquivo'), csvFile);
expect(await screen.findByText('6 registros encontrados')).toBeVisible();
expect(screen.getByRole('region', { name: 'Pré-visualização da planilha' })).toHaveAttribute('tabindex', '0');
```

Testar confirmação antes de `bulkCreateCollaborators`, mensagem “Dados
importados”, agendamento rotulado, filtros do bulk, seleção por nome, barra “1
colaborador selecionado”, cascata de Ilha, confirmação de atualização e chamada
exata `bulkUpdateCollaborators(['4127'], 'status', FERIAS)`.

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/ImportPage.test.tsx pages/BulkUpdatePage.test.tsx`  
Expected: FAIL em semântica, feedback e modal compartilhado.

- [ ] **Step 3: Migrar composição preservando serviços**

Manter intactos `findOrCreate*`, `bulkCreateCollaborators`, `scheduleTask`,
`updateTask`, `saveCollaborator`, `bulkUpdateCollaborators` e `addHistory`.
Remover `dangerouslySetInnerHTML`, `text-white` sobre laranja e altura rígida de
600px. Expor filtros e campos com labels; usar `Modal` para confirmação e
`InlineNotice` para resultado.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/ImportPage.test.tsx pages/BulkUpdatePage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/ImportPage.tsx pages/ImportPage.test.tsx pages/BulkUpdatePage.tsx pages/BulkUpdatePage.test.tsx
git commit -m "feat: refina fluxos de dados em massa"
```

---

### Task 9: Vencimento de contratos e Gantt

**Files:**
- Modify: `pages/ExpiringContractsPage.tsx`
- Create: `pages/ExpiringContractsPage.test.tsx`

**Interfaces:**
- Consumes: tokens `--viz-*`, `SegmentedControl`, `Table`, `Tag`, estados compartilhados.
- Produces: tabela e timeline acessíveis nos dois temas.

- [ ] **Step 1: Escrever testes RED com relógio congelado**

Testar quatro estados de carga, nove colunas, Tag SIM/NÃO, permissão e rollback de
efetivação, botão “Compactar coluna de colaboradores”, barras focáveis, tooltip
por foco/hover e teclado Home/End/setas na timeline.

```tsx
expect(screen.getByRole('button', { name: 'Compactar coluna de colaboradores' })).toHaveAttribute('aria-pressed', 'false');
expect(screen.getByRole('region', { name: 'Linha do tempo de contratos' })).toHaveAttribute('tabindex', '0');
```

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/ExpiringContractsPage.test.tsx`  
Expected: FAIL na compactação, teclado, estados e tokens.

- [ ] **Step 3: Implementar a migração visual**

Substituir cores literais por `var(--viz-track)`, `var(--viz-today)`,
`var(--viz-weekend)`, `var(--viz-warning)`, `var(--viz-negative)` e tooltip
semântico. Manter os cálculos de vencimento e chamadas de efetivação existentes.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/ExpiringContractsPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/ExpiringContractsPage.tsx pages/ExpiringContractsPage.test.tsx
git commit -m "feat: torna gantt responsivo e tematico"
```

---

### Task 10: Turnover

**Files:**
- Modify: `pages/TurnoverPage.tsx`
- Create: `pages/TurnoverPage.test.tsx`

**Interfaces:**
- Consumes: `MetricStrip`, `FilterBar`, `Table`, estados compartilhados e tokens `--viz-*`.
- Produces: análise de turnover temática sem mudar fórmulas/exportações.

- [ ] **Step 1: Escrever testes RED com fixture determinística de agosto/2026**

```tsx
expect(await screen.findByText('Turnover 50,00%')).toBeVisible();
expect(screen.getByText('Taxa de desligamento 50,00%')).toBeVisible();
expect(screen.getByText('Headcount médio 2')).toBeVisible();
expect(screen.getByText('1 admissão')).toBeVisible();
expect(screen.getByText('1 desligamento')).toBeVisible();
```

Testar loading/erro/vazio, filtros, faixa de 91–180 dias igual a 1, regiões de
gráfico nomeadas, EmptyState por ilha, nomes acessíveis de Excel/PDF e tabela
mensal rolável.

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/TurnoverPage.test.tsx`  
Expected: FAIL no novo layout e estados, mantendo os valores calculados.

- [ ] **Step 3: Migrar gráficos e métricas**

Trocar os quatro cards por `MetricStrip`; manter todas as fórmulas e exports.
Configurar Recharts com `var(--viz-grid)`, `var(--viz-axis)`,
`var(--viz-tooltip-bg)`, `var(--viz-tooltip-border)`, `var(--viz-positive)` e
`var(--viz-negative)`. Remover hexadecimais locais e sombras promocionais.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/TurnoverPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/TurnoverPage.tsx pages/TurnoverPage.test.tsx
git commit -m "feat: harmoniza analise de turnover"
```

---

### Task 11: Organograma navegável

**Files:**
- Modify: `pages/OrganogramPage.tsx`
- Create: `pages/OrganogramPage.test.tsx`

**Interfaces:**
- Consumes: `FilterBar`, `IconButton`, estados e `--viz-connector`.
- Produces: canvas operável por pointer, toque e teclado.

- [ ] **Step 1: Escrever testes RED de hierarquia e interação**

Testar gerente → coordenador → supervisor → ilha → colaborador; labels de
filtros; cinco controles nomeados; `aria-pressed`; região “Organograma
operacional”; pan por setas; zoom por `+/-`; reset por Home; pointerdown/move com
`pointerType: 'touch'`.

```tsx
const canvas = screen.getByRole('region', { name: 'Organograma operacional' });
canvas.focus();
await user.keyboard('{ArrowRight}{ArrowDown}+');
expect(canvas.firstElementChild).not.toHaveStyle('transform: translate(0px, 0px) scale(1)');
```

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/OrganogramPage.test.tsx`  
Expected: FAIL em toque, teclado e nomes dos controles.

- [ ] **Step 3: Implementar interação por Pointer Events e tema neutro**

Unificar mouse/toque em `onPointerDown`, `onPointerMove`, `onPointerUp` com
`setPointerCapture`. Diferenciar níveis por eyebrow, forma e linha; remover
emerald/blue/orange/indigo. Conectores usam `var(--viz-connector)`.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/OrganogramPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/OrganogramPage.tsx pages/OrganogramPage.test.tsx
git commit -m "feat: torna organograma acessivel ao toque"
```

---

### Task 12: Sobre e zona de perigo

**Files:**
- Modify: `pages/AboutPage.tsx`
- Modify: `pages/ResetDataPage.tsx`
- Create: `pages/AboutPage.test.tsx`
- Create: `pages/ResetDataPage.test.tsx`

**Interfaces:**
- Consumes: `Logo`, `Card`, `Button`, `Modal`, `InlineNotice`.
- Produces: utilitários compactos e coerentes.

- [ ] **Step 1: Escrever testes RED**

```tsx
render(<AboutPage />);
expect(screen.getByRole('img', { name: 'Quality Contact Center' })).toBeVisible();
expect(screen.getByText('Versão').closest('dl')).toBeInTheDocument();

render(<ResetDataPage />);
await user.click(screen.getByRole('button', { name: 'Resetar todos os dados' }));
expect(screen.getByRole('dialog', { name: 'Resetar todos os dados?' })).toBeVisible();
expect(db.resetDatabase).not.toHaveBeenCalled();
```

Testar mailto, ausência de altura fixa, confirmação, Escape, foco restaurado,
loading, sucesso com reload e erro sem reload com retry.

- [ ] **Step 2: Rodar e confirmar falhas**

Run: `npm test -- pages/AboutPage.test.tsx pages/ResetDataPage.test.tsx`  
Expected: FAIL pelo layout promocional e `window.confirm`.

- [ ] **Step 3: Implementar utilitários**

`AboutPage` usa `Logo variant="lockup"`, `<dl>` e link mailto. `ResetDataPage`
usa região nomeada “Zona de perigo”, botão `solid-danger` e `Modal`; chama
`db.resetDatabase()` uma vez e recarrega somente após sucesso.

- [ ] **Step 4: Rodar e commit**

Run: `npm test -- pages/AboutPage.test.tsx pages/ResetDataPage.test.tsx && npx tsc --noEmit`  
Expected: PASS.

```powershell
git add -- pages/AboutPage.tsx pages/AboutPage.test.tsx pages/ResetDataPage.tsx pages/ResetDataPage.test.tsx
git commit -m "feat: finaliza telas utilitarias"
```

---

### Task 13: Integração visual, remoção de legado e matriz E2E

**Files:**
- Modify: `index.css`
- Modify: `test/supabaseFixtures.ts`
- Modify: `e2e/a11y.spec.ts`
- Create: `e2e/helpers.ts`
- Create: `e2e/finalizacao-interface.spec.ts`
- Modify only when audit proves a remaining consumer: `pages/*.tsx`, `components/**/*.tsx`

**Interfaces:**
- Consumes: todas as Tasks 1–12.
- Produces: aplicação integrada sem shims consumidos e evidência automatizada de aceite.

- [ ] **Step 1: Escrever E2E RED da matriz representativa**

```ts
for (const width of [360, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${width}px em ${theme}`, async ({ page }) => {
      await entrar(page);
      await aplicarTema(page, theme);
      for (const rota of ['Importar dados', 'Turnover', 'Resetar dados']) {
        await page.getByRole('button', { name: rota, exact: true }).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      }
    });
  }
}
```

Adicionar testes de scroller da prévia, foco do modal Bulk, End na timeline,
pointer/touch/teclado no organograma, `color-scheme` computado e contraste de
texto/foco/controles.

- [ ] **Step 2: Rodar auditoria de legado antes da limpeza**

Run:

```powershell
rg -n --glob '!dist/**' --glob '!docs/**' 'VERT|vert-|brand-[0-9]{2,3}|text-white|#[0-9A-Fa-f]{6}|(?:bg|text|border)-(?:gray|blue|indigo|purple|green|red|orange)-' App.tsx components pages index.css
```

Expected: resultados apenas em shims e exceções de marca identificáveis; qualquer
call site de página encontrado deve ser migrado para token semântico antes do
próximo passo.

- [ ] **Step 3: Remover shims sem consumidores e seletores globais frágeis**

Remover de `index.css` somente após `rg` retornar zero consumidores:

```css
--color-brand-50;
--color-brand-100;
--color-brand-200;
--color-brand-300;
--color-brand-500;
--color-brand-600;
--color-brand-700;
--color-brand-800;
--color-brand-900;
```

Remover também o `@layer utilities` de remapeamento `gray/blue/indigo/orange`
e os seletores posicionais `main > div > h2`, `main table`, `main select/input`
quando a auditoria comprovar ausência de dependência.

Confirmar ainda que `rg -n 't-display|t-eyebrow|t-data' pages components` mostra
registros tipográficos nas páginas migradas e que `rg -n 'AnelQ' pages components`
retorna somente login, marca lateral e tiles de ilha.

- [ ] **Step 4: Executar verificação completa**

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run e2e
```

Expected: todos os testes PASS, TypeScript sem erro, build concluído e todas as
rotas sem erro de console.

- [ ] **Step 5: Inspeção visual e commit final**

Inspecionar um representante de cada arquétipo em 360/768/1440 e claro/escuro:
Clientes, Detalhe do colaborador, Férias, Importar dados, Turnover, Vencimento de
contratos, Organograma e Resetar dados. Confirmar loading, vazio, conteúdo,
modal, foco e rolagem interna.

```powershell
git add -- index.css test/supabaseFixtures.ts e2e components pages
git commit -m "feat: conclui interface Quality do MOP"
```

---

## Execution Coordination

- Cada agente da Wave 2 recebe exatamente uma Task e não toca `index.css`,
  `components/ui`, `components/shell`, `test/supabaseFixtures.ts` ou `e2e`.
- O integrador revisa primeiro aderência ao spec e depois qualidade de código.
- Se um agente precisar mudar uma API compartilhada, ele para e informa o
  integrador; não altera a fundação unilateralmente.
- Testes de uma Task rodam no agente; a suíte completa roda após integrar cada
  onda.
- Commits da Wave 2 são feitos pelo integrador, um conjunto de caminhos por vez,
  para evitar disputa pelo índice Git compartilhado.
