-- ============================================
-- DEBUG: Vấn đề tin nhắn không đồng bộ
-- Mô tả: MINHLE gửi tin ("hi", "đưa acc đây", "đưa nick đây") 
--        nhưng Le Quang Minh chỉ thấy tin cũ "hi" (12:52 PM)
-- ============================================

-- BƯỚC 1: Tìm user_id (Auth UUID) của 2 người
SELECT 
  '=== MINHLE Profile ===' as section,
  id as profile_id,
  user_id as auth_uuid,
  name,
  age,
  gender,
  "createdAt"
FROM roommates 
WHERE name ILIKE '%MINHLE%' 
  AND is_listing = false
ORDER BY "createdAt" DESC
LIMIT 3;

SELECT 
  '=== Le Quang Minh Profile ===' as section,
  id as profile_id,
  user_id as auth_uuid,
  name,
  age,
  gender,
  "createdAt"
FROM roommates
WHERE (name ILIKE '%Le Quang Minh%' OR name ILIKE '%Lê Quang Minh%')
  AND is_listing = false
ORDER BY "createdAt" DESC
LIMIT 3;

-- BƯỚC 2: Tìm TẤT CẢ các chat_id có thể có giữa 2 người
-- (Vấn đề: có thể dùng profile_id hoặc auth_uuid → tạo ra nhiều chat_id khác nhau)
SELECT 
  '=== All Chat IDs Between Them ===' as section,
  chat_id,
  COUNT(*) as message_count,
  MIN(timestamp) as first_message,
  MAX(timestamp) as last_message
FROM messages
WHERE 
  -- Tìm chat_id chứa MINHLE (thay bằng auth_uuid thực tế sau khi chạy BƯỚC 1)
  chat_id ILIKE '%auth_uuid_minhle_here%'
  OR chat_id ILIKE '%profile_id_minhle_here%'
  -- Hoặc chứa Le Quang Minh
  OR chat_id ILIKE '%auth_uuid_lequangminh_here%'
  OR chat_id ILIKE '%profile_id_lequangminh_here%'
GROUP BY chat_id
ORDER BY last_message DESC;

-- BƯỚC 3: Xem CHI TIẾT tin nhắn gần đây (30 tin mới nhất)
SELECT 
  '=== Recent Messages Detail ===' as section,
  id,
  chat_id,
  sender_id,
  CASE 
    WHEN text LIKE '[AGREEMENT%' THEN '[AGREEMENT...]'
    WHEN text LIKE '[SYSTEM%' THEN text
    ELSE LEFT(text, 60)
  END as message_preview,
  timestamp
FROM messages
WHERE 
  chat_id ILIKE '%auth_uuid_minhle_here%'
  OR chat_id ILIKE '%profile_id_minhle_here%'
  OR chat_id ILIKE '%auth_uuid_lequangminh_here%'
  OR chat_id ILIKE '%profile_id_lequangminh_here%'
ORDER BY timestamp DESC
LIMIT 30;

-- BƯỚC 4: Kiểm tra xem có tin nhắn "đưa acc đây", "đưa nick đây" không?
SELECT 
  '=== Search for Missing Messages ===' as section,
  id,
  chat_id,
  sender_id,
  text,
  timestamp
FROM messages
WHERE 
  (text ILIKE '%đưa acc%' OR text ILIKE '%đưa nick%' OR text ILIKE '%hi%')
  AND (
    chat_id ILIKE '%auth_uuid_minhle_here%'
    OR chat_id ILIKE '%profile_id_minhle_here%'
    OR chat_id ILIKE '%auth_uuid_lequangminh_here%'
    OR chat_id ILIKE '%profile_id_lequangminh_here%'
  )
ORDER BY timestamp DESC;

-- ============================================
-- HƯỚNG DẪN SỬ DỤNG:
-- 1. Chạy BƯỚC 1 để lấy user_id (auth UUID) và id (profile ID) của 2 người
-- 2. Thay thế:
--    - auth_uuid_minhle_here → user_id của MINHLE
--    - profile_id_minhle_here → id của MINHLE
--    - auth_uuid_lequangminh_here → user_id của Le Quang Minh
--    - profile_id_lequangminh_here → id của Le Quang Minh
-- 3. Chạy BƯỚC 2, 3, 4 để xem kết quả
-- 
-- KẾT QUẢ MONG ĐỢI:
-- - Nếu có NHIỀU chat_id khác nhau → Vấn đề: tin nhắn bị chia ra nhiều cuộc trò chuyện
-- - Nếu tin "đưa acc đây" có trong DB → Vấn đề: Frontend không fetch đúng
-- - Nếu tin "đưa acc đây" KHÔNG có trong DB → Vấn đề: Không gửi được lên Supabase
-- ============================================
