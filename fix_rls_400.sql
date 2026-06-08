-- Check and fix RLS policies causing 400 error

-- Step 1: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'roommates';

-- Step 2: Disable RLS temporarily to test (ONLY for testing)
ALTER TABLE public.roommates DISABLE ROW LEVEL SECURITY;

-- Step 3: Or create permissive policies for authenticated users
-- DROP POLICY IF EXISTS "Allow authenticated users to insert" ON roommates;
-- DROP POLICY IF EXISTS "Allow authenticated users to update own" ON roommates;
-- DROP POLICY IF EXISTS "Allow public read access" ON roommates;

-- CREATE POLICY "Allow authenticated users to insert" ON roommates
--   FOR INSERT TO authenticated
--   WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users to update own" ON roommates
--   FOR UPDATE TO authenticated
--   USING (user_id = auth.uid()::text)
--   WITH CHECK (user_id = auth.uid()::text);

-- CREATE POLICY "Allow public read access" ON roommates
--   FOR SELECT TO public
--   USING (true);

-- Step 4: Check constraints that might cause 400
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'roommates';

-- Step 5: Test insert manually
-- INSERT INTO roommates (id, name, age, role, avatar, location, district, type, budget, bio, gender, "isVerified", status, "matchScore", "reputationScore", tags, lifestyle, "createdAt", "postedBy", user_id, is_listing)
-- VALUES ('test-id-123', 'Test User', 21, 'Sinh viên', 'https://example.com/avatar.jpg', 'Hải Châu, Đà Nẵng', 'Hải Châu', 'Phòng trọ', 3000000, 'Test bio', 'Nữ', false, 'Chưa tìm được bạn', 100, 0, '["Bình thường"]'::jsonb, '{"sleep":"Bình thường","pets":"Thoải mái","smoke":"Không hút thuốc","cook":"Đôi khi nấu","interaction":"Cân bằng","neatness":"Sạch sẽ"}'::jsonb, NOW(), 'auth-user-id', 'auth-user-id', false);
