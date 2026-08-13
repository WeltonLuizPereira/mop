# MOP Redesign (VERT Design System + Tema Claro/Escuro) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remodelar a identidade visual do MOP (Login, Sidebar, Header, Dashboard e componentes compartilhados) adotando os tokens do design system VERT Capital, com alternância funcional entre tema claro e escuro, linguagem Material 3 (superfícies tonais, elevação, forma, movimento) e uma ilustração de assinatura (arquipélago) grounded na metáfora do próprio produto ("Mapa Operacional" / "Ilhas").

**Architecture:** Migração do Tailwind CDN para Tailwind v4 instalado (`@tailwindcss/vite`, config CSS-first via `@theme`). Tokens de cor expostos como variáveis CSS "cruas" (`--bg`, `--surface`, `--brand`, etc.) redefinidas em `:root` (claro) e `.dark` (escuro); o `@theme` do Tailwind aponta para essas variáveis via indireção (`--color-bg: var(--bg)`), então **nenhuma classe `dark:` é necessária** nos componentes — trocar a classe `.dark` no `<html>` já repinta tudo. Um `ThemeContext` React controla o toggle e persiste em `localStorage`; um script inline no `<head>` aplica a classe antes do primeiro paint para evitar flash. Espaçamento e raio do VERT já batem exatamente com valores nativos do Tailwind (documentado na Task 1), então não são sobrescritos — só usados com o nome certo.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript (verificação via `tsc --noEmit`), lucide-react.

**Spec:** [docs/superpowers/specs/2026-08-13-mop-redesign-design.md](../specs/2026-08-13-mop-redesign-design.md)

## Global Constraints

- Não quebrar `App.tsx` em múltiplos arquivos existentes — os componentes tocados são restilizados no lugar onde já vivem. Apenas os módulos genuinamente novos (`contexts/ThemeContext.tsx`, `components/ArchipelagoIllustration.tsx`, `index.css`) entram como arquivos novos.
- Nenhuma classe `dark:` do Tailwind é usada — a troca de tema acontece via redefinição de variáveis CSS sob `.dark`, não via variant.
- Mapeamento de raio VERT → classe Tailwind nativa (nenhum override de `@theme` necessário, valores já coincidem): **None → `rounded-none`**, **SM (4px) → `rounded-sm`**, **MD (8px) → `rounded-lg`**, **LG (16px) → `rounded-2xl`**, **Pill/Circular → `rounded-full`**. Todo componente restilizado nesta leva segue essa tabela.
- Espaçamento VERT (2/4/8/12/16/24/32/40/48/64/80/96/160px) já é idêntico à escala padrão do Tailwind (`p-0.5`…`p-40`) — usar as classes de espaçamento padrão do Tailwind sem overrides.
- Toda cor de feedback tonal usa o modificador de opacidade nativo do Tailwind (`bg-success/15`, `bg-error/10`, etc.) em vez de tokens tonais duplicados.
- `--color-warning` (`#E6CF42`) nunca é usado como cor de texto sobre fundo claro — só como fundo tonal com `text-fg` por cima (contraste insuficiente como texto).
- Toda animação nova respeita `@media (prefers-reduced-motion: reduce)`.
- Idioma da interface continua pt-BR em todo texto visível.

---

## Estrutura de arquivos

| Arquivo | Ação |
|---|---|
| `package.json` | Modificar — adicionar `tailwindcss`, `@tailwindcss/vite` |
| `vite.config.ts` | Modificar — registrar plugin Tailwind |
| `index.html` | Modificar — remover CDN do Tailwind, adicionar fonte Lato, script inline anti-flash |
| `index.css` | Criar — tokens, sombras, animações, regras base |
| `contexts/ThemeContext.tsx` | Criar — `ThemeProvider` + hook `useTheme` |
| `components/ArchipelagoIllustration.tsx` | Criar — ilustração de assinatura (SVG inline) |
| `index.tsx` | Modificar — envolver `<App />` com `<ThemeProvider>` |
| `App.tsx` | Modificar — Button, Input, Select, Badge, MultiSelect, NavItem, Header, NotificationCenter, LoginPage, CrudPage, CollaboratorFormModal, Dashboard, shell do `App` |

---

### Task 1: Fundação — Tailwind v4, tokens de cor e animações compartilhadas

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Create: `index.css`

**Interfaces:**
- Produces: variáveis CSS `--bg`, `--surface`, `--surface-alt`, `--border`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`, `--brand`, `--brand-dark`, `--brand-tonal`, `--success`, `--warning`, `--error` (redefinidas em `:root` e `.dark`); utilitários Tailwind derivados `bg-bg`, `bg-surface`, `bg-surface-alt`, `border-border`, `border-border-strong`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `bg-primary`/`text-primary`/`border-primary`, `bg-primary-dark`, `bg-primary-tonal`/`text-primary-tonal`, `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-error`/`text-error`; utilitários de sombra `shadow-1`..`shadow-4`; classes de animação `.mop-node`, `.mop-fade-up`, `.mop-pop-in`; `font-sans` passa a resolver para Lato.

- [ ] **Step 1: Instalar dependências do Tailwind v4**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Registrar o plugin no Vite**

Em `vite.config.ts`, adicionar o import e registrar o plugin:

```ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    const now = new Date();
    const versionStr = `1.1.${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(versionStr),
        '__UPDATE_DATE__': JSON.stringify(dateStr)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

- [ ] **Step 3: Remover o Tailwind CDN do `index.html` e preparar o `<head>`**

Substituir todo o bloco (linhas 8–27 do arquivo original: o `<script src="https://cdn.tailwindcss.com">` e o `<script>` com `tailwind.config`) por nada — remover as duas tags `<script>` inteiras. O `index.html` completo fica:

```html

<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MOP - Mapa Operacional</title>
    <script>
      (function() {
        try {
          var stored = localStorage.getItem('mop-theme');
          var theme = stored === 'light' || stored === 'dark'
            ? stored
            : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          if (theme === 'dark') document.documentElement.classList.add('dark');
        } catch (e) {}
      })();
    </script>
  <script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "lucide-react": "https://esm.sh/lucide-react@^0.562.0",
    "xlsx": "https://esm.sh/xlsx@0.18.5",
    "jspdf": "https://esm.sh/jspdf@2.5.1",
    "jspdf-autotable": "https://esm.sh/jspdf-autotable@3.8.2",
    "recharts": "https://esm.sh/recharts@^3.6.0",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.39.3"
  }
}
</script>
<link rel="stylesheet" href="/index.css">
</head>
  <body class="antialiased">
    <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>
```

Note: o script inline anti-flash precisa da mesma chave de `localStorage` (`mop-theme`) que o `ThemeContext` da Task 2 vai usar — se um dia a chave mudar num lugar, muda no outro também.

- [ ] **Step 4: Criar `index.css` com tokens, sombras e animações**

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&display=swap');

@theme {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-alt: var(--surface-alt);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-primary: var(--brand);
  --color-primary-dark: var(--brand-dark);
  --color-primary-tonal: var(--brand-tonal);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);

  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.08), 0 1px 3px rgb(0 0 0 / 0.06);
  --shadow-2: 0 4px 8px rgb(0 0 0 / 0.10), 0 2px 4px rgb(0 0 0 / 0.06);
  --shadow-3: 0 8px 16px rgb(0 0 0 / 0.12), 0 4px 8px rgb(0 0 0 / 0.08);
  --shadow-4: 0 16px 32px rgb(0 0 0 / 0.16), 0 8px 16px rgb(0 0 0 / 0.10);

  --font-sans: 'Lato', ui-sans-serif, system-ui, sans-serif;
}

:root {
  --bg: #F4F4F4;
  --surface: #FFFFFF;
  --surface-alt: #EEEEEE;
  --border: #E0E0E0;
  --border-strong: #C7C7C7;
  --fg: #171919;
  --fg-muted: #4A4A4A;
  --fg-subtle: #AAAAAA;
  --brand: #00747A;
  --brand-dark: #033E3F;
  --brand-tonal: #E6F1F2;
  --success: #41D394;
  --warning: #E6CF42;
  --error: #F07363;
}

.dark {
  --bg: #171919;
  --surface: #202323;
  --surface-alt: #262929;
  --border: #333636;
  --border-strong: #4A4A4A;
  --fg: #FFFFFF;
  --fg-muted: #C7C7C7;
  --fg-subtle: #AAAAAA;
  --brand: #3DA5A5;
  --brand-dark: #245859;
  --brand-tonal: rgb(0 116 122 / 0.16);
  --success: #41D394;
  --warning: #E6CF42;
  --error: #F07363;
}

html, body {
  background-color: var(--bg);
  color: var(--fg);
}

* {
  transition: background-color 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out;
}

@keyframes mop-node-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.mop-node {
  transform-origin: center;
  transform-box: fill-box;
  animation: mop-node-pulse 2.4s ease-in-out infinite;
}

@keyframes mop-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.mop-fade-up {
  animation: mop-fade-up 420ms ease-out both;
}

@keyframes mop-pop-in {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.mop-pop-in {
  animation: mop-pop-in 180ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
  .mop-node, .mop-fade-up, .mop-pop-in {
    animation: none !important;
  }
}
```

Nota sobre tipografia: o VERT define uma escala de 11 degraus dentro de 12–96px, mas não publica os valores exatos (só uma imagem de tabela, ilegível via fetch). A escala padrão do Tailwind v4 (`text-xs`…`text-8xl`) já cobre 12/14/16/18/20/24/30/36/48/60/72/96px — 12 degraus dentro do mesmo intervalo — então não há override de `--text-*` nesta leva; usar as classes `text-*` padrão do Tailwind normalmente. Isso substitui a escala inventada na seção 4.3 do spec por uma decisão mais simples e igualmente fiel à intenção original (faixa 12–96px).

- [ ] **Step 5: Verificar que o build sobe sem erros**

Run: `npm run dev` (deixar rodando alguns segundos, checar terminal sem erro de PostCSS/Tailwind) e depois `Ctrl+C`.
Expected: nenhum erro no terminal; ao abrir `http://localhost:3000` no navegador a página carrega em branco/cinza claro (ainda sem os componentes retocados) sem exceptions no console relacionadas a CSS.

