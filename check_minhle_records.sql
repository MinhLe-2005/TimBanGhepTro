-- Kiểm tra tất cả records có tên "MINHLE"
SELECT 
  id,
  name,
  bio,
  budget,
  "phoneNumber",
  is_listing,
  "postedBy",
  "user_id",
  "createdAt"
FROM roommates
WHERE UPPER(name) LIKE '%MINH%' OR UPPER(name) = 'MINHLE'
ORDER BY "createdAt" DESC;
