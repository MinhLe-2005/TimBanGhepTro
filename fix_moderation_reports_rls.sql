-- Run this file in Supabase SQL Editor after changing the admin account.
-- Add any additional trusted admin email to the function below.

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

REVOKE ALL ON FUNCTION public.is_roomiematch_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_roomiematch_admin() TO authenticated;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.roomiematch_chat_has_banned_user(target_chat_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messages ban_message
    WHERE ban_message.chat_id = 'SYSTEM_BANS'
      AND ban_message.text LIKE '[BAN]%'
      AND position(
        trim(replace(ban_message.text, '[BAN]', ''))
        IN coalesce(target_chat_id, '')
      ) > 0
  );
$$;

REVOKE ALL ON FUNCTION public.roomiematch_chat_has_banned_user(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roomiematch_chat_has_banned_user(text) TO authenticated;

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "RoomieMatch users can insert messages" ON public.messages;
CREATE POLICY "RoomieMatch users can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()::text
  AND NOT public.roomiematch_chat_has_banned_user(chat_id)
);

DROP POLICY IF EXISTS "Admin can read moderation messages" ON public.messages;
CREATE POLICY "Admin can read moderation messages"
ON public.messages FOR SELECT
USING (
  public.is_roomiematch_admin()
  AND chat_id LIKE 'SYSTEM_%'
);

DROP POLICY IF EXISTS "Authenticated users can read ban status" ON public.messages;
CREATE POLICY "Authenticated users can read ban status"
ON public.messages FOR SELECT
TO authenticated
USING (chat_id = 'SYSTEM_BANS');

DROP POLICY IF EXISTS "Admin can delete moderation content" ON public.messages;
CREATE POLICY "Admin can delete moderation content"
ON public.messages FOR DELETE
USING (
  public.is_roomiematch_admin()
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id TEXT NOT NULL,
  roommate_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_reports_unique
ON public.review_reports(review_id, reporter_id);

CREATE INDEX IF NOT EXISTS idx_review_reports_status
ON public.review_reports(status, created_at DESC);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create review reports" ON public.review_reports;
CREATE POLICY "Users can create review reports"
ON public.review_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admin can read review reports" ON public.review_reports;
CREATE POLICY "Admin can read review reports"
ON public.review_reports FOR SELECT
USING (
  public.is_roomiematch_admin()
);

DROP POLICY IF EXISTS "Admin can update review reports" ON public.review_reports;
CREATE POLICY "Admin can update review reports"
ON public.review_reports FOR UPDATE
USING (
  public.is_roomiematch_admin()
)
WITH CHECK (
  public.is_roomiematch_admin()
);

DROP POLICY IF EXISTS "Admin can delete reported reviews" ON public.reviews;
CREATE POLICY "Admin can delete reported reviews"
ON public.reviews FOR DELETE
USING (
  public.is_roomiematch_admin()
);
