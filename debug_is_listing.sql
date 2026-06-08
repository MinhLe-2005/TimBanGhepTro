-- Check is_listing values for LONG's records
SELECT id, name, user_id, "postedBy", is_listing, "createdAt"
FROM roommates 
WHERE name = 'LONG'
ORDER BY "createdAt" DESC;

-- Count by is_listing status
SELECT 
  is_listing,
  COUNT(*) as count
FROM roommates 
GROUP BY is_listing;
