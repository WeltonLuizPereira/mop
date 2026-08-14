# MOP — Nova interface (identidade Quality Contact Center)

**Data:** 2026-08-14
**Status:** Aprovado para planejamento
**Substitui:** `2026-08-13-mop-redesign-design.md` (direção VERT / verde-petróleo, descartada)

---

## 1. Contexto

O MOP (Mapa Operacional) é o sistema interno de gestão de força de trabalho da
**Quality Contact Center**: colaboradores alocados em ilhas de atendimento,
organizadas por operação e cliente, com supervisão e coordenação sobrepostas.
Cobre admissão, férias, afastamento, aviso prévio, desligamento, vencimento de
contrato, importação em massa e histórico.

Hoje ele é um único componente React de 5.468 linhas (`App.tsx`) com 22 páginas,
todos os componentes compartilhados e o roteamento no mesmo arquivo. Passou por
uma remodelação visual anterior (design system VERT, verde-petróleo `#00747A`,
fonte Lato) que o cliente rejeitou integralmente.

O pedido: interface nova, moderna, com alternância claro/escuro, construída
sobre o design system público do Supabase, trocando o verde-esmeralda da marca
por laranja derivado de `#F27405` / `#F54E00` / `#D04200`, em harmonia com o
logo da empresa.

## 2. Decisões já tomadas

| Decisão | Escolha | Consequência |
|---|---|---|
| Escopo | Três levas, com reestruturação de código na leva 1 | `App.tsx` deixa de ser monolito antes de qualquer restyling |
| Modo padrão | **Claro primeiro**, escuro como par completo | Canvas branco puro; o escuro é derivado, não improvisado |
| Visão geral | **Mapa de ilhas**, não cards de KPI | A tela que dá nome ao sistema passa a mostrar o que ele mapeia |

## 3. Objetivo desta leva (leva 1)

Construir a fundação e aplicá-la às três superfícies que definem a primeira
impressão:

- **Entrar** (login)
- **Shell** — barra lateral, barra superior, navegação por perfil
- **Visão geral** — o Mapa Operacional
- **Colaboradores** — a tabela, que estabelece o tratamento de dado denso
  reaproveitado por todas as outras telas
- **Primitivos** — `Button`, `Input`, `Select`, `MultiSelect`, `Badge`, `Card`,
  `Table`, `Modal`, `Logo`, `AnelQ`

Mais a extração mecânica das 22 páginas de `App.tsx` para arquivos próprios
(seção 14), sem mudança de comportamento.

---

## 4. Sistema de cor

### 4.1 Princípio

**Laranja significa uma coisa só: "aqui você age."** Botão primário, link, anel
de foco, item de navegação ativo e alerta de atenção. Nada mais.

Isso resolve dois problemas de uma vez:

1. Os **7 status de colaborador** (`ATIVO`, `FÉRIAS`, `AFASTADO`,
   `LICENÇA MATERNIDADE`, `AVISO PRÉVIO`, `REALOCADO`, `DESLIGADO`) formam uma
   família cromática **própria e separada da marca**. Nenhum status é laranja,
   então nunca há ambiguidade entre "isto é um estado" e "isto é um botão".
2. **Não existe cor de `warning` no sistema.** Contrato vencendo, retorno de
   férias, aviso prévio — tudo isso é atenção, atenção é ação, e ação é laranja.
   Uma cor a menos e um conflito a menos, já que âmbar de alerta brigaria com a
   marca.

### 4.2 Marca

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--brand` | `#F27405` | `#F27405` | preenchimento primário, anel de foco, régua do item ativo |
| `--brand-hot` | `#F54E00` | `#FF6A1A` | hover do preenchimento; ponta quente do Anel Q |
| `--brand-press` | `#D04200` | `#C93E00` | estado pressionado |
| `--brand-text` | `#D04200` | `#F27405` | laranja seguro como **texto** sobre o canvas |
| `--brand-wash` | `#FFF4EC` | `rgb(242 116 5 / .14)` | fundo tonal: item ativo, linha selecionada |
| `--on-brand` | `#191310` | `#191310` | **texto sobre preenchimento laranja** |

