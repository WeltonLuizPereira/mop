# MOP — Dashboard editorial e shell imersivo

**Data:** 2026-09-16  
**Status:** aprovado visualmente; aguardando revisão do documento  
**Escopo:** primeira entrega — shell global e Dashboard

## 1. Objetivo

Elevar o MOP ao acabamento visual das referências apresentadas sem alterar regras
de negócio, dados, filtros ou destinos de navegação. O modo claro adota uma
linguagem editorial luminosa inspirada no case Genova AI. O modo escuro adota
uma atmosfera operacional azul-marinho inspirada na presença visual da Hidram.
A posição e o comportamento dos componentes permanecem iguais nos dois temas.

O público é a equipe que acompanha pessoas, capacidade e movimentações da
operação. O Dashboard precisa permitir uma leitura rápida da situação geral e,
em seguida, a inspeção completa de cada ilha.

## 2. Escopo

### Incluído

- `AppShell`, menu lateral, topbar e alternância de tema.
- Dashboard e seus estados responsivos.
- Faixa de indicadores agregados.
- Grade completa de Ilhas em operação.
- Filtros de cliente, operação e ordenação.
- Hover/foco expandido de cada ilha.
- Anel Q usado como gráfico de rosca de provimento.
- Componentes fundamentais consumidos pelo Dashboard.
- Temas claro e escuro, acessibilidade e movimento reduzido.
- Testes do shell e Dashboard, build e inspeção visual.

### Excluído

- Redesign das demais rotas nesta entrega.
- Mudanças de banco, consultas, permissões ou regras de cálculo.
- Novos indicadores que não existam nos dados atuais.
- Alteração do roteamento ou do destino dos cards.

## 3. Direção visual

### 3.1 Modo claro — editorial

- `#FFFFFF` — canvas principal.
- `#F6F6F4` — superfície editorial secundária.
- `#191310` — texto principal.
- `#6B615C` — texto auxiliar.
- `#F27405` / `#F54E00` — ação, foco e provimento.
- `#E4E4E4` — hairlines e estrutura.

O layout usa espaço em branco, tipografia expressiva, painéis claros e laranja
concentrado. Sombras só aparecem quando há mudança real de plano, como no hover
expandido.

### 3.2 Modo escuro — imersivo

- `#061625` — canvas profundo.
- `#0A2032` — painéis.
- `#EAF2F7` — texto principal.
- `#91A5B5` — texto auxiliar.
- `#FF4D2E` — ação e foco luminoso.
- `#17364D` — linhas e superfícies elevadas.

O modo escuro não será uma inversão automática. Ele terá profundidade técnica,
contraste e iluminação controlada, sem alterar geometria ou ordem do conteúdo.

### 3.3 Tipografia

- **Archivo:** títulos e estrutura editorial.
- **IBM Plex Sans:** leitura e controles.
- **IBM Plex Mono:** percentuais, contagens, datas e métricas tabulares.

### 3.4 Assinatura

O elemento memorável é o **Anel Q vivo**: a própria marca Quality atua como
gráfico de rosca e comunica o percentual de provimento. Ele não pode ser
substituído por um donut circular genérico. Seu desenho, abertura e terminal da
letra Q permanecem reconhecíveis em todos os percentuais.

## 4. Estrutura

```text
┌──────────────┬──────────────────────────────────────────────────┐
│ marca / menu │ contexto, busca, notificações, tema e usuário   │
│              ├──────────────────────────────────────────────────┤
│ visão geral  │ título e leitura operacional do dia             │
│ pessoas      │ faixa agregada: PA, ativos, provimento, status  │
│ gestão       ├──────────────────────────────────────────────────┤
│ sistema      │ filtros                                          │
│              │ grade completa de Ilhas em operação             │
│              │ evolução e itens que pedem atenção              │
└──────────────┴──────────────────────────────────────────────────┘
```

O menu agrupa destinos reais e usa uma régua de seleção. O topo permanece
funcional e compacto. O Dashboard não esconde a grade abaixo de uma composição
promocional excessiva; a faixa agregada e as ilhas são o centro do produto.

## 5. Contrato das Ilhas em operação

Cada card preserva e exibe no estado normal:

- nome da ilha;
- cliente e operação;
- Anel Q com percentual de provimento;
- percentual e rótulo de provimento.

No hover e no foco por teclado, o card revela, sem perder o conteúdo-base:

- PA contratada;
- ativos;
- detalhamento completo por status disponível, incluindo ativos, férias,
  licença-maternidade, aviso prévio, afastados e realocados;
