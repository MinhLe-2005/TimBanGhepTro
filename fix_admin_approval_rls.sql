-- ============================================================
-- FIX ADMIN APPROVAL & REJECTION RLS POLICIES & RPC FUNCTIONS
-- Run this script in the Supabase SQL Editor once
-- ============================================================

-- 1. Sửa RLS Update policy trên bảng roommates để Admin có thể duyệt bài của người khác
DROP POLICY IF EXISTS "Owners or Admin can update roommates" ON public.roommates;
DROP POLICY IF EXISTS "Owners can update roommates" ON public.roommates;
CREATE POLICY "Owners or Admin can update roommates"
ON public.roommates FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 2. Sửa RLS Update policy trên bảng rooms để Admin có thể duyệt bài của người khác
DROP POLICY IF EXISTS "Owners or Admin can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
CREATE POLICY "Owners or Admin can update rooms"
ON public.rooms FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 3. Tạo RPC function duyệt bài bằng SECURITY DEFINER (ép cập nhật bỏ qua RLS)
CREATE OR REPLACE FUNCTION public.admin_approve_listing(p_table text, p_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_table = 'rooms' THEN
    UPDATE public.rooms SET "isVerifiedRoom" = true, "rejectReason" = NULL WHERE id = p_id;
  ELSIF p_table = 'roommates' THEN
    UPDATE public.roommates SET "isVerified" = true, "rejectReason" = NULL WHERE id = p_id;
  END IF;
END;
$$;

-- 4. Tạo RPC function từ chối bài bằng SECURITY DEFINER (ép cập nhật bỏ qua RLS)
CREATE OR REPLACE FUNCTION public.admin_reject_listing(p_table text, p_id text, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_table = 'rooms' THEN
    UPDATE public.rooms SET "isVerifiedRoom" = false, "rejectReason" = p_reason WHERE id = p_id;
  ELSIF p_table = 'roommates' THEN
    UPDATE public.roommates SET "isVerified" = false, "rejectReason" = p_reason WHERE id = p_id;
  END IF;
END;
$$;

-- 5. Cấp quyền thực thi các hàm RPC cho mọi vai trò
GRANT EXECUTE ON FUNCTION public.admin_approve_listing(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(text, text, text) TO anon, authenticated, service_role;
