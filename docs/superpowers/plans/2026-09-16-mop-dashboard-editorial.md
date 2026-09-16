# MOP Dashboard Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o novo shell e Dashboard do MOP com modo claro editorial, modo escuro imersivo, todos os indicadores atuais e cards de ilha completos.

**Architecture:** A fonte de dados e os cálculos atuais permanecem em `DashboardPage`, `ilhaStats` e no `DataContext`. O trabalho evolui os tokens globais, o shell e os componentes visuais existentes; o `AnelQ` continua sendo a única implementação do gráfico de provimento. Comportamentos são protegidos primeiro por testes e cada etapa produz uma interface utilizável.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS 4, Vite 6, Vitest, Testing Library e Playwright.

**Spec:** `docs/superpowers/specs/2026-09-16-mop-dashboard-editorial-design.md`

## Global Constraints

- Não alterar banco, consultas, permissões, regras de cálculo ou destinos de navegação.
- Todos os cards, filtros, métricas e detalhes atuais precisam permanecer disponíveis.
- O Anel Q continua sendo o gráfico de rosca; não criar um donut substituto.
- O modo claro usa `#FFFFFF`, `#F6F6F4`, `#191310`, `#6B615C`, `#F27405`/`#F54E00` e `#E4E4E4`.
- O modo escuro usa `#061625`, `#0A2032`, `#EAF2F7`, `#91A5B5`, `#FF4D2E` e `#17364D`.
- Preservar contraste AA, foco visível, teclado, toque e `prefers-reduced-motion`.
- Não adicionar dependências.

---

### Task 1: Tema editorial e tokens do shell

**Files:**
- Modify: `index.css`
- Modify: `contexts/ThemeContext.tsx`
- Test: `contexts/ThemeContext.test.tsx`

**Interfaces:**
- Consumes: classe raiz `.dark` e variáveis CSS já usadas pelos componentes.
- Produces: tokens `--canvas`, `--canvas-soft`, `--canvas-sunk`, `--ink*`, `--brand*`, `--hairline*` e sombras coerentes nos dois temas.

- [ ] **Step 1: Escrever o teste que protege persistência e classe do tema**

Adicionar a `ThemeContext.test.tsx` um cenário que inicia em claro, alterna e confirma a classe escura:

```tsx
it('alterna entre as duas atmosferas sem mudar o contrato do tema', async () => {
  const user = userEvent.setup();
  montar();
  expect(document.documentElement).not.toHaveClass('dark');
  await user.click(screen.getByRole('button', { name: 'tema: light' }));
  expect(document.documentElement).toHaveClass('dark');
  expect(localStorage.getItem('mop-theme')).toBe('dark');
});
```

- [ ] **Step 2: Executar o teste e confirmar a proteção atual**

Run: `npm test -- contexts/ThemeContext.test.tsx`  
Expected: PASS; o teste documenta o contrato que o redesign não pode quebrar.

- [ ] **Step 3: Atualizar somente os tokens globais**

Em `index.css`, definir a base escura especificada e manter nomes semânticos:

```css
:root {
  --canvas:#fff; --canvas-soft:#f6f6f4; --canvas-sunk:#efefed;
  --hairline:#e4e4e4; --hairline-2:#cbc7c3;
  --ink:#191310; --ink-2:#453c38; --ink-mute:#6b615c;
  --brand:#f27405; --brand-hot:#f54e00; --brand-wash:#fff1e8;
}
.dark {
  color-scheme:dark;
  --canvas:#061625; --canvas-soft:#0a2032; --canvas-sunk:#04111d;
  --hairline:#17364d; --hairline-2:#28506b;
  --ink:#eaf2f7; --ink-2:#bfd0dc; --ink-mute:#91a5b5;
  --brand:#ff5b35; --brand-hot:#ff4d2e; --brand-wash:rgb(255 77 46 / .12);
}
```

