# MOP — Finalização da interface Quality

**Data:** 2026-08-17  
**Status:** Aprovado em conversa; aguardando revisão do documento  
**Complementa:** `2026-08-14-mop-redesign-quality-design.md`

## 1. Contexto

O MOP já concluiu a primeira leva da nova identidade Quality nas superfícies que
definem a primeira impressão: login, shell, Mapa Operacional e lista de
colaboradores. A aplicação está funcional, com 22 rotas navegáveis, 101 testes
unitários e oito testes E2E passando.

As demais telas foram extraídas do antigo monólito, mas ainda carregam decisões
visuais anteriores: escalas cromáticas azuis e índigo, tokens VERT que já não
existem, cards com sombras e raios divergentes, tabelas HTML reimplementadas,
controles nativos inconsistentes e cores fixas que não acompanham o tema escuro.
Uma camada de compatibilidade iniciada em `index.css` reduz parte da divergência,
mas não resolve contraste, semântica, responsividade ou consistência estrutural.

## 2. Objetivo

Finalizar somente a interface das telas restantes, estendendo de forma explícita
o design system Quality já aprovado. A entrega deve tornar todas as rotas
coerentes em hierarquia, cor, tipografia, densidade, responsividade, estados de
interface, acessibilidade visual e tema escuro, sem alterar regras de negócio.

## 3. Escopo

### 3.1 Incluído

- Evolução dos primitivos visuais compartilhados.
- Criação de compostos visuais usados por dois ou mais fluxos.
- Migração das telas legadas para tokens e componentes Quality.
- Tratamento responsivo de tabelas, formulários, modais e visualizações especiais.
- Paridade visual real entre os temas claro e escuro.
- Estados explícitos de carregamento, vazio, erro e confirmação.
- Acessibilidade de foco, teclado, contraste e alvos de toque.
- Testes de interface proporcionais ao risco de cada arquétipo.
- Remoção dos shims legados somente após o último consumidor migrar.

### 3.2 Excluído

- Mudanças de banco de dados ou integrações.
- Alterações de regras de negócio, permissões ou perfis.
- Novos recursos de produto.
- Redesenho de navegação ou troca do roteamento atual.
- Otimização de bundle e code splitting.
- Reescrita funcional das páginas.

## 4. Direção visual

A interface adota o **registro operacional Quality**: estrutura por faixas,
hairlines, tabelas e painéis rasos, com densidade adequada a um sistema interno
de gestão de pessoas. Cards soltos, icon tiles coloridos, sombras promocionais e
pílulas decorativas deixam de ser o mecanismo padrão de organização.

```text
TÍTULO DA TELA                                      [Ação principal]
Contexto curto, orientação ou contagem real
──────────────────────────────────────────────────────────────────
[Filtros coerentes e compactos]
┌────────────────────────────────────────────────────────────────┐
│ dados densos, claros e roláveis                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.1 Cor

Os tokens existentes permanecem como fonte de verdade:

| Papel | Claro | Escuro |
|---|---|---|
| Canvas | `#FFFFFF` | `#121110` |
| Canvas suave | `#FAFAFA` | `#1A1817` |
| Tinta | `#191310` | `#F5F1EF` |
| Linha forte | `#CFCFCF` | `#423D3A` |
| Marca/ação | `#F27405` | `#F27405` |
| Marca textual | `#D04200` | `#F27405` |

Regras:

- Laranja significa ação, foco, seleção ou atenção.
- Texto sobre preenchimento laranja usa `--on-brand`, nunca branco.
- Texto laranja sobre canvas usa `--brand-text`, nunca `--brand` no tema claro.
- `--ink-faint` não comunica informação essencial; texto pequeno usa ao menos
  `--ink-mute`.
- Bordas de controles e indicadores de foco atingem 3:1 contra o entorno.
- Status de colaborador mantêm ponto de cor mais rótulo textual.
- Estados que não são status de colaborador usam tag neutra ou feedback
  semântico, não o componente `Badge` de status.
