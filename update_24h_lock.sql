-- 1. Thêm cột locked_until vào các bảng liên quan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- 2. Cập nhật trigger giới hạn số lượng báo cáo (Khóa tạm thời 24h)
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

    -- Nếu tài khoản bị từ 3 người dùng khác nhau report trở lên
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

        -- Khóa tài khoản tạm thời 24h trong bảng profiles
        UPDATE public.profiles
        SET locked_until = NOW() + INTERVAL '24 hours'
        WHERE id = NEW.reported_id 
           OR auth_id::text = NEW.reported_id
           OR id = v_user_id
           OR auth_id::text = v_user_id
           OR id = v_profile_id;

        -- Khóa tài khoản tạm thời 24h trong bảng roommates
        UPDATE public.roommates
        SET locked_until = NOW() + INTERVAL '24 hours'
        WHERE id = NEW.reported_id 
           OR user_id = NEW.reported_id 
           OR "postedBy" = NEW.reported_id
           OR id = v_user_id
           OR user_id = v_user_id
           OR "postedBy" = v_user_id
           OR id = v_profile_id;
           
        -- Khóa tài khoản tạm thời 24h trong bảng rooms
        UPDATE public.rooms
        SET locked_until = NOW() + INTERVAL '24 hours'
        WHERE user_id = NEW.reported_id
           OR "postedBy" = NEW.reported_id
           OR user_id = v_user_id
           OR "postedBy" = v_user_id;

        -- Tự động gửi thông báo về Dashboard Admin qua table messages (bảng log reports của hệ thống)
        INSERT INTO public.messages (chat_id, sender_id, text, is_system)
        VALUES (
            'SYSTEM_REPORTS_AUTO',
            'system',
            '[REPORT] {"target_id":"' || NEW.reported_id || '","reason":"[HỆ THỐNG] Tài khoản đã bị KHÓA TẠM THỜI 24 GIỜ do nhận > 3 báo cáo từ các người dùng khác nhau. Báo cáo cuối từ: ' || NEW.reporter_id || '. Lý do: ' || COALESCE(NEW.reason, 'Không có lý do') || '","source":"system_auto_lock"}',
            true
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đảm bảo trigger vẫn hoạt động đúng
DROP TRIGGER IF EXISTS trg_check_user_reports_limit ON public.user_reports;
CREATE TRIGGER trg_check_user_reports_limit
    AFTER INSERT OR UPDATE ON public.user_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_reports_limit();
