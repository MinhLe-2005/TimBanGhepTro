-- ⚠️ CRITICAL: Delete all OLD PROFILES to prevent modal confusion
-- Only keep LISTINGS (is_listing = true)

-- Step 1: Preview what will be deleted
SELECT 
  id,
  name,
  budget,
  "phoneNumber",
  is_listing,
  "createdAt"
FROM roommates
WHERE is_listing IS NULL OR is_listing = false
ORDER BY "createdAt" DESC;

-- Step 2: Uncomment to DELETE (only profiles, keep listings)
-- DELETE FROM roommates WHERE is_listing IS NULL OR is_listing = false;

-- Step 3: Verify only listings remain
-- SELECT COUNT(*) as total_listings FROM roommates WHERE is_listing = true;
