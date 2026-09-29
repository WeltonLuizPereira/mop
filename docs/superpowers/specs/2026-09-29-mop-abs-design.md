# Módulo ABS — desenho técnico

## Objetivo

Adicionar ao MOP 2.1 uma seção de absenteísmo que substitua o processo manual de copiar a `BASE_ABS.xlsx` para a planilha `ABS_VR.xlsx`. O módulo deve importar automaticamente a base disponível na rede da empresa, cruzar os registros com os colaboradores do MOP pela matrícula e reproduzir no sistema a visão mensal da aba `ABS_OPERAÇÃO`.

## Escopo

O módulo inclui:

- agente local para importação automática da planilha;
- persistência dos registros de ponto e do histórico de execuções no Supabase;
- conciliação entre `BASE_ABS.re` e `mop_collaborators.matricula`;
- motor de classificação diária e totalização mensal;
- página ABS com filtros, calendário diário e indicadores;
- tratamento de matrículas não encontradas, divergências e valores desconhecidos;
- restrição de acesso para o perfil `VISUALIZADOR`;
- reprocessamento e diagnóstico técnico para administradores.
- migração do login atual para Supabase Auth, necessária para aplicar as permissões no servidor.

Não faz parte do escopo editar a planilha de origem ou manter a `ABS_VR.xlsx` como motor de cálculo após a migração.

## Arquitetura

### Agente ABS local

Um agente Node.js será instalado na máquina Windows indicada pelo usuário. Essa máquina possui acesso ao compartilhamento:

`\\192.168.0.115\Shared\Relatorios_Quality\MIS - Operações\VR\ABS\BASE_ABS.xlsx`

O Agendador de Tarefas do Windows iniciará o agente de segunda a sexta-feira às 10h15. Se o arquivo estiver indisponível, bloqueado para leitura ou ainda não tiver sido atualizado no dia, novas tentativas ocorrerão a cada 15 minutos até 12h.

O agente:

1. verifica existência e data de atualização do arquivo;
2. abre o arquivo somente para leitura;
3. valida a aba e os cabeçalhos obrigatórios;
4. normaliza datas, matrículas, departamentos e marcações;
5. classifica o status bruto de cada registro;
6. envia os dados em lotes ao Supabase;
7. registra o resultado completo da execução;
8. encerra com um código de saída compatível com o Agendador do Windows.

A credencial de integração será armazenada apenas na configuração local protegida da máquina. Nenhuma credencial privilegiada será incluída no bundle do navegador ou versionada no repositório.

### Supabase

O Supabase será a fonte de verdade do módulo ABS. O banco armazenará os dados brutos normalizados, as execuções de importação e as pendências. Consultas ou funções no banco consolidarão a competência solicitada com o cadastro atual do MOP.

### Aplicação MOP

A aplicação React consultará os dados consolidados no Supabase. O navegador não tentará acessar diretamente o compartilhamento SMB. A página ABS exibirá o painel mensal e permitirá ações administrativas sem participar da captura automática do arquivo.

## Fonte de dados

A `BASE_ABS.xlsx` possui uma aba `Sheet1` e os campos:

- `DATA`
- `NOME`
- `ENTRADA 1` a `ENTRADA 5`
- `SAÍDA 1` a `SAÍDA 5`
- `departamento`
- `re`

Na amostra analisada em 29 de setembro de 2026 havia 2.222 registros, sem duplicidade de `DATA + re`. Foram encontrados os departamentos `Operação 04` e `Operação 01` e os marcadores brutos `Férias`, `Ates`, `Falta`, `L. Mate` e `Declara`, além de horários.

O campo `departamento` será mantido para auditoria, mas não determinará cliente, operação, supervisor ou ilha no painel.

## Modelo de dados

### `mop_abs_records`

Um registro normalizado por colaborador e data, com no mínimo:

- data;
- matrícula normalizada;
- nome recebido da planilha;
- departamento recebido da planilha;
- dez marcações brutas de entrada e saída;
- status bruto identificado;
- status validado;
- identificador da execução de importação;
- data de criação e atualização.

A restrição única será `data + matrícula`. A carga usará `upsert`, tornando reprocessamentos idempotentes.

### `mop_abs_import_runs`

Cada tentativa registrará:

- início e término;
- caminho e data de modificação do arquivo;
- situação: aguardando, processando, concluída, concluída com pendências ou erro;
- quantidade de linhas lidas, incluídas, atualizadas, rejeitadas e sem correspondência;
- maior data de ponto presente no arquivo;
- mensagem resumida e detalhes técnicos seguros.

### `mop_abs_unmatched`

