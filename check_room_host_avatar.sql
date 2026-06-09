-- Check if room listings have correct host avatar
SELECT 
  id,
  title,
  host_name,
  LEFT(host_avatar, 50) as avatar_preview,
  CASE 
    WHEN host_avatar LIKE 'data:image%' THEN 'Base64 Image'
    WHEN host_avatar LIKE 'http%' THEN 'URL Image'
    ELSE 'Unknown/Missing'
  END as avatar_type,
  posted_by,
  user_id,
  created_at
FROM rooms
ORDER BY created_at DESC
LIMIT 10;

-- Check if we can find the host's profile
SELECT 
  r.id as room_id,
  r.title as room_title,
  r.host_name,
  r.host_avatar as room_host_avatar,
  rm.id as roommate_id,
  rm.name as roommate_name,
  LEFT(rm.avatar, 50) as roommate_avatar
FROM rooms r
LEFT JOIN roommates rm ON (r.posted_by = rm.user_id OR r.user_id = rm.user_id)
WHERE r.created_at > NOW() - INTERVAL '30 days'
ORDER BY r.created_at DESC
LIMIT 5;
