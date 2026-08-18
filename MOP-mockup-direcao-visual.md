---
version: "2.0"
name: "mop-quality-contact-center"
description: "Especificação visual e funcional do MOP - Mapa Operacional da Quality Contact Center, reconstruída a partir dos mockups em PDF nos estados claro e escuro."
source_artifact_id: "37252794-ca12-489c-92b2-f354cd4cc62f"

colors:
  primary: "#ff8705"
  primary-deep: "#d96b00"
  primary-hot: "#ff4d00"
  primary-pale: "#ffe4c2"
  primary-wash: "#fff8f0"
  brand-red: "#f7080d"
  danger: "#d81b3a"
  danger-soft: "#fff0f3"
  ink: "#171717"
  ink-secondary: "#332d29"
  ink-muted: "#746a63"
  ink-faint: "#a39890"
  on-primary: "#171717"
  on-dark: "#ffffff"
  canvas: "#ffffff"
  canvas-soft: "#fffaf5"
  canvas-night: "#1f1915"
  canvas-night-soft: "#2a211b"
  hairline: "#e5ddd6"
  hairline-strong: "#cfc2b8"

typography:
  display:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
  section-title:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  card-title:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
  eyebrow:
    fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.22em
    textTransform: "uppercase"
  numeric:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.4
    fontVariantNumeric: "tabular-nums"

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 20px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  huge: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  input-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  alert-error:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    borderColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  island-tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "24px"
  data-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "0px"
---

# MOP - mockup de direção visual

## 1. Objetivo

O MOP é o mapa operacional da Quality Contact Center. A interface oferece uma leitura executiva da operação e, em seguida, permite aprofundar a análise por ilha e por colaborador.

O sistema deve transmitir precisão, controle e sobriedade. A identidade é essencialmente monocromática, com o laranja do logotipo como evento cromático principal e o vermelho como acento secundário controlado.

## 2. Princípios de direção visual

- Usar branco, preto aquecido e neutros quentes como base.
- Reservar `{colors.primary}` para ações, anéis de operação, foco e destaques.
- Manter densidade informacional sem ruído: sem zebra nas tabelas e sem ornamentos gratuitos.
- Usar algarismos tabulares nos indicadores e dados operacionais.
- Exibir status sempre com rótulo textual; cor nunca deve ser o único meio de identificação.
- Mostrar apenas números provenientes da contagem real. Totais estimados não entram na faixa executiva.
- Limitar o movimento ao desenho inicial do anel do logotipo na tela de entrada.

## 3. Paleta

### 3.1 Marca e ação

| Token | Cor | Uso |
|---|---:|---|
| `{colors.primary}` | `#ff8705` | CTA principal, anel saudável, foco e seleção |
| `{colors.primary-deep}` | `#d96b00` | Hover e pressionado |
| `{colors.primary-hot}` | `#ff4d00` | Ilhas abaixo do limite operacional |
| `{colors.primary-pale}` | `#ffe4c2` | Chips e realces discretos |
| `{colors.primary-wash}` | `#fff8f0` | Fundo de seção ou card com identidade |
| `{colors.brand-red}` | `#f7080d` | Marca Quality e ênfase secundária |

### 3.2 Superfícies e texto

| Token | Cor | Uso |
|---|---:|---|
| `{colors.canvas}` | `#ffffff` | Fundo principal claro |
| `{colors.canvas-soft}` | `#fffaf5` | Fundo alternado claro |
| `{colors.canvas-night}` | `#1f1915` | Fundo principal escuro |
| `{colors.canvas-night-soft}` | `#2a211b` | Cards e campos no modo escuro |
| `{colors.ink}` | `#171717` | Texto principal |
| `{colors.ink-muted}` | `#746a63` | Texto secundário |
| `{colors.hairline}` | `#e5ddd6` | Separadores e bordas leves |
| `{colors.hairline-strong}` | `#cfc2b8` | Bordas de controles e foco neutro |

### 3.3 Regra de contraste

- O botão laranja usa `{colors.on-primary}` (`#171717`), não branco.
- O vermelho vivo não deve receber texto branco pequeno. Para alertas, usar fundo claro e texto vermelho escuro.
- No modo escuro, o laranja permanece saturado e os textos migram para branco ou neutros claros.

## 4. Tipografia

- Família principal: Inter ou sans-serif humanista equivalente.
- Títulos: peso 700, espaçamento compacto e alto contraste.
- Corpo: peso 400, entrelinha de 1.5.
- Rótulos de seção: caixa alta com tracking amplo.
- Indicadores e dados: fonte mono ou `font-variant-numeric: tabular-nums`.
- A hierarquia deve depender de tamanho, peso e espaçamento, não de várias cores.

## 5. Temas

### 5.1 Claro

- Fundo branco.
- Cards brancos com borda `hairline`.
- Texto principal quase preto.
- Sombras discretas apenas em painéis elevados.
- Anéis em laranja oficial ou laranja quente conforme o desempenho.

### 5.2 Escuro

- Fundo `{colors.canvas-night}`.
- Cards `{colors.canvas-night-soft}`.
- Texto principal `{colors.on-dark}`.
- Bordas em neutros quentes com contraste reduzido.
- O laranja não muda de identidade entre os temas.

