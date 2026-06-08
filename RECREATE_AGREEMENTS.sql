-- Drop and recreate agreements table with correct structure
DROP TABLE IF EXISTS agreements CASCADE;

CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  roommate_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "startDate" DATE,
  "endDate" DATE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))
);

CREATE INDEX idx_agreements_user1 ON agreements(user1_id);
CREATE INDEX idx_agreements_user2 ON agreements(user2_id);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_agreements_roommate ON agreements(roommate_id);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreements" ON agreements
  FOR SELECT
  USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

CREATE POLICY "Users can create agreements" ON agreements
  FOR INSERT
  WITH CHECK (auth.uid()::text = user1_id);

CREATE POLICY "Parties can update agreements" ON agreements
  FOR UPDATE
  USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

COMMENT ON TABLE agreements IS 'Stores roommate agreements. Only users with completed agreements can write reviews.';

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agreements'
ORDER BY ordinal_position;