- Cores de gráficos, Gantt e organograma derivam de variáveis do tema.

### 4.2 Tipografia

- **Archivo:** títulos, seções, cabeçalhos e estrutura.
- **IBM Plex Sans:** campos, botões, texto de interface e leitura.
- **IBM Plex Mono:** matrícula, data, horário, porcentagem e métricas tabulares.

Os registros `t-display-*`, `t-eyebrow` e `t-data` substituem combinações locais
de tamanho, peso, tracking e caixa alta. O título da rota permanece na barra
superior; a página não o duplica sem necessidade.

### 4.3 Forma e elevação

- Campos e botões: raio de 6px.
- Tags e alertas: 8px.
- Painéis e tabelas: 12px.
- Modais: 16px.
- Sombras ficam restritas a sobreposições e mudança real de plano.
- Painéis comuns usam borda e, no máximo, elevação nível 1.
- A escala espacial continua baseada em 8px.

### 4.4 Assinatura

O Anel Q continua sendo o único gesto orgânico e animado do sistema. Ele aparece
somente no login, na marca lateral e nos tiles de ilha. Não será usado para
decorar métricas, vazios, gráficos ou cabeçalhos. A contenção preserva sua força
e mantém o restante da aplicação preciso e operacional.

## 5. Arquitetura visual

A lógica e as consultas permanecem dentro das páginas atuais. A composição
visual se organiza em três níveis:

```text
AppShell existente
└── Página
    ├── compostos de página
    │   ├── PageToolbar
    │   ├── FilterBar
    │   ├── MetricStrip
    │   └── SegmentedControl
    ├── painéis de conteúdo
    │   ├── Table evoluída
    │   ├── EmptyState
    │   ├── LoadingState
    │   └── InlineNotice
    └── primitivos
        ├── Button / IconButton
        ├── Input / Select / MultiSelect / Field
        ├── Badge / Tag
        ├── Card
        └── Modal
```

Um composto compartilhado só deve existir quando tiver pelo menos dois
consumidores reais. Visualizações singulares permanecem locais, mas consomem os
mesmos tokens. Não será criado um componente universal com condicionais para
todos os tipos de página.

## 6. Contratos dos componentes

### 6.1 Button e IconButton

- Variantes: primária, secundária, ghost, danger e solid-danger.
- Tamanhos explícitos, incluindo alvo móvel mínimo de 44px quando o controle
  estiver isolado.
- Botão somente com ícone exige nome acessível.
- Cor, foco, hover, disabled e loading vêm do componente, não de classes locais.

### 6.2 Field, Input, Select e MultiSelect

- `Field` associa label, controle, ajuda e erro.
- Altura, borda, foco, disabled e texto auxiliar são uniformes.
- Valores tabulares podem usar a variante tipográfica `data`.
- `MultiSelect` oferece listbox real, setas, Escape, anúncio de seleção e alvos
  de remoção adequados ao toque.
- Margens externas pertencem ao layout consumidor, não ao campo.

### 6.3 Table

- Contêiner rolável horizontalmente, focável e identificado.
- Cabeçalho Quality, células de texto, data/número e ação.
- Linha acionável responde a ponteiro, Enter e Espaço com semântica coerente.
- Suporte visual a seleção, toolbar, carregamento e vazio.
- Tabelas de dados mantêm densidade; não viram uma pilha de cards no mobile.

### 6.4 Badge e Tag

- `Badge` fica restrito aos sete status de colaborador previstos no design system.
- `Tag` representa categorias neutras como “Programado”, “Em gozo”, “Sim” e
  “Não”, sem disputar semanticamente com status ou ação.

### 6.5 Modal

- `role="dialog"`, nome acessível e `aria-modal`.
- Foco inicial previsível, ciclo de Tab/Shift+Tab, Escape e retorno ao acionador.
- Fundo inerte e rolagem da página bloqueada enquanto aberto.
- Corpo rolável e rodapé responsivo a 320px.

### 6.6 Compostos de página

