-- Fix 400 error when saving profile to roommates table

-- Step 1: Add is_listing column if not exists
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS is_listing BOOLEAN DEFAULT true;

-- Step 2: Check all columns in roommates table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'roommates' 
ORDER BY ordinal_position;

-- Step 3: Check if there are any constraints causing 400 error
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'roommates';

-- Step 4: Update existing user profiles
UPDATE roommates 
SET is_listing = false 
WHERE user_id IS NOT NULL AND user_id != '';

-- Step 5: Verify the update
SELECT id, name, user_id, is_listing 
FROM roommates 
WHERE name = 'LONG';
