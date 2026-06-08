-- XÓA TẤT CẢ test data, CHỈ GIỮ 5 listings mẫu ban đầu
-- Mẫu ban đầu: Minh Anh, Hoàng Nam, Trang Lê, Đức Trí, Khánh Vy

-- Step 1: Xem tất cả listings sẽ bị xóa (KHÔNG bao gồm 5 mẫu)
SELECT id, name, age, role, is_listing, "createdAt"
FROM roommates 
WHERE id NOT IN ('minh-anh', 'hoang-nam', 'trang-le', 'duc-tri', 'khanh-vy')
ORDER BY name, "createdAt" DESC;

-- Step 2: UNCOMMENT và chạy để XÓA tất cả (trừ 5 mẫu)
-- DELETE FROM roommates 
-- WHERE id NOT IN ('minh-anh', 'hoang-nam', 'trang-le', 'duc-tri', 'khanh-vy');

-- Step 3: Verify - chỉ còn 5 mẫu
-- SELECT id, name, is_listing, "createdAt"
-- FROM roommates 
-- ORDER BY name;