- `PageToolbar`: contexto curto, filtros e ação principal; quebra em linhas no
  tablet/mobile.
- `FilterBar`: rótulos visíveis e ação consistente para limpar filtros.
- `MetricStrip`: contagens reais em uma faixa linear separada por hairlines.
- `SegmentedControl`: alternância entre modos ou abas, com seleção semântica.
- `EmptyState`: explica o estado e oferece somente uma próxima ação relevante.
- `LoadingState`: não se confunde com vazio e é anunciado por tecnologia
  assistiva.
- `InlineNotice`: feedback informativo, positivo, de atenção ou erro sem criar
  uma nova paleta decorativa.

## 7. Arquétipos de tela

### 7.1 CRUD e detalhe

**Rotas:** Clientes, Operações, Ilhas, Coordenadores, Supervisores, Usuários e
detalhe do colaborador.

- Migrar `CrudPage` dos tokens VERT inexistentes para Quality.
- Usar uma toolbar, tabela e modal comuns nas seis rotas de cadastro.
- Organizar detalhe do colaborador em seções de definição, reduzindo a coleção
  de cards brancos com sombra.
- Reutilizar `ClientLogo` e os tratamentos de status já estabelecidos.

### 7.2 Listas operacionais

**Rotas:** Aniversariantes, Aviso prévio, Afastados e licenças, Desligados,
Férias, Histórico e Tarefas agendadas.

- Aplicar o mesmo ritmo de toolbar, filtros, tabela e estado vazio.
- Garantir rolagem interna em todas as tabelas estreitas.
- Substituir avatares e pílulas cromáticas por identificação e status
  semanticamente corretos.
- Usar `MetricStrip` somente para contagens reais que ajudam a interpretar a
  lista; não criar KPIs decorativos.

### 7.3 Fluxos em massa

**Rotas:** Importar dados e Atualização em massa.

- Organizar etapas por `SegmentedControl`, dropzone, prévia tabular e barra de
  seleção.
- Preservar as ações e validações atuais.
- Corrigir CTA laranja para `--on-brand` e remover sombra promocional.
- Unificar confirmações e resultados no `Modal`/`InlineNotice` compartilhado.

### 7.4 Visualizações especiais

**Rotas:** Turnover, Vencimento de contratos/Gantt e Organograma.

- **Turnover:** trocar o mosaico cromático por faixa métrica e painéis de
  gráfico; grid, eixos, cursor, séries e tooltip acompanham o tema.
- **Gantt:** manter a natureza horizontal; tornar a coluna de pessoas
  compactável e garantir espaço útil para a linha do tempo em telas estreitas.
- **Organograma:** substituir o arco-íris de níveis por diferenças de forma,
  rótulo e hairline; implementar pan/zoom com pointer/touch e controles
  acessíveis.

### 7.5 Utilitários

**Rotas:** Sobre e Resetar dados.

- `Sobre` usa a marca Quality e uma lista compacta de propriedades da aplicação,
  sem estética promocional.
- `Resetar dados` se torna uma `DangerZone` clara, com descrição da consequência
  e confirmação em modal antes da ação existente.

## 8. Estados de interface

Cada página distingue quatro estados:

1. **Carregando:** mensagem/status explícito enquanto a consulta está pendente.
2. **Vazio:** conteúdo carregado e sem registros, com orientação contextual.
3. **Erro:** motivo compreensível e “Tentar novamente” quando a operação puder
   ser repetida.
4. **Conteúdo:** dados, filtros e ações normais.

Confirmações usam a mesma palavra da ação: “Salvar” produz “Alterações salvas”;
“Importar” produz “Dados importados”. Mensagens não pedem desculpas nem usam
texto genérico como “Algo deu errado”.

Esses estados representam o ciclo das requisições existentes; não introduzem
novas operações de dados.

## 9. Responsividade

- O shell continua usando gaveta abaixo de 900px e passa a usar altura dinâmica
  segura para navegadores móveis.
