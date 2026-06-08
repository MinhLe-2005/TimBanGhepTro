-- FINAL CLEANUP: Xóa TẤT CẢ profiles (is_listing=false hoặc NULL)
-- CHỈ GIỮ listings (is_listing=true)

-- BƯỚC 1: Kiểm tra trước khi xóa
SELECT 
  'PROFILES (sẽ bị xóa)' as type,
  COUNT(*) as count
FROM roommates
WHERE is_listing = false OR is_listing IS NULL

UNION ALL

SELECT 
  'LISTINGS (sẽ giữ lại)' as type,
  COUNT(*) as count
FROM roommates
WHERE is_listing = true;

-- BƯỚC 2: Xem chi tiết profiles sẽ bị xóa
SELECT id, name, is_listing, budget, "phoneNumber", "createdAt"
FROM roommates
WHERE is_listing = false OR is_listing IS NULL
ORDER BY "createdAt" DESC;

-- BƯỚC 3: Uncomment dòng dưới để XÓA
-- DELETE FROM roommates WHERE is_listing = false OR is_listing IS NULL;

-- BƯỚC 4: Verify kết quả
-- SELECT COUNT(*) as total_listings FROM roommates WHERE is_listing = true;
