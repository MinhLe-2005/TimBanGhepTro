-- CẨNTHẬN: Xóa TẤT CẢ test listings (LONG, MINHLE, User Test, etc.)
-- GIỮ LẠI profiles (is_listing=false)

-- Step 1: Preview what will be deleted
SELECT id, name, is_listing, "createdAt"
FROM roommates 
WHERE name IN ('LONG', 'MINHLE', 'User Test') AND is_listing = true
ORDER BY name, "createdAt" DESC;

-- Step 2: UNCOMMENT dòng dưới để thực sự xóa
-- DELETE FROM roommates WHERE name IN ('LONG', 'MINHLE', 'User Test') AND is_listing = true;

-- Step 3: Verify - should only see profiles left
-- SELECT id, name, is_listing, "createdAt"
-- FROM roommates 
-- WHERE name IN ('LONG', 'MINHLE', 'User Test')
-- ORDER BY name;
