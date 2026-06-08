-- Delete old MINHLE profile (is_listing = false) to stop modal confusion
-- Keep only the NEW listing (is_listing = true)

-- Step 1: Check all MINHLE records
SELECT 
  id,
  name,
  budget,
  "phoneNumber",
  is_listing,
  "createdAt"
FROM roommates
WHERE UPPER(name) = 'MINHLE'
ORDER BY is_listing DESC, "createdAt" DESC;

-- Step 2: DELETE the old profile (is_listing = false or NULL)
-- Uncomment below line to execute:
-- DELETE FROM roommates WHERE UPPER(name) = 'MINHLE' AND (is_listing = false OR is_listing IS NULL);

-- Step 3: Verify only listing remains
-- SELECT * FROM roommates WHERE UPPER(name) = 'MINHLE';
