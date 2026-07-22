-- ============================================================
-- MIGRATION: USER REPORT & ACCOUNT LOCKING SYSTEM
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Thêm cột is_locked vào bảng profiles và roommates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- 2. Tạo bảng user_reports để lưu trữ lượt báo cáo
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tạo unique index để đảm bảo mỗi người dùng chỉ được báo cáo 1 tài khoản tối đa 1 lần
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_reports_unique ON public.user_reports (reporter_id, reported_id);

-- 4. Tắt RLS hoặc phân quyền cho user_reports để testing/demo
ALTER TABLE public.user_reports DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_reports TO anon, authenticated, service_role;

-- 5. Viết trigger đếm số lượng report và khóa tài khoản
CREATE OR REPLACE FUNCTION public.check_user_reports_limit()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    v_user_id TEXT;
    v_profile_id TEXT;
BEGIN
    -- Đếm số lượng người báo cáo khác nhau cho tài khoản bị báo cáo
    SELECT COUNT(DISTINCT reporter_id) INTO report_count
    FROM public.user_reports
    WHERE reported_id = NEW.reported_id;

    -- Nếu tài khoản bị từ 3 người dùng khác nhau report trở lên (>= 3)
    IF report_count >= 3 THEN
        -- Tìm user_id/auth_id liên kết từ roommates
        SELECT user_id INTO v_user_id
        FROM public.roommates
        WHERE id = NEW.reported_id OR user_id = NEW.reported_id OR "postedBy" = NEW.reported_id
        LIMIT 1;

        -- Tìm profile_id liên kết từ profiles
        SELECT id INTO v_profile_id
        FROM public.profiles
        WHERE id = NEW.reported_id OR auth_id::text = NEW.reported_id
        LIMIT 1;

        -- Khóa tài khoản trong bảng profiles (is_locked = true)
        UPDATE public.profiles
        SET is_locked = true
        WHERE id = NEW.reported_id 
           OR auth_id::text = NEW.reported_id
           OR id = v_user_id
           OR auth_id::text = v_user_id
           OR id = v_profile_id;

        -- Khóa tài khoản trong bảng roommates (is_locked = true)
        UPDATE public.roommates
        SET is_locked = true
        WHERE id = NEW.reported_id 
           OR user_id = NEW.reported_id 
           OR "postedBy" = NEW.reported_id
           OR id = v_user_id
           OR user_id = v_user_id
           OR "postedBy" = v_user_id
           OR id = v_profile_id;

        -- Tự động gửi thông báo về Dashboard Admin qua table messages (bảng log reports của hệ thống)
        INSERT INTO public.messages (chat_id, sender_id, text, is_system)
        VALUES (
            'SYSTEM_REPORTS_AUTO',
            'system',
            '[REPORT] {"target_id":"' || NEW.reported_id || '","reason":"[HỆ THỐNG] Tài khoản đã bị KHÓA TẠM THỜI do nhận > 3 báo cáo từ các người dùng khác nhau. Báo cáo cuối từ: ' || NEW.reporter_id || '. Lý do: ' || COALESCE(NEW.reason, 'Không có lý do') || '","source":"system_auto_lock"}',
            true
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào bảng user_reports
DROP TRIGGER IF EXISTS trg_check_user_reports_limit ON public.user_reports;
CREATE TRIGGER trg_check_user_reports_limit
    AFTER INSERT OR UPDATE ON public.user_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_reports_limit();