`--on-brand` é a idiossincrasia herdada do Supabase (que usa quase-preto sobre o
esmeralda, nunca branco) e aqui não é preferência estética — é a única opção que
passa:

| Combinação | Contraste | |
|---|---|---|
| `#F27405` + `#191310` | **7.3:1** | ✅ o botão lê como brasa acesa |
| `#F27405` + `#FFFFFF` | 2.9:1 | ❌ reprova em AA |
| `#F27405` sobre `#121110` | 6.5:1 | ✅ |
| `#F27405` como texto sobre branco | 2.9:1 | ❌ — por isso existe `--brand-text` |
| `#D04200` como texto sobre branco | 4.7:1 | ✅ AA |

### 4.3 Canvas e tinta

A tinta é um **preto-quase quente** (`#191310`, não neutro): puxa de leve para o
laranja e amarra o sistema. O escuro inverte mantendo a mesma temperatura.

| Token | Claro | Escuro |
|---|---|---|
| `--canvas` | `#FFFFFF` | `#121110` |
| `--canvas-soft` | `#FAFAFA` | `#1A1817` |
| `--canvas-sunk` | `#F2F2F1` | `#0C0B0A` |
| `--hairline` | `#E4E4E4` | `#2E2A28` |
| `--hairline-2` | `#CFCFCF` | `#423D3A` |
| `--ink` | `#191310` | `#F5F1EF` |
| `--ink-2` | `#453C38` | `#C4BCB7` |
| `--ink-mute` | `#6B615C` | `#948B86` |
| `--ink-faint` | `#9A918C` | `#6E6560` |

O branco puro do canvas claro é compromisso explícito do design system do
Supabase ("the white-canvas commitment is non-negotiable") e é mantido: sem
gradiente atmosférico, sem fundo cinza-azulado.

### 4.4 Status

Renderizados **sempre como ponto de 8px + rótulo em tinta**, nunca cor sozinha
(quem não distingue cor lê o rótulo) e **nunca como preenchimento grande** — é o
que mantém a página quase-monocromática e preserva o laranja como único evento
cromático de área.

| Status | Claro | Escuro |
|---|---|---|
| `ATIVO` | `#12794F` | `#3FBE84` |
| `FÉRIAS` | `#1264A3` | `#5AA9E6` |
| `AFASTADO` | `#6544C0` | `#9B8CFF` |
| `LICENÇA MATERNIDADE` | `#B4008C` | `#E86FD8` |
| `AVISO PRÉVIO` | `#C4183C` | `#FF4D6D` |
| `REALOCADO` | `#00786F` | `#38B5A8` |
| `DESLIGADO` | `#6B615C` | `#948B86` |

`DESLIGADO` ficar sem matiz não é economia, é semântica: a pessoa saiu, a cor
drena.

Violeta, magenta e carmim foram afastados em matiz depois de um teste no modo
escuro em que ficaram vizinhos demais para distinguir de relance.

### 4.5 Feedback

Uma cor por papel, reaproveitando a família de status:

- `--danger` = `#C4183C` / `#FF4D6D` — ação destrutiva, erro de formulário
  (mesmo carmim de `AVISO PRÉVIO`; o estado alarmante e a ação alarmante
  compartilham a cor de propósito)
- `--ok` = `#12794F` / `#3FBE84` — confirmação (mesmo verde de `ATIVO`)
- atenção → **`--brand`**, conforme 4.1

---

## 5. Tipografia

O logo já traz dois registros opostos, e o sistema usa exatamente esses dois:

```
QUALITY                        →  pesado, fechado, geométrico
C o n t a c t   C e n t e r    →  leve, aberto, espaçadíssimo
```

Isso não é ornamento inventado: é a dialética tipográfica da própria marca
virando dispositivo estrutural da interface.

