-- ============================================================
-- FIX MISSING DATA - Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Đảm bảo tất cả columns cần thiết tồn tại (idempotent)
ALTER TABLE public.roommates
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS is_listing boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS school text;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS electricity text,
  ADD COLUMN IF NOT EXISTS water text,
  ADD COLUMN IF NOT EXISTS parking text,
  ADD COLUMN IF NOT EXISTS proximity text,
  ADD COLUMN IF NOT EXISTS "hostRole" text,
  ADD COLUMN IF NOT EXISTS "roommateInfo" text,
  ADD COLUMN IF NOT EXISTS habits jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

-- 2. Các bản ghi roommate cũ (không phải profile) cần is_listing = true
-- Profile là bản ghi có is_listing = false được set rõ ràng
-- Bản ghi cũ có is_listing = null => đây là listing, set = true
UPDATE public.roommates
SET is_listing = true
WHERE is_listing IS NULL;

-- 3. Đảm bảo RLS policies đúng cho public read
-- (Chạy lại để chắc chắn - idempotent)
ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read roommates" ON public.roommates;
CREATE POLICY "Public can read roommates"
ON public.roommates FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read rooms" ON public.rooms;
CREATE POLICY "Public can read rooms"
ON public.rooms FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Owners can insert roommates" ON public.roommates;
CREATE POLICY "Owners can insert roommates"
ON public.roommates FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update roommates" ON public.roommates;
CREATE POLICY "Owners can update roommates"
ON public.roommates FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
)
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can delete roommates" ON public.roommates;
CREATE POLICY "Owners can delete roommates"
ON public.roommates FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can insert rooms" ON public.rooms;
CREATE POLICY "Owners can insert rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
CREATE POLICY "Owners can update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
)
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can delete rooms" ON public.rooms;
CREATE POLICY "Owners can delete rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR "postedBy" = auth.uid()::text
);

GRANT SELECT ON public.roommates, public.rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.roommates, public.rooms TO authenticated;

-- 4. Kiểm tra kết quả
SELECT 
  'roommates' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_listing = true THEN 1 ELSE 0 END) as listings,
  SUM(CASE WHEN is_listing = false THEN 1 ELSE 0 END) as profiles,
  SUM(CASE WHEN is_listing IS NULL THEN 1 ELSE 0 END) as null_listing
FROM public.roommates
UNION ALL
SELECT 
  'rooms' as table_name,
  COUNT(*) as total,
  NULL as listings,
  NULL as profiles,
  NULL as null_listing
FROM public.rooms;
