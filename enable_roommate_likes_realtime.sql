-- Create and Enable Realtime for roommate_likes table
-- This allows real-time synchronization of likes across all users

-- 1. Create the roommate_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS roommate_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roommate_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one user can only like a roommate once
  UNIQUE(roommate_id, user_id)
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_roommate_likes_roommate_id ON roommate_likes(roommate_id);
CREATE INDEX IF NOT EXISTS idx_roommate_likes_user_id ON roommate_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_roommate_likes_created_at ON roommate_likes(created_at DESC);

-- 3. Enable RLS on the table
ALTER TABLE roommate_likes ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all roommate likes" ON roommate_likes;
DROP POLICY IF EXISTS "Users can insert their own roommate likes" ON roommate_likes;
DROP POLICY IF EXISTS "Users can delete their own roommate likes" ON roommate_likes;

-- 5. Create RLS policies
-- Allow everyone to VIEW all likes (needed for counting and displaying popular profiles)
CREATE POLICY "Users can view all roommate likes"
ON roommate_likes
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow authenticated users to INSERT their own likes
CREATE POLICY "Users can insert their own roommate likes"
ON roommate_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own likes
CREATE POLICY "Users can delete their own roommate likes"
ON roommate_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Enable Realtime replication for roommate_likes
ALTER PUBLICATION supabase_realtime ADD TABLE roommate_likes;

-- 7. Grant necessary permissions for Realtime
GRANT SELECT ON roommate_likes TO authenticated;
GRANT SELECT ON roommate_likes TO anon;
GRANT INSERT, DELETE ON roommate_likes TO authenticated;

-- Success message
SELECT 'Table roommate_likes created and Realtime enabled!' as status;