> Nota: a captura impressa com o tema escuro selecionado manteve o fundo branco por causa do estilo de impressão do navegador. Os tokens acima representam a implementação esperada do tema, não a aparência incompleta da impressão.

## 6. Tela de entrada

### 6.1 Estrutura

No desktop, a tela é dividida em dois palcos:

1. Painel esquerdo escuro com o lockup completo da Quality Contact Center.
2. Painel direito claro com formulário de autenticação.

O seletor `CLARO / ESCURO` permanece no alto da página, com estado ativo perceptível por peso, borda e contraste.

### 6.2 Conteúdo

- Eyebrow: `MAPA OPERACIONAL`
- Título: `Entrar`
- Apoio: `Use a matrícula e a senha que o RH cadastrou para você.`
- Campo: `Matrícula`
- Campo: `Senha`
- CTA: `Entrar`
- Rodapé: `Quality Contact Center - MOP v2.0`

### 6.3 Estado de erro

Mensagem observada: `Matrícula ou senha incorreta.`

Regras:

- Exibir o alerta imediatamente acima dos campos.
- Usar `alert-error`, com texto e borda explícitos.
- Manter os valores preenchidos, exceto a senha quando a política de segurança exigir limpeza.
- Direcionar o foco para o alerta e anunciar a mensagem com `aria-live="polite"`.

### 6.4 Movimento

O anel do lockup é desenhado uma única vez ao carregar. Nenhum outro elemento deve ter animação decorativa contínua.

## 7. Visão geral - mapa operacional

### 7.1 Cabeçalho

O cabeçalho inclui:

- Título da página: `Visão geral`.
- Ação de busca.
- Alternancia de tema.
- Menu principal.

### 7.2 Faixa executiva

| Indicador | Valor do mockup |
|---|---:|
| Ativos | 1.284 |
| Em férias | 37 |
| Em aviso prévio | 12 |
| Afastados | 8 |

Os números devem usar algarismos tabulares e vir de contagem real.

### 7.3 Barra de contexto

- Rótulo: `ILHAS EM OPERAÇÃO`.
- Filtro: `Cliente: todos`.
- Ordenação: `em operação`, crescente ou decrescente.

### 7.4 Anatomia do tile de ilha

Cada tile contém:

1. Nome e número da ilha.
2. Cliente e segmento.
3. Anel de disponibilidade.
4. Percentual em operação.
5. Total de pessoas.
6. Distribuição por status.

Fórmula principal:

```text
percentual_em_operacao = ativos / total_de_pessoas
```

Regra cromática:

```text
se percentual_em_operacao >= 80%: usar colors.primary
se percentual_em_operacao < 80%: usar colors.primary-hot
```

### 7.5 Dados de exemplo das ilhas

| Ilha | Cliente / segmento | Operação | Total | Ativos | Férias | Outros status |
|---|---|---:|---:|---:|---:|---|
| Ilha 04 - Retenção | Vivo / Móvel | 85% | 48 | 41 | 4 | 2 afastados; 1 aviso |
| Ilha 01 - SAC | Vivo / Móvel | 94% | 52 | 49 | 2 | 1 aviso |
| Ilha 07 - Cobrança | Enel / Residencial | 61% | 31 | 19 | 5 | 4 afastados; 3 avisos |
| Ilha 02 - Receptivo | Enel / Residencial | 86% | 44 | 38 | 3 | 2 maternidade; 1 aviso |
| Ilha 09 - Backoffice | Sabesp / Corporativo | 92% | 26 | 24 | 2 | - |
| Ilha 05 - Ativo | Porto Seguro / Auto | 70% | 37 | 26 | 4 | 3 afastados; 4 avisos |
| Ilha 03 - Ouvidoria | Vivo / Fibra | 95% | 19 | 18 | 1 | - |
| Ilha 08 - Emergência | Enel / Rede | 81% | 58 | 47 | 6 | 3 afastados; 2 realocados |
| Ilha 06 - Chat | Sabesp / Corporativo | 65% | 23 | 15 | 3 | 2 afastados; 3 avisos |

### 7.6 Ordenação padrão

O mockup apresenta ordenação crescente por percentual em operação no controle, mas a composição visual também prioriza leitura em duas colunas. A implementação deve usar uma única regra de ordenação consistente e atualizar o indicador de direção no controle.

## 8. Colaboradores - tratamento de dado denso

### 8.1 Princípio

O cabeçalho ocupa o registro largo do logotipo. Os dados usam algarismos tabulares, as linhas são separadas por `hairline` e não existe zebra. Status é representado por ponto mais rótulo, nunca por cor sozinha.

### 8.2 Controles

- Busca por nome ou matrícula.
- Filtro de ilha, com valor inicial `todas`.
- Filtro de status, com valor inicial `ativos`.
- Ação `Exportar`.
- Ação `Novo colaborador`.

O formato de exportação deve ser definido na implementação. O mockup especifica a ação, mas não determina CSV, XLSX ou PDF.

### 8.3 Colunas

