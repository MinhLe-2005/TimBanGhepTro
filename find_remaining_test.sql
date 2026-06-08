-- Tìm record test còn sót lại
SELECT id, name, age, role, is_listing, user_id, "postedBy", "createdAt"
FROM roommates 
WHERE id NOT IN ('minh-anh', 'hoang-nam', 'trang-le', 'duc-tri', 'khanh-vy');

-- Sau khi biết ID, xóa nó:
-- DELETE FROM roommates WHERE id = 'ID_CỦA_RECORD_ĐÓ';
