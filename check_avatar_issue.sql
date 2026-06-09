-- Check if avatars are stored correctly in database
-- Replace 'your_user_id' with actual user ID you're testing

-- 1. Check roommates table (profiles)
SELECT 
  id,
  user_id,
  name,
  avatar,
  is_listing,
  LENGTH(avatar) as avatar_length,
  CASE 
    WHEN avatar LIKE 'data:image%' THEN 'Base64 Image'
    WHEN avatar LIKE 'http%' THEN 'URL Image'
    ELSE 'Unknown Format'
  END as avatar_type
FROM roommates
WHERE is_listing = false
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if there are duplicate profiles (which could cause avatar mismatch)
SELECT 
  user_id,
  COUNT(*) as profile_count,
  STRING_AGG(id::text, ', ') as profile_ids,
  STRING_AGG(name, ', ') as names
FROM roommates
WHERE is_listing = false
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 3. Check a specific user's profile and listings
-- Replace 'USER_ID_HERE' with the actual user_id you're testing
SELECT 
  id,
  user_id,
  name,
  avatar,
  bio,
  budget,
  is_listing,
  LEFT(avatar, 50) as avatar_preview
FROM roommates
WHERE user_id = 'USER_ID_HERE' OR id = 'USER_ID_HERE'
ORDER BY is_listing, created_at DESC;
