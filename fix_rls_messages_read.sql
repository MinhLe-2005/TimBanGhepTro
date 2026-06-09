-- Fix RLS for messages table to allow users to read messages from their chats
-- This policy allows users to see messages in chat_id that contains their auth.uid

-- First, check current RLS status
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can see messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Policy 1: Allow users to READ messages from chats they're part of
CREATE POLICY "Users can see messages in their chats"
ON messages FOR SELECT
USING (
  chat_id ILIKE '%' || auth.uid() || '%'
);

-- Policy 2: Allow users to INSERT messages
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
);

-- Policy 3: Allow update reactions (optional, if needed)
CREATE POLICY "Users can update reactions"
ON messages FOR UPDATE
USING (
  chat_id ILIKE '%' || auth.uid() || '%'
)
WITH CHECK (
  chat_id ILIKE '%' || auth.uid() || '%'
);
