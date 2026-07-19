-- ============================================================
-- FIX: COMPLETE TYPE-SAFE DETECT SUSPICIOUS MESSAGE TRIGGER
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Đảm bảo các cột hệ thống tồn tại trong bảng messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS visible_to TEXT;

-- 2. Tạo/Cập nhật hàm trigger cảnh báo nhạy cảm
CREATE OR REPLACE FUNCTION public.detect_suspicious_message()
RETURNS TRIGGER AS $$
DECLARE
    lower_text TEXT;
    warning_text TEXT := '⚠️ CẢNH BÁO AN TOÀN: Tuyệt đối không chuyển khoản trước, gửi tiền cọc giữ chỗ hoặc giao dịch tài chính gấp trước khi xem phòng trực tiếp và ký hợp đồng thuê/ở ghép rõ ràng để tránh bị lừa đảo.';
    partner_id TEXT;
    part1 TEXT;
    part2 TEXT;
    is_part1_sender BOOLEAN := false;
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
            
            -- Kiểm tra xem part1 có phải là sender không
            IF part1 = NEW.sender_id THEN
                is_part1_sender := true;
            ELSE
                -- Kiểm tra liên kết profiles (Ép kiểu ::text cho các trường UUID)
                IF EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE (id::text = part1 AND auth_id::text = NEW.sender_id)
                       OR (auth_id::text = part1 AND id::text = NEW.sender_id)
                ) THEN
                    is_part1_sender := true;
                -- Kiểm tra liên kết roommates
                ELSIF EXISTS (
                    SELECT 1 FROM public.roommates 
                    WHERE (id = part1 AND user_id = NEW.sender_id)
                       OR (user_id = part1 AND id = NEW.sender_id)
                ) THEN
                    is_part1_sender := true;
                END IF;
            END IF;
            
            -- Nếu part1 là sender thì người nhận (partner_id) là part2, ngược lại là part1
            IF is_part1_sender THEN
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

-- 3. Tạo lại trigger
DROP TRIGGER IF EXISTS trg_detect_suspicious_message ON public.messages;
CREATE TRIGGER trg_detect_suspicious_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_suspicious_message();
