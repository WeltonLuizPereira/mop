-- Consulta de status da atualização do ABS (polling pelo front).
-- A fila mop_abs_refresh_requests, mop_abs_request_refresh(), mop_abs_claim_refresh() e
-- mop_abs_finish_refresh() JÁ EXISTEM no banco. Este arquivo só adiciona a RPC de consulta de status.
-- Idempotente: pode ser executado mais de uma vez.

create or replace function public.mop_abs_refresh_status(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.mop_current_role() is distinct from 'ADMIN' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'id', r.id,
      'status', r.status,
      'result', r.result,
      'error_message', r.error_message,
      'finished_at', r.finished_at
    )
    from public.mop_abs_refresh_requests r
    where r.id = p_id
  );
end;
$$;

revoke all on function public.mop_abs_refresh_status(uuid) from public;
grant execute on function public.mop_abs_refresh_status(uuid) to anon, authenticated;