| Coluna | Conteúdo |
|---|---|
| Cliente | Monograma ou identificador curto |
| Nome | Nome completo do colaborador |
| Status | Situação atual com rótulo textual |
| Supervisor | Responsável direto |
| Ilha | Número e nome da operação |

### 8.4 Dados de exemplo

| Cliente | Nome | Status | Supervisor | Ilha |
|---|---|---|---|---|
| V | Adriana Lopes Ferreira | Ativo | Marcos Vinícius | Ilha 04 - Retenção |
| V | Bruno Cardoso Alves | Ativo | Juliana Prado | Ilha 01 - SAC |
| E | Camila Souza Rocha | Férias | Marcos Vinícius | Ilha 07 - Cobrança |
| E | Diego Nunes Barbosa | Aviso prévio | Renata Lima | Ilha 02 - Receptivo |
| S | Eduarda Martins Pinto | Ativo | Juliana Prado | Ilha 09 - Backoffice |
| P | Fábio Henrique Costa | Afastado | Renata Lima | Ilha 05 - Ativo |
| V | Gabriela Nascimento | Licença maternidade | Marcos Vinícius | Ilha 04 - Retenção |
| V | Henrique Dias Moreira | Realocado | Juliana Prado | Ilha 01 - SAC |
| E | Isabela Ramos Teixeira | Desligado | Renata Lima | Ilha 07 - Cobrança |

## 9. Componentes

### 9.1 Botão principal

- Fundo `{colors.primary}`.
- Texto `{colors.on-primary}`.
- Altura mínima de 44px.
- Raio `{rounded.sm}`.
- Hover em `{colors.primary-deep}`.
- Indicador de foco visível e externo.

### 9.2 Campos

- Label sempre visível acima do campo.
- Borda de 1px em `{colors.hairline-strong}`.
- Altura mínima de 44px.
- Placeholder não substitui label.
- Erro indicado por mensagem, borda e atributo semântico.

### 9.3 Tile de ilha

- Fundo plano.
- Borda de 1px.
- Raio amplo `{rounded.lg}`.
- Sem gradiente.
- Sem sombra no nível padrão.
- Anel e percentual formam o principal ponto focal.

### 9.4 Tabela

- Cabeçalho em caixa alta e tracking amplo.
- Sem zebra.
- Separadores horizontais de 1px.
- Nome com peso maior que os metadados.
- Filtros e ações permanecem acima do cabeçalho da tabela.

## 10. Comportamento responsivo

### Desktop

- Login em duas colunas.
- Tiles em grade de duas colunas.
- Faixa executiva em quatro indicadores.
- Tabela completa com cinco colunas.

### Tablet

- Tiles podem permanecer em duas colunas quando houver largura útil suficiente.
- Faixa executiva quebra em duas linhas.
- Controles da tabela quebram de forma ordenada antes da rolagem horizontal.

### Mobile

- Login empilha marca e formulário.
- Tiles passam para uma coluna.
- Faixa executiva vira grade 2 x 2.
- Tabela usa rolagem horizontal ou linhas expansivas, sem ocultar status.
- Ações mantêm alvo mínimo de 44 x 44px.

## 11. Acessibilidade

- Manter contraste WCAG AA para texto e controles.
- Oferecer rótulo acessível para busca, tema e menu.
- Não usar apenas cor para status ou desempenho.
- Expor o percentual do anel em texto e em nome acessível.
- Permitir navegação integral por teclado.
- Respeitar `prefers-reduced-motion`; nesse caso, mostrar o anel final sem animação.
- Informar erros de login via `aria-live`.
- Usar cabeçalhos semânticos na tabela.

## 12. Contrato mínimo de dados

```ts
type IslandStatus = {
  id: string;
  name: string;
  client: string;
  segment: string;
  totalPeople: number;
  active: number;
  vacation: number;
  notice: number;
  leave: number;
  maternity: number;
  reallocated: number;
};

type Employee = {
  id: string;
  registration: string;
  clientCode: string;
  name: string;
  status: string;
  supervisor: string;
  islandId: string;
};
```

O percentual deve ser calculado a partir dos dados atuais e não armazenado como valor independente quando puder ser derivado.

## 13. Critérios de aceite visual

- O logotipo é o único elemento de marca dominante na entrada.
- O anel é a única animação decorativa.
- Nenhum tile usa cor de fundo saturada.
- Ilhas abaixo de 80% são distinguidas por tom quente e texto numérico.
- A tabela não usa zebra.
- Status sempre possui rótulo.
- Números executivos usam algarismos tabulares.
- Os modos claro e escuro preservam a mesma hierarquia.
- O laranja permanece a cor primária em todas as telas.
- Não existem totais estimados na faixa executiva.

## 14. Observações da reconstrução

- Os dois PDFs possuem quatro páginas e o mesmo conteúdo textual.
- Uma captura representa o tema claro e a outra registra o seletor escuro ativo.
- O modo escuro não foi impresso com seus fundos reais; por isso, sua paleta foi documentada com os tokens oficiais da Quality.
- A página 4 contém apenas a continuação da última linha da tabela por causa da quebra de impressão. Na interface, a tabela deve permanecer contínua.
