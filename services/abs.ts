import { calculateAbsMetrics, type AbsStatus } from '../lib/absRules';
import { supabase } from './supabase';

export interface AbsFilters { month:string; clientId:string; operationId:string; coordinatorId:string; supervisorId:string; ilhaId:string }
export interface AbsMonthRow { matricula:string; collaboratorName:string; supervisorName:string; ilhaName:string; employmentStatus:string; justifiedAbsences:number; unjustifiedAbsences:number; totalAbsences:number; presences:number; absRate:number; dailyStatuses:Record<string,AbsStatus> }
export interface AbsImportStatus { status:string; finishedAt:string|null; maxWorkDate:string|null; rowsRead:number; unmatchedCount:number }
const nullable = (value:string) => value || null;

export async function getAbsMonth(filters:AbsFilters):Promise<AbsMonthRow[]> {
  const { data, error } = await supabase.rpc('mop_abs_month', { p_month:`${filters.month}-01`, p_client_id:nullable(filters.clientId), p_operation_id:nullable(filters.operationId), p_coordinator_id:nullable(filters.coordinatorId), p_supervisor_id:nullable(filters.supervisorId), p_ilha_id:nullable(filters.ilhaId) });
  if (error) throw new Error(`Não foi possível carregar os dados do ABS: ${error.message}`);
  return (data ?? []).map((row:any) => {
    const dailyStatuses: Record<string, AbsStatus> = row.daily_statuses ?? {};
    const metrics = calculateAbsMetrics(Object.values(dailyStatuses));
    return { matricula:String(row.matricula), collaboratorName:row.collaborator_name, supervisorName:row.supervisor_name ?? '-', ilhaName:row.ilha_name ?? '-', employmentStatus:row.employment_status, justifiedAbsences:metrics.justified, unjustifiedAbsences:metrics.unjustified, totalAbsences:metrics.absences, presences:metrics.presences, absRate:metrics.rate, dailyStatuses };
  });
}

export async function getAbsImportStatus(month:string):Promise<AbsImportStatus|null> {
  const { data, error } = await supabase.rpc('mop_abs_last_import', { p_month: `${month}-01` });
  if (error) throw new Error(`Não foi possível consultar a atualização do ABS: ${error.message}`);
  const row = data?.[0];
  return row ? { status:row.status, finishedAt:row.finished_at, maxWorkDate:row.max_work_date, rowsRead:Number(row.rows_read ?? 0), unmatchedCount:Number(row.unmatched_count ?? 0) } : null;
}

export const ABS_REFRESH_POLL_MS = 3000;
export const ABS_REFRESH_TIMEOUT_MS = 120_000;
export const ABS_REFRESH_TIMEOUT_MESSAGE = 'Pedido enviado; o agente na máquina ainda não respondeu. Tente de novo em alguns minutos.';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface AbsRefreshStatusRow { id: string; status: 'pendente' | 'processando' | 'concluida' | 'erro' | string; result?: unknown; error_message?: string | null }

/**
 * Produção (Vercel): não há servidor com acesso à rede SMB local, então o pedido vai para a fila
 * `mop_abs_refresh_requests`. O agente na máquina local faz claim, importa e finaliza; aqui só
 * acompanhamos o status até concluir, falhar ou estourar o tempo limite.
 */
async function requestAbsRefreshViaQueue(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc('mop_abs_request_refresh');
  if (error) {
    return { success: false, message: `Não foi possível solicitar a atualização do ABS: ${error.message}` };
  }
  const requestId: string | undefined = typeof data === 'string' && data ? data : undefined;
  if (!requestId) {
    return { success: false, message: 'Não foi possível solicitar a atualização do ABS: resposta sem identificador do pedido.' };
  }

  const deadline = Date.now() + ABS_REFRESH_TIMEOUT_MS;
  for (;;) {
    const { data: statusData, error: statusError } = await supabase.rpc('mop_abs_refresh_status', { p_id: requestId });
    if (statusError) {
      return { success: false, message: `Não foi possível consultar a atualização do ABS: ${statusError.message}` };
    }
    const row = statusData as AbsRefreshStatusRow | null;
    if (!row) {
      return { success: false, message: 'O pedido de atualização do ABS não foi encontrado.' };
    }
    if (row.status === 'concluida') {
      const message = typeof row.result === 'string' && row.result ? row.result : 'Atualização do ABS concluída.';
      return { success: true, message };
    }
    if (row.status === 'erro') {
      return { success: false, message: row.error_message || 'A atualização do ABS falhou na máquina local.' };
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { success: false, message: ABS_REFRESH_TIMEOUT_MESSAGE };
    }
    await sleep(Math.min(ABS_REFRESH_POLL_MS, remaining));
  }
}

export async function triggerAbsImport(): Promise<{ success: boolean; message: string }> {
  let res: Response;
  try {
    res = await fetch('/api/trigger-abs-import', { method: 'POST' });
  } catch {
    // Sem servidor de dev acessível: segue pela fila do Supabase.
    return requestAbsRefreshViaQueue();
  }

  // Dev local: o plugin do Vite responde JSON. Produção (Vercel): 404 ou HTML de fallback do SPA.
  const isJson = res.headers.get('content-type')?.includes('application/json') ?? false;
  if (res.status === 404 || !isJson) {
    return requestAbsRefreshViaQueue();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: data.message || `Erro HTTP ${res.status}` };
  }
  return { success: Boolean(data.success), message: data.message || 'Sincronização concluída com sucesso.' };
}

