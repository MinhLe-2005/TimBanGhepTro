-- Debug: Kiểm tra bài đăng có trong database không

-- 1. Xem tất cả bài đăng (is_listing = true)
SELECT id, name, age, role, location, budget, user_id, is_listing, "createdAt"
FROM roommates 
WHERE is_listing = true
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 2. Xem tất cả hồ sơ (is_listing = false hoặc NULL)
SELECT id, name, age, role, location, budget, user_id, is_listing, "createdAt"
FROM roommates 
WHERE is_listing = false OR is_listing IS NULL
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 3. Xem tất cả records của user LONG
SELECT id, name, age, role, budget, user_id, is_listing, "createdAt"
FROM roommates 
WHERE name = 'LONG' OR user_id LIKE '%2116d5d2%'
ORDER BY "createdAt" DESC;

-- 4. Count tổng số records
SELECT 
  COUNT(*) FILTER (WHERE is_listing = true) as listings_count,
  COUNT(*) FILTER (WHERE is_listing = false OR is_listing IS NULL) as profiles_count,
  COUNT(*) as total
FROM roommates;

-- 5. Tắt RLS nếu đang bật
ALTER TABLE public.roommates DISABLE ROW LEVEL SECURITY;
