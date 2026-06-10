-- Run once in Supabase SQL Editor to enable persistent, realtime room reviews.
CREATE TABLE IF NOT EXISTS public.room_reviews (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  reviewer_id text NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_avatar text,
  rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_room_reviews_room
  ON public.room_reviews(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_reviews_reviewer
  ON public.room_reviews(reviewer_id);

ALTER TABLE public.room_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room reviews are public" ON public.room_reviews;
CREATE POLICY "Room reviews are public"
  ON public.room_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users create own room reviews" ON public.room_reviews;
CREATE POLICY "Users create own room reviews"
  ON public.room_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own room reviews" ON public.room_reviews;
CREATE POLICY "Users update own room reviews"
  ON public.room_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid()::text)
  WITH CHECK (reviewer_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own room reviews" ON public.room_reviews;
CREATE POLICY "Users delete own room reviews"
  ON public.room_reviews FOR DELETE
  TO authenticated
  USING (reviewer_id = auth.uid()::text);

GRANT SELECT ON public.room_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_reviews TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reviews;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
