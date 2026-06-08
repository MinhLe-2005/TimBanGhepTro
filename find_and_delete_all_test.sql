-- STEP 1: Xem TẤT CẢ records trong database
SELECT id, name, age, role, is_listing, "createdAt"
FROM roommates 
ORDER BY name;

-- STEP 2: Xem DANH SÁCH SẼ XÓA (tất cả trừ mẫu ban đầu)
-- Dựa vào ảnh, các mẫu ban đầu có vẻ là:
-- minh-anh, hoang-nam, trang-le, duc-tri, khanh-vy, tuan-kiet, thanh-hang, quoc-bao, thuy-quynh, duy-manh
-- Nhưng để chắc chắn, hãy check trong supabase_schema.sql xem có bao nhiêu mẫu được INSERT

SELECT id, name, age, role, is_listing, "createdAt"
FROM roommates 
WHERE id NOT LIKE 'minh-anh'
  AND id NOT LIKE 'hoang-nam'
  AND id NOT LIKE 'trang-le'
  AND id NOT LIKE 'duc-tri'
  AND id NOT LIKE 'khanh-vy'
ORDER BY name;

-- STEP 3: UNCOMMENT để XÓA tất cả test data (LONG, MINHLE, User Test, etc.)
-- DELETE FROM roommates 
-- WHERE id NOT IN ('minh-anh', 'hoang-nam', 'trang-le', 'duc-tri', 'khanh-vy');

-- STEP 4: Verify - chỉ còn mẫu
-- SELECT id, name, is_listing, "createdAt"
-- FROM roommates 
-- ORDER BY name;