Run: `npm run build`
Expected: build termina com sucesso (exit code 0), gera `dist/`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts index.html index.css
git commit -m "feat(design): migrate to Tailwind v4 and add VERT token system"
```

---

### Task 2: ThemeContext (tema claro/escuro com persistência)

**Files:**
- Create: `contexts/ThemeContext.tsx`
- Modify: `index.tsx`

**Interfaces:**
- Consumes: nada (módulo raiz de tema).
- Produces: `ThemeProvider` (componente), `useTheme(): { theme: 'light' | 'dark', toggleTheme: () => void }` — usado pela Task 8 (`ThemeToggle` no Header).

- [ ] **Step 1: Criar `contexts/ThemeContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'mop-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Envolver `<App />` com `<ThemeProvider>` em `index.tsx`**

Old:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
```
New:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
```

Old:
```tsx
root.render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>
);
```
New:
```tsx
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`, abrir `http://localhost:3000` no navegador.
No devtools console, rodar `localStorage.setItem('mop-theme', 'dark')` e recarregar a página (F5).
Expected: a tag `<html>` passa a ter `class="dark"` (inspecionar no Elements/Inspector) já no primeiro paint, sem flash de tema claro.
Rodar `localStorage.removeItem('mop-theme')`, recarregar, e alternar a preferência de cor do SO/navegador (ex.: DevTools → Rendering → "Emulate CSS prefers-color-scheme").
Expected: `<html>` reflete a preferência do sistema quando não há escolha salva.

- [ ] **Step 4: Commit**

```bash
git add contexts/ThemeContext.tsx index.tsx
git commit -m "feat(design): add ThemeProvider with persisted light/dark toggle"
```

---

### Task 3: Ilustração de assinatura — arquipélago vetorial

**Files:**
- Create: `components/ArchipelagoIllustration.tsx`

**Interfaces:**
- Consumes: variáveis CSS `--brand`, `--brand-tonal`, `--border-strong` (Task 1).
- Produces: `ArchipelagoIllustration({ variant?: 'hero' | 'empty', className?: string })` — usado pela Task 9 (Login) e Task 10 (estado vazio do CrudPage).

- [ ] **Step 1: Criar o componente**

```tsx
import React from 'react';

interface ArchipelagoIllustrationProps {
  variant?: 'hero' | 'empty';
  className?: string;
}

const islands = [
  { path: 'M60,170 C60,120 100,90 140,95 C185,100 200,140 180,175 C160,210 110,215 80,195 C65,185 60,180 60,170 Z' },
  { path: 'M235,95 C230,65 260,45 290,50 C320,55 330,80 315,100 C300,120 265,120 245,110 C238,106 236,101 235,95 Z' },
  { path: 'M290,215 C288,195 305,180 325,182 C345,184 355,200 348,215 C341,230 315,233 300,225 C294,222 291,219 290,215 Z' },
];

const nodes = [
  { cx: 120, cy: 150 },
  { cx: 270, cy: 80 },
  { cx: 320, cy: 200 },
  { cx: 195, cy: 130 },
];

export const ArchipelagoIllustration = ({ variant = 'hero', className = '' }: ArchipelagoIllustrationProps) => {
  const size = variant === 'hero' ? 'w-full max-w-md' : 'w-40';

  return (
    <svg
      viewBox="0 0 400 300"
      className={`${size} ${className}`}
      role="img"
      aria-label="Mapa ilustrado de ilhas conectadas"
    >
      <line x1="120" y1="150" x2="270" y2="80" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      <line x1="270" y1="80" x2="320" y2="200" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />
      <line x1="120" y1="150" x2="320" y2="200" style={{ stroke: 'var(--border-strong)' }} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" />

      {islands.map((island, i) => (
        <path key={i} d={island.path} style={{ fill: 'var(--brand-tonal)', stroke: 'var(--brand)' }} strokeWidth={2} />
      ))}

      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.cx}
          cy={node.cy}
          r={6}
          className="mop-node"
          style={{ fill: 'var(--brand)', animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
};
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum novo erro relacionado a `components/ArchipelagoIllustration.tsx` (o arquivo ainda não é importado em nenhum lugar, então isso só confirma que o próprio arquivo compila).

- [ ] **Step 3: Commit**

```bash
git add components/ArchipelagoIllustration.tsx
git commit -m "feat(design): add archipelago signature illustration component"
```

---

### Task 4: Restilizar Button, Input, Select

**Files:**
- Modify: `App.tsx:33-69`

**Interfaces:**
- Consumes: tokens da Task 1 (`bg-primary`, `text-fg-muted`, etc.), variantes existentes (`primary`, `secondary`, `danger`, `solid-danger`, `ghost`) — assinatura de props não muda.
- Produces: mesmas assinaturas `Button`, `Input`, `Select` já usadas por dezenas de call sites em todo `App.tsx` — nenhuma delas precisa mudar.

- [ ] **Step 1: Restilizar `Button` (App.tsx:33-47)**

Old:
```tsx
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm";
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    "solid-danger": "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-gray-500 hover:text-gray-900"
  };
  return (
    <button type="button" className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
```
New:
```tsx
const Button = ({ children, onClick, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-bold transition-colors duration-200 flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-primary-tonal text-primary hover:bg-primary/20",
    danger: "bg-error/10 text-error hover:bg-error/20 border border-error/30",
    "solid-danger": "bg-error text-white hover:opacity-90 shadow-1 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-fg-muted hover:text-fg hover:bg-surface-alt"
  };
  return (
    <button type="button" className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
```

- [ ] **Step 2: Restilizar `Input` (App.tsx:49-57)**

Old:
```tsx
const Input = ({ label, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
      {...props} 
    />
  </div>
);
```
New:
```tsx
const Input = ({ label, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</label>}
    <input 
      className={`w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-fg ${className}`}
      {...props} 
    />
  </div>
);
```

- [ ] **Step 3: Restilizar `Select` (App.tsx:59-69)**

Old:
```tsx
const Select = ({ label, children, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
    <select 
      className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);
```
New:
```tsx
const Select = ({ label, children, className = '', ...props }: any) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{label}</label>}
    <select 
      className={`w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-fg ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);
```

- [ ] **Step 4: Verificar tipos e visual**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, abrir a tela de Login (única tela alcançável sem dados de usuário ainda restilizada de ponta a ponta — os campos já devem mostrar o novo estilo "filled").
Expected: os inputs de Matrícula/Senha têm fundo cinza claro sólido (sem borda visível em repouso) e ganham anel verde-azulado ao focar; o botão "Entrar na Plataforma" é um retângulo teal sólido com cantos de 8px.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle Button, Input and Select with VERT tokens"
```

---

### Task 5: Restilizar Badge (chips de status)

**Files:**
- Modify: `App.tsx:71-85`

**Interfaces:**
- Consumes: tokens `--success`, `--warning`, `--error`, `--surface-alt`, `--fg-muted`, `--border-strong` (Task 1).
- Produces: mesma assinatura `Badge({ status: string })`.

- [ ] **Step 1: Restilizar `Badge`**

Old:
```tsx
const Badge = ({ status }: { status: string }) => {
  let color = 'bg-gray-100 text-gray-600';
  if (status === 'ATIVO' || status === 'SIM' || status === 'APROVADO') color = 'bg-green-100 text-green-700';
  if (status === 'DESLIGADO' || status === 'INATIVO' || status === 'REJEITADO' || status === 'NÃO') color = 'bg-red-100 text-red-700';
  if (status === 'FÉRIAS' || status === 'PENDENTE') color = 'bg-yellow-100 text-yellow-700';
  if (status === 'AVISO PRÉVIO') color = 'bg-orange-100 text-orange-700';
  if (status === 'AFASTADO') color = 'bg-red-50 text-red-600 border border-red-200';
  if (status === 'LICENÇA MATERNIDADE') color = 'bg-pink-100 text-pink-700';
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {status}
    </span>
  );
};
```
New:
```tsx
const Badge = ({ status }: { status: string }) => {
  let color = 'bg-surface-alt text-fg-muted';
  if (status === 'ATIVO' || status === 'SIM' || status === 'APROVADO') color = 'bg-success/15 text-success';
  if (status === 'DESLIGADO' || status === 'INATIVO' || status === 'REJEITADO' || status === 'NÃO') color = 'bg-error/15 text-error';
  if (status === 'FÉRIAS' || status === 'PENDENTE') color = 'bg-warning/20 text-fg';
  if (status === 'AVISO PRÉVIO') color = 'bg-warning/30 text-fg border border-warning/50';
  if (status === 'AFASTADO') color = 'bg-error/10 text-error border border-error/30';
  if (status === 'LICENÇA MATERNIDADE') color = 'bg-surface-alt text-fg-muted border border-border-strong';
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {status}
    </span>
  );
};
```

Nota: `FÉRIAS`/`AVISO PRÉVIO` usam `text-fg` (não `text-warning`) por cima do fundo amarelo tonal — o amarelo do VERT (`#E6CF42`) não tem contraste suficiente como cor de texto (ver seção 8 do spec).

- [ ] **Step 2: Verificar visualmente**

Run: `npm run dev`, navegar (após login) até qualquer tela que already usa `Badge` visível pelas telas em escopo — como a lista de Clientes/Ilhas (usa `CrudPage`, que ainda será restilizado na Task 10, mas o `Badge` em si já reflete o novo estilo mesmo antes da Task 10, já que é um componente próprio).
Expected: badges "ATIVO" aparecem verdes, "INATIVO" vermelhos, sem depender do tema (funcionam em claro e escuro pois usam os tokens).

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle status Badge with VERT feedback tokens"
```

---

### Task 6: Restilizar MultiSelect

**Files:**
- Modify: `App.tsx:87-193`

**Interfaces:**
- Consumes: tokens da Task 1, classe `.mop-pop-in` (Task 1).
- Produces: mesma assinatura `MultiSelect({ label, options, value, onChange })`.

- [ ] **Step 1: Restilizar o botão-gatilho e o label (App.tsx:132-142)**

Old:
```tsx
  return (
    <div className="relative group" ref={containerRef}>
      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 bg-gray-50 border rounded-lg text-xs focus:ring-1 focus:ring-brand-500 flex justify-between items-center h-[34px] transition-all ${isOpen ? 'border-brand-500 ring-1 ring-brand-500 bg-white' : 'border-gray-200 hover:bg-gray-100'}`}
      >
        <span className="truncate block max-w-[90%] text-gray-700 font-medium">{displayText}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
```
New:
```tsx
  return (
    <div className="relative group" ref={containerRef}>
      <label className="text-[10px] font-bold text-fg-muted uppercase mb-1 block">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 bg-surface-alt border rounded-lg text-xs focus:ring-1 focus:ring-primary flex justify-between items-center h-[34px] transition-colors ${isOpen ? 'border-primary ring-1 ring-primary bg-surface' : 'border-transparent hover:bg-border/30'}`}
      >
        <span className="truncate block max-w-[90%] text-fg font-medium">{displayText}</span>
        <ChevronDown size={14} className={`text-fg-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
```

- [ ] **Step 2: Restilizar o painel dropdown (App.tsx:144-190)**

Old:
```tsx
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
           <div className="p-2 border-b border-gray-100">
               <input
                   type="text"
                   placeholder="Buscar..."
                   className="w-full px-2 py-1.5 border border-brand-500 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
               />
               <div className="flex justify-between items-center mt-2 px-1">
                   <div 
                       className="flex items-center gap-2 cursor-pointer group/select"
                       onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                   >
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.length === filteredOptions.length && filteredOptions.length > 0 ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'}`}>
                           {value.length === filteredOptions.length && filteredOptions.length > 0 && <Check size={10} className="text-white" />}
                       </div>
                       <span className="text-xs text-brand-600 font-medium group-hover/select:underline">Selecionar todos</span>
                   </div>
                   <span 
                       className="text-[10px] uppercase font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                       onClick={(e) => { e.stopPropagation(); clearAll(); }}
                   >
                       Limpar
                   </span>
               </div>
           </div>
           <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                    <div key={opt.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'}`} onClick={() => toggleOption(opt.value)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </div>
                 )})
              ) : (
                <div className="px-3 py-3 text-center text-xs text-gray-400">Nenhum resultado</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
```
New:
```tsx
      {isOpen && (
        <div className="mop-pop-in absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded-lg shadow-2 z-50 flex flex-col min-w-[200px]">
           <div className="p-2 border-b border-border">
               <input
                   type="text"
                   placeholder="Buscar..."
                   className="w-full px-2 py-1.5 bg-surface text-fg border border-primary rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
               />
               <div className="flex justify-between items-center mt-2 px-1">
                   <div 
                       className="flex items-center gap-2 cursor-pointer group/select"
                       onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                   >
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.length === filteredOptions.length && filteredOptions.length > 0 ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                           {value.length === filteredOptions.length && filteredOptions.length > 0 && <Check size={10} className="text-white" />}
                       </div>
                       <span className="text-xs text-primary font-medium group-hover/select:underline">Selecionar todos</span>
                   </div>
                   <span 
                       className="text-[10px] uppercase font-bold text-fg-subtle cursor-pointer hover:text-fg transition-colors"
                       onClick={(e) => { e.stopPropagation(); clearAll(); }}
                   >
                       Limpar
                   </span>
               </div>
           </div>
           <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                    <div key={opt.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary-tonal text-primary' : 'hover:bg-surface-alt text-fg'}`} onClick={() => toggleOption(opt.value)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </div>
                 )})
              ) : (
                <div className="px-3 py-3 text-center text-xs text-fg-subtle">Nenhum resultado</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle MultiSelect with VERT tokens"
```

---

### Task 7: Restilizar NavItem e o shell da Sidebar

**Files:**
- Modify: `App.tsx:195-206` (`NavItem`)
- Modify: `App.tsx:5327-5419` (bloco `<aside>` dentro de `App`)

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: mesma assinatura `NavItem({ icon, label, active, onClick })`.

- [ ] **Step 1: Restilizar `NavItem` (App.tsx:195-206)**

Old:
```tsx
const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
      active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon size={18} className={active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'} />
    {label}
  </button>
);
```
New:
```tsx
const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active ? 'bg-primary-tonal text-primary' : 'text-fg-muted hover:bg-surface-alt hover:text-fg'
    }`}
  >
    <Icon size={18} className={active ? 'text-primary' : 'text-fg-subtle group-hover:text-fg-muted'} />
    {label}
  </button>
);
```

