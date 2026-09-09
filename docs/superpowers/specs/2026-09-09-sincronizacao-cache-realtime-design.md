# Sincronização entre interface e Supabase

## Objetivo

Reduzir o tempo percebido de abertura das telas e manter os dados coerentes entre usuários. A primeira etapa introduz um cache compartilhado no cliente. A segunda conecta o Supabase Realtime ao mesmo cache, sem duplicar a lógica de dados nas páginas.

## Escopo

A primeira entrega cobre colaboradores, clientes, operações, ilhas, coordenadores e supervisores. Colaboradores, Detalhes, Dashboard e formulários serão os primeiros consumidores migrados; telas analíticas entram em seguida sobre a mesma API.

Histórico, férias, tarefas agendadas, rotinas automáticas e importação em lote continuam com consultas especializadas. Eles serão otimizados em fases posteriores, pois possuem paginação, filtros e regras de gravação diferentes dos cadastros compartilhados.

## Arquitetura

Um `DataProvider` será instalado no topo da aplicação. Ele exporá hooks tipados por recurso e manterá, para cada recurso:

- dados confirmados pelo Supabase;
- estado de primeira carga;
- erro mais recente;
- horário da última confirmação;
- promessa em andamento, para deduplicar solicitações concorrentes.

O repositório compartilhado será independente dos componentes React. O provider apenas assinará seu estado e administrará seu ciclo de vida. Essa separação permite testar cache, concorrência e invalidação sem renderizar telas.

O serviço Supabase continuará responsável por mapear nomes de colunas e executar operações remotas. Ele não guardará estado visual.

## Fluxo de leitura

Na primeira solicitação, o repositório consulta o serviço e compartilha a mesma promessa com todos os consumidores. Depois da resposta, os dados ficam disponíveis para qualquer tela.

Ao navegar, a tela exibe imediatamente o cache existente. Se o dado estiver vencido, uma revalidação silenciosa ocorre em segundo plano. A validade inicial será de 60 segundos; eventos Realtime e invalidações explícitas continuam tendo precedência.

Uma tela sem cache mostra o estado de carregamento. Uma tela com cache vencido conserva os dados visíveis enquanto atualiza, evitando retornar temporariamente para campos vazios.

## Fluxo de gravação

Toda escrita deve propagar erros do Supabase. A interface somente fecha o formulário e informa sucesso depois da confirmação remota.

Após uma gravação confirmada, apenas os recursos afetados são invalidados. O mecanismo global `dataVersion`, que remonta páginas e recarrega tabelas sem relação com a alteração, será removido gradualmente.

A primeira etapa usará invalidação seguida de revalidação. Atualização otimista fica fora do escopo inicial para evitar divergência enquanto os erros silenciosos do serviço são corrigidos.

## Supabase Realtime

Na segunda etapa, uma assinatura por tabela observada será criada enquanto o provider estiver montado. Eventos `INSERT`, `UPDATE` e `DELETE` invalidarão ou atualizarão o recurso correspondente.

As assinaturas serão removidas no desmontar do provider. Reconexões usarão revalidação completa do recurso para recuperar eventos possivelmente perdidos.

O Realtime será uma aceleração de consistência, não a única fonte de verdade. Carga inicial, invalidação após escrita e revalidação por validade continuarão funcionando se o canal estiver indisponível.

## Erros e concorrência

- Falha na primeira leitura apresenta erro com opção de nova tentativa.
- Falha de revalidação conserva o cache anterior e sinaliza que ele pode estar desatualizado.
- Falha de escrita não altera o cache como se tivesse sido confirmada.
- Respostas antigas não podem sobrescrever uma invalidação ou resposta mais recente; cada recurso terá uma geração de solicitação.
- Consultas simultâneas do mesmo recurso compartilham uma promessa.
- Recursos diferentes continuam carregando em paralelo.

## Migração

1. Criar e testar o repositório compartilhado.
2. Instalar o `DataProvider` e hooks tipados.
3. Migrar Colaboradores, Detalhes, Dashboard e `CollaboratorFormModal`.
4. Corrigir propagação de erros nas gravações usadas por essas telas.
5. Migrar as telas analíticas e remover recargas redundantes.
6. Remover gradualmente `dataVersion` quando nenhum consumidor depender dele.
7. Adicionar Realtime, reconexão e invalidação por evento.
8. Otimizar histórico, importação e rotinas automáticas em entregas separadas.

Cada passo deve manter a aplicação utilizável e pode ser publicado independentemente.

## Testes e validação

Testes unitários devem provar:

- deduplicação de duas leituras simultâneas;
- retorno imediato do cache ainda válido;
- conservação do cache durante revalidação;
- invalidação seletiva;
- proteção contra resposta antiga;
- propagação de falhas de escrita;
- aplicação e remoção de eventos Realtime.

Testes das páginas devem demonstrar que a navegação reutiliza dados carregados e que uma alteração externa aparece sem atualizar o navegador. A validação de cada entrega inclui a suíte completa e o build de produção.

## Critérios de aceite

- Navegar entre as telas migradas não repete consultas enquanto o cache estiver válido.
- Duas telas que solicitam o mesmo recurso simultaneamente causam uma única consulta remota.
- Dados existentes permanecem visíveis durante revalidação.
- Falhas de escrita são apresentadas e não produzem sucesso falso.
- Uma alteração feita por outro cliente aparece nas telas migradas por Realtime.
- A aplicação continua funcional quando o canal Realtime estiver indisponível.
