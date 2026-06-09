-- =============================================
-- XÓA HẾT TẤT CẢ DATA AI/FAKE/TEST
-- CHỈ GIỮ LẠI PROFILE CỦA LE QUANG MINH
-- =============================================

-- BƯỚC 1: Xem trước khi xóa
SELECT 'PROFILES (is_listing=false) - SẼ XÓA:' as info, COUNT(*) as count
FROM roommates 
WHERE is_listing = false 
  AND name NOT IN ('Le Quang Minh', 'Lê Quang Minh');

SELECT 'LISTINGS (is_listing=true) - SẼ XÓA HẾT:' as info, COUNT(*) as count
FROM roommates 
WHERE is_listing = true;

SELECT 'ROOMS - SẼ XÓA HẾT:' as info, COUNT(*) as count
FROM rooms;

SELECT 'MESSAGES - SẼ XÓA (trừ Le Quang Minh):' as info, COUNT(*) as count
FROM messages
WHERE chat_id NOT LIKE '%44b14eb1-d838-424d-847a-51f371c49a1a%'
  AND chat_id != 'SYSTEM_REPORTS'
  AND chat_id != 'SYSTEM_BANS';

-- BƯỚC 2: XÓA NGAY

-- Xóa tất cả PROFILE AI (MINHLE, v.v.) - CHỈ GIỮ Le Quang Minh
DELETE FROM roommates
WHERE is_listing = false 
  AND name NOT IN ('Le Quang Minh', 'Lê Quang Minh');

-- Xóa HẾT TẤT CẢ LISTING (bài đăng tìm bạn)
DELETE FROM roommates
WHERE is_listing = true;

-- Xóa TOÀN BỘ rooms (phòng trọ)
DELETE FROM rooms;

-- Xóa messages không liên quan đến Le Quang Minh
DELETE FROM messages
WHERE chat_id NOT LIKE '%44b14eb1-d838-424d-847a-51f371c49a1a%'
  AND chat_id != 'SYSTEM_REPORTS'
  AND chat_id != 'SYSTEM_BANS';

-- BƯỚC 3: Verify sau khi xóa
SELECT '========== KẾT QUẢ SAU KHI XÓA ==========' as separator;

SELECT 'PROFILES còn lại:' as info, name, id, user_id, is_listing
FROM roommates 
WHERE is_listing = false
ORDER BY "createdAt" DESC;

SELECT 'LISTINGS còn lại:' as info, COUNT(*) as count
FROM roommates 
WHERE is_listing = true;

SELECT 'ROOMS còn lại:' as info, COUNT(*) as count FROM rooms;

SELECT 'MESSAGES còn lại:' as info, COUNT(*) as count FROM messages;

-- =============================================
-- KẾT QUẢ MONG ĐỢI:
-- - PROFILES: Chỉ còn Le Quang Minh (1 record)
-- - LISTINGS: 0 (XÓA HẾT)
-- - ROOMS: 0 (XÓA HẾT)
-- - MESSAGES: Chỉ còn tin nhắn của Le Quang Minh
-- =============================================
