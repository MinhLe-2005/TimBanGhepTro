-- Cleanup: Xóa tất cả listings cũ (giữ lại profiles)
-- Chỉ xóa các record có is_listing = true hoặc NULL

-- Xem trước những gì sẽ bị xóa
SELECT id, name, created_at, is_listing, user_id
FROM roommates
WHERE is_listing IS TRUE OR is_listing IS NULL
ORDER BY created_at DESC;

-- Uncomment dòng dưới để thực hiện xóa
-- DELETE FROM roommates WHERE is_listing IS TRUE OR is_listing IS NULL;

-- Kiểm tra còn lại (chỉ profiles)
-- SELECT id, name, is_listing FROM roommates WHERE is_listing = false;
