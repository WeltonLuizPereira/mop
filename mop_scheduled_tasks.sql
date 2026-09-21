CREATE TABLE IF NOT EXISTS mop_scheduled_tasks (
  id text PRIMARY KEY,
  matricula text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mop_scheduled_tasks_pending_date_idx
  ON mop_scheduled_tasks (scheduled_date) WHERE status = 'PENDING';
CREATE UNIQUE INDEX IF NOT EXISTS mop_scheduled_tasks_pending_unique_idx
  ON mop_scheduled_tasks (matricula, scheduled_date) WHERE status = 'PENDING';

ALTER TABLE mop_scheduled_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON mop_scheduled_tasks;
CREATE POLICY "Enable read access for all users" ON mop_scheduled_tasks
  FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Enable insert for all users" ON mop_scheduled_tasks;
CREATE POLICY "Enable insert for all users" ON mop_scheduled_tasks
  FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON mop_scheduled_tasks;
CREATE POLICY "Enable update for all users" ON mop_scheduled_tasks
  FOR UPDATE TO public USING (true) WITH CHECK (true);