| Papel | Fonte | Especificação |
|---|---|---|
| `display-xl` | Archivo 700 | 40px / 1.08 / −0.022em — título do login |
| `display-lg` | Archivo 700 | 28px / 1.15 / −0.02em — título de página |
| `display-md` | Archivo 700 | 19px / 1.25 / −0.015em — título de seção e de tile |
| `eyebrow` | Archivo 500 | 11px, caixa alta, **+0.18em**, 1.0 — grupo de nav, cabeçalho de tabela, rótulo de seção |
| `body` | IBM Plex Sans 400 | 14px / 1.5 |
| `label` | IBM Plex Sans 500 | 13px — rótulo de campo |
| `button` | IBM Plex Sans 600 | 13px / 1.0 |
| `data` | IBM Plex Mono 400/500 | 13px, `tabular-nums` |
| `micro` | IBM Plex Sans 400 | 11px / 1.4 |

**Por que não Inter.** É o substituto que o próprio documento do Supabase sugere
para a Circular, e é a resposta padrão de qualquer projeto. O IBM Plex Sans faz
o mesmo trabalho em 13px de tabela densa com mais caráter, e vem com um mono
irmão desenhado junto.

**Por que mono no dado.** `matricula`, `horarioEntrada`, `horarioSaida`,
`dtNasc`, `dtEntradaProduto` e todas as contagens são código e número. Em fonte
proporcional os dígitos desalinham entre linhas da tabela; em tabular, empilham.

**Carregamento.** Google Fonts, `display=swap`, subset latino:
`Archivo` (variável, eixos `wdth` 62–125 e `wght` 100–900),
`IBM Plex Sans` (400/500/600), `IBM Plex Mono` (400/500).

---

## 6. Forma, espaço e elevação

**Raio** — herdado do Supabase, que é deliberadamente quadradão:

| Token | Valor | Uso |
|---|---|---|
| `--r-xs` | 4px | anel de foco, tag fina |
| `--r-sm` | 6px | **botão** e campo — nunca pílula |
| `--r-md` | 8px | alerta, chip |
| `--r-lg` | 12px | card, container de tabela |
| `--r-xl` | 16px | modal |
| `--r-tile` | 20px | tile de ilha |
| `--r-full` | 9999px | avatar, ponto de status |

**Espaço** — base 8px, com 2/4/12 para trabalho fino. Respiro de conteúdo 28px,
largura máxima 1440px.

**Elevação** — no claro, sombra; no escuro, a borda faz o trabalho e a sombra só
aprofunda.

| Nível | Claro | Escuro |
|---|---|---|
| 0 | hairline de 1px | hairline de 1px |
| 1 | `0 1px 3px rgb(0 0 0 / .06)` | `0 1px 3px rgb(0 0 0 / .4)` |
| 2 | `0 8px 24px rgb(0 0 0 / .08)` | `0 8px 24px rgb(0 0 0 / .5)` |
| 3 | `0 16px 48px rgb(0 0 0 / .12)` | `0 16px 48px rgb(0 0 0 / .6)` |

---

## 7. Assinatura: o Anel Q

### 7.1 O que é

O "Q" do logo é um anel de pincel **incompleto** — traço gestual, borda
irregular, com uma cauda. Um arco que não fecha é, literalmente, uma
porcentagem. O mark da empresa já era um medidor; o sistema só passa a usá-lo
como tal.

### 7.2 Técnica

O arquivo `assets/brand/quality-logo.svg` traz o anel como **contorno
preenchido**, não como traço: 1.456 pontos de micro-segmentos traçados do
pincel original. A irregularidade da tinta está **na geometria**.

Consequências:

- **Nada de `feTurbulence`.** Não se imita pincel quando se tem o pincel.
- **Nada de `stroke-dasharray`.** Contorno preenchido não aceita. O arco varia
  por **máscara**: uma cunha circular gira sobre o path real, revelando-o. A
  borda rasgada fica preservada e o efeito é de tinta sendo assentada.

