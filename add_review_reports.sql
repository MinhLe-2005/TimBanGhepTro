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
