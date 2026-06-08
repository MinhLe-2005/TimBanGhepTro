-- ============================================
-- SCRIPT SETUP SUPABASE CHO ROOMIEMATCH
-- Chạy trên Supabase SQL Editor
-- ============================================

-- 1. TẠO BẢNG MESSAGES CHO CHAT REAL-TIME
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Thêm index để tăng tốc truy vấn
    CONSTRAINT messages_chat_id_idx UNIQUE (id)
);

-- Index cho query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

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

-- 3. TẮT RLS TẠM THỜI ĐỂ TESTING (CHO PHÉP TẤT CẢ TRUY CẬP)
-- ⚠️ LƯU Ý: NẾU LÊN PRODUCTION, CẦN BẬT LẠI VÀ THIẾT LẬP POLICY CHO ĐÚNG!
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements DISABLE ROW LEVEL SECURITY;

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
END $$;

-- Thêm vào publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;

-- 5. KIỂM TRA XEM REALTIME ĐÃ ĐƯỢC BẬT CHƯA
-- Chạy query này để verify:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Bạn phải thấy 'messages' và 'agreements' trong kết quả

-- 6. INSERT TEST MESSAGE ĐỂ KIỂM TRA
-- INSERT INTO public.messages (chat_id, sender_id, text) 
-- VALUES ('test_chat', 'test_user', 'Hello from SQL!');

-- DONE! ✅