- [ ] **Step 2: Restilizar o cabeçalho de marca da sidebar (App.tsx:5327-5331)**

Old:
```tsx
       <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">M</div>
             <span className="font-bold text-lg tracking-tight">MOP System</span>
          </div>
```
New:
```tsx
       <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-10">
          <div className="h-16 flex items-center px-6 border-b border-border">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold mr-3">M</div>
             <span className="font-bold text-lg tracking-tight text-fg">MOP System</span>
          </div>
```

- [ ] **Step 3: Restilizar os rótulos de seção da navegação (App.tsx:5334-5403)**

Trocar, em cada uma das 7 ocorrências, a classe do `<p>` de rótulo de seção:

Old (repetida 7×, uma por seção — "Principal", "Gestão", "RH", "Cadastros", "Administração", "Sistema", "Ajuda"):
```tsx
                   <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
```
New (mesma troca nas 7 ocorrências):
```tsx
                   <p className="px-3 text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">
```

- [ ] **Step 4: Restilizar o rodapé de usuário/logout da sidebar (App.tsx:5405-5418)**

Old:
```tsx
          <div className="p-4 border-t border-gray-100 bg-gray-50">
             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                     {currentUser.nome.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-900 truncate">{currentUser.nome}</p>
                     <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors">
                 <LogOut size={14} /> Sair
             </button>
          </div>
       </aside>
```
New:
```tsx
          <div className="p-4 border-t border-border bg-surface-alt">
             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-1">
                     {currentUser.nome.charAt(0)}
                 </div>
                 <div className="flex-1 overflow-hidden">
                     <p className="text-xs font-bold text-fg truncate">{currentUser.nome}</p>
                     <p className="text-[10px] text-fg-muted truncate">{currentUser.email}</p>
                 </div>
             </div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">
                 <LogOut size={14} /> Sair
             </button>
          </div>
       </aside>
```

- [ ] **Step 5: Verificar visualmente**

Run: `npm run dev`, fazer login (usar credenciais existentes no `mockDb`/Supabase configurado) e observar a sidebar.
Expected: fundo branco (claro) ou cinza-escuro (`.dark` via toggle manual no devtools, já que o botão de tema só chega na Task 8), item ativo com fundo verde-azulado suave e texto teal, rótulos de seção em versalete cinza.

