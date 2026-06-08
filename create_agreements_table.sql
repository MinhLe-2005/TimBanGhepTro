-- Create agreements table to track roommate contracts
-- Only users with completed agreements can write reviews

CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user1_id" TEXT NOT NULL, -- User who initiated the agreement
  "user2_id" TEXT NOT NULL, -- Roommate partner
  "roommate_id" TEXT, -- Reference to roommates table (optional)
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "startDate" DATE,
  "endDate" DATE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_agreements_user1 ON agreements("user1_id");
CREATE INDEX IF NOT EXISTS idx_agreements_user2 ON agreements("user2_id");
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_roommate ON agreements("roommate_id");

-- Enable RLS (Row Level Security)
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own agreements
CREATE POLICY "Users can view own agreements" ON agreements
  FOR SELECT
  USING (auth.uid()::text = "user1_id" OR auth.uid()::text = "user2_id");

-- Policy: Users can create agreements
CREATE POLICY "Users can create agreements" ON agreements
  FOR INSERT
  WITH CHECK (auth.uid()::text = "user1_id");

-- Policy: Both parties can update agreement status
CREATE POLICY "Parties can update agreements" ON agreements
  FOR UPDATE
  USING (auth.uid()::text = "user1_id" OR auth.uid()::text = "user2_id");

-- Add comment
COMMENT ON TABLE agreements IS 'Stores roommate agreements/contracts between users. Only users with completed agreements can write reviews.';
