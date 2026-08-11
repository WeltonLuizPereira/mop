-- 1. Alter mop_supervisors to add coordinator_ids (array of uuid)
ALTER TABLE mop_supervisors ADD COLUMN coordinator_ids uuid[] DEFAULT '{}';

-- Migrate data
UPDATE mop_supervisors SET coordinator_ids = ARRAY[coordinator_id] WHERE coordinator_id IS NOT NULL;

-- 2. Alter mop_ilhas to add coordinator_ids and supervisor_ids
ALTER TABLE mop_ilhas ADD COLUMN coordinator_ids uuid[] DEFAULT '{}';
ALTER TABLE mop_ilhas ADD COLUMN supervisor_ids uuid[] DEFAULT '{}';

-- Migrate data
UPDATE mop_ilhas SET coordinator_ids = ARRAY[coordinator_id] WHERE coordinator_id IS NOT NULL;
UPDATE mop_ilhas SET supervisor_ids = ARRAY[supervisor_id] WHERE supervisor_id IS NOT NULL;

-- Drop old columns
ALTER TABLE mop_supervisors DROP COLUMN coordinator_id;
ALTER TABLE mop_ilhas DROP COLUMN coordinator_id;
ALTER TABLE mop_ilhas DROP COLUMN supervisor_id;