**Geometria medida do path:** caixa `327 177 353 360`, centro **(503.5, 357)**,
raio externo ≈ 180. A cunha usa raio 270, que cobre os cantos da caixa com
folga (distância máxima do centro ao canto ≈ 252).

```
cunha(v):
  a0 = −90°                       (meia-noite)
  a1 = a0 + v · 360°              (sentido horário)
  M cx cy L p(a0) A 270 270 0 [v>0.5] 1 p(a1) Z
```

Em `v >= 1` a máscara é omitida por inteiro — arco de 360° é degenerado em SVG.

### 7.3 Interface do componente

```tsx
<AnelQ value={0.85} threshold={0.80} size={54} />
```

- `value` — 0…1
- `threshold` — abaixo disso a cor vai de `--brand` para `--brand-hot`
  (padrão 0.80)
- A cor vem de `currentColor`; o componente não define cor própria
- `id` da máscara via `useId()`, para múltiplas instâncias na mesma página
- `role="img"` com `aria-label` legível (`"85% em operação"`)

### 7.4 Onde aparece

- **Entrar** — anel completo dentro do lockup, desenhando-se uma vez ao carregar
- **Tile de ilha** — arco = % em operação
- **Marca da barra lateral** — anel completo, 24px, estático

**Em nenhum outro lugar.** Sem rosca decorativa em card, sem versão ornamental.
A ousadia do sistema inteiro é gasta aqui; todo o resto é quieto.

### 7.5 Movimento

Uma animação, uma vez: a cunha vai de 0 ao valor final em 700ms `ease-out` na
montagem. Sob `prefers-reduced-motion: reduce`, renderiza no valor final sem
transição.

---

## 8. Marca: o componente `Logo`

```tsx
<Logo variant="mark" | "lockup" />
```

Três paths, três tratamentos:

| Path | Cor | Regra |
|---|---|---|
| anel | `#ff8705` | cor **fixa** do arquivo |
| `QUALITY` | `#f7080d` | cor **fixa** do arquivo |
| `Contact Center` | `currentColor` | **segue o tema** |

O logo mantém as cores dele. `#ff8705` tem contraste 2.4:1 sobre branco e
reprovaria como cor de interface, mas marca registrada é isenta da exigência de
contraste da WCAG (1.4.3). O logo fica sendo o logo; a interface usa os tokens
da seção 4.

**A linha `Contact Center` é branca no arquivo original** — o logo foi desenhado
para fundo escuro. Duas consequências:

1. O path recebe `currentColor` para não sumir no canvas branco.
2. **O palco do login é escuro nos dois temas** (seção 12).

**Pendência de arquivo.** Essa linha foi vetorizada como *contorno*: cada letra
é um traço vazado, não uma forma sólida. Ampliada funciona; pequena vira mingau.
Paliativo aplicado: `stroke: currentColor; stroke-width: 1.6`. Alternativa em
aberto, a critério do cliente: compor a linha em Archivo (o registro `eyebrow`
já é exatamente esse espaçamento largo) e manter do vetor apenas o anel e o
`QUALITY`.

---

## 9. Shell

A navegação é a parte quieta do sistema.

```
┌──────────────┬───────────────────────────────────────┐
│ ◜◝ MOP       │  Visão geral            ⌕  ☾  ⌂ WL   │ 56px
│    Quality…  ├───────────────────────────────────────┤
├──────────────┤                                       │
│ P R I N C I P│  faixa de totais                      │
│ ▎Visão geral │                                       │
│              │  ┌────────┐ ┌────────┐ ┌────────┐    │
│ G E S T Ã O  │  │  tile  │ │  tile  │ │  tile  │    │
│  Colaborador │  └────────┘ └────────┘ └────────┘    │
│  ...         │                                       │
└──────────────┴───────────────────────────────────────┘
  260px            respiro 28px · máx 1440px
```

- **Lateral 260px**, fundo `--canvas-soft`, hairline à direita.
- **Topo da lateral**: `<Logo variant="mark">` 24px + "MOP" em Archivo 700 15px
  + "Quality Contact Center" em 10px `--ink-faint`. O lockup completo fica
  reservado ao login.
