-- Run once in Supabase SQL Editor.
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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('room-images', 'room-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('reports', 'reports', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public reads room images" ON storage.objects;
CREATE POLICY "Public reads room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Users upload own room images" ON storage.objects;
CREATE POLICY "Users upload own room images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'room-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own room images" ON storage.objects;
CREATE POLICY "Users update own room images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'room-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_roomiematch_admin())
);

DROP POLICY IF EXISTS "Users delete own room images" ON storage.objects;
CREATE POLICY "Users delete own room images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'room-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_roomiematch_admin())
);

DROP POLICY IF EXISTS "Public reads report evidence" ON storage.objects;
CREATE POLICY "Public reads report evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

DROP POLICY IF EXISTS "Users upload own report evidence" ON storage.objects;
CREATE POLICY "Users upload own report evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins delete report evidence" ON storage.objects;
CREATE POLICY "Admins delete report evidence"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'reports'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_roomiematch_admin()
  )
);
