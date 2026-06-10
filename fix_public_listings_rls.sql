-- Run this once in Supabase SQL Editor.
-- Public users can read listings; authenticated owners can create and manage theirs.

CREATE OR REPLACE FUNCTION public.is_roomiematch_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'admin@roomiematch.com',
      'quanly@roomiematch.com'
    )
    OR lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) = 'admin';
$$;

ALTER TABLE public.roommates
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS is_listing boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_roommates_user_id ON public.roommates(user_id);
CREATE INDEX IF NOT EXISTS idx_roommates_is_listing ON public.roommates(is_listing);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON public.rooms(user_id);

ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read roommates" ON public.roommates;
CREATE POLICY "Public can read roommates"
ON public.roommates FOR SELECT
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
  OR public.is_roomiematch_admin()
);

DROP POLICY IF EXISTS "Public can read rooms" ON public.rooms;
CREATE POLICY "Public can read rooms"
ON public.rooms FOR SELECT
TO anon, authenticated
USING (true);

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
  OR public.is_roomiematch_admin()
);

GRANT SELECT ON public.roommates, public.rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.roommates, public.rooms TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roommates;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
