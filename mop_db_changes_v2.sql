-- 1. Se você já rodou o ALTER TABLE e criou como uuid[], vamos remover primeiro:
-- (Se já estiver criada como uuid, remova com as linhas abaixo)
ALTER TABLE mop_supervisors DROP COLUMN IF EXISTS coordinator_ids;
ALTER TABLE mop_ilhas DROP COLUMN IF EXISTS coordinator_ids;
ALTER TABLE mop_ilhas DROP COLUMN IF EXISTS supervisor_ids;

-- 2. Criar as colunas como text[] (pois as chaves primárias do sistema estão como texto)
ALTER TABLE mop_supervisors ADD COLUMN coordinator_ids text[] DEFAULT '{}';
ALTER TABLE mop_ilhas ADD COLUMN coordinator_ids text[] DEFAULT '{}';
ALTER TABLE mop_ilhas ADD COLUMN supervisor_ids text[] DEFAULT '{}';

-- 3. Migrar os dados antigos (se a coluna antiga ainda existir)
UPDATE mop_supervisors SET coordinator_ids = ARRAY[coordinator_id] WHERE coordinator_id IS NOT NULL;
UPDATE mop_ilhas SET coordinator_ids = ARRAY[coordinator_id] WHERE coordinator_id IS NOT NULL;
UPDATE mop_ilhas SET supervisor_ids = ARRAY[supervisor_id] WHERE supervisor_id IS NOT NULL;

-- 4. Excluir as colunas antigas (somente após conferir que os dados migraram certinho)
ALTER TABLE mop_supervisors DROP COLUMN coordinator_id;
ALTER TABLE mop_ilhas DROP COLUMN coordinator_id;
ALTER TABLE mop_ilhas DROP COLUMN supervisor_id;
