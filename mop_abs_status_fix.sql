-- mop_abs_status_fix.sql
--
-- Motivo: mop_abs_finish_import grava status 'concluida_com_pendencias' quando
-- sobra matricula nao encontrada (RE sem correspondencia). As funcoes
-- mop_abs_last_import e mop_abs_month so consideravam 'COMPLETED' e 'concluida',
-- entao essas importacoes sumiam do status da tela e dos indicadores.
--
-- Parte 1 (status): amplia o filtro de status nas duas funcoes para incluir
-- 'concluida_com_pendencias'.
--
-- Parte 2 (contagem de REs nao encontrados, so mop_abs_last_import): nenhum
-- codigo do repo grava mop_abs_import_runs.unmatched_count (so o create table
-- e os selects de leitura), entao o aviso "N REs nao encontrados" ficava sempre
-- 0. A contagem passa a vir de mop_abs_unmatched (resolved_at is null).
--
-- Seguro para rodar mais de uma vez: cada passo so age se o texto ainda nao
-- foi atualizado. CREATE OR REPLACE preserva owner e grants existentes.

do $$
declare
  v_sig text;
  v_def text;
  v_new text;
  v_count integer;
begin
  foreach v_sig in array array[
    'public.mop_abs_last_import(date)',
    'public.mop_abs_month(date,text,text,text,text,text)'
  ] loop
    v_def := pg_get_functiondef(v_sig::regprocedure);

    -- Parte 1: status 'concluida_com_pendencias'
    if position('concluida_com_pendencias' in v_def) = 0 then
      v_new := replace(
        v_def,
        $q$in ('COMPLETED', 'concluida')$q$,
        $q$in ('COMPLETED', 'concluida', 'concluida_com_pendencias')$q$
      );
      if v_new = v_def then
        raise exception 'mop_abs_status_fix: trecho de status nao encontrado em %', v_sig;
      end if;
      v_def := v_new;
    end if;

    -- Parte 2: REs nao encontrados via mop_abs_unmatched (so mop_abs_last_import)
    if v_sig like 'public.mop_abs_last_import(%'
       and position('u.resolved_at is null' in v_def) = 0 then

      -- remove latest_run.unmatched_count do group by
      v_new := replace(
        v_def,
        'group by latest_run.status, latest_run.finished_at, latest_run.unmatched_count',
        'group by latest_run.status, latest_run.finished_at'
      );
      if v_new = v_def then
        raise exception 'mop_abs_status_fix: group by de mop_abs_last_import nao encontrado';
      end if;
      v_def := v_new;

      -- o select deve restar com exatamente uma ocorrencia de latest_run.unmatched_count
      v_count := (length(v_def) - length(replace(v_def, 'latest_run.unmatched_count', '')))
                 / length('latest_run.unmatched_count');
      if v_count <> 1 then
        raise exception 'mop_abs_status_fix: esperava 1 ocorrencia de latest_run.unmatched_count, achou %', v_count;
      end if;

      v_def := replace(
        v_def,
        'latest_run.unmatched_count',
        '(select count(*)::integer from public.mop_abs_unmatched u where u.resolved_at is null) as unmatched_count'
      );
    end if;

    execute v_def;
  end loop;
end
$$;
