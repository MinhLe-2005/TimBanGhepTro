-- Add reactions column to messages table
-- Reactions format: { "❤️": ["user_id1", "user_id2"], "😂": ["user_id3"] }

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Create index for faster reaction queries
CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING gin(reactions);

-- Grant permissions
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
