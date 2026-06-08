-- Check profiles and their user_id mapping

-- 1. List all profiles with user_id
SELECT id, name, age, user_id, "postedBy", is_listing, "createdAt"
FROM roommates 
WHERE is_listing = false OR is_listing IS NULL
ORDER BY "createdAt" DESC;

-- 2. Find profiles missing user_id
SELECT id, name, age, user_id, "postedBy", is_listing
FROM roommates 
WHERE (user_id IS NULL OR user_id = '') 
  AND (is_listing = false OR is_listing IS NULL);

-- 3. Fix: Update profiles to have user_id from postedBy
UPDATE roommates 
SET user_id = "postedBy"
WHERE (user_id IS NULL OR user_id = '') 
  AND "postedBy" IS NOT NULL 
  AND "postedBy" != ''
  AND (is_listing = false OR is_listing IS NULL);

-- 4. Verify after fix
SELECT id, name, user_id, "postedBy", is_listing
FROM roommates 
WHERE is_listing = false OR is_listing IS NULL;
