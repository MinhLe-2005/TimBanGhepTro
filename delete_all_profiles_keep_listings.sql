-- DELETE ALL PROFILES (is_listing = false), KEEP ONLY LISTINGS (is_listing = true)
-- This removes old profile data to prevent modal from showing wrong data

-- Step 1: Check what will be deleted
SELECT 
  id,
  name,
  budget,
  "phoneNumber",
  bio,
  is_listing,
  user_id,
  "createdAt"
FROM roommates
WHERE is_listing = false OR is_listing IS NULL
ORDER BY "createdAt" DESC;

-- Step 2: Uncomment below to DELETE all profiles
-- DELETE FROM roommates 
-- WHERE is_listing = false OR is_listing IS NULL;

-- Step 3: Verify only listings remain
-- SELECT 
--   id,
--   name,
--   budget,
--   "phoneNumber",
--   bio,
--   is_listing
-- FROM roommates
-- WHERE is_listing = true
-- ORDER BY "createdAt" DESC;
