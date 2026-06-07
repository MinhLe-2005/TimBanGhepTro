-- TẠO BẢNG MESSAGES CHO CHAT REAL-TIME
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT,
    image_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BẢNG REVIEWS ĐÃ CÓ SẴN (Bỏ qua việc tạo lại bảng reviews để tránh lỗi)

-- TẠO BẢNG AGREEMENTS (NẾU CHƯA CÓ HOẶC CẦN UPDATE SCHEMA)
CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' (chờ ký), 'signed' (đã ký hiệu lực)
    rules JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BẬT REALTIME CHO BẢNG MESSAGES VÀ AGREEMENTS
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table agreements;

-- POLICY CHO PHÉP TẤT CẢ (VÌ LÀ APP DEMO, NẾU LÊN PRODUCTION CẦN KHÓA LẠI)
-- Chạy riêng rẽ để không lỗi nếu policy đã tồn tại
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow All for Messages" ON public.messages FOR ALL USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN
        ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow All for Agreements" ON public.agreements FOR ALL USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