Pendências de matrícula conterão:

- data;
- RE normalizado;
- nome recebido da planilha;
- departamento;
- execução de origem;
- motivo;
- estado de resolução.

Após a correção do cadastro no MOP, uma nova importação ou um reprocessamento administrativo tentará resolver automaticamente a pendência.

### Políticas de acesso

As tabelas terão RLS. Leituras usadas pelo painel serão permitidas somente a usuários autenticados cujo perfil seja diferente de `VISUALIZADOR`. Operações privilegiadas de carga usarão a credencial exclusiva do agente. Reprocessamentos e detalhes técnicos ficarão restritos a `ADMIN`.

O login atual consulta usuários e senhas diretamente no navegador e, por isso, não fornece uma identidade verificável às políticas do Supabase. Como pré-requisito do módulo ABS, o MOP migrará para Supabase Auth:

- cada usuário ativo de `mop_users` receberá uma identidade Auth vinculada à matrícula;
- a tela continuará aceitando matrícula e senha;
- a autenticação produzirá uma sessão Supabase válida;
- o perfil de negócio permanecerá em tabela controlada e será associado ao usuário autenticado;
- as senhas deixarão de ser lidas ou comparadas pelo navegador;
- após validação da migração, senhas legadas em texto aberto serão removidas de `mop_users`;
- usuários inativos continuarão impedidos de entrar;
- a migração terá procedimento de recuperação para contas que não puderem ser convertidas automaticamente.

A criação e migração das identidades ocorrerá por uma rotina administrativa executada com credencial de serviço fora do navegador. Nenhuma chave privilegiada será incorporada à aplicação React.

## Cruzamento com o MOP

O vínculo principal será:

`BASE_ABS.re → mop_collaborators.matricula`

Os dois valores serão tratados como texto, com remoção de espaços e normalização segura, preservando zeros à esquerda. O nome da planilha será usado apenas para conferência e auditoria.

Após o vínculo, o sistema obterá do cadastro atual do MOP:

- nome oficial;
- cliente;
- operação;
- supervisor;
- ilha;
- status contratual;
- data de admissão;
- data de desligamento.

Os filtros de negócio serão baseados no MOP e incluirão VR BENEFÍCIOS, TIM e Underlabz, além das respectivas operações, supervisores e ilhas. Uma divergência entre o departamento da planilha e a estrutura cadastrada no MOP não bloqueará a carga, mas será sinalizada para conferência.

Registros sem correspondência serão preservados em `mop_abs_unmatched` e não participarão dos indicadores até serem vinculados.

## Classificação do registro importado

O agente examinará as marcações de entrada e saída do registro:

- presença de horário válido ou valor `P`: `P`;
- `Ates` ou `Declara`: `FJ`;
- `Falta`: `FI`;
- `Férias`: `FE`;
- `INSS`: `INSS`;
- `L. Mate`: `LM`;
- `FOLGA`: `FG`;
- `Amament`: `LAM`;
- `Licença Pa`: `LP`;
- `MT`: `MATRIMONIO`;
- valor textual desconhecido: pendência de qualidade e status diário `-` até correção.

Não haverá distinção entre `HOME` e `OFFICE`; ambos serão representados como `P`.

A comparação dos marcadores ignorará diferenças de caixa, espaços laterais e variações previsíveis de acentuação, mas preservará o valor original para auditoria.

## Motor diário

Para cada colaborador vinculado e cada dia da competência selecionada, o status exibido seguirá esta prioridade:

1. sábado ou domingo: `FG`;
2. colaborador desligado e data igual ou posterior à data de desligamento: `DES`;
3. data anterior à admissão: `-`;
4. data posterior à maior data de ponto da última importação válida: `-`;
5. status validado do registro importado;
6. ausência de registro em dia útil: `-`.

A ausência de registro não será convertida automaticamente em falta injustificada. A falta só contará como `FI` quando a fonte trouxer `Falta`.

## Totalizadores mensais

Para o recorte filtrado:

- faltas justificadas: quantidade de `FJ`, `LM`, `LP`, `FE`, `INSS`, `LAM` e `MATRIMONIO`;
- faltas injustificadas: quantidade de `FI`;
- total de faltas: faltas justificadas + faltas injustificadas;
- presenças: quantidade de `P`;
- ABS: `total de faltas / (presenças + total de faltas)`.

Quando o denominador for zero, o ABS será exibido como `0%`.

A fórmula foi validada contra a planilha real: 127 faltas e 1.528 presenças resultam em 7,67%.

## Página ABS

### Acesso

