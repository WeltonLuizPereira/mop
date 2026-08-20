-- Tabela de PA Contratada por ilha, por mês de referência.
-- ilha_id é FK textual: os ids do sistema não são uuid (ver mop_ilhas).
CREATE TABLE mop_provimento (
  id text PRIMARY KEY,
  ilha_id text NOT NULL REFERENCES mop_ilhas(id),
  referencia date NOT NULL,
  pa_contratada integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ilha_id, referencia)
);

-- Row Level Security — mesmo padrão de mop_vacation_history: leitura,
-- inserção e atualização públicas, coerente com a chave publicável do app.
ALTER TABLE mop_provimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON mop_provimento
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for all users" ON mop_provimento
    AS PERMISSIVE FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON mop_provimento
    AS PERMISSIVE FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
