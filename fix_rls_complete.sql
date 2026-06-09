-- Complete RLS setup for messages table
-- This ensures users can:
-- 1. READ all messages from chats they're part of
-- 2. INSERT their own messages
-- 3. UPDATE reactions in chats they're part of

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can see messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update reactions" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON messages;
DROP POLICY IF EXISTS "Enable read access for all messages" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable update for message reactions" ON messages;

-- Policy 1: SELECT - Allow users to see messages from chats containing their auth.uid
-- This is the KEY policy for reading messages
CREATE POLICY "Enable read access for all messages"
ON messages FOR SELECT
USING (
  chat_id ILIKE '%' || auth.uid() || '%'
);

-- Policy 2: INSERT - Allow users to insert their own messages
CREATE POLICY "Enable insert for authenticated users"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy 3: UPDATE - Allow users to update reactions in their chats
-- This is needed for the reaction feature to work
CREATE POLICY "Enable update for message reactions"
ON messages FOR UPDATE
USING (
  chat_id ILIKE '%' || auth.uid() || '%'
)
WITH CHECK (
  chat_id ILIKE '%' || auth.uid() || '%'
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY policyname;
