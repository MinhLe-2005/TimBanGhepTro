-- Link future reviews to authenticated users and prevent duplicate reviews.
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reviewer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer
ON public.reviews(reviewer_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_reviewer
ON public.reviews(roommate_id, reviewer_id)
WHERE reviewer_id IS NOT NULL;
