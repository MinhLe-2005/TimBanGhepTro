-- Xóa 5 phòng trọ AI (demo/test data)
-- Chạy query này để xem danh sách phòng trước khi xóa

-- BƯỚC 1: Xem danh sách phòng (để chọn 5 phòng cần xóa)
SELECT 
  id,
  title,
  location,
  price,
  "hostName",
  "createdAt"
FROM rooms
ORDER BY "createdAt" DESC
LIMIT 10;

-- BƯỚC 2: Xóa 5 phòng cụ thể (SAU KHI XEM DANH SÁCH Ở TRÊN)
-- Uncomment và thay ID thực tế từ kết quả BƯỚC 1
/*
DELETE FROM rooms
WHERE id IN (
  'room_id_1_here',
  'room_id_2_here',
  'room_id_3_here',
  'room_id_4_here',
  'room_id_5_here'
);
*/

-- HOẶC: Xóa 5 phòng CŨ NHẤT
/*
DELETE FROM rooms
WHERE id IN (
  SELECT id 
  FROM rooms 
  ORDER BY "createdAt" ASC 
  LIMIT 5
);
*/

-- HOẶC: Xóa 5 phòng MỚI NHẤT
/*
DELETE FROM rooms
WHERE id IN (
  SELECT id 
  FROM rooms 
  ORDER BY "createdAt" DESC 
  LIMIT 5
);
*/

-- HOẶC: Xóa tất cả phòng có tên chủ nhà là "AI" hoặc "Test"
/*
DELETE FROM rooms
WHERE "hostName" ILIKE '%AI%' 
   OR "hostName" ILIKE '%Test%'
   OR "hostName" ILIKE '%Demo%';
*/

-- Verify sau khi xóa
SELECT COUNT(*) as total_rooms FROM rooms;
