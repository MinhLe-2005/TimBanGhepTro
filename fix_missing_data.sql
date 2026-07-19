-- ============================================================
-- FIX MISSING DATA - Chạy trong Supabase SQL Editor
-- ============================================================

-- 1. Đảm bảo tất cả columns cần thiết tồn tại (idempotent)
ALTER TABLE public.roommates
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS is_listing boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS "rejectReason" text;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS user_id text,
  ADD COLUMN IF NOT EXISTS "postedBy" text,
  ADD COLUMN IF NOT EXISTS electricity text,
  ADD COLUMN IF NOT EXISTS water text,
  ADD COLUMN IF NOT EXISTS parking text,
  ADD COLUMN IF NOT EXISTS proximity text,
  ADD COLUMN IF NOT EXISTS "hostRole" text,
  ADD COLUMN IF NOT EXISTS "roommateInfo" text,
  ADD COLUMN IF NOT EXISTS habits jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "rejectReason" text;

-- Đảm bảo cột is_system và visible_to tồn tại trong bảng messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to text;

-- Đảm bảo Trigger tự động cảnh báo tin nhắn nhạy cảm tồn tại
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
                -- Kiểm tra liên kết profiles
                IF EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE (id = part1 AND auth_id::text = NEW.sender_id)
                       OR (auth_id::text = part1 AND id = NEW.sender_id)
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

DROP TRIGGER IF EXISTS trg_detect_suspicious_message ON public.messages;
CREATE TRIGGER trg_detect_suspicious_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_suspicious_message();

-- 2. Các bản ghi roommate cũ (không phải profile) cần is_listing = true
-- Profile là bản ghi có is_listing = false được set rõ ràng
-- Bản ghi cũ có is_listing = null => đây là listing, set = true
UPDATE public.roommates
SET is_listing = true
WHERE is_listing IS NULL;

-- 3. Đảm bảo RLS policies đúng cho public read
-- (Chạy lại để chắc chắn - idempotent)
ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read roommates" ON public.roommates;
CREATE POLICY "Public can read roommates"
ON public.roommates FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can read rooms" ON public.rooms;
CREATE POLICY "Public can read rooms"
ON public.rooms FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Owners can insert roommates" ON public.roommates;
CREATE POLICY "Owners can insert roommates"
ON public.roommates FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update roommates" ON public.roommates;
CREATE POLICY "Owners can update roommates"
ON public.roommates FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
)
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can delete roommates" ON public.roommates;
CREATE POLICY "Owners can delete roommates"
ON public.roommates FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can insert rooms" ON public.rooms;
CREATE POLICY "Owners can insert rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
CREATE POLICY "Owners can update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
)
WITH CHECK (
  user_id = auth.uid()::text OR "postedBy" = auth.uid()::text
);

DROP POLICY IF EXISTS "Owners can delete rooms" ON public.rooms;
CREATE POLICY "Owners can delete rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()::text
  OR "postedBy" = auth.uid()::text
);

GRANT SELECT ON public.roommates, public.rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.roommates, public.rooms TO authenticated;

-- 4. Kiểm tra kết quả
SELECT 
  'roommates' as table_name,
  COUNT(*) as total,
  SUM(CASE WHEN is_listing = true THEN 1 ELSE 0 END) as listings,
  SUM(CASE WHEN is_listing = false THEN 1 ELSE 0 END) as profiles,
  SUM(CASE WHEN is_listing IS NULL THEN 1 ELSE 0 END) as null_listing
FROM public.roommates
UNION ALL
SELECT 
  'rooms' as table_name,
  COUNT(*) as total,
  NULL as listings,
  NULL as profiles,
  NULL as null_listing
FROM public.rooms;
