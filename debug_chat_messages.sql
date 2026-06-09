-- Debug: Check all messages between MINHLE and Le Quang Minh
-- Find their user IDs first
SELECT 
  'MINHLE user_id:' as info,
  id, user_id, name, email
FROM roommates 
WHERE name ILIKE '%MINHLE%'
LIMIT 5;

SELECT 
  'Le Quang Minh user_id:' as info,
  id, user_id, name, email  
FROM roommates
WHERE name ILIKE '%Le Quang Minh%' OR name ILIKE '%Lê Quang Minh%'
LIMIT 5;

-- Check all chat_ids that include either user
SELECT DISTINCT chat_id, COUNT(*) as message_count
FROM messages
WHERE chat_id ILIKE '%MINHLE_ID_HERE%' 
   OR chat_id ILIKE '%LE_QUANG_MINH_ID_HERE%'
GROUP BY chat_id
ORDER BY chat_id;

-- Show recent messages with timestamps
SELECT 
  id,
  chat_id,
  sender_id,
  LEFT(text, 50) as message_preview,
  timestamp,
  created_at
FROM messages
WHERE chat_id ILIKE '%MINHLE%' OR chat_id ILIKE '%Quang%'
ORDER BY timestamp DESC
LIMIT 20;

-- Find all possible chat_id variations between these two users
-- Replace with actual IDs after running queries above
