-- Check if agreements table exists and what columns it has
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agreements'
ORDER BY ordinal_position;

-- If table exists with wrong structure, drop it first
-- DROP TABLE IF EXISTS agreements CASCADE;

-- Then run create_agreements_table.sql again
