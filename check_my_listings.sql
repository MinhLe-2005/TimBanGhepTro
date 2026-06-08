-- Check all LONG's records to see ownership fields
SELECT 
  id,
  name,
  user_id,
  "postedBy",
  is_listing,
  "createdAt",
  CASE 
    WHEN user_id IS NOT NULL AND user_id != '' THEN '✅ Has user_id'
    ELSE '❌ Missing user_id'
  END as user_id_status,
  CASE 
    WHEN "postedBy" IS NOT NULL AND "postedBy" != '' THEN '✅ Has postedBy'
    ELSE '❌ Missing postedBy'
  END as postedBy_status
FROM roommates 
WHERE name = 'LONG'
ORDER BY "createdAt" DESC;

-- Also check what your actual auth user_id is
-- You can find it from the auth.users table or from console logs