- **Rótulos de grupo** no registro `eyebrow` — o registro "Contact Center" do
  logo.
- **Item ativo**: régua laranja de 2px à esquerda + fundo `--brand-wash`, texto
  em tinta e peso 600. O texto **não** fica laranja: a marca marca posição sem
  virar texto colorido.
- **Ícones**: `lucide-react`, 16px, `opacity: .75`.
- **Rodapé da lateral**: avatar (inicial em Archivo 700 sobre `--brand`), nome,
  perfil, e ação de sair em `--danger` discreto.
- **Barra superior 56px**: título da página em Archivo 700 16px, busca, toggle
  de tema, central de avisos, tudo em `iconbtn` de 32px.

**Visibilidade por perfil.** A lateral varia muito: `ADMIN` vê 22 itens,
`VISUALIZADOR` vê 6. Os grupos são desenhados para funcionar cheios e vazios, e
um grupo sem itens visíveis não renderiza o rótulo. A configuração sai de
`App.tsx` para `lib/navigation.ts`, como dado declarativo:

```ts
{ group: 'RH', items: [
  { key: 'vacation', label: 'Férias', icon: Sun, roles: NOT_VIEWER },
] }
```

**Responsivo.** Abaixo de 900px a lateral vira gaveta sobreposta acionada por
botão na barra superior; o conteúdo passa a ocupar a largura toda.

---

## 10. Visão geral — o Mapa Operacional

### 10.1 A faixa de totais

Uma linha, quatro contagens reais, separadas por hairline vertical:

```
1.284 ativos │ 37 em férias │ 12 em aviso prévio │ 8 afastados
```

Número em Archivo 700 21px `tabular-nums`, rótulo em 13px `--ink-mute`.

**Todo número da tela é calculado.** O dashboard atual afirma
`+4% vs mês anterior`, `-1% turnover mensal` e `Próximo retorno: 26/02`
com valores fixos no código (`App.tsx:2846-2854`) — dados falsos com cara de
dado. Nenhum sobrevive. Regra: ou o número é real, ou não aparece.

### 10.2 O tile de ilha

```
┌──────────────────────────────────────┐
│ Ilha 04 — Retenção                   │  Archivo 700 15px
│ Vivo · Móvel                         │  12px --ink-mute
│ ────────────────────────────────────│  hairline
│  ╭────╮                              │
│  │ ◜◝ │   85%                        │  Anel 54px + Archivo 700 26px
│  ╰────╯   em operação · 48 pessoas   │  12px, contagem em mono
│                                      │
│ ● 41 ativos  ● 4 férias  ● 2 afast.  │  ponto + rótulo
└──────────────────────────────────────┘
   raio 20px · --canvas-soft · borda 1px
```

O nome da ilha ocupa a largura inteira no topo — é o identificador da linha e
não pode truncar. (Uma primeira versão colocava nome e cliente espremidos à
direita do anel e cortava `Ilha 09 — Ba…`; foi corrigido.)

Grade: `repeat(auto-fill, minmax(286px, 1fr))`, gap 14px.

Hover: elevação 2 + `translateY(-1px)` + borda em `--hairline-2`. Clique abre a
ilha. `tabindex="0"` com foco visível — o tile é navegável por teclado.

### 10.3 O que o anel mede

**`ATIVO ÷ total de colaboradores da ilha`** — quanto da ilha está de pé hoje.

Justificativa e limite: `Ilha` **não tem campo de capacidade**
(`types.ts:53-61`). Não existe "48 de 60 lugares" no banco, então "ocupação"
literal é incalculável. O `ilhaStats` de hoje calcula participação no quadro
total, o que renderizado como anel diria "esta ilha é 8% da empresa" — inútil
por tile.

Quem está de férias, afastado, em licença ou em aviso não está atendendo. A
razão de ativos sobre o total da ilha sai direto dos dados existentes, é
honesta, e é a pergunta que operação de call center realmente faz.

