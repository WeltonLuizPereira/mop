import type { AbsStatus } from '../lib/absRules';
import { supabase } from './supabase';

export interface AbsFilters { month:string; clientId:string; operationId:string; coordinatorId:string; supervisorId:string; ilhaId:string }
export interface AbsMonthRow { matricula:string; collaboratorName:string; supervisorName:string; ilhaName:string; employmentStatus:string; justifiedAbsences:number; unjustifiedAbsences:number; totalAbsences:number; presences:number; absRate:number; dailyStatuses:Record<string,AbsStatus> }
export interface AbsImportStatus { status:string; finishedAt:string|null; maxWorkDate:string|null; rowsRead:number; unmatchedCount:number }
const nullable = (value:string) => value || null;

export async function getAbsMonth(filters:AbsFilters):Promise<AbsMonthRow[]> {
  const { data, error } = await supabase.rpc('mop_abs_month', { p_month:`${filters.month}-01`, p_client_id:nullable(filters.clientId), p_operation_id:nullable(filters.operationId), p_coordinator_id:nullable(filters.coordinatorId), p_supervisor_id:nullable(filters.supervisorId), p_ilha_id:nullable(filters.ilhaId) });
  if (error) throw new Error(`Não foi possível carregar os dados do ABS: ${error.message}`);
  return (data ?? []).map((row:any) => ({ matricula:String(row.matricula), collaboratorName:row.collaborator_name, supervisorName:row.supervisor_name ?? '-', ilhaName:row.ilha_name ?? '-', employmentStatus:row.employment_status, justifiedAbsences:Number(row.justified_absences ?? 0), unjustifiedAbsences:Number(row.unjustified_absences ?? 0), totalAbsences:Number(row.total_absences ?? 0), presences:Number(row.presences ?? 0), absRate:Number(row.abs_rate ?? 0), dailyStatuses:row.daily_statuses ?? {} }));
}

export async function getAbsImportStatus(month:string):Promise<AbsImportStatus|null> {
  const { data, error } = await supabase.rpc('mop_abs_last_import', { p_month: `${month}-01` });
  if (error) throw new Error(`Não foi possível consultar a atualização do ABS: ${error.message}`);
  const row = data?.[0];
  return row ? { status:row.status, finishedAt:row.finished_at, maxWorkDate:row.max_work_date, rowsRead:Number(row.rows_read ?? 0), unmatchedCount:Number(row.unmatched_count ?? 0) } : null;
}
