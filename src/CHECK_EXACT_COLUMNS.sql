-- Check exact column names in the organizers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'organizers'
ORDER BY ordinal_position;
