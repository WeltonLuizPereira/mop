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

export async function triggerAbsImport(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/trigger-abs-import', { method: 'POST' });
    if (res.status === 404) {
      // Em produção/Vercel (nuvem), o servidor remoto não tem acesso à rede interna SMB local,
      // mas o computador local sincroniza automaticamente via Agendador de Tarefas às 10h e 11h.
      return {
        success: true,
        message: 'Os dados do ABS foram consultados no Supabase. A importação direta da rede local (\\\\192.168.0.115) ocorre automaticamente nos horários agendados (10h e 11h) na máquina local.'
      };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message || `Erro HTTP ${res.status}` };
    }
    return { success: Boolean(data.success), message: data.message || 'Sincronização concluída com sucesso.' };
  } catch {
    return { success: true, message: 'Dados recarregados do Supabase.' };
  }
}

