# Sincronizacao do cache com Supabase

O MOP mantem os dados compartilhados em cache no navegador e usa o Supabase Realtime para invalidar somente o recurso alterado. As leituras HTTP continuam sendo a fonte da verdade: se o canal Realtime falhar, os dados em cache permanecem disponiveis e uma nova leitura tenta revalida-los.

## Preparar o banco

Execute primeiro o arquivo `mop_history_sync_indexes.sql` no SQL Editor do projeto ou com uma ferramenta PostgreSQL conectada ao banco:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f mop_history_sync_indexes.sql
```

Depois, como proprietario da publicacao, adicione as seis tabelas ao Realtime. O bloco e idempotente e pode ser executado novamente:

```sql
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'mop_collaborators',
    'mop_clients',
    'mop_operations',
    'mop_ilhas',
    'mop_coordinators',
    'mop_supervisors'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        table_name
      );
    END IF;
  END LOOP;
END $$;
```

Confirme a publicacao:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'mop_%'
ORDER BY tablename;
```

## Verificar RLS e leitura

O Realtime respeita as permissoes de `SELECT` do usuario conectado. Confira se RLS esta habilitado e quais politicas cobrem as tabelas:

```sql
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = ANY (ARRAY[
    'mop_collaborators', 'mop_clients', 'mop_operations',
    'mop_ilhas', 'mop_coordinators', 'mop_supervisors'
  ])
ORDER BY c.relname;

SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = ANY (ARRAY[
    'mop_collaborators', 'mop_clients', 'mop_operations',
    'mop_ilhas', 'mop_coordinators', 'mop_supervisors'
  ])
  AND cmd IN ('SELECT', 'ALL')
ORDER BY tablename, policyname;
```

Cada tabela com RLS habilitado precisa de uma politica `SELECT` (ou `ALL`) aplicavel ao papel usado pelo aplicativo. Nao desabilite RLS para contornar uma politica ausente; ajuste a politica de acordo com o modelo de acesso do projeto.

## Validacao com duas janelas

1. Abra a mesma instalacao do MOP em duas janelas e aguarde a carga inicial.
2. Na primeira janela, altere nome, alocacao e status de um colaborador e salve.
3. Na segunda janela, confirme que os tres campos mudam sem recarregar a pagina.
4. Repita uma alteracao para cada cadastro compartilhado: clientes, operacoes, ilhas, coordenadores e supervisores.
5. Nas ferramentas do navegador, mude a rede para `Offline`.
6. Navegue entre telas ja visitadas e confirme que os dados em cache continuam visiveis; uma tentativa de revalidacao pode exibir o estado de desatualizacao/erro sem apagar os dados anteriores.
7. Restaure a rede e confirme que a reconexao revalida os seis recursos.

## Diagnostico

- Nenhum evento chega: confirme a lista em `pg_publication_tables` e o projeto/URL usado pelo frontend.
- Apenas uma tabela nao atualiza: confira a politica `SELECT` dessa tabela e se ela consta na publicacao.
- O canal conecta, mas a tela demora: procure erros na requisicao HTTP disparada depois da invalidacao; o evento apenas solicita a revalidacao do cache.
- Eventos duplicados: verifique se existe somente um `DataProvider` montado. Cada provider abre um canal por tabela.
- Reconexao sem dados novos: confira no console de rede se as seis consultas HTTP ocorreram depois do status `SUBSCRIBED`.
- Cache vazio durante falha: visite a tela uma vez com rede ativa. O modo degradado preserva dados previamente carregados, mas nao inventa uma primeira resposta sem conexao.

Para a verificacao automatizada antes de publicar, execute:

```bash
npm test
npm run build
git diff --check
```
