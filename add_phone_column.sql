-- Add phoneNumber column to roommates table if not exists
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roommates' 
AND column_name = 'phoneNumber';