- Toolbars e filtros quebram em linhas sem esconder ações.
- Tabelas rolam dentro do próprio painel, sem ampliar ou recortar o documento.
- Cabeçalhos internos empilham conteúdo a partir do espaço disponível.
- Modais e formulários passam de duas colunas para uma em telas estreitas.
- A interface é verificada a partir de 320px.
- Gantt preserva a linha do tempo por meio de coluna lateral compactável.
- Organograma aceita ponteiro, toque e teclado para alcançar conteúdo fora do
  primeiro viewport.

## 10. Acessibilidade

- Incluir link “Pular para o conteúdo”.
- Garantir foco visível com contraste mínimo de 3:1.
- Garantir contraste AA para textos e controles nos dois temas.
- Nomear todos os icon buttons e expor estado expandido quando aplicável.
- Fazer gaveta, notificações, modais, linhas acionáveis e multiselect operáveis
  por teclado.
- Não comunicar status ou urgência somente por cor.
- Anunciar carregamento, erro e confirmação de forma apropriada.
- Preservar conteúdo e ações com zoom e reflow.

## 11. Tema escuro

O tema escuro não será validado apenas pela presença da classe `.dark`. Todas as
superfícies, bordas, campos, sombras, gráficos, tooltips, estados e componentes
nativos precisam apresentar resultado visual equivalente. A raiz declara
`color-scheme` coerente para que controles de data, hora e select acompanhem o
tema.

Hexadecimais locais só permanecem em ativos de marca ou quando representam um
dado cromático que não pode ser tokenizado. Gráficos e visualizações usam
variáveis semânticas como grid, eixo, tooltip, positiva e negativa.

## 12. Estratégia de migração

1. Fortalecer tokens e primitivos; criar os compostos com consumidores reais.
2. Migrar `CrudPage`, Usuários e detalhe do colaborador.
3. Aplicar o padrão de lista em Histórico, Aniversariantes, Aviso prévio,
   Afastados e Tarefas; depois Desligados e Férias.
4. Migrar Importação e Atualização em massa.
5. Tokenizar Vencimento de contratos/Gantt, Turnover e Organograma.
6. Finalizar Sobre e Resetar dados.
7. Remover shims VERT, `gray-*` e `brand-N` somente quando buscas no repositório
   provarem que não há consumidores relevantes.

A alteração já presente em `index.css` no início deste trabalho é preservada
como trabalho do usuário e tratada inicialmente como compatibilidade. Ela não
será descartada nem sobrescrita de forma indiscriminada.

## 13. Validação

### 13.1 Testes automatizados

- Manter os 101 testes unitários e os oito E2E atuais.
- Testar contratos dos primitivos e compostos alterados.
- Manter smoke das 22 rotas sem erro de console.
- Exercitar ao menos um representante de cada arquétipo em 360px, 768px e
  1440px, nos temas claro e escuro.
- Testar rolagem horizontal interna e alcance da última coluna.
- Testar modais, gaveta e multiselect por teclado.
- Verificar foco, contraste computado e ausência de recorte.

### 13.2 Inspeção visual

- Comparar páginas do mesmo arquétipo lado a lado.
- Inspecionar estados normal, hover, foco, disabled, loading, vazio e erro.
- Revisar claro e escuro nos três viewports-alvo.
- Remover uma decoração sem função sempre que a composição parecer competir com
  o conteúdo.

## 14. Critérios de aceite

A finalização está concluída quando:

- todas as 22 rotas usam a linguagem Quality sem tokens VERT quebrados;
- laranja aparece apenas nos papéis semânticos definidos;
- não há texto branco sobre o laranja principal;
- todas as tabelas estreitas permitem alcançar suas colunas;
- modais e controles compostos funcionam por teclado;
- Turnover, Gantt e Organograma são utilizáveis nos dois temas e em mobile;
- carregamento não é confundido com vazio;
- os shims removidos não têm consumidores restantes;
- testes unitários, TypeScript, build e E2E passam;
- a revisão visual não encontra clipping, contraste insuficiente ou hierarquia
  conflitante nos viewports-alvo.

