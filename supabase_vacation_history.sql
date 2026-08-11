-- Table: mop_vacation_history
CREATE TABLE IF NOT EXISTS mop_vacation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collaborator_matricula TEXT NOT NULL REFERENCES mop_collaborators(matricula) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE mop_vacation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mop_vacation_history
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for all users" ON mop_vacation_history
    AS PERMISSIVE FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON mop_vacation_history
    AS PERMISSIVE FOR DELETE
    TO public
    USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_mop_vacation_history_collaborator ON mop_vacation_history(collaborator_matricula);
