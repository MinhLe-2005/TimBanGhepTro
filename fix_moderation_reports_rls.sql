-- Run once in Supabase SQL Editor.
-- Allows the configured RoomieMatch admin to review and moderate reports.

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read moderation messages" ON public.messages;
CREATE POLICY "Admin can read moderation messages"
ON public.messages FOR SELECT
USING (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
  AND chat_id LIKE 'SYSTEM_%'
);

DROP POLICY IF EXISTS "Admin can delete moderation content" ON public.messages;
CREATE POLICY "Admin can delete moderation content"
ON public.messages FOR DELETE
USING (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create review reports" ON public.review_reports;
CREATE POLICY "Users can create review reports"
ON public.review_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admin can read review reports" ON public.review_reports;
CREATE POLICY "Admin can read review reports"
ON public.review_reports FOR SELECT
USING (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
);

DROP POLICY IF EXISTS "Admin can update review reports" ON public.review_reports;
CREATE POLICY "Admin can update review reports"
ON public.review_reports FOR UPDATE
USING (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
)
WITH CHECK (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
);

DROP POLICY IF EXISTS "Admin can delete reported reviews" ON public.reviews;
CREATE POLICY "Admin can delete reported reviews"
ON public.reviews FOR DELETE
USING (
  auth.uid()::text = '7a1b28ab-058f-49b6-85bb-3cb61406db31'
);