Abaixo de **80%** o anel vira de `--brand` para `--brand-hot`. Uma marca, dois
significados — magnitude e temperatura. (A proposta inicial tinha *também* uma
borda do tile que esquentava com o risco; foi cortada por codificar duas vezes
a mesma preocupação.)

### 10.4 Controles e estados

- **Filtro por cliente** e **ordenação** (em operação ↑ / nome / tamanho) como
  `chip` na linha do rótulo da seção.
- **Vazio**: "Nenhuma ilha cadastrada ainda. Cadastre a primeira em
  Cadastros › Ilhas para ver o mapa." — convite, com o caminho.
- **Ilha sem ninguém**: o tile aparece, anel em 0, texto "Nenhum colaborador
  alocado".
- **Carregando**: esqueleto dos tiles em `--canvas-sunk`, sem spinner.

---

## 11. Colaboradores — a tabela

### 11.1 Colunas

Definidas pelo cliente:

| Logo Cliente | Nome | Status | Supervisor | Ilha |
|---|---|---|---|---|

A matrícula não é coluna. Segue disponível na busca ("Buscar por nome ou
matrícula") e na página de detalhes do colaborador.

### 11.2 A coluna de logo

O campo `Client.logo` (`types.ts:39-44`) já existe e hoje é preenchido pelo
cadastro de Clientes sem nunca ser exibido em lugar nenhum. Passa a ser a
âncora visual da linha, resolvida pela cadeia
`colaborador → ilha → operação → cliente`.

- **Com logo**: `<img>` de 24px de altura, `object-fit: contain`, dentro de um
  quadrado de 28px com `--r-xs` e fundo `--canvas-sunk` — o fundo neutro evita
  que logo colorido brigue com o canvas em qualquer um dos dois temas.
- **Sem logo** (ou imagem que falha ao carregar): quadrado de 28px, `--r-xs`,
  fundo `--canvas-sunk`, inicial do cliente em Archivo 700 12px `--ink-2`.
- `alt` com o nome do cliente. Não é decoração: é a identificação do cliente na
  linha.

### 11.3 Tratamento

- Cabeçalho no registro `eyebrow`.
- Dado em `--font-data` com `tabular-nums`; nome e texto em Plex Sans.
- **Uma linha por pessoa** — sem quebra de célula. (A primeira versão gastava
  duas linhas por registro; corrigido com `white-space: nowrap`.)
- **Sem zebra.** Separação por hairline; hover pinta a linha com
  `--canvas-soft`.
- Status como `Badge` (ponto + rótulo).
- Container em `--r-lg` com barra de ferramentas no topo: busca, filtro de ilha,
  filtro de status, **Exportar** (`btn--ghost`) e **Novo colaborador**
  (`btn--primary`).
- Linha clicável abre os detalhes; `Enter` no teclado faz o mesmo.

### 11.4 Estados

- **Vazio sem filtro**: "Nenhum colaborador cadastrado. Importe uma planilha ou
  cadastre o primeiro." com as duas ações.
- **Vazio com filtro**: "Nenhum colaborador encontrado para esses filtros." +
  "Limpar filtros".
- **Erro de carga**: "Não foi possível carregar os colaboradores." + "Tentar de
  novo". Sem pedido de desculpas, sem vaguidão.

---

## 12. Entrar

Duas colunas. À esquerda o palco; à direita o formulário, máximo 330px.

**O palco é escuro nos dois temas** (`#121110`). O logo tem a linha
`Contact Center` em branco no arquivo — foi desenhado para fundo escuro, e no
canvas branco precisaria de gambiarra para existir. Colocá-lo no ambiente nativo
resolve o problema técnico e dá presença à tela de entrada sem inventar
decoração. É a mesma manobra que o Supabase usa ao inverter para
`canvas-night` o card de destaque num site comprometido com branco.

- Lockup completo, `min(430px, 84%)`, anel desenhando-se uma vez.
- Formulário: `eyebrow` "Mapa Operacional", `display-xl` "Entrar", auxiliar
  "Use a matrícula e a senha que o RH cadastrou para você."
- Campos: Matrícula (mono, `inputmode="numeric"`) e Senha.
- Ação: **Entrar** — `btn--primary btn--block`.
- Abaixo de 900px o palco some e sobra o formulário centralizado.

**Copy de erro**, substituindo o atual:

| Situação | Hoje | Novo |
|---|---|---|
| Credencial errada | "Credenciais inválidas" | "Matrícula ou senha incorreta." |
| Usuário inativo | "Acesso bloqueado: Usuário inativo." | "Este acesso está inativo. Fale com o RH para reativar." |

---

## 13. Primitivos

Um arquivo por peça. É delas que as levas 2 e 3 vivem.

| Peça | Decisões |
|---|---|
| `Button` | raio 6px. `primary` (`--brand` + `--on-brand`), `ghost` (contorno em `--hairline-2`), `danger` (texto `--danger`, fundo só no hover), `block`. Altura mínima 36px. |
| `Input` / `Select` | raio 6px, borda `--hairline-2`, foco = anel `--brand` de 2px com offset 2px. Variante `data` em mono. |
| `MultiSelect` | mesma moldura do `Select`; seleções como chips removíveis em `--brand-wash`. |
| `Badge` | ponto 8px + rótulo em tinta. Os 7 status + neutro. Nunca preenchimento colorido. |
| `Card` | raio 12px, `--canvas-soft`, borda 1px. |
| `Table` | cabeçalho `eyebrow`, dado em mono, sem zebra, hairline entre linhas, hover na linha. |
| `Modal` | raio 16px, elevação 3, fundo de sobreposição `rgb(0 0 0 / .5)`, foco preso dentro, `Esc` fecha. |
| `Logo` | seção 8. |
| `AnelQ` | seção 7. |

---

## 14. Arquitetura de código

### 14.1 O problema

`App.tsx` tem 5.468 linhas com 22 páginas, 8 componentes compartilhados e o
roteamento. Não se constrói uma biblioteca de componentes dentro de um arquivo
desse tamanho. A remodelação anterior decidiu explicitamente não tocar nisso, e
o resultado está registrado em `index.css`, num shim que mapeia classes `brand-*`
legadas "porque ~94 call sites em App.tsx estão fora do escopo desta migração".

### 14.2 Destino

```
assets/brand/       quality-logo.svg · quality-logo.png
components/
  ui/               Button · Input · Select · MultiSelect · Badge
                    Card · Table · Modal · index.ts
  brand/            Logo.tsx · AnelQ.tsx
  shell/            AppShell · Sidebar · NavItem · Topbar
                    NotificationCenter · ThemeToggle
pages/              LoginPage · DashboardPage · CollaboratorsPage · (…as 22)
lib/                navigation.ts · format.ts
contexts/           ThemeContext.tsx  (já existe, mantido)
App.tsx             só roteamento e estado de sessão
```

### 14.3 Ordem de execução

Duas fases separadas, e a separação é o que reduz o risco:

1. **Extração mecânica** — mover as 22 páginas e os 8 componentes para arquivos
   próprios **sem alterar uma linha de estilo ou comportamento**. Critério de
   aceite: o app roda idêntico ao anterior, e `App.tsx` fica com o roteamento.
2. **Restyling** — só então aplicar tokens, tipografia e primitivos às
   superfícies da leva 1.

Fazer as duas de uma vez torna impossível saber se uma regressão veio do move ou
do estilo.

### 14.4 Limpeza incluída

- Remover o shim `--color-brand-*` de `index.css` — depois da extração, os call
  sites são localizáveis e corrigíveis.
- `index.html` já tem o script anti-flash de tema; mantido, ajustado ao novo
  padrão (claro).
- O `importmap` de `index.html` e as dependências de `package.json` divergem
  (React 19.2.3 nos dois, mas o importmap serve de `esm.sh` enquanto o Vite
  empacota do `node_modules`). Verificar e unificar durante a leva 1.
- `ArchipelagoIllustration.tsx` é da direção anterior; removido.

**Fora do escopo:** qualquer mudança em `services/mockDb.ts`, no schema do
Supabase ou na lógica de negócio. Esta é uma leva de interface.

---

## 15. Escrita

Palavras são material de design, não decoração.

- **Voz ativa e nome da ação constante.** O botão diz "Salvar alterações" e o
  aviso de sucesso diz "Alterações salvas". Nunca "Enviar", nunca "Submeter".
- **Do lado do usuário.** "Colaboradores", não "registros"; "ilha", não
  "entidade"; "Fale com o RH", não "contate o administrador do sistema".
- **Erro diz o que houve e o que fazer.** Não pede desculpas, não é vago.
- **Tela vazia é convite.** Sempre com a ação e o caminho.
- **Caixa de frase** em rótulos e botões: "Novo colaborador", não "Novo
  Colaborador".
- Nenhum texto de interface afirma número que o sistema não calculou.

---

## 16. Piso de qualidade

Sem alarde, mas obrigatório:

- **Responsivo** até 360px. Lateral vira gaveta abaixo de 900px; mapa colapsa
  para uma coluna; tabela rola horizontalmente dentro do próprio container, sem
  jamais rolar o `body`.
- **Foco de teclado visível** em tudo que é focável: anel `--brand` de 2px com
  offset. Tile e linha de tabela são focáveis e acionáveis por `Enter`.
- **`prefers-reduced-motion: reduce`** desliga a animação do anel, as
  transições e o `translateY` do hover.
- **Cor nunca sozinha**: status sempre com rótulo textual.
- **Contraste**: todo par texto/fundo dos tokens da seção 4 verificado em AA
  (4.5:1 para texto normal, 3:1 para elemento de interface). O logo é a única
  isenção, por ser marca registrada.
- **Alvo de toque** mínimo 36×36px.
- `<html lang="pt-BR">`, `aria-current="page"` na navegação, `role`/`aria-label`
  no `AnelQ`.

---

## 17. Levas seguintes

Não entram agora, e herdam os primitivos automaticamente assim que a leva 1
subir. Seções com markup próprio podem precisar de retoque quando forem
tocadas.

- **Leva 2 — telas densas**: Detalhes do Colaborador, família `CrudPage`
  (Clientes, Operações, Ilhas, Coordenadores, Supervisores, Usuários),
  Turnover, Organograma.
- **Leva 3 — RH e administração**: Férias, Aviso Prévio, Afastados, Desligados,
  Vencimento de Contratos, Aniversariantes, Importar, Update em Massa,
  Histórico, Tarefas Agendadas, Resetar Dados, Sobre.

---

## 18. Riscos

| Risco | Mitigação |
|---|---|
| A máscara de cunha sobre 1.456 pontos de path, multiplicada por N ilhas, pode pesar | `<defs>` compartilhado; medir com 30 tiles. Se pesar, gerar variantes pré-cozidas do path em passos de 5% |
| Três famílias de fonte aumentam o payload | Subset latino, `display=swap`, Archivo variável num arquivo só |
| O `Contact Center` vazado pode não agradar em tamanho pequeno | Decisão pendente na seção 8; o fallback em Archivo está especificado |
| A extração de 22 páginas pode introduzir regressão silenciosa | Fase 1 é move puro, verificada antes de qualquer restyling |
| `Client.logo` está vazio para a maioria dos clientes hoje | O monograma de fallback é parte da especificação, não remendo |

---

## 19. Referência visual

Mockup navegável das três superfícies, nos dois temas:
[`docs/mockup/index.html`](../../mockup/index.html)

Gerado por `docs/mockup/build.cjs`, que injeta os paths reais de
`assets/brand/quality-logo.svg` no template. Artefato de design — sai do
repositório quando a leva 1 for implementada.