Manter as variáveis de status existentes e recalibrar sombras para cada canvas.

- [ ] **Step 4: Executar contexto e testes de contraste**

Run: `npm test -- contexts/ThemeContext.test.tsx lib/contrast.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.css contexts/ThemeContext.test.tsx
git commit -m "style: redefine atmosferas clara e escura do MOP"
```

---

### Task 2: Shell global editorial

**Files:**
- Modify: `components/shell/AppShell.tsx`
- Modify: `components/shell/Sidebar.tsx`
- Modify: `components/shell/Topbar.tsx`
- Test: `components/shell/AppShell.test.tsx`
- Test: `components/shell/Sidebar.test.tsx`
- Test: `components/shell/Topbar.test.tsx`

**Interfaces:**
- Consumes: `currentUser`, `currentPage`, `onNavigate`, `onLogout` e `ThemeContext` atuais.
- Produces: o mesmo contrato público do `AppShell`, com menu agrupado, topo compacto e gaveta móvel preservada.

- [ ] **Step 1: Escrever testes de regressão da navegação e acessibilidade**

Adicionar asserções aos testes existentes:

```tsx
expect(screen.getByRole('navigation', { name: /principal/i })).toBeInTheDocument();
expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo-principal');
expect(screen.getByRole('button', { name: /tema/i })).toBeInTheDocument();
```

No teste móvel, abrir a gaveta, pressionar `Escape` e confirmar retorno do foco ao gatilho.

- [ ] **Step 2: Rodar os testes para estabelecer a linha de base**

Run: `npm test -- components/shell/AppShell.test.tsx components/shell/Sidebar.test.tsx components/shell/Topbar.test.tsx`  
Expected: PASS ou FAIL apenas nas novas expectativas de nomes acessíveis, que serão implementadas a seguir.

- [ ] **Step 3: Remodelar o shell sem mudar callbacks**

Aplicar no `AppShell` a geometria editorial:

```tsx
<div className="min-h-dvh bg-canvas-sunk lg:p-5">
  <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] max-w-[1600px] overflow-hidden
                  bg-canvas shadow-3 lg:grid-cols-[248px_minmax(0,1fr)] lg:rounded-[24px]">
    <Sidebar {...sidebarProps} />
    <div className="min-w-0"><Topbar {...topbarProps} /><main id={CONTEUDO_ID}>{children}</main></div>
  </div>
</div>
```

Manter `inert`, Escape, restauração de foco e os callbacks atuais.

- [ ] **Step 4: Organizar Sidebar e Topbar**

No `Sidebar`, usar os grupos reais de navegação existentes e régua interna no item selecionado. No `Topbar`, manter título da rota, notificações, tema e perfil; não introduzir busca sem fonte de dados.

- [ ] **Step 5: Rodar os testes do shell**

Run: `npm test -- components/shell/AppShell.test.tsx components/shell/Sidebar.test.tsx components/shell/Topbar.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/shell
git commit -m "style: remodela shell editorial do MOP"
```

---

### Task 3: Anel Q e detalhe completo dos cards

**Files:**
- Modify: `components/brand/AnelQ.tsx`
- Modify: `components/dashboard/IlhaTile.tsx`
- Modify: `components/dashboard/GeralTile.tsx`
- Test: `components/brand/AnelQ.test.tsx`
- Test: `components/dashboard/IlhaTile.test.tsx`
- Test: `components/dashboard/GeralTile.test.tsx`

**Interfaces:**
- Consumes: `AnelQ({ value, threshold, className, label })`, `IlhaStat`, `ConsolidadoStat` e `Badge`.
- Produces: os mesmos componentes públicos, com expansão acessível via `aria-expanded` e todos os dados preservados.

- [ ] **Step 1: Escrever testes para o contrato expandido**

Em `IlhaTile.test.tsx`, exigir o estado semântico:

