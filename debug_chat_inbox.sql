-- Debug: Check if new messages are in database
-- Replace 'YOUR_AUTH_ID' with your actual Supabase auth UUID

-- First, find your auth UUID
SELECT id, email FROM auth.users LIMIT 5;

-- Then check messages with your auth ID
SELECT 
  id,
  chat_id,
  sender_id,
  text,
  timestamp,
  created_at
FROM messages
WHERE chat_id ILIKE '%YOUR_AUTH_ID%'
ORDER BY timestamp DESC
LIMIT 20;

-- Check all messages in last 24 hours
SELECT 
  id,
  chat_id,
  sender_id,
  text,
  timestamp
FROM messages
WHERE timestamp > NOW() - INTERVAL '1 day'
ORDER BY timestamp DESC
LIMIT 50;

-- Check messages count by chat_id
SELECT 
  chat_id,
  COUNT(*) as message_count,
  MAX(timestamp) as last_message
FROM messages
GROUP BY chat_id
ORDER BY MAX(timestamp) DESC
LIMIT 20;
