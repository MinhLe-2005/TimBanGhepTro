-- Check tất cả records có tên "helo"
SELECT 
  id,
  name,
  bio,
  budget,
  "phoneNumber",
  is_listing,
  created_at
FROM roommates
WHERE name ILIKE '%helo%'
ORDER BY created_at DESC;
