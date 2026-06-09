-- Check RLS policies on messages table
SELECT * FROM pg_policies 
WHERE tablename = 'messages';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE tablename = 'messages';

-- Try to view all messages (this may fail if RLS blocks it)
SELECT 
  id,
  chat_id,
  sender_id,
  text,
  timestamp,
  created_at
FROM messages
ORDER BY timestamp DESC
LIMIT 20;

-- Check messages for a specific chat_id pattern
-- Replace with actual auth IDs if needed
SELECT 
  id,
  chat_id,
  sender_id,
  substring(text, 1, 50) as text_preview,
  timestamp
FROM messages
WHERE chat_id ILIKE '%b6590d4c%' -- Replace with your auth ID
ORDER BY timestamp DESC
LIMIT 20;