- [ ] **Step 6: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle NavItem and sidebar shell with VERT tokens"
```

---

### Task 8: Restilizar Header, adicionar ThemeToggle, restilizar NotificationCenter

**Files:**
- Modify: `App.tsx:1-13` (imports)
- Modify: `App.tsx:207-401` (`NotificationCenter`, `Header`)

**Interfaces:**
- Consumes: `useTheme` de `./contexts/ThemeContext` (Task 2), tokens da Task 1, classe `.mop-pop-in` (Task 1).
- Produces: novo componente `ThemeToggle` (sem props) usado dentro de `Header`; assinatura de `Header` e `NotificationCenter` não muda.

- [ ] **Step 1: Adicionar o ícone `Moon` e o import do `useTheme` (App.tsx:4-20)**

Old:
```tsx
import { 
  LayoutDashboard, Users, UserCog, Building2, Globe, MapPin, Briefcase, 
  LogOut, Menu, X, Plus, Edit2, ChevronLeft, ChevronRight, ChevronDown, Search, Phone,
  ShieldCheck, Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle,
  Bell, Info, AlertTriangle, Gift, ArrowUpRight, ArrowDownRight, Eye,
  FileDown, Filter, CalendarDays, Wallet, Sun, Calendar as CalendarIcon, Clock, History, FileText, Check, XCircle, Lightbulb, Save,
  User as UserIcon, Cake, Mail, Hash, BriefcaseBusiness, CalendarClock, UserPlus, Loader2, ArrowLeft, Activity, File,
  TrendingUp, TrendingDown, MoreHorizontal, BarChart3, PieChart, Timer, UserMinus, LineChart, ListChecks, Calendar, Network, Maximize, AlignJustify, GanttChartSquare,
  MousePointer2, Hand, Stethoscope, UserX, Key, HelpCircle
} from 'lucide-react';
```
New:
```tsx
import { 
  LayoutDashboard, Users, UserCog, Building2, Globe, MapPin, Briefcase, 
  LogOut, Menu, X, Plus, Edit2, ChevronLeft, ChevronRight, ChevronDown, Search, Phone,
  ShieldCheck, Upload, FileSpreadsheet, Trash2, CheckCircle, AlertCircle,
  Bell, Info, AlertTriangle, Gift, ArrowUpRight, ArrowDownRight, Eye,
  FileDown, Filter, CalendarDays, Wallet, Sun, Moon, Calendar as CalendarIcon, Clock, History, FileText, Check, XCircle, Lightbulb, Save,
  User as UserIcon, Cake, Mail, Hash, BriefcaseBusiness, CalendarClock, UserPlus, Loader2, ArrowLeft, Activity, File,
  TrendingUp, TrendingDown, MoreHorizontal, BarChart3, PieChart, Timer, UserMinus, LineChart, ListChecks, Calendar, Network, Maximize, AlignJustify, GanttChartSquare,
  MousePointer2, Hand, Stethoscope, UserX, Key, HelpCircle
} from 'lucide-react';
```

E logo abaixo do import de `./services/mockDb` (App.tsx:21), adicionar:

Old:
```tsx
import { db } from './services/mockDb';
```
New:
```tsx
import { db } from './services/mockDb';
import { useTheme } from './contexts/ThemeContext';
```

- [ ] **Step 2: Restilizar `NotificationCenter` (App.tsx:277-374, o `return`)**

Old:
```tsx
    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="relative p-2 rounded-full text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
                <Bell size={20} />
                {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Central de Notificações</h3>
                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">Hoje</span>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {(notifications.birthdays.length > 0 || notifications.expiring.length > 0 || notifications.avisoEnding.length > 0) && (
                            <div className="p-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Atenção Hoje</p>
                                
                                {notifications.avisoEnding.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors bg-orange-50/50">
                                        <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                            <UserMinus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Aviso Prévio Finalizando</p>
                                            <p className="text-xs text-gray-500">Último dia de <span className="font-semibold">{c.nome}</span>.</p>
                                            <p className="text-[10px] text-orange-600 font-medium mt-1">Realizar desligamento no sistema.</p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.birthdays.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Aniversariante do Dia!</p>
                                            <p className="text-xs text-gray-500">Parabéns para <span className="font-semibold">{c.nome}</span></p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.expiring.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors bg-red-50/50">
                                        <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Contrato Vencendo Hoje</p>
                                            <p className="text-xs text-gray-500">{c.nome} completa o período de experiência.</p>
                                            <p className="text-[10px] text-red-600 font-medium mt-1">Ação necessária no sistema.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {notifications.birthdays.length === 0 && notifications.expiring.length === 0 && notifications.avisoEnding.length === 0 && (
                            <div className="p-6 text-center text-gray-400">
                                <CheckCircle className="mx-auto mb-2 text-gray-300" size={24} />
                                <p className="text-xs">Nenhuma pendência urgente para hoje.</p>
                            </div>
                        )}

                        <div className="w-full h-px bg-gray-100 my-1"></div>

                        <div className="p-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Últimas Atualizações</p>
                            {notifications.recentHistory.map(log => (
                                <div key={log.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 
                                        ${log.type === 'create' ? 'bg-green-500' : 
                                          log.type === 'delete' ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    />
                                    <div>
                                        <p className="text-xs text-gray-800 leading-tight">
                                            <span className="font-bold">{log.user}</span> {log.action.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">{log.target} • {log.date.split(' ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                             {notifications.recentHistory.length === 0 && (
                                <p className="text-xs text-gray-400 p-3 text-center">Nenhum histórico recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
```
New:
```tsx
    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="relative p-2 rounded-full text-fg-muted hover:text-primary hover:bg-primary-tonal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Bell size={20} />
                {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
                )}
            </button>

            {isOpen && (
                <div className="mop-pop-in absolute right-0 mt-4 w-80 sm:w-96 bg-surface rounded-2xl shadow-3 border border-border z-50 overflow-hidden">
                    <div className="p-4 border-b border-border bg-surface-alt flex justify-between items-center">
                        <h3 className="font-bold text-fg text-sm">Central de Notificações</h3>
                        <span className="text-xs bg-primary-tonal text-primary px-2 py-0.5 rounded-full font-bold">Hoje</span>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {(notifications.birthdays.length > 0 || notifications.expiring.length > 0 || notifications.avisoEnding.length > 0) && (
                            <div className="p-2">
                                <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider px-2 py-1">Atenção Hoje</p>
                                
                                {notifications.avisoEnding.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors bg-warning/10">
                                        <div className="bg-warning/20 text-fg p-2 rounded-lg">
                                            <UserMinus size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Aviso Prévio Finalizando</p>
                                            <p className="text-xs text-fg-muted">Último dia de <span className="font-semibold">{c.nome}</span>.</p>
                                            <p className="text-[10px] text-warning font-medium mt-1">Realizar desligamento no sistema.</p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.birthdays.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors">
                                        <div className="bg-primary-tonal text-primary p-2 rounded-lg">
                                            <Gift size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Aniversariante do Dia!</p>
                                            <p className="text-xs text-fg-muted">Parabéns para <span className="font-semibold">{c.nome}</span></p>
                                        </div>
                                    </div>
                                ))}

                                {notifications.expiring.map(c => (
                                    <div key={c.matricula} className="flex items-start gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors bg-error/10">
                                        <div className="bg-error/15 text-error p-2 rounded-lg">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-fg">Contrato Vencendo Hoje</p>
                                            <p className="text-xs text-fg-muted">{c.nome} completa o período de experiência.</p>
                                            <p className="text-[10px] text-error font-medium mt-1">Ação necessária no sistema.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {notifications.birthdays.length === 0 && notifications.expiring.length === 0 && notifications.avisoEnding.length === 0 && (
                            <div className="p-6 text-center text-fg-subtle">
                                <CheckCircle className="mx-auto mb-2 text-fg-subtle" size={24} />
                                <p className="text-xs">Nenhuma pendência urgente para hoje.</p>
                            </div>
                        )}

                        <div className="w-full h-px bg-border my-1"></div>

                        <div className="p-2">
                            <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider px-2 py-1">Últimas Atualizações</p>
                            {notifications.recentHistory.map(log => (
                                <div key={log.id} className="flex gap-3 p-3 hover:bg-surface-alt rounded-lg transition-colors">
                                    <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 
                                        ${log.type === 'create' ? 'bg-success' : 
                                          log.type === 'delete' ? 'bg-error' : 'bg-primary'}`} 
                                    />
                                    <div>
                                        <p className="text-xs text-fg leading-tight">
                                            <span className="font-bold">{log.user}</span> {log.action.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-fg-muted mt-1">{log.target} • {log.date.split(' ')[1]}</p>
                                    </div>
                                </div>
                            ))}
                             {notifications.recentHistory.length === 0 && (
                                <p className="text-xs text-fg-subtle p-3 text-center">Nenhum histórico recente.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
```

- [ ] **Step 3: Adicionar `ThemeToggle` e restilizar `Header` (App.tsx:377-401)**

Old:
```tsx
const Header = ({ title, user, children }: { title: string, user: User, children?: React.ReactNode }) => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
                <h1 className="text-lg font-bold text-gray-900 capitalize leading-none">{title}</h1>
                <p className="text-xs text-gray-500 capitalize mt-1">{today}</p>
            </div>
            
            <div className="flex items-center gap-6">
                {children}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{user.nome.split(' ')[0]} {user.nome.split(' ').pop()}</p>
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">{user.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-brand-100 border-2 border-white shadow-sm text-brand-700 flex items-center justify-center font-bold text-sm">
                        {user.nome.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};
```
New:
```tsx
const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-pressed={isDark}
            className="p-2 rounded-full text-fg-muted hover:text-primary hover:bg-primary-tonal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

const Header = ({ title, user, children }: { title: string, user: User, children?: React.ReactNode }) => {
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <header className="bg-surface border-b border-border h-16 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div>
                <h1 className="text-lg font-bold text-fg capitalize leading-none">{title}</h1>
                <p className="text-xs text-fg-muted capitalize mt-1">{today}</p>
            </div>
            
            <div className="flex items-center gap-6">
                <ThemeToggle />
                {children}
                <div className="flex items-center gap-3 pl-6 border-l border-border">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-fg leading-tight">{user.nome.split(' ')[0]} {user.nome.split(' ').pop()}</p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wide">{user.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary-tonal border-2 border-surface shadow-1 text-primary flex items-center justify-center font-bold text-sm">
                        {user.nome.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};
```

- [ ] **Step 4: Verificar tipos e comportamento do toggle**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, login, clicar no ícone de sol/lua no header.
Expected: o app inteiro (fundo, textos, bordas, sidebar) troca de claro para escuro suavemente (~200ms) sem recarregar a página; recarregar a página (F5) mantém o tema escolhido; o ícone mostra lua quando está no claro (convite para escurecer) e sol quando está no escuro (convite para clarear).

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat(design): add theme toggle and restyle Header/NotificationCenter"
```

---

### Task 9: Restilizar LoginPage com a ilustração de assinatura

**Files:**
- Modify: `App.tsx:1516-1550`

**Interfaces:**
- Consumes: `ArchipelagoIllustration` (Task 3), tokens e `.mop-fade-up` (Task 1).
- Produces: mesma assinatura `LoginPage({ onLogin })`.

- [ ] **Step 1: Importar a ilustração**

Adicionar junto aos outros imports locais no topo do `App.tsx` (perto de `import { db } from './services/mockDb';`):

Old:
```tsx
import { db } from './services/mockDb';
import { useTheme } from './contexts/ThemeContext';
```
New:
```tsx
import { db } from './services/mockDb';
import { useTheme } from './contexts/ThemeContext';
import { ArchipelagoIllustration } from './components/ArchipelagoIllustration';
```

- [ ] **Step 2: Restilizar `LoginPage`**

Old:
```tsx
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
               <div className="w-12 h-12 bg-brand-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">M</div>
               <h1 className="text-2xl font-bold text-gray-900">Bem-vindo</h1>
               <p className="text-gray-500 text-sm">Entre com suas credenciais para acessar.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Matrícula" value={matricula} onChange={(e: any) => setMatricula(e.target.value)} placeholder="Ex: 3924" />
              <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••" />
              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
              <Button className="w-full justify-center py-3" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}</Button>
            </form>
            <p className="mt-6 text-center text-xs text-gray-400">© 2026 MOP System v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</p>
          </div>
        </div>
    );
};
```
New:
```tsx
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg p-4">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-surface rounded-2xl shadow-3 overflow-hidden">
            <div className="hidden md:flex flex-col items-center justify-center gap-6 bg-primary-tonal p-10 mop-fade-up">
              <ArchipelagoIllustration variant="hero" />
              <div className="text-center">
                <h2 className="text-3xl font-black text-primary tracking-tight">Mapa Operacional</h2>
                <p className="text-fg-muted text-sm mt-1">Visão completa das suas ilhas de operação.</p>
              </div>
            </div>

            <div className="p-8 md:p-10 flex flex-col justify-center mop-fade-up" style={{ animationDelay: '120ms' }}>
              <div className="text-center md:text-left mb-8">
                 <h1 className="text-2xl font-bold text-fg">Bem-vindo</h1>
                 <p className="text-fg-muted text-sm">Entre com suas credenciais para acessar.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Matrícula" value={matricula} onChange={(e: any) => setMatricula(e.target.value)} placeholder="Ex: 3924" />
                <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••" />
                {error && <div className="text-error text-sm text-center bg-error/10 p-2 rounded-lg">{error}</div>}
                <Button className="w-full justify-center py-3" type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Entrar na Plataforma'}</Button>
              </form>
              <p className="mt-6 text-center md:text-left text-xs text-fg-subtle">© 2026 MOP System v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1'}</p>
            </div>
          </div>
        </div>
    );
};
```

Nota: o pequeno logomark quadrado "M" que existia dentro do cartão foi substituído pelo painel com a ilustração + wordmark "Mapa Operacional" — a ilustração já cumpre o papel de assinatura visual, então manter os dois seria redundante.

- [ ] **Step 3: Verificar tipos e visual**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, deslogar (ou abrir em aba anônima) para ver a tela de Login.
Expected: em telas ≥768px, painel esquerdo teal-claro com o arquipélago (nós pulsando suavemente) e o wordmark; painel direito com o formulário; em telas menores, só o formulário aparece (painel de ilustração oculto via `hidden md:flex`). Ambos os painéis entram com um leve fade+subida, o formulário levemente atrasado.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle LoginPage with archipelago signature illustration"
```

---

### Task 10: Restilizar CrudPage (tabela, busca, modais, estado vazio)

**Files:**
- Modify: `App.tsx:1389-1513` (o `return` de `CrudPage`)

**Interfaces:**
- Consumes: `ArchipelagoIllustration` (Task 3, variant `"empty"`), tokens, `.mop-fade-up`, `.mop-pop-in` (Task 1).
- Produces: mesma assinatura genérica `CrudPage<T>(...)` — usada por Coordenadores, Supervisores, Clientes, Operações, Ilhas e Usuários sem mudança de props.

- [ ] **Step 1: Substituir o `return` completo de `CrudPage`**

Old:
```tsx
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* ... CRUD UI ... */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                {isAdmin && <Button onClick={handleCreate}><Plus size={16} /> Novo</Button>}
            </div>
            {/* Table ... */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input className="pl-9 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500" placeholder={`Buscar ${title}...`} value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (<th key={s.key} className="p-4">{s.label}</th>))}
                        {isAdmin && <th className="p-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-medium text-gray-900">{item.nome}</td>
                          <td className="p-4"><Badge status={item.status} /></td>
                          {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => { 
    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
    const selectedOpt = opts?.find(o => o.value === (item as any)[s.key]); 
    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>; 
})}
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="text-brand-600 hover:text-brand-800 p-1 bg-brand-50 rounded"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-gray-400">Nenhum registro encontrado</td></tr>}
                    </tbody>
                  </table>
                </div>
            </div>
            {/* Modal ... */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
                      <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {schema.map(field => {
                        const opts = typeof field.options === 'function' ? field.options(currentItem) : field.options;
                        return (
                        <div key={field.key} className={field.type === 'multiselect' ? 'col-span-1 md:col-span-2' : ''}>
                          {field.type === 'text' && <Input label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})} required={field.key !== 'logo'} />}
                          {field.type === 'select' && <Select label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => {
                                const newVal = e.target.value;
                                // se mudar cliente, limpa operacao.
                                if (field.key === 'clientId') {
                                    setCurrentItem({...currentItem, clientId: newVal, operationId: ''});
                                } else {
                                    setCurrentItem({...currentItem, [field.key]: newVal});
                                }
                          }} required><option value="">Selecione...</option>{opts?.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</Select>}
                          {field.type === 'multiselect' && (
                              <div className="mb-4">
                                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{field.label}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                                      {opts?.map((opt: any) => {
                                          const isSelected = (currentItem[field.key] || []).includes(opt.value);
                                          return (
                                              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={isSelected}
                                                      onChange={(e) => {
                                                          const curr = currentItem[field.key] || [];
                                                          if (e.target.checked) {
                                                              setCurrentItem({...currentItem, [field.key]: [...curr, opt.value]});
                                                          } else {
                                                              setCurrentItem({...currentItem, [field.key]: curr.filter(v => v !== opt.value)});
                                                          }
                                                      }}
                                                      className="rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                                                  />
                                                  {opt.label}
                                              </label>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                        </div>
                      );
                      })}
                       </div>
                      <div className="mt-2 pt-4 border-t border-gray-100">
                        <Select label="Status" value={currentItem.status || EntityStatus.ACTIVE} onChange={(e: any) => setCurrentItem({...currentItem, status: e.target.value})}><option value={EntityStatus.ACTIVE}>Ativo</option><option value={EntityStatus.INACTIVE}>Inativo</option></Select>
                      </div>
                      <div className="mt-4 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
            {/* Delete Modal ... */}
            {isDeleteOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                       <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir {title.slice(0, -1)}?</h3>
                       <p className="text-gray-500 text-sm mb-6">Tem certeza que deseja remover <b>{itemToDelete.nome}</b>?</p>
                       <div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button></div>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};
```
New:
```tsx
    return (
        <div className="space-y-4 mop-fade-up">
            {/* ... CRUD UI ... */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-fg">{title}</h2>
                {isAdmin && <Button onClick={handleCreate}><Plus size={16} /> Novo</Button>}
            </div>
            {/* Table ... */}
            <div className="bg-surface rounded-2xl shadow-1 border border-border overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="p-4 border-b border-border flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" size={16} />
                    <input className="pl-9 w-full px-3 py-2 bg-surface-alt border border-transparent rounded-lg text-sm text-fg focus:ring-2 focus:ring-primary outline-none transition-colors" placeholder={`Buscar ${title}...`} value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-fg-muted">
                    <thead className="bg-surface-alt text-fg-muted font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="p-4">Nome</th>
                        <th className="p-4">Status</th>
                        {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => (<th key={s.key} className="p-4">{s.label}</th>))}
                        {isAdmin && <th className="p-4 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-alt transition-colors">
                          <td className="p-4 font-medium text-fg">{item.nome}</td>
                          <td className="p-4"><Badge status={item.status} /></td>
                          {schema.filter(s => s.key !== 'nome' && s.key !== 'status' && s.type === 'select').map(s => { 
    const opts = typeof s.options === 'function' ? s.options(item) : s.options;
    const selectedOpt = opts?.find(o => o.value === (item as any)[s.key]); 
    return <td key={s.key} className="p-4">{selectedOpt?.label || '-'}</td>; 
})}
                          {isAdmin && (<td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(item)} className="text-primary hover:text-primary-dark p-1.5 bg-primary-tonal rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDeleteRequest(item)} className="text-error hover:opacity-80 p-1.5 bg-error/10 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>)}
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={10} className="p-10">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <ArchipelagoIllustration variant="empty" />
                            <p className="text-fg-subtle text-sm">Nenhum registro encontrado</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            {/* Modal ... */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="mop-pop-in bg-surface rounded-2xl shadow-3 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="bg-surface-alt p-4 border-b border-border flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg text-fg">{currentItem.id ? 'Editar' : 'Novo'} {title}</h3>
                      <button type="button" onClick={() => setIsOpen(false)} className="text-fg-subtle hover:text-fg"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {schema.map(field => {
                        const opts = typeof field.options === 'function' ? field.options(currentItem) : field.options;
                        return (
                        <div key={field.key} className={field.type === 'multiselect' ? 'col-span-1 md:col-span-2' : ''}>
                          {field.type === 'text' && <Input label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => setCurrentItem({...currentItem, [field.key]: e.target.value})} required={field.key !== 'logo'} />}
                          {field.type === 'select' && <Select label={field.label} value={currentItem[field.key] || ''} onChange={(e: any) => {
                                const newVal = e.target.value;
                                // se mudar cliente, limpa operacao.
                                if (field.key === 'clientId') {
                                    setCurrentItem({...currentItem, clientId: newVal, operationId: ''});
                                } else {
                                    setCurrentItem({...currentItem, [field.key]: newVal});
                                }
                          }} required><option value="">Selecione...</option>{opts?.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</Select>}
                          {field.type === 'multiselect' && (
                              <div className="mb-4">
                                  <label className="text-xs font-bold text-fg-muted uppercase block mb-1">{field.label}</label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-surface-alt">
                                      {opts?.map((opt: any) => {
                                          const isSelected = (currentItem[field.key] || []).includes(opt.value);
                                          return (
                                              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface p-1 rounded text-fg">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={isSelected}
                                                      onChange={(e) => {
                                                          const curr = currentItem[field.key] || [];
                                                          if (e.target.checked) {
                                                              setCurrentItem({...currentItem, [field.key]: [...curr, opt.value]});
                                                          } else {
                                                              setCurrentItem({...currentItem, [field.key]: curr.filter(v => v !== opt.value)});
                                                          }
                                                      }}
                                                      className="rounded text-primary focus:ring-primary border-border-strong"
                                                  />
                                                  {opt.label}
                                              </label>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                        </div>
                      );
                      })}
                       </div>
                      <div className="mt-2 pt-4 border-t border-border">
                        <Select label="Status" value={currentItem.status || EntityStatus.ACTIVE} onChange={(e: any) => setCurrentItem({...currentItem, status: e.target.value})}><option value={EntityStatus.ACTIVE}>Ativo</option><option value={EntityStatus.INACTIVE}>Inativo</option></Select>
                      </div>
                      <div className="mt-4 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
            {/* Delete Modal ... */}
            {isDeleteOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="mop-pop-in bg-surface rounded-2xl shadow-3 w-full max-w-sm overflow-hidden">
                    <div className="p-6 text-center">
                       <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                       <h3 className="text-xl font-bold text-fg mb-2">Excluir {title.slice(0, -1)}?</h3>
                       <p className="text-fg-muted text-sm mb-6">Tem certeza que deseja remover <b>{itemToDelete.nome}</b>?</p>
                       <div className="flex gap-3 justify-center"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Sim, Excluir</Button></div>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};
```

- [ ] **Step 2: Verificar tipos e visual**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, login como Admin, navegar até "Clientes" (menu Cadastros).
Expected: tabela com cabeçalho tonal, linhas com hover sutil; clicar em "Novo" abre o modal com cantos de 16px e fundo/borda coerentes com o tema atual (fechar com "Cancelar" ou X, sem salvar); digitar um termo de busca que não bate com nenhum cliente existente (ex.: "zzz_teste_vazio") mostra a ilustração pequena de arquipélago com "Nenhum registro encontrado" — não excluir nem criar nenhum registro real durante a verificação, o app conecta num Supabase real (services/supabase.ts), não num banco de teste.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle CrudPage table, modals and empty state"
```

---

### Task 11: Restilizar CollaboratorFormModal

**Files:**
- Modify: `App.tsx:1586-1753` (o `return` de `CollaboratorFormModal`)

**Interfaces:**
- Consumes: tokens e `.mop-pop-in`/`.mop-fade-up` (Task 1).
- Produces: mesma assinatura `CollaboratorFormModal({ onClose, onSave, initialData, onSchedule, initialScheduleDate })`. Apenas o *chrome* do modal e as seções bespoke deste componente são tocados — a página que o abre (`CollaboratorsPage`) fica fora de escopo.

Mapeamento de cor usado neste componente (sem equivalente direto no VERT, resolvido por semântica):
- Seções amarela (Férias) e vermelha (Desligado/Afastado) → `warning`/`error` tonais, como no Badge (Task 5).
- Seção laranja (Aviso Prévio) → tratamento `warning` mais forte (opacidade maior), para continuar visualmente distinta da seção de Férias.
- Seção rosa (Licença Maternidade) → tratamento neutro (`surface-alt`/`border-strong`), já que é informativa, não um alerta.
- Seção azul (agendamento de mudança futura) → `primary`, por ser uma ação/fluxo do produto, não um estado de feedback.

- [ ] **Step 1: Substituir o `return` completo de `CollaboratorFormModal`**

Old:
```tsx
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{initialData ? 'Editar' : 'Novo'} Colaborador</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                <Input label="Matrícula" value={formData.matricula} onChange={(e:any) => handleChange('matricula', e.target.value)} required disabled={!!initialData} />
                <Input label="Nome Completo" value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} required />
                <Input label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} />
                <Input label="Data Nascimento" type="date" value={formData.dtNasc} onChange={(e:any) => handleChange('dtNasc', e.target.value)} />

                {/* Novos Campos VR */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <Input label="Email VR" value={formData.email_vr || ''} onChange={(e:any) => handleChange('email_vr', e.target.value)} placeholder="Email para sistema VR" />
                    <Input label="Senha de Acesso" value={formData.senha || ''} onChange={(e:any) => handleChange('senha', e.target.value)} placeholder="Senha inicial" />
                </div>
                
                <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alocação</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select label="Cliente" value={formData.clientId} onChange={(e:any) => {
                           handleChange('clientId', e.target.value);
                           handleChange('operationId', '');
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Operação" value={formData.operationId} onChange={(e:any) => {
                           handleChange('operationId', e.target.value);
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {operations.filter(o => !formData.clientId || o.clientId === formData.clientId).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </Select>
                        <Select label="Ilha" value={formData.ilhaId} onChange={(e:any) => {
                            const ilha = ilhas.find(i => i.id === e.target.value);
                            if(ilha) {
                                setFormData(p => ({
                                    ...p, 
                                    ilhaId: ilha.id,
                                    operationId: ilha.operationId,
                                    clientId: ilha.clientId,
                                    coordinatorId: ilha.coordinatorIds?.[0] || p.coordinatorId,
                                    supervisorId: ilha.supervisorIds?.[0] || p.supervisorId
                                }));
                            } else {
                                handleChange('ilhaId', e.target.value);
                            }
                        }}>
                            <option value="">Selecione...</option>
                            {ilhas.filter(i => (!formData.clientId || i.clientId === formData.clientId) && (!formData.operationId || i.operationId === formData.operationId)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Coordenador" value={formData.coordinatorId} onChange={(e:any) => handleChange('coordinatorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {coordinators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Supervisor" value={formData.supervisorId} onChange={(e:any) => handleChange('supervisorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <Select label="Status" value={formData.status} onChange={(e:any) => handleChange('status', e.target.value)}>
                        {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    
                    {formData.status === CollaboratorStatus.FERIAS && (
                        <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-in slide-in-from-top-2">
                             <Input label="Início Férias" type="date" value={formData.feriasInicio} onChange={(e:any) => handleChange('feriasInicio', e.target.value)} />
                             <Input label="Fim Férias" type="date" value={formData.feriasFim} onChange={(e:any) => handleChange('feriasFim', e.target.value)} />
                        </div>
                    )}
                    
                    {formData.status === CollaboratorStatus.DESLIGADO && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top-2">
                             <Input label="Data Desligamento" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AVISO_PREVIO && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-orange-800">
                                <AlertTriangle size={16} />
                                <p className="text-sm font-bold">Registro de Aviso Prévio</p>
                             </div>
                             <p className="text-xs text-orange-600 mb-3">Informe a data prevista para o desligamento final. O sistema usará esta data para cálculos de turnover futuro.</p>
                             <Input label="Data Fim do Aviso" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AFASTADO && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-red-800">
                                <Activity size={16} />
                                <p className="text-sm font-bold">Registro de Afastamento</p>
                             </div>
                             <Input label="Data de Início do Afastamento" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.LICENCA_MATERNIDADE && (
                        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2 mb-2 text-pink-800">
                                <Stethoscope size={16} />
                                <p className="text-sm font-bold">Registro de Licença Maternidade</p>
                             </div>
                             <Input label="Data de Início da Licença" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Input label="Data Entrada" type="date" value={formData.dtEntradaProduto} onChange={(e:any) => handleChange('dtEntradaProduto', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Horário Entrada" type="time" value={formData.horarioEntrada} onChange={(e:any) => handleChange('horarioEntrada', e.target.value)} />
                        <Input label="Horário Saída" type="time" value={formData.horarioSaida} onChange={(e:any) => handleChange('horarioSaida', e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-gray-100 shrink-0">
                 {onSchedule ? (
                    <div className="flex items-center gap-2">
                        {!isScheduling ? (
                            <Button variant="secondary" onClick={() => setIsScheduling(true)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                <CalendarClock size={16}/> {initialData ? "Agendar Alteração" : "Agendar Cadastro"}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200 animate-in fade-in slide-in-from-left-2">
                                <span className="text-xs font-bold text-blue-700 uppercase">Para:</span>
                                <input 
                                    type="date" 
                                    className="px-2 py-1 text-sm rounded border border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                                <button 
                                    onClick={() => setIsScheduling(false)} 
                                    className="p-1 rounded-full text-blue-400 hover:text-blue-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                 ) : <div></div>}

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    {isScheduling ? (
                        <Button onClick={handleConfirmSchedule} className="bg-blue-600 hover:bg-blue-700">
                            Confirmar Agendamento
                        </Button>
                    ) : (
                        <Button onClick={() => onSave(formData)}>Salvar</Button>
                    )}
                </div>
            </div>
          </div>
        </div>
    );
};
```
New:
```tsx
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="mop-pop-in bg-surface rounded-2xl shadow-3 w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="bg-surface-alt p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-fg">{initialData ? 'Editar' : 'Novo'} Colaborador</h3>
              <button onClick={onClose} className="text-fg-subtle hover:text-fg"><X size={20}/></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                <Input label="Matrícula" value={formData.matricula} onChange={(e:any) => handleChange('matricula', e.target.value)} required disabled={!!initialData} />
                <Input label="Nome Completo" value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} required />
                <Input label="Email" type="email" value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} />
                <Input label="Data Nascimento" type="date" value={formData.dtNasc} onChange={(e:any) => handleChange('dtNasc', e.target.value)} />

                {/* Novos Campos VR */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 bg-primary-tonal p-3 rounded-lg border border-primary/20">
                    <Input label="Email VR" value={formData.email_vr || ''} onChange={(e:any) => handleChange('email_vr', e.target.value)} placeholder="Email para sistema VR" />
                    <Input label="Senha de Acesso" value={formData.senha || ''} onChange={(e:any) => handleChange('senha', e.target.value)} placeholder="Senha inicial" />
                </div>
                
                <div className="col-span-1 md:col-span-2 bg-surface-alt p-4 rounded-lg border border-border">
                    <p className="text-xs font-bold text-fg-subtle uppercase tracking-wider mb-2">Alocação</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select label="Cliente" value={formData.clientId} onChange={(e:any) => {
                           handleChange('clientId', e.target.value);
                           handleChange('operationId', '');
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Operação" value={formData.operationId} onChange={(e:any) => {
                           handleChange('operationId', e.target.value);
                           handleChange('ilhaId', '');
                        }}>
                           <option value="">Selecione...</option>
                           {operations.filter(o => !formData.clientId || o.clientId === formData.clientId).map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </Select>
                        <Select label="Ilha" value={formData.ilhaId} onChange={(e:any) => {
                            const ilha = ilhas.find(i => i.id === e.target.value);
                            if(ilha) {
                                setFormData(p => ({
                                    ...p, 
                                    ilhaId: ilha.id,
                                    operationId: ilha.operationId,
                                    clientId: ilha.clientId,
                                    coordinatorId: ilha.coordinatorIds?.[0] || p.coordinatorId,
                                    supervisorId: ilha.supervisorIds?.[0] || p.supervisorId
                                }));
                            } else {
                                handleChange('ilhaId', e.target.value);
                            }
                        }}>
                            <option value="">Selecione...</option>
                            {ilhas.filter(i => (!formData.clientId || i.clientId === formData.clientId) && (!formData.operationId || i.operationId === formData.operationId)).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Coordenador" value={formData.coordinatorId} onChange={(e:any) => handleChange('coordinatorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {coordinators.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                        <Select label="Supervisor" value={formData.supervisorId} onChange={(e:any) => handleChange('supervisorId', e.target.value)}>
                            <option value="">Selecione...</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-border pt-4 mt-2">
                    <Select label="Status" value={formData.status} onChange={(e:any) => handleChange('status', e.target.value)}>
                        {Object.values(CollaboratorStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    
                    {formData.status === CollaboratorStatus.FERIAS && (
                        <div className="grid grid-cols-2 gap-4 bg-warning/15 p-4 rounded-lg border border-warning/40 mop-fade-up">
                             <Input label="Início Férias" type="date" value={formData.feriasInicio} onChange={(e:any) => handleChange('feriasInicio', e.target.value)} />
                             <Input label="Fim Férias" type="date" value={formData.feriasFim} onChange={(e:any) => handleChange('feriasFim', e.target.value)} />
                        </div>
                    )}
                    
                    {formData.status === CollaboratorStatus.DESLIGADO && (
                        <div className="bg-error/10 p-4 rounded-lg border border-error/30 mop-fade-up">
                             <Input label="Data Desligamento" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AVISO_PREVIO && (
                        <div className="bg-warning/25 p-4 rounded-lg border border-warning/50 mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-fg">
                                <AlertTriangle size={16} />
                                <p className="text-sm font-bold">Registro de Aviso Prévio</p>
                             </div>
                             <p className="text-xs text-fg-muted mb-3">Informe a data prevista para o desligamento final. O sistema usará esta data para cálculos de turnover futuro.</p>
                             <Input label="Data Fim do Aviso" type="date" value={formData.dataFim} onChange={(e:any) => handleChange('dataFim', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.AFASTADO && (
                        <div className="bg-error/10 p-4 rounded-lg border border-error/30 mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-error">
                                <Activity size={16} />
                                <p className="text-sm font-bold">Registro de Afastamento</p>
                             </div>
                             <Input label="Data de Início do Afastamento" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}

                    {formData.status === CollaboratorStatus.LICENCA_MATERNIDADE && (
                        <div className="bg-surface-alt p-4 rounded-lg border border-border-strong mop-fade-up">
                             <div className="flex items-center gap-2 mb-2 text-fg">
                                <Stethoscope size={16} />
                                <p className="text-sm font-bold">Registro de Licença Maternidade</p>
                             </div>
                             <Input label="Data de Início da Licença" type="date" value={formData.dataAfastamento} onChange={(e:any) => handleChange('dataAfastamento', e.target.value)} required />
                        </div>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <Input label="Data Entrada" type="date" value={formData.dtEntradaProduto} onChange={(e:any) => handleChange('dtEntradaProduto', e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="Horário Entrada" type="time" value={formData.horarioEntrada} onChange={(e:any) => handleChange('horarioEntrada', e.target.value)} />
                        <Input label="Horário Saída" type="time" value={formData.horarioSaida} onChange={(e:any) => handleChange('horarioSaida', e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="p-4 bg-surface-alt flex items-center justify-between border-t border-border shrink-0">
                 {onSchedule ? (
                    <div className="flex items-center gap-2">
                        {!isScheduling ? (
                            <Button variant="secondary" onClick={() => setIsScheduling(true)}>
                                <CalendarClock size={16}/> {initialData ? "Agendar Alteração" : "Agendar Cadastro"}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 bg-primary-tonal p-2 rounded-lg border border-primary/30 mop-fade-up">
                                <span className="text-xs font-bold text-primary uppercase">Para:</span>
                                <input 
                                    type="date" 
                                    className="px-2 py-1 text-sm rounded border border-primary/40 bg-surface text-fg focus:ring-1 focus:ring-primary outline-none"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                                <button 
                                    onClick={() => setIsScheduling(false)} 
                                    className="p-1 rounded-full text-primary/70 hover:text-primary"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                 ) : <div></div>}

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    {isScheduling ? (
                        <Button onClick={handleConfirmSchedule}>
                            Confirmar Agendamento
                        </Button>
                    ) : (
                        <Button onClick={() => onSave(formData)}>Salvar</Button>
                    )}
                </div>
            </div>
          </div>
        </div>
    );
};
```

- [ ] **Step 2: Verificar tipos e visual**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, login, ir em Colaboradores → abrir o modal de edição de um colaborador ativo → mudar o Status para "FÉRIAS", depois "DESLIGADO", depois "AVISO PRÉVIO", depois "LICENÇA MATERNIDADE" no dropdown (isso só muda o estado local do formulário, ainda não gravado) → fechar o modal em "Cancelar" sem clicar em "Salvar". O app conecta num Supabase real (`services/supabase.ts`); não persistir nenhuma dessas mudanças de teste.
Expected: cada mudança de status revela a seção correspondente com o tratamento de cor certo (amarelo tonal para férias, vermelho tonal para desligado, amarelo mais forte para aviso prévio, neutro para licença maternidade), legível em ambos os temas.

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle CollaboratorFormModal chrome and status sections"
```

---

### Task 12: Restilizar Dashboard (cards, distribuição, avisos)

**Files:**
- Modify: `App.tsx:2751-2911` (`Card`, `DistributionList` e o `return` de `Dashboard`)

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: mesma assinatura `Dashboard({ currentUser, onNavigate })`.

Mapeamento de cor dos 4 cartões de estatística e dos 4 avisos, usando só os 4 tokens de marca/feedback disponíveis (sem inventar cores extras): Total→`primary`, Ativos→`success`, Férias→`warning`, Desligados→`error`; Fim de Contrato→`error` (urgente, mesmo tratamento do `NotificationCenter` na Task 8), Aviso Prévio→`warning`, Férias→`primary` (neutro/informativo), Aniversariantes→`success` (celebratório).

- [ ] **Step 1: Restilizar `Card` (App.tsx:2751-2770)**

Old:
```tsx
  const Card = ({ title, value, subtext, trend, trendValue, icon: Icon, colorClass }: any) => (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">{title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
                  <Icon size={20} />
              </div>
          </div>
          <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium">
                  {trend === 'up' ? <TrendingUp size={14} className="text-green-600"/> : <TrendingDown size={14} className="text-red-600"/>}
                  <span className="text-green-600">{trendValue}</span>
                  <span className="text-gray-400 ml-1">{subtext}</span>
              </div>
          </div>
      </div>
  );
```
New:
```tsx
  const Card = ({ title, value, subtext, trend, trendValue, icon: Icon, colorClass }: any) => (
      <div className="bg-surface p-5 rounded-2xl shadow-1 border border-border flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex justify-between items-start">
              <div>
                  <p className="text-fg-muted text-xs font-bold uppercase tracking-wide">{title}</p>
                  <h3 className="text-3xl font-bold text-fg mt-1">{value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-surface-alt ${colorClass}`}>
                  <Icon size={20} />
              </div>
          </div>
          <div className="mt-2">
              <div className="flex items-center gap-1 text-xs font-medium">
                  {trend === 'up' ? <TrendingUp size={14} className="text-success"/> : <TrendingDown size={14} className="text-error"/>}
                  <span className="text-success">{trendValue}</span>
                  <span className="text-fg-subtle ml-1">{subtext}</span>
              </div>
          </div>
      </div>
  );
```

- [ ] **Step 2: Restilizar `DistributionList` (App.tsx:2772-2790)**

Old:
```tsx
  const DistributionList = ({ title, data }: { title: string, data: any[] }) => (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
          <h3 className="font-bold text-gray-900 mb-6">{title}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {data.map(item => (
                  <div key={item.name}>
                      <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                          <span className="truncate max-w-[70%]">{item.name.toUpperCase()}</span>
                          <span>{item.percent}% ({item.count})</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.percent}%` }}></div>
                      </div>
                  </div>
              ))}
              {data.length === 0 && <p className="text-gray-400 text-sm">Sem dados registrados.</p>}
          </div>
      </div>
  );
```
New:
```tsx
  const DistributionList = ({ title, data }: { title: string, data: any[] }) => (
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-1 h-full">
          <h3 className="font-bold text-fg mb-6">{title}</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {data.map(item => (
                  <div key={item.name}>
                      <div className="flex justify-between text-xs font-bold text-fg-muted mb-1">
                          <span className="truncate max-w-[70%]">{item.name.toUpperCase()}</span>
                          <span>{item.percent}% ({item.count})</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${item.percent}%` }}></div>
                      </div>
                  </div>
              ))}
              {data.length === 0 && <p className="text-fg-subtle text-sm">Sem dados registrados.</p>}
          </div>
      </div>
  );
```

- [ ] **Step 3: Substituir o `return` de `Dashboard` (App.tsx:2792-2911)**

Old:
```tsx
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card 
               title="Total Colaboradores" 
               value={stats.total} 
               subtext="vs mês anterior"
               trend="up"
               trendValue="+4%"
               icon={Users}
               colorClass="text-blue-600"
           />
           <Card 
               title="Em Operação / Ativos" 
               value={stats.active} 
               subtext="de quadro total"
               trend="up"
               trendValue={`${stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%`}
               icon={CheckCircle}
               colorClass="text-green-600"
           />
           <Card 
               title="Em Férias" 
               value={stats.vacation} 
               subtext="Próximo retorno: 26/02"
               trend="down"
               trendValue=""
               icon={Sun}
               colorClass="text-orange-600"
           />
           <Card 
               title="Desligados / Licença" 
               value={stats.inactive} 
               subtext="turnover mensal"
               trend="down"
               trendValue="-1%"
               icon={UserIcon}
               colorClass="text-gray-400"
           />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <DistributionList title="Distribuição por Operação" data={operationsStats} />
           </div>

           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 h-full">
               <h3 className="font-bold text-gray-900 mb-2">Avisos Recentes</h3>
               <div 
                   onClick={() => onNavigate('expiring')}
                   className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-yellow-100 transition-colors"
               >
                   <div className="text-yellow-600 mt-0.5"><AlertTriangle size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Fim de Contrato Próximo</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {expiringCount > 0 
                             ? `${expiringCount} colaboradores vencem contrato nos próximos 15 dias. Clique para ver.` 
                             : `Nenhum contrato vencendo nos próximos 15 dias.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('aviso_previo')}
                   className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-orange-100 transition-colors"
               >
                   <div className="text-orange-600 mt-0.5"><UserMinus size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Colaboradores em Aviso Prévio</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {avisoPrevioCount > 0 
                             ? `${avisoPrevioCount} colaboradores atualmente em aviso. Clique para gerenciar.` 
                             : `Nenhum colaborador em aviso prévio.`}
                       </p>
                   </div>
               </div>

                <div 
                   onClick={() => onNavigate('vacation')}
                   className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-blue-100 transition-colors"
               >
                   <div className="text-blue-600 mt-0.5"><Sun size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Colaboradores em Férias</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                           {stats.vacation > 0 
                               ? `${stats.vacation} colaboradores em gozo de férias. Clique para gerenciar.` 
                               : `Nenhum colaborador em férias no momento.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('birthdays')}
                   className="p-3 bg-green-50 border border-green-100 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-green-100 transition-colors"
               >
                   <div className="text-green-600 mt-0.5"><Gift size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-gray-900">Aniversariantes do Mês</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                           {birthdaysCount > 0
                               ? `${birthdaysCount} colaboradores celebram ano este mês.`
                               : 'Nenhum aniversariante este mês.'}
                       </p>
                   </div>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DistributionList title="Distribuição por Ilha" data={ilhaStats} />
           <DistributionList title="Distribuição por Supervisor" data={supervisorStats} />
       </div>
    </div>
  );
};
```
New:
```tsx
  return (
    <div className="space-y-6 mop-fade-up pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-fg">Visão Geral</h2>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card 
               title="Total Colaboradores" 
               value={stats.total} 
               subtext="vs mês anterior"
               trend="up"
               trendValue="+4%"
               icon={Users}
               colorClass="text-primary"
           />
           <Card 
               title="Em Operação / Ativos" 
               value={stats.active} 
               subtext="de quadro total"
               trend="up"
               trendValue={`${stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%`}
               icon={CheckCircle}
               colorClass="text-success"
           />
           <Card 
               title="Em Férias" 
               value={stats.vacation} 
               subtext="Próximo retorno: 26/02"
               trend="down"
               trendValue=""
               icon={Sun}
               colorClass="text-warning"
           />
           <Card 
               title="Desligados / Licença" 
               value={stats.inactive} 
               subtext="turnover mensal"
               trend="down"
               trendValue="-1%"
               icon={UserIcon}
               colorClass="text-error"
           />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2">
              <DistributionList title="Distribuição por Operação" data={operationsStats} />
           </div>

           <div className="bg-surface p-6 rounded-2xl border border-border shadow-1 space-y-4 h-full">
               <h3 className="font-bold text-fg mb-2">Avisos Recentes</h3>
               <div 
                   onClick={() => onNavigate('expiring')}
                   className="p-3 bg-error/10 border border-error/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-error/15 transition-colors"
               >
                   <div className="text-error mt-0.5"><AlertTriangle size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Fim de Contrato Próximo</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                         {expiringCount > 0 
                             ? `${expiringCount} colaboradores vencem contrato nos próximos 15 dias. Clique para ver.` 
                             : `Nenhum contrato vencendo nos próximos 15 dias.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('aviso_previo')}
                   className="p-3 bg-warning/15 border border-warning/30 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-warning/25 transition-colors"
               >
                   <div className="text-fg mt-0.5"><UserMinus size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Colaboradores em Aviso Prévio</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                         {avisoPrevioCount > 0 
                             ? `${avisoPrevioCount} colaboradores atualmente em aviso. Clique para gerenciar.` 
                             : `Nenhum colaborador em aviso prévio.`}
                       </p>
                   </div>
               </div>

                <div 
                   onClick={() => onNavigate('vacation')}
                   className="p-3 bg-primary-tonal border border-primary/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-primary/15 transition-colors"
               >
                   <div className="text-primary mt-0.5"><Sun size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Colaboradores em Férias</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                           {stats.vacation > 0 
                               ? `${stats.vacation} colaboradores em gozo de férias. Clique para gerenciar.` 
                               : `Nenhum colaborador em férias no momento.`}
                       </p>
                   </div>
               </div>

               <div 
                   onClick={() => onNavigate('birthdays')}
                   className="p-3 bg-success/10 border border-success/20 rounded-lg flex gap-3 items-start cursor-pointer hover:bg-success/15 transition-colors"
               >
                   <div className="text-success mt-0.5"><Gift size={18} /></div>
                   <div>
                       <h4 className="text-sm font-bold text-fg">Aniversariantes do Mês</h4>
                       <p className="text-xs text-fg-muted mt-0.5">
                           {birthdaysCount > 0
                               ? `${birthdaysCount} colaboradores celebram ano este mês.`
                               : 'Nenhum aniversariante este mês.'}
                       </p>
                   </div>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DistributionList title="Distribuição por Ilha" data={ilhaStats} />
           <DistributionList title="Distribuição por Supervisor" data={supervisorStats} />
       </div>
    </div>
  );
};
```

- [ ] **Step 4: Verificar tipos e visual**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

Run: `npm run dev`, login, ver a tela inicial (Visão Geral).
Expected: 4 cartões de estatística com ícone tonal colorido (teal/verde/amarelo/vermelho), barras de distribuição em teal, os 4 avisos com fundo tonal na cor certa; alternar o tema no header confirma que tudo continua legível no escuro.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle Dashboard cards, distribution lists and alerts"
```

---

### Task 13: Restilizar o wrapper raiz do shell do `App`

**Files:**
- Modify: `App.tsx:5325-5326` (div raiz)
- Modify: `App.tsx:5421` (`<main>`)

**Interfaces:**
- Consumes: tokens da Task 1. A classe `font-sans` já existente na `<div>` raiz passa a resolver para Lato automaticamente assim que `--font-sans` é definido na Task 1 — nenhuma mudança adicional de fonte é necessária em nenhum outro componente.

- [ ] **Step 1: Restilizar a div raiz (App.tsx:5325-5326)**

Old:
```tsx
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
```
New:
```tsx
  return (
    <div className="flex h-screen bg-bg text-fg font-sans">
```

- [ ] **Step 2: Restilizar o `<main>` (App.tsx:5421)**

Old:
```tsx
       <main className="flex-1 ml-64 overflow-y-auto h-full bg-gray-50 flex flex-col relative custom-scrollbar">
```
New:
```tsx
       <main className="flex-1 ml-64 overflow-y-auto h-full bg-bg flex flex-col relative custom-scrollbar">
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: nenhum erro novo.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(design): restyle App shell root wrapper with VERT tokens"
```

---

### Task 14: Verificação final

**Files:** nenhum (só verificação — nenhuma edição de código).

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build termina com sucesso (exit code 0).

- [ ] **Step 2: Checklist manual em tema claro**

Run: `npm run dev`, abrir no navegador.
Percorrer, com o toggle de tema **desligado** (claro): Login (ilustração + formulário) → Dashboard (Visão Geral) → Clientes (CrudPage: abrir o modal "Novo" e o de edição de um registro existente só para olhar, fechar sem salvar; digitar uma busca sem resultado para ver o estado vazio) → Colaboradores → abrir o modal de edição de um colaborador existente e alternar pelo menos 3 status diferentes no dropdown (Férias, Desligado, Aviso Prévio) só para ver as seções condicionais, fechar sem salvar → Sidebar (todas as seções, usuário Admin) → sino de notificações no Header.
Expected: nenhum texto ilegível (contraste), nenhuma classe do Tailwind quebrada (sem `bg-brand-*`/`bg-gray-*` residual visível), foco de teclado visível ao tabular pelos campos e botões.

**Importante:** o app conecta num Supabase real (`services/supabase.ts`), não há banco de teste isolado. Este checklist é somente leitura/navegação — nunca clicar em "Salvar", "Sim, Excluir", "Resetar Dados" nem em qualquer ação que persista uma mudança. Abrir modais e formulários para inspecionar visualmente é seguro; submetê-los não é.

- [ ] **Step 3: Checklist manual em tema escuro**

Clicar no toggle de tema no Header e repetir o mesmo percurso do Step 2.
Expected: mesmas telas, agora em fundo escuro; nenhum "flash" de branco embutido (procurar especialmente dentro de modais, dropdown de notificações e dropdown do MultiSelect); os badges de status e as seções coloridas do formulário de colaborador continuam legíveis.

- [ ] **Step 4: Persistência e preferência do sistema**

Com o tema escuro ativo, recarregar a página (F5).
Expected: continua escuro (não volta para claro).
Rodar `localStorage.removeItem('mop-theme')` no console, recarregar, e alternar a emulação de `prefers-color-scheme` do navegador (DevTools → Rendering).
Expected: o tema acompanha a preferência do sistema quando não há escolha manual salva.

- [ ] **Step 5: `prefers-reduced-motion`**

No DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", recarregar a tela de Login e abrir um modal do CrudPage.
Expected: a ilustração do arquipélago não pulsa, o cartão de login não desliza/aparece com transição, os modais aparecem instantaneamente (sem `mop-pop-in` animado) — mas continuam funcionalmente idênticos.

- [ ] **Step 6: Checagem pontual de contraste**

Usar o inspetor de contraste do DevTools (ou o Lighthouse) nos seguintes pares, em ambos os temas: texto de corpo (`text-fg` sobre `bg-bg`/`bg-surface`), texto secundário (`text-fg-muted` sobre `bg-surface`), texto dos badges de status (`text-success`/`text-error` sobre seus fundos tonais).
Expected: todos ≥ 4.5:1 (AA para texto normal). Se algum falhar, ajustar o valor do token correspondente em `index.css` (Task 1) antes de prosseguir — não é necessário reabrir tasks já commitadas, só editar os valores de cor no arquivo.

- [ ] **Step 7: Commit final (se houver ajustes do Step 6)**

```bash
git add index.css
git commit -m "fix(design): adjust token contrast after final QA pass"
```

Se nenhum ajuste foi necessário, não há o que commitar neste step.

---

## Auto-Revisão do Plano

**Cobertura do spec:** Seção 3 (build/tema) → Tasks 1–2. Seção 4 (tokens) → Task 1 + Global Constraints (mapeamento de raio/espaçamento). Seção 5 (componentes) → Tasks 4–12 cobrem Button, Input, Select, Badge, MultiSelect, Modais (CrudPage e CollaboratorFormModal), CrudPage, Sidebar/NavItem, Header, LoginPage, Dashboard — todos os itens listados no spec. Seção 6 (ilustração) → Task 3 (componente) + Tasks 9 e 10 (usos). Seção 7 (movimento) → Task 1 (keyframes + reduced-motion) aplicado nas Tasks 9–12. Seção 8 (acessibilidade) → `focus-visible` em Tasks 4/7/8, `aria-label`/`aria-pressed` no toggle (Task 8), regra de não usar `warning` como texto (Tasks 5 e 11), verificação de contraste na Task 14. Seção 9 (verificação) → Task 14. Seção 10 (riscos) → anotado inline nas Tasks 1 (tokens escuros derivados, escala tipográfica simplificada) e 11 (mapeamento de cor sem equivalente direto no VERT).

**Placeholders:** nenhum "TBD"/"implementar depois" encontrado — todo step de código tem o código real completo.

**Consistência de tipos/nomes:** `useTheme()` retorna `{ theme, toggleTheme }` (Task 2) e é consumido exatamente assim na Task 8. `ArchipelagoIllustration({ variant, className })` (Task 3) é chamado com `variant="hero"` (Task 9) e `variant="empty"` (Task 10) — únicos dois valores do union type. Classes de token (`bg-bg`, `bg-surface`, `bg-surface-alt`, `border-border`, `border-border-strong`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `bg-primary`/`text-primary`/`border-primary`, `bg-primary-dark`, `bg-primary-tonal`, `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-error`/`text-error`, `shadow-1`…`shadow-4`, `.mop-node`, `.mop-fade-up`, `.mop-pop-in`) são usadas de forma idêntica em todas as tasks que as consomem, e todas são definidas uma única vez na Task 1.

---
