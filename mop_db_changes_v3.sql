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
