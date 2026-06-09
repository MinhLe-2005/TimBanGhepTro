-- Run once in Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS public.roommate_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roommate_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roommate_likes_unique
ON public.roommate_likes(roommate_id, user_id);

CREATE INDEX IF NOT EXISTS idx_roommate_likes_roommate
ON public.roommate_likes(roommate_id, created_at DESC);

ALTER TABLE public.roommate_likes DISABLE ROW LEVEL SECURITY;
