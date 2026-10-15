-- Consulta de status da atualização do ABS (polling pelo front).
-- A fila mop_abs_refresh_requests, mop_abs_request_refresh(), mop_abs_claim_refresh() e
-- mop_abs_finish_refresh() JÁ EXISTEM no banco. Este arquivo adiciona a RPC de consulta de status
-- e os ajustes de permissão necessários para o app.
-- Idempotente: pode ser executado mais de uma vez.
--
-- Observação: o MOP não usa sessão do Supabase Auth, então auth.uid() e mop_current_role()
-- são nulos dentro do banco. Por isso a consulta de status não checa perfil (o pedido é
-- identificado por um uuid), e requested_by precisa aceitar nulo.

alter table public.mop_abs_refresh_requests
  alter column requested_by drop not null;

revoke all on function public.mop_abs_request_refresh() from public;
grant execute on function public.mop_abs_request_refresh() to anon, authenticated;

create or replace function public.mop_abs_refresh_status(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id,
    'status', r.status,
    'result', r.result,
    'error_message', r.error_message,
    'finished_at', r.finished_at
  )
  from public.mop_abs_refresh_requests r
  where r.id = p_id
$$;

revoke all on function public.mop_abs_refresh_status(uuid) from public;
grant execute on function public.mop_abs_refresh_status(uuid) to anon, authenticated;
