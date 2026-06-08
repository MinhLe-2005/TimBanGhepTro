-- XÓA NGAY - CHỈ GIỮ 5 MẪU BAN ĐẦU
-- Copy và paste TOÀN BỘ code dưới vào Supabase SQL Editor và RUN

DELETE FROM roommates 
WHERE id NOT IN ('minh-anh', 'hoang-nam', 'trang-le', 'duc-tri', 'khanh-vy');

-- Sau khi chạy xong, verify:
SELECT id, name, is_listing, "createdAt"
FROM roommates 
ORDER BY name;
