# MOP — Redesign visual (VERT Design System + tema claro/escuro)

**Data:** 2026-08-13
**Status:** Aprovado para planejamento

## 1. Contexto

O MOP (Mapa Operacional) é um sistema interno de gestão de workforce para call
center, hoje implementado como um único componente React (`App.tsx`, ~5.400
linhas) estilizado com Tailwind via CDN (`cdn.tailwindcss.com`), sem suporte a
tema escuro e sem um sistema de tokens de design formal. A cor de marca atual
é um verde ad-hoc (`brand.600 = #16a34a`) definido inline no `index.html`.

O pedido é remodelar a identidade visual do app adotando o design system
público da VERT Capital (https://design.vert-capital.com), com alternância
entre modo claro e escuro, em uma linguagem visual inspirada no Material
Design (superfícies tonais, elevação, forma, movimento) e um elemento de
assinatura vetorial/ilustrado.

## 2. Objetivo desta leva

Construir a fundação de design (tokens, tema, componentes compartilhados) e
aplicá-la às telas que definem a primeira impressão e que concentram o maior
reaproveitamento de UI:

- Login
- Sidebar + Header (shell do app)
- Dashboard (Visão Geral)
- Componentes compartilhados: `Button`, `Input`, `Select`, `Badge`,
  `MultiSelect`, modais (`CollaboratorFormModal` e padrão de modal em geral),
  `CrudPage` (tabela/lista genérica usada por Coordenadores, Supervisores,
  Clientes, Operações, Ilhas, Usuários)

**Fora de escopo nesta leva** (fica para uma leva seguinte, sinalizado ao
usuário quando chegar lá): Organograma, Gestão de Férias, Turnover,
Importação/Update em massa, Aniversariantes, Desligados, Aviso Prévio,
Afastados, Detalhe do Colaborador, Tarefas Agendadas, Histórico, Resetar
Dados, Sobre. Essas páginas continuam funcionando e herdam automaticamente o
novo visual nos componentes compartilhados que usam (Button, Input, Badge
etc.), mas seções com markup bespoke (cores `bg-white`/`bg-gray-*` fixas fora
de componentes compartilhados) podem não responder ao tema escuro até serem
tocadas.

Não está no escopo: quebrar `App.tsx` em múltiplos arquivos/módulos. Essa é
uma decisão de arquitetura de código separada da remodelação visual; os
componentes tocados serão restilizados no lugar onde já vivem.

## 3. Abordagem técnica

### 3.1 Build do Tailwind

Migrar de Tailwind via CDN para **Tailwind v4 instalado**, usando o plugin
oficial `@tailwindcss/vite` (sem `tailwind.config.js` — configuração
CSS-first via `@theme` em `index.css`). Motivação: o script CDN é
explicitamente não recomendado para produção pelo próprio Tailwind, e não
permite expressar tokens semânticos que trocam de valor entre os temas claro
e escuro.

Alterações:
- `package.json`: adicionar `tailwindcss` e `@tailwindcss/vite` como
  devDependencies.
- `vite.config.ts`: registrar o plugin `@tailwindcss/vite`.
- `index.html`: remover o `<script src="cdn.tailwindcss.com">` e o bloco
  `tailwind.config` inline; manter o `<link rel="stylesheet" href="/index.css">`
  (hoje presente mas apontando para um arquivo inexistente).
- Criar `index.css` com `@import "tailwindcss";`, o bloco `@theme` com os
  tokens (seção 4) e `@custom-variant dark (&:where(.dark, .dark *));` para
  dark mode por classe no `<html>`.
- Import da fonte Lato (Google Fonts, pesos 300/400/700/900) via `@import` no
  topo do `index.css` ou `<link>` no `index.html`.

### 3.2 Tema claro/escuro

Criar um `ThemeContext` simples (`useState` + `useEffect`, sem lib externa):

- Estado: `'light' | 'dark'`.
- Inicialização: lê `localStorage.getItem('mop-theme')`; se ausente, usa
  `window.matchMedia('(prefers-color-scheme: dark)')`.
- Aplica a classe `dark` no `<html>` via efeito colateral quando o tema é
  `'dark'`.
- Toggle persiste a escolha explícita do usuário em `localStorage` (a partir
  do primeiro toggle manual, deixa de seguir mudanças do SO).
- Exposto via hook `useTheme()` para o botão de alternância no Header.

## 4. Tokens de design

Extraídos de https://design.vert-capital.com/design-tokens.html. Valores de
superfície escura marcados como *derivados* porque o VERT não publica tokens
de modo escuro — seguem a convenção de elevação do Material 3 (superfícies
mais claras que o fundo conforme "sobem" na hierarquia).

### 4.1 Cor — tokens semânticos

| Token | Claro | Escuro | Origem |
|---|---|---|---|
| `--color-bg` | `#F4F4F4` | `#171919` | High Extra Light / Low Pure |
| `--color-surface` | `#FFFFFF` | `#202323` | High Pure / *derivado* |
| `--color-surface-alt` | `#EEEEEE` | `#262929` | High Light / *derivado* |
| `--color-border` | `#E0E0E0` | `#333636` | High Medium / *derivado* |
| `--color-border-strong` | `#C7C7C7` | `#4A4A4A` | High Dark / Low Dark |
| `--color-text-primary` | `#171919` | `#FFFFFF` | Low Pure / High Pure |
| `--color-text-secondary` | `#4A4A4A` | `#C7C7C7` | Low Dark / High Dark |
| `--color-text-tertiary` | `#AAAAAA` | `#AAAAAA` | Low Medium (ambos) |
| `--color-primary` | `#00747A` | `#3DA5A5` | Primary Pure / Primary Light |
| `--color-primary-dark` | `#033E3F` | `#245859` | Primary Dark / Primary Medium |
| `--color-primary-tonal` | `#E6F1F2` | `rgba(0,116,122,.16)` | Primary Extra Light / *derivado* |
| `--color-success` | `#41D394` | `#41D394` | Success Pure |
| `--color-warning` | `#E6CF42` | `#E6CF42` | Warning Pure |
| `--color-error` | `#F07363` | `#F07363` | Helper Pure |

Cada cor de feedback ganha uma variante tonal (fundo suave, ~12–16% de
opacidade) para badges/chips, calculada em CSS (`color-mix`) em vez de
hardcoded, para funcionar em ambos os temas sem duplicar tokens.

### 4.2 Espaçamento, raio, sombra, borda

Direto da página https://design.vert-capital.com/spacing.html e
design-tokens.html:

- Espaçamento: `2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160` (px) →
  mapeado em `@theme` como `--spacing-*`.
- Raio: `0` (none), `4` (sm — inputs pequenos/chips internos), `8` (md —
  padrão de botão/input), `16` (lg — cards/modais), `9999` (pill — badges de
  status), `50%` (circular — avatares).
- Borda: `1` (hairline, padrão), `2` (thin, foco/ênfase).
- Sombra: 4 níveis crescentes (usar os do VERT diretamente: y/blur/spread de
  4px a 48px), aplicados como `shadow-1`..`shadow-4`; `shadow-1` em botões
  primários e cards em repouso, `shadow-2`/`3` em modais e dropdowns abertos.

### 4.3 Tipografia

- Família única: **Lato**, pesos 300/400/700/900.
- Escala (11 degraus, dentro do range 12–96px do VERT):
  `12, 14, 16, 18, 20, 24, 30, 36, 48, 64, 96` px.
- Papéis por peso, não por família (conforme orientação do próprio VERT):
  - `900` — números grandes de destaque, wordmark do login.
  - `700` — títulos de página/seção, labels de botão.
  - `400` — corpo de texto, valores de tabela.
  - `300` + versalete + tracking — eyebrows, legendas, labels de campo
    (mantendo o padrão atual de label acima do input).

## 5. Componentes

Para cada componente: o que muda visualmente, mantendo a API/props atual
(sem quebrar os ~20 call sites espalhados pelo arquivo).

- **Button** — variantes viram filled (`primary`), tonal (`secondary`),
  tonal-erro (`danger`/`solid-danger` fundidos em uma leitura tonal vs.
  sólida), text (`ghost`). Raio `md`, `shadow-1` no filled, sem sombra no
  tonal/text. Estado de foco visível (ring com `--color-primary`).
- **Input / Select** — de "outline branco" para "filled":
  fundo `--color-surface-alt`, sem borda pesada em repouso, indicador de
  foco na cor primária (ring + leve mudança de fundo). Label continua
  estático acima do campo — não introduz floating label.
- **Badge** — vira chip pill (`radius: pill`) tonal: fundo na cor de
  feedback a ~12% de opacidade, texto/borda na cor cheia. Mapeamento de
  status existente preservado (Ativo→success, Desligado/Inativo→error,
  Férias/Pendente→warning, Aviso Prévio→warning forte, Afastado→error tonal
  com borda, Licença Maternidade→um tom neutro-quente da paleta).
- **MultiSelect** — mesmo padrão de Input/Select para o gatilho; dropdown
  usa `--color-surface` + `shadow-2` + `--color-border`.
- **Modais** (`CollaboratorFormModal` e o padrão geral) — raio `lg`,
  `shadow-3`, header com `--color-surface-alt`, backdrop mantém
  blur+overlay escuro em ambos os temas.
- **CrudPage** (tabela/lista genérica) — linhas com `--color-border` sutil,
  hover em `--color-surface-alt`, cabeçalho de coluna em `text-secondary`
  peso 700 versalete.
- **Sidebar / NavItem** — item ativo com indicador tonal deslizante
  (`--color-primary-tonal` de fundo, texto/ícone em `--color-primary`) em
  vez de preenchimento sólido; transição do indicador anima em vez de
  trocar de cor abruptamente.
- **Header** — adiciona botão de alternância de tema (ícone sol/lua,
  `lucide-react` já tem `Sun`; adicionar `Moon`), com transição de ícone.
- **LoginPage** — cartão em `--color-surface`, ilustração de assinatura
  (seção 6) como peça central, wordmark "MOP" em peso 900.
- **Dashboard** — cards de estatística e gráficos (Recharts) recebem cores
  do tema: `--color-primary` e derivados para séries de gráfico, grid/eixos
  em `--color-border`, tooltips em `--color-surface` + `shadow-2`.

## 6. Elemento de assinatura: ilustração do arquipélago

"Ilhas" é uma entidade real do domínio (pods/times dentro de cada operação),
e o produto se chama "Mapa Operacional" — a ilustração de assinatura usa essa
metáfora literal em vez de um ilustração genérica estilo Material:

- SVG inline (componente React `ArchipelagoIllustration`), sem assets
  externos — desenhado com formas geométricas planas (círculos/blobs
  simples) nas cores do token system (`--color-primary`, `--color-primary-tonal`,
  tons neutros), representando ilhas conectadas por linhas pontilhadas
  (rotas), com pequenos nós que pulsam suavemente (operações ativas).
- Usos: painel/fundo do Login (peça central, animação de entrada com
  stagger) e estados vazios das telas em escopo (ex.: nenhum resultado no
  CrudPage) em uma versão menor e estática.
- Uma única ilustração-base parametrizável (tamanho, nº de ilhas visíveis),
  não uma ilustração diferente por tela.

## 7. Movimento

- Transição de cores (~200ms, ease-out) em `background-color`, `color`,
  `border-color` no `<html>`/superfícies principais ao trocar de tema, para
  evitar flash.
- Entrada orquestrada da ilustração no Login: fade + stagger por ilha
  (~60ms de defasagem entre elementos), nós com pulso ambiente contínuo e
  sutil.
- Indicador de navegação ativo desliza (`transform`) entre itens em vez de
  aparecer/desaparecer.
- Tudo dentro de `@media (prefers-reduced-motion: reduce)`: animações
  contínuas (pulso) e de entrada são suprimidas; transições de tema caem
  para instantâneas.

## 8. Acessibilidade

- Contraste: todos os pares texto/fundo dos tokens da seção 4.1 verificados
  em AA (texto normal ≥ 4.5:1) durante a implementação; `--color-warning`
  (`#E6CF42`) usado apenas como fundo tonal com texto escuro, nunca como
  texto sobre fundo claro.
- Foco de teclado visível em todos os controles interativos (ring usando
  `--color-primary`), inclusive no novo toggle de tema e no indicador de
  navegação.
- Toggle de tema é um `<button>` com `aria-label` (ex.: "Ativar modo
  escuro"/"Ativar modo claro") e `aria-pressed`.

## 9. Verificação

- `npm run dev` e navegação manual por Login, Sidebar, Header, Dashboard e
  uma tela `CrudPage` (ex.: Clientes) em ambos os temas.
- Toggle de tema testado: persistência após reload, respeito ao
  `prefers-color-scheme` na primeira visita.
- `npm run build` para garantir que a migração para Tailwind instalado não
  quebra o build de produção.
- Checagem visual de contraste dos tokens de texto/fundo (seção 8).
- Teste manual com `prefers-reduced-motion` ativado no SO/browser.

## 10. Riscos e decisões assumidas

- Tokens de superfície escura são derivados (não publicados pelo VERT) —
  ajustáveis se o usuário achar o contraste de elevação errado na prática.
- Escala tipográfica de 11 degraus é uma interpolação razoável dentro do
  range 12–96px informado pelo VERT (a página não lista os valores exatos
  por trás da imagem `spacing.svg`/tabela de fontes).
- Páginas fora do escopo desta leva podem exibir combinações
  visuais inconsistentes em modo escuro até uma leva seguinte — está
  documentado na seção 2 e será sinalizado ao usuário no momento certo.