```tsx
const card = screen.getByRole('button', { name: /Ilha 01/ });
expect(card).toHaveAttribute('aria-expanded', 'false');
fireEvent.focus(card);
expect(card).toHaveAttribute('aria-expanded', 'true');
expect(screen.getByText('PA contratada')).toBeVisible();
expect(screen.getByText(/Por status/i)).toBeVisible();
```

Em `GeralTile.test.tsx`, confirmar PA, ativos, status e aviso de PA indefinida. Em `AnelQ.test.tsx`, manter casos 0%, intermediário, 100% e valor acima de 100% com `aria-label` real.

- [ ] **Step 2: Rodar e confirmar falha do novo contrato ARIA**

Run: `npm test -- components/brand/AnelQ.test.tsx components/dashboard/IlhaTile.test.tsx components/dashboard/GeralTile.test.tsx`  
Expected: FAIL por ausência de `aria-expanded` no card.

- [ ] **Step 3: Implementar a expansão acessível sem remover conteúdo**

Associar card e região:

```tsx
const detalheId = useId();
<article
  role="button"
  tabIndex={0}
  aria-expanded={aberto}
  aria-controls={detalheId}
  onMouseEnter={() => setAberto(true)}
  onMouseLeave={() => setAberto(false)}
  onFocus={() => setAberto(true)}
  onBlur={() => setAberto(false)}
>
  {/* cabeçalho, AnelQ, percentual */}
  <div id={detalheId} aria-hidden={!aberto}>{/* PA, ativos, status e avisos */}</div>
</article>
```

No mobile, manter o clique que navega e disponibilizar o conteúdo completo pela ordem de foco; não converter o primeiro clique desktop em ação diferente.

- [ ] **Step 4: Refinar visualmente o Anel Q real**

Preservar `RING_PATH`, `wedgePath` e clamp visual em 100%; o texto continua mostrando valores acima de 100%. Ajustar apenas tamanho, track e tokens por CSS/props, sem desenhar outro SVG circular.

- [ ] **Step 5: Rodar testes de cards e marca**

Run: `npm test -- components/brand/AnelQ.test.tsx components/dashboard/IlhaTile.test.tsx components/dashboard/GeralTile.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/brand/AnelQ.tsx components/brand/AnelQ.test.tsx components/dashboard/IlhaTile.tsx components/dashboard/IlhaTile.test.tsx components/dashboard/GeralTile.tsx components/dashboard/GeralTile.test.tsx
git commit -m "style: eleva cards de ilha sem perder detalhes"
```

---

### Task 4: Composição editorial do Dashboard

**Files:**
- Modify: `pages/DashboardPage.tsx`
- Modify: `pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `computeIlhaStats`, `consolidarIlhas`, `totaisGerais`, `GeralTile`, `IlhaTile` e callback `onAbrirIlha(id: string)`.
- Produces: Dashboard com faixa agregada completa, filtros atuais e grade integral responsiva.

- [ ] **Step 1: Fortalecer os testes de preservação de informação**

Em `DashboardPage.test.tsx`, manter a string agregada já verificada e adicionar:

```tsx
expect(screen.getByRole('group', { name: 'Resumo do quadro' })).toHaveTextContent('PA contratada');
expect(screen.getByRole('group', { name: 'Resumo do quadro' })).toHaveTextContent('ativos');
expect(screen.getByRole('group', { name: 'Resumo do quadro' })).toHaveTextContent('provimento geral');
expect(screen.getAllByRole('article')).toHaveLength(3); // geral + duas ilhas do fixture
```

- [ ] **Step 2: Rodar o teste da página antes da remodelagem**

Run: `npm test -- pages/DashboardPage.test.tsx`  
Expected: PASS para os dados existentes; qualquer falha de contagem deve ser corrigida no teste usando o fixture real, sem alterar a produção.

- [ ] **Step 3: Reorganizar a página com os dados reais**

Usar a ordem abaixo, mantendo `numeros`, `geral`, `stats`, `cliente`, `operacao` e `ordem` como as fontes já calculadas no arquivo:

```tsx
<div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-9">
  <header className="mb-7">
    <h1 className="t-display-lg text-ink">Operação em perspectiva.</h1>
    <p className="mt-2 text-sm text-ink-mute">Pessoas, capacidade e movimentos de hoje.</p>
  </header>
  <div role="group" aria-label="Resumo do quadro">
    {numeros.map(({ rotulo, valor, aceso }) => (
      <div key={rotulo}><strong className={aceso ? 'text-brand-hot' : 'text-ink'}>{valor}</strong><span>{rotulo}</span></div>
    ))}
  </div>
  <section aria-labelledby="ilhas-title">
    <div className="flex flex-wrap items-end gap-3">
      <h2 id="ilhas-title">Ilhas em operação</h2>
      {/* manter aqui os três ChipSelect existentes e seus handlers atuais */}
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
      <GeralTile geral={geral} />
      {stats.map(ilha => <IlhaTile key={ilha.id} ilha={ilha} onOpen={() => onAbrirIlha(ilha.id)} />)}
    </div>
  </section>
