ALTER TABLE mop_history ADD COLUMN IF NOT EXISTS collaborator_matricula text;
ALTER TABLE mop_history ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mop_history_collaborator
  ON mop_history(collaborator_matricula);
CREATE INDEX IF NOT EXISTS idx_mop_history_created_at
  ON mop_history(created_at DESC);
