-- Kiểm tra TẤT CẢ records "helo"
SELECT 
  id, 
  name, 
  is_listing,
  bio,
  budget,
  "phoneNumber",
  "postedBy",
  "createdAt"
FROM roommates
WHERE name ILIKE '%helo%'
ORDER BY "createdAt" DESC;

-- Sau khi xác nhận, XÓA CHỈ PROFILE (giữ lại listing)
-- DELETE FROM roommates WHERE name ILIKE '%helo%' AND (is_listing = false OR is_listing IS NULL);
