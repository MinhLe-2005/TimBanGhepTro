-- Kiểm tra dữ liệu đầy đủ của profile HUY

SELECT 
  id,
  name,
  age,
  role,
  budget,
  bio,
  lifestyle,
  gender,
  district,
  location,
  type,
  is_listing,
  user_id,
  "createdAt"
FROM roommates 
WHERE name = 'HUY';

-- Nếu không có data, có thể profile chưa được lưu vào Supabase
-- Kiểm tra tất cả profiles trong database
SELECT COUNT(*), 
       COUNT(*) FILTER (WHERE budget IS NOT NULL) as has_budget,
       COUNT(*) FILTER (WHERE bio IS NOT NULL AND bio != '') as has_bio,
       COUNT(*) FILTER (WHERE lifestyle IS NOT NULL) as has_lifestyle
FROM roommates;
