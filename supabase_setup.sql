-- ============================================
-- SCRIPT SETUP SUPABASE CHO ROOMIEMATCH
-- Chạy trên Supabase SQL Editor
-- ============================================

-- 0. TẠO BẢNG PROFILES (LƯU THÔNG TIN USER)
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,  -- rm-xxx hoặc auth UUID
    auth_id UUID,  -- Link tới Supabase Auth user
    name TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'Thành viên',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho profiles
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 1. TẠO BẢNG MESSAGES CHO CHAT REAL-TIME
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_system BOOLEAN DEFAULT false,
    visible_to TEXT,
    
    -- Thêm index để tăng tốc truy vấn
    CONSTRAINT messages_chat_id_idx UNIQUE (id)
);

-- Index cho query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- TRIGGER TỰ ĐỘNG CẢNH BÁO TIN NHẮN NHẠY CẢM
CREATE OR REPLACE FUNCTION public.detect_suspicious_message()
RETURNS TRIGGER AS $$
DECLARE
    lower_text TEXT;
    warning_text TEXT := '⚠️ CẢNH BÁO AN TOÀN: Tuyệt đối không chuyển khoản trước, gửi tiền cọc giữ chỗ hoặc giao dịch tài chính gấp trước khi xem phòng trực tiếp và ký hợp đồng thuê/ở ghép rõ ràng để tránh bị lừa đảo.';
    partner_id TEXT;
    part1 TEXT;
    part2 TEXT;
BEGIN
    lower_text := lower(NEW.text);
    
    -- Kiểm tra nếu không phải tin nhắn hệ thống và chứa từ khóa nhạy cảm
    IF (NEW.is_system = false OR NEW.is_system IS NULL) AND (
        lower_text LIKE '%chuyển khoản trước%' OR
        lower_text LIKE '%gửi cọc giữ chỗ%' OR
        lower_text LIKE '%chuyển tiền gấp%' OR
        lower_text LIKE '%đặt cọc%' OR
        lower_text LIKE '%tiền cọc%' OR
        lower_text LIKE '%gửi cọc%' OR
        lower_text LIKE '%chuyển khoản%' OR
        lower_text LIKE '%chuyển tiền%'
    ) THEN
        -- Tách chat_id (định dạng user1_user2) để tìm partner_id (người nhận tin nhắn)
        IF NEW.chat_id LIKE '%_%' THEN
            part1 := split_part(NEW.chat_id, '_', 1);
            part2 := split_part(NEW.chat_id, '_', 2);
            
            IF NEW.sender_id = part1 OR EXISTS (
                SELECT 1 FROM public.roommates 
                WHERE (id = part1 OR user_id = part1 OR auth_id = part1) 
                  AND (id = NEW.sender_id OR user_id = NEW.sender_id OR auth_id = NEW.sender_id)
            ) OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE (id = part1 OR auth_id = part1) 
                  AND (id = NEW.sender_id OR auth_id = NEW.sender_id)
            ) THEN
                partner_id := part2;
            ELSE
                partner_id := part1;
            END IF;
            
            -- Tự động sinh thêm một tin nhắn hệ thống cảnh báo, chỉ hiển thị cho partner_id
            INSERT INTO public.messages (chat_id, sender_id, text, is_system, visible_to)
            VALUES (NEW.chat_id, 'system', warning_text, true, partner_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_detect_suspicious_message ON public.messages;
CREATE TRIGGER trg_detect_suspicious_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_suspicious_message();

-- 2. TẠO BẢNG AGREEMENTS
DROP TABLE IF EXISTS public.agreements CASCADE;
CREATE TABLE public.agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' (chờ ký), 'signed' (đã ký hiệu lực)
    rules JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho agreements
CREATE INDEX IF NOT EXISTS idx_agreements_creator ON public.agreements(creator_id);
CREATE INDEX IF NOT EXISTS idx_agreements_partner ON public.agreements(partner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.agreements(status);

-- 2.5. TẠO BẢNG REVIEWS (ĐÁNH GIÁ)
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roommate_id TEXT NOT NULL,
    reviewer_id TEXT,
    reviewer_name TEXT NOT NULL,
    reviewer_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho reviews
CREATE INDEX IF NOT EXISTS idx_reviews_roommate ON public.reviews(roommate_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_reviewer
ON public.reviews(roommate_id, reviewer_id)
WHERE reviewer_id IS NOT NULL;

-- 2.6. BÁO CÁO FEEDBACK KHÔNG PHÙ HỢP
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

-- 2.7. LƯỢT QUAN TÂM HỒ SƠ ROOMMATE
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

-- 3. TẮT RLS TẠM THỜI ĐỂ TESTING (CHO PHÉP TẤT CẢ TRUY CẬP)
-- ⚠️ LƯU Ý: NẾU LÊN PRODUCTION, CẦN BẬT LẠI VÀ THIẾT LẬP POLICY CHO ĐÚNG!
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_likes DISABLE ROW LEVEL SECURITY;

-- NẾU BẠN MUỐN BẬT RLS NHƯNG CHO PHÉP TẤT CẢ (DEMO MODE):
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow All for Messages" ON public.messages;
-- CREATE POLICY "Allow All for Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow All for Agreements" ON public.agreements;
-- CREATE POLICY "Allow All for Agreements" ON public.agreements FOR ALL USING (true) WITH CHECK (true);

-- 4. BẬT REALTIME CHO CÁC BẢNG
-- Xóa khỏi publication trước (nếu đã có) - bỏ qua lỗi nếu chưa có
DO $$
BEGIN
    -- Thử xóa messages khỏi publication (bỏ qua nếu chưa có)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Thử xóa agreements khỏi publication (bỏ qua nếu chưa có)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.agreements;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Thử xóa reviews khỏi publication (bỏ qua nếu chưa có)
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.reviews;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- Thêm vào publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- 5. KIỂM TRA XEM REALTIME ĐÃ ĐƯỢC BẬT CHƯA
-- Chạy query này để verify:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Bạn phải thấy 'messages' và 'agreements' trong kết quả

-- 6. INSERT TEST MESSAGE ĐỂ KIỂM TRA
-- INSERT INTO public.messages (chat_id, sender_id, text) 
-- VALUES ('test_chat', 'test_user', 'Hello from SQL!');

-- DONE! ✅



-- ============================================
-- FIX: Separate user profile from roommate listings
-- ============================================
-- Add is_listing field to distinguish between user profiles and roommate listings
-- is_listing = false → User profile (CANNOT be deleted from listing page)
-- is_listing = true → Roommate listing (CAN be deleted)
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS is_listing BOOLEAN DEFAULT true;

-- Update existing profiles to mark as user profiles (not listings)
-- Run this after adding the column to fix existing data
-- UPDATE roommates SET is_listing = false WHERE user_id IS NOT NULL;
