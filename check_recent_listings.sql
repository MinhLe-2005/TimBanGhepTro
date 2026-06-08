-- Kiểm tra 10 listings mới nhất
SELECT 
  id,
  name,
  age,
  is_listing,
  budget,
  "phoneNumber",
  "postedBy",
  "createdAt"
FROM roommates
WHERE is_listing = true
ORDER BY "createdAt" DESC
LIMIT 10;
