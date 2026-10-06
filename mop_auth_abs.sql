create extension if not exists pgcrypto;
create table if not exists public.mop_abs_import_runs(id uuid primary key default gen_random_uuid(),started_at timestamptz not null default now(),finished_at timestamptz,source_path text not null,source_modified_at timestamptz,status text not null,rows_read integer not null default 0,rows_upserted integer not null default 0,unmatched_count integer not null default 0,max_work_date date,message text);
create table if not exists public.mop_abs_records(id bigint generated always as identity primary key,work_date date not null,matricula text not null,source_name text not null,source_department text,punches jsonb not null default '[]',raw_status text,validated_status text not null,import_run_id uuid not null references public.mop_abs_import_runs(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(work_date,matricula));
create table if not exists public.mop_abs_unmatched(id bigint generated always as identity primary key,work_date date not null,matricula text not null,source_name text not null,source_department text,reason text not null,import_run_id uuid not null references public.mop_abs_import_runs(id),resolved_at timestamptz,unique(work_date,matricula));

alter table public.mop_abs_import_runs enable row level security;
alter table public.mop_abs_records enable row level security;
alter table public.mop_abs_unmatched enable row level security;
revoke all on table public.mop_abs_import_runs from anon, authenticated;
revoke all on table public.mop_abs_records from anon, authenticated;
revoke all on table public.mop_abs_unmatched from anon, authenticated;

-- Holidays mechanism
create table if not exists public.mop_holidays(
  holiday_date date primary key,
  description text
);

alter table public.mop_holidays enable row level security;
revoke all on table public.mop_holidays from anon, authenticated;

drop policy if exists "Enable read access for authenticated users" on public.mop_holidays;
create policy "Enable read access for authenticated users" on public.mop_holidays
  for select to authenticated using (true);

drop policy if exists "Enable insert/update/delete for admins" on public.mop_holidays;
create policy "Enable insert/update/delete for admins" on public.mop_holidays
  for all to authenticated
  using (
    exists (
      select 1 from public.mop_users u
      where u.id = auth.uid()::text and u.role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.mop_users u
      where u.id = auth.uid()::text and u.role = 'ADMIN'
    )
  );

create or replace function public.mop_add_holiday(p_date date, p_description text default 'Feriado Geral (FG)')
returns void
language sql
security definer
as $$
  insert into public.mop_holidays (holiday_date, description)
  values (p_date, p_description)
  on conflict (holiday_date) do update set description = excluded.description;
$$;

revoke all on function public.mop_add_holiday(date, text) from public;
grant execute on function public.mop_add_holiday(date, text) to authenticated;

drop policy if exists "Deny direct client access" on public.mop_abs_import_runs;
create policy "Deny direct client access" on public.mop_abs_import_runs
  for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access" on public.mop_abs_records;
create policy "Deny direct client access" on public.mop_abs_records
  for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny direct client access" on public.mop_abs_unmatched;
create policy "Deny direct client access" on public.mop_abs_unmatched
  for all to anon, authenticated using (false) with check (false);

drop function if exists public.mop_abs_last_import();

create or replace function public.mop_abs_last_import(p_month date)
returns table(status text,finished_at timestamptz,max_work_date date,rows_read integer,unmatched_count integer)
language sql
stable
security definer
set search_path = public
as $$
  with latest_run as (
    select r.status, r.finished_at, r.unmatched_count
    from public.mop_abs_import_runs r
    where r.status in ('COMPLETED', 'concluida')
    order by r.finished_at desc nulls last
    limit 1
  )
  select
    latest_run.status,
    latest_run.finished_at,
    max(records.work_date) as max_work_date,
    count(records.id)::integer as rows_read,
    latest_run.unmatched_count
  from latest_run
  left join public.mop_abs_records records
    on records.work_date >= date_trunc('month', p_month)::date
    and records.work_date < (date_trunc('month', p_month) + interval '1 month')::date
    and records.work_date <= (now() at time zone 'America/Sao_Paulo')::date - 1
  group by latest_run.status, latest_run.finished_at, latest_run.unmatched_count
$$;

drop function if exists public.mop_abs_month(date, text, text, text, text);

create or replace function public.mop_abs_month(p_month date,p_client_id text default null,p_operation_id text default null,p_coordinator_id text default null,p_supervisor_id text default null,p_ilha_id text default null)
returns table(matricula text,collaborator_name text,supervisor_name text,ilha_name text,employment_status text,justified_absences bigint,unjustified_absences bigint,total_absences bigint,presences bigint,abs_rate numeric,daily_statuses jsonb)
language sql
stable
security definer
set search_path = public
as $$
with bounds as (
  select
    date_trunc('month', p_month)::date as start_date,
    (date_trunc('month', p_month) + interval '1 month - 1 day')::date as end_date,
    least(
      coalesce(
        (select max(max_work_date) from public.mop_abs_import_runs where status in ('COMPLETED', 'concluida')),
        p_month - 1
      ),
      (now() at time zone 'America/Sao_Paulo')::date - 1
    ) as cutoff
),
people as (
  select c.*, s.nome as supervisor_name, i.nome as ilha_name
  from public.mop_collaborators c
  left join public.mop_supervisors s on s.id = c.supervisor_id
  left join public.mop_ilhas i on i.id = c.ilha_id
  where (p_client_id is null or c.client_id = p_client_id)
    and (p_operation_id is null or c.operation_id = p_operation_id)
    and (p_coordinator_id is null or c.coordinator_id = p_coordinator_id)
    and (p_supervisor_id is null or c.supervisor_id = p_supervisor_id)
    and (p_ilha_id is null or c.ilha_id = p_ilha_id)
    and (
      nullif(trim(c.dt_entrada_produto::text), '') is null
      or nullif(trim(c.dt_entrada_produto::text), '')::date <= (select end_date from bounds)
    )
    and (
      nullif(trim(c.data_fim::text), '') is null
      or nullif(trim(c.data_fim::text), '')::date >= (select start_date from bounds)
    )
),
calendar as (
  select
    p.matricula,
    p.nome,
    p.supervisor_name,
    p.ilha_name,
    p.status,
    generated.work_date::date as work_date,
    case
      when generated.work_date::date > b.cutoff then '-'
      when exists (select 1 from public.mop_holidays h where h.holiday_date = generated.work_date::date) then 'FG'
      when extract(isodow from generated.work_date) in (6, 7) then 'FG'
      when upper(p.status::text) = 'DESLIGADO'
        and nullif(trim(p.data_fim::text), '') is not null
        and generated.work_date::date >= nullif(trim(p.data_fim::text), '')::date then 'DES'
      when nullif(trim(p.dt_entrada_produto::text), '') is not null
        and generated.work_date::date < nullif(trim(p.dt_entrada_produto::text), '')::date then '-'
      else coalesce(r.validated_status, '-')
    end as daily
  from people p
  cross join bounds b
  cross join lateral generate_series(
    b.start_date,
    b.end_date,
    interval '1 day'
  ) as generated(work_date)
  left join public.mop_abs_records r
    on r.matricula = p.matricula
    and r.work_date = generated.work_date::date
)
select
  c.matricula,
  max(c.nome),
  max(c.supervisor_name),
  max(c.ilha_name),
  max(c.status::text),
  count(*) filter (where daily = 'FJ'),
  count(*) filter (where daily = 'FI'),
  count(*) filter (where daily in ('FJ', 'FI')),
  count(*) filter (where daily = 'P'),
  case
    when count(*) filter (where daily in ('P', 'FJ', 'FI')) = 0 then 0
    else count(*) filter (where daily in ('FJ', 'FI'))::numeric
      / count(*) filter (where daily in ('P', 'FJ', 'FI'))
  end,
  jsonb_object_agg(
    to_char(c.work_date, 'YYYY-MM-DD'),
    daily
    order by c.work_date
  )
from calendar c
group by c.matricula
order by max(c.nome)
$$;

revoke all on function public.mop_abs_last_import(date) from public;
revoke all on function public.mop_abs_month(date, text, text, text, text, text) from public;
grant execute on function public.mop_abs_last_import(date) to anon, authenticated;
grant execute on function public.mop_abs_month(date, text, text, text, text, text) to anon, authenticated;
