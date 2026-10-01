-- Hotfix dos alertas Supabase Advisor observados em 2026-10-01.
-- As seis tabelas abaixo ja possuem a policy legada "Enable all for all".
-- Habilitar RLS preserva o comportamento atual do MOP e corrige os lints
-- policy_exists_rls_disabled e rls_disabled_in_public.

begin;

alter table public.mop_clients enable row level security;
alter table public.mop_collaborators enable row level security;
alter table public.mop_coordinators enable row level security;
alter table public.mop_ilhas enable row level security;
alter table public.mop_operations enable row level security;
alter table public.mop_supervisors enable row level security;

-- Os dados brutos do ABS nao sao acessados diretamente pelo navegador.
-- O agente usa service_role e a tela usa somente as RPCs mop_abs_*.
do $hotfix$
declare
  table_name text;
begin
  foreach table_name in array array[
    'mop_abs_import_runs',
    'mop_abs_records',
    'mop_abs_unmatched'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all on table public.%I from anon, authenticated', table_name);
    end if;
  end loop;
end
$hotfix$;

-- Politicas negativas documentam que o bloqueio das tabelas brutas e
-- intencional e eliminam o aviso informativo rls_enabled_no_policy.
-- service_role ignora RLS e continua sendo o unico escritor direto.
drop policy if exists "Deny direct client access" on public.mop_abs_import_runs;
create policy "Deny direct client access" on public.mop_abs_import_runs
  for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access" on public.mop_abs_records;
create policy "Deny direct client access" on public.mop_abs_records
  for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access" on public.mop_abs_unmatched;
create policy "Deny direct client access" on public.mop_abs_unmatched
  for all to anon, authenticated using (false) with check (false);

-- Aborta a transacao se alguma das tabelas relatadas pelo Advisor continuar
-- sem RLS. Assim o SQL nunca informa sucesso parcial silenciosamente.
do $verify$
declare
  missing_tables text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
    into missing_tables
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[
      'mop_clients',
      'mop_collaborators',
      'mop_coordinators',
      'mop_ilhas',
      'mop_operations',
      'mop_supervisors'
    ])
    and not c.relrowsecurity;

  if missing_tables is not null then
    raise exception 'RLS nao foi habilitado em: %', missing_tables;
  end if;
end
$verify$;

do $verify_abs_policies$
declare
  missing_policies text;
begin
  select string_agg(t.table_name, ', ' order by t.table_name)
    into missing_policies
  from unnest(array[
    'mop_abs_import_runs',
    'mop_abs_records',
    'mop_abs_unmatched'
  ]) as t(table_name)
  where not exists (
    select 1
    from pg_catalog.pg_policy p
    join pg_catalog.pg_class c on c.oid = p.polrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = t.table_name
      and p.polname = 'Deny direct client access'
  );

  if missing_policies is not null then
    raise exception 'Politica de bloqueio ausente em: %', missing_policies;
  end if;
end
$verify_abs_policies$;

commit;