</div>
```

Manter os três `ChipSelect` existentes, com as mesmas opções e handlers, no local indicado pelo comentário. A faixa usa somente `numeros` e não inventa tendências.

- [ ] **Step 4: Rodar testes do Dashboard**

Run: `npm test -- pages/DashboardPage.test.tsx components/dashboard`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pages/DashboardPage.tsx pages/DashboardPage.test.tsx components/dashboard
git commit -m "style: compoe dashboard editorial do MOP"
```

---

### Task 5: Responsividade, regressão e revisão visual

**Files:**
- Modify: `e2e/shots.spec.ts`
- Modify: `e2e/a11y.spec.ts`
- Modify: `e2e/smoke.spec.ts`
- Modify: `index.css` only if the visual review reveals a shared token defect

**Interfaces:**
- Consumes: aplicação integrada das Tasks 1–4.
- Produces: evidência de desktop/mobile e temas claro/escuro sem regressão funcional.

- [ ] **Step 1: Adicionar captura determinística do Dashboard**

Em `e2e/shots.spec.ts`, usar os helpers de autenticação existentes e registrar capturas em 1440×1000 e 390×844, nos dois temas, após os cards estarem visíveis.

```ts
await expect(page.getByRole('heading', { name: /Ilhas em operação/i })).toBeVisible();
await page.screenshot({ path: testInfo.outputPath(`dashboard-${tema}-${largura}.png`), fullPage: true });
```

- [ ] **Step 2: Adicionar jornada de teclado do card**

Em `e2e/a11y.spec.ts`, focar uma ilha, confirmar `aria-expanded="true"`, verificar PA/status visíveis e acionar Enter para navegar à lista filtrada.

- [ ] **Step 3: Executar toda a suíte unitária e o build**

Run: `npm test`  
Expected: todos os testes PASS.

Run: `npm run build`  
Expected: build concluído sem erro TypeScript/Vite.

- [ ] **Step 4: Executar E2E proporcional ao risco**

Run: `npx playwright test e2e/smoke.spec.ts e2e/a11y.spec.ts e2e/shots.spec.ts`  
Expected: PASS sem erro de console, clipping ou controles inacessíveis.

- [ ] **Step 5: Revisar as quatro capturas**

Confirmar visualmente: Anel Q íntegro; todos os cards presentes; hover sem sobreposição destrutiva; faixa completa; quatro/duas/uma coluna conforme largura; claro editorial; escuro azul-marinho; foco visível. Se houver defeito, corrigi-lo no componente responsável e repetir Steps 3–5.

- [ ] **Step 6: Commit final**

```bash
git add e2e index.css components pages
git commit -m "test: valida redesign responsivo do dashboard"
```