A opção ABS aparecerá para `ADMIN`, `GERENTE`, `COORDENADOR`, `SUPERVISOR`, `RH` e `SUPORTE`. O perfil `VISUALIZADOR` não verá a opção no menu e terá o acesso à rota bloqueado.

O bloqueio será aplicado em três níveis: menu, guarda de página e políticas/RPCs do Supabase. Alterar manualmente o estado ou a URL no navegador não permitirá consultar os dados.

### Cabeçalho e filtros

O topo exibirá:

- data e hora da última importação válida;
- estado da automação;
- filtros de mês/ano, cliente, operação, supervisor e ilha;
- acesso ao histórico de importações;
- contador e acesso aos REs não encontrados;
- ação de reprocessamento, visível somente para `ADMIN`.

Os filtros serão dependentes dos dados do MOP. A escolha de cliente limitará operações, supervisores e ilhas aplicáveis.

### Tabela mensal

A tabela terá colunas fixas para:

- matrícula;
- colaborador;
- supervisor;
- ilha;
- status contratual;
- FJ;
- FI;
- total de faltas;
- presenças;
- ABS.

Depois dessas colunas haverá uma coluna por dia, do dia 1 ao último dia da competência. O cabeçalho mostrará o número e o dia da semana. As células exibirão o código diário e usarão cores consistentes por status.

As colunas de identificação e indicadores permanecerão congeladas, com rolagem horizontal para o calendário. Totalizadores gerais responderão aos filtros aplicados.

### Pendências e histórico

A área de pendências exibirá RE, nome da fonte, data, departamento e motivo. O histórico mostrará situação, horários, arquivo, quantidades processadas e mensagem da execução. Detalhes técnicos e reprocessamento serão exclusivos de `ADMIN`.

## Tratamento de falhas

- A última carga válida continuará disponível se uma nova execução falhar.
- Uma planilha com cabeçalhos ausentes ou estrutura inválida será rejeitada integralmente.
- Uma linha inválida será isolada e registrada sem impedir linhas válidas, desde que a estrutura do arquivo seja válida.
- Falhas parciais no envio serão retomáveis e não criarão duplicatas.
- O agente nunca gravará no arquivo de origem.
- O painel distinguirá arquivo aguardado, arquivo desatualizado, processamento, sucesso, sucesso com pendências e erro.
- Logs locais não armazenarão credenciais nem dados pessoais desnecessários.

## Instalação e operação

A entrega incluirá:

- configuração do agente por variáveis de ambiente locais;
- script de instalação ou instruções reproduzíveis para o Agendador de Tarefas;
- verificação de conectividade com o compartilhamento e o Supabase;
- documentação de execução manual para diagnóstico;
- documentação de rotação da credencial;
- procedimento de desativação e reinstalação.

## Testes e critérios de aceitação

### Testes automatizados

- normalização de matrícula e datas;
- reconhecimento de horários e marcadores;
- mapeamento de todos os status, incluindo `Declara → FJ`;
- prioridade das regras do motor diário;
- totais FJ, FI, faltas, presenças e ABS;
- denominador zero;
- idempotência por `data + matrícula`;
- identificação e posterior resolução de RE não encontrado;
- divergência entre departamento da fonte e estrutura do MOP;
- visibilidade e bloqueio do perfil `VISUALIZADOR`;
- restrição das ações administrativas;
- autenticação por matrícula com sessão Supabase válida;
- migração de usuário ativo, bloqueio de inativo e remoção do acesso a senhas legadas;
- rejeição de consultas ABS feitas sem sessão ou por `VISUALIZADOR`;
- filtros dependentes e calendário de competências com 28 a 31 dias.

### Validação integrada

Antes da conclusão, uma competência completa será processada a partir de uma cópia da `BASE_ABS.xlsx` real. Os totais por colaborador, supervisor e visão geral serão comparados com `ABS_VR.xlsx`, respeitando as correções deliberadas deste desenho, especialmente `Declara → FJ`, o vínculo por matrícula e os clientes provenientes do MOP.

### Critérios de aceite

O módulo será aceito quando:

1. a carga automática ocorrer sem o navegador aberto;
2. reexecuções não duplicarem registros;
3. REs ausentes ficarem visíveis e recuperáveis;
4. a página reproduzir os códigos diários e totalizadores aprovados;
5. o ABS corresponder à fórmula de faltas sobre presenças mais faltas;
6. VR BENEFÍCIOS, TIM e Underlabz forem filtrados conforme o cadastro do MOP;
7. `VISUALIZADOR` não conseguir acessar o módulo;
8. falhas e última atualização forem claramente auditáveis.
9. o navegador não consultar nem receber senhas cadastradas de usuários.
