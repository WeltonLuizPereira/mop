import fs from 'node:fs/promises';
import { readAbsWorkbook } from './reader.mjs';
import { normalizeSupabaseUrl } from './config.mjs';

const file = process.env.ABS_FILE_PATH;
const dryRun = process.argv.includes('--dry-run');

if (!file) throw new Error('ABS_FILE_PATH não configurado');

const stat = await fs.stat(file);
const rows = readAbsWorkbook(file);

if (dryRun) {
  console.log(JSON.stringify({
    file,
    rows: rows.length,
    unknown: rows.filter(row => row.unknown).length,
  }));
  process.exit(0);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
}

const { createClient } = await import('@supabase/supabase-js');
const client = createClient(
  normalizeSupabaseUrl(process.env.SUPABASE_URL),
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const maxWorkDate = rows.reduce(
  (maximum, row) => row.workDate > maximum ? row.workDate : maximum,
  '',
);
const { data: run, error } = await client
  .from('mop_abs_import_runs')
  .insert({
    source_path: file,
    source_modified_at: stat.mtime.toISOString(),
    status: 'PROCESSING',
    rows_read: rows.length,
    max_work_date: maxWorkDate,
  })
  .select('id')
  .single();

if (error) throw error;

for (let index = 0; index < rows.length; index += 500) {
  const payload = rows.slice(index, index + 500).map(row => ({
    work_date: row.workDate,
    matricula: row.matricula,
    source_name: row.sourceName,
    source_department: row.sourceDepartment,
    punches: row.punches,
    raw_status: row.rawStatus,
    validated_status: row.validatedStatus,
    import_run_id: run.id,
  }));
  const { error: upsertError } = await client
    .from('mop_abs_records')
    .upsert(payload, { onConflict: 'work_date,matricula' });
  if (upsertError) throw upsertError;
}

const { error: completionError } = await client
  .from('mop_abs_import_runs')
  .update({
    status: 'COMPLETED',
    finished_at: new Date().toISOString(),
    rows_upserted: rows.length,
  })
  .eq('id', run.id);

if (completionError) throw completionError;
console.log(JSON.stringify({ rows: rows.length, runId: run.id }));
