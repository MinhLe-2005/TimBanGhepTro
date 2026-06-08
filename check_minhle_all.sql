-- Check all MINHLE records (both profile and listings)
SELECT 
  id,
  name,
  budget,
  "phoneNumber",
  bio,
  is_listing,
  user_id,
  "postedBy",
  "createdAt",
  CASE 
    WHEN is_listing = true THEN '✅ LISTING'
    WHEN is_listing = false THEN '❌ PROFILE'
    ELSE '⚠️ NULL'
  END as type
FROM roommates
WHERE UPPER(name) LIKE '%MINH%'
ORDER BY is_listing DESC, "createdAt" DESC;