- avisos operacionais, como ilhas sem PA definida;
- qualquer informação já fornecida pelo card atual.

Nenhum dado será removido por motivo estético. Estados sem ocorrência podem ser
omitidos somente se o comportamento atual já fizer isso. O conteúdo expandido
não pode ficar inacessível por teclado ou toque. Em telas touch, o detalhe abre
por acionamento explícito; um segundo acionamento navega para a lista filtrada,
ou um link claramente nomeado realiza a navegação.

O card Geral Quality mantém borda de marca e consolidação das 15 ilhas. Cards
abaixo da meta recebem hierarquia de atenção sem depender apenas de cor. Cards
acima de 100% mostram o valor real, sem truncamento visual do anel.

## 6. Indicadores agregados

A faixa de resumo preserva todos os dados existentes:

- PA contratada;
- ativos;
- provimento geral;
- pessoas em férias;
- pessoas em aviso prévio;
- afastados;
- demais indicadores que o Dashboard atual já apresenta.

A apresentação pode mudar de uma faixa linear para um painel responsivo, mas
nenhuma métrica desaparece. Os valores continuam navegáveis quando atualmente
funcionam como atalho.

## 7. Interação e movimento

- Um único momento de entrada coordena shell, faixa e grade.
- Hover do card sinaliza mudança de plano e revela o detalhe.
- Foco por teclado produz o mesmo conteúdo e contraste do hover.
- O Anel Q pode animar uma vez até o percentual atual; não pulsa continuamente.
- `prefers-reduced-motion` remove transições não essenciais.
- Filtros e navegação preservam os handlers e destinos existentes.

## 8. Responsividade

- Desktop: quatro ilhas por linha quando houver espaço real.
- Tablet: duas colunas e menu compacto/gaveta.
- Mobile: uma coluna, filtros roláveis ou empilhados e detalhe acionável.
- A faixa agregada pode rolar horizontalmente ou quebrar em grade, sem ocultar
  métricas.
- A interface será verificada a partir de 320 px.

## 9. Estados e acessibilidade

- Contraste AA nos dois temas.
- Foco visível em todos os controles e cards acionáveis.
- Status nunca comunicado apenas por cor.
- Card com semântica de botão/link e nome acessível.
- Detalhe expandido associado ao card por `aria-expanded` e região nomeada.
- Carregamento, vazio e erro mantêm a geometria principal e informam a próxima
  ação possível.
- Alvos de toque de ao menos 44 px quando isolados.

## 10. Arquitetura de implementação

A lógica atual do Dashboard permanece em `DashboardPage`. A entrega evolui:

- tokens e estilos globais em `index.css`;
- shell em `components/shell`;
- composição do Dashboard em `pages/DashboardPage.tsx`;
- cards e agregados em `components/dashboard`;
- `AnelQ` como fonte de verdade para o gráfico de provimento.

Componentes novos só serão extraídos quando possuírem responsabilidade clara ou
mais de um consumidor. O redesign não criará uma segunda fonte de dados nem
duplicará cálculos existentes.

## 11. Autocrítica do frontend design

O primeiro mockup usava o padrão comum de “grande número + métricas auxiliares”.
Ele foi revisado para não transformar essa fórmula na assinatura do produto. A
personalidade específica do MOP será construída pelo Anel Q funcional, pela
densidade progressiva dos cards e pela faixa operacional completa. O destaque
superior continuará contido para não competir com as ilhas, que são o principal
instrumento de trabalho.

## 12. Validação

- Manter testes unitários existentes.
- Testar shell, troca de tema, filtros e navegação das ilhas.
- Testar hover, foco, toque e todos os dados do detalhe expandido.
- Testar Anel Q em 0%, valores intermediários, 100% e acima de 100%.
- Executar build e suíte unitária.
- Executar smoke E2E sem erros de console.
- Capturar e revisar desktop e mobile nos modos claro e escuro.
- Verificar contraste, clipping, reflow, teclado e movimento reduzido.

## 13. Critérios de aceite

- O modo claro reproduz a clareza editorial aprovada no mockup.
- O modo escuro possui atmosfera azul-marinho imersiva e legibilidade equivalente.
- Todos os cards de ilha permanecem na tela.
- Todos os dados existentes continuam disponíveis.
- O hover/foco mostra o detalhe completo de cada ilha.
- O símbolo Quality permanece como gráfico de rosca.
- Todos os filtros, atalhos e destinos atuais continuam funcionando.
- A grade é utilizável em desktop, tablet, mobile, teclado e toque.
- Testes, build e revisão visual passam sem regressões funcionais.
