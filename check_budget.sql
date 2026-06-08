-- Kiểm tra dữ liệu budget trong bảng roommates
SELECT id, name, budget, user_id 
FROM roommates 
WHERE name = 'LONG';

-- Nếu không có budget column, thêm column này:
-- ALTER TABLE roommates ADD COLUMN IF NOT EXISTS budget INTEGER DEFAULT 0;

-- Sau đó update budget cho user LONG:
-- UPDATE roommates SET budget = 3000000 WHERE name = 'LONG';
