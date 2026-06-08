-- Insert test profiles để fix "Người dùng ẩn danh"
-- Thay YOUR_UUID và YOUR_PROFILE_ID bằng giá trị thực từ bảng messages

-- Profile 1: User với UUID auth
INSERT INTO public.profiles (id, auth_id, name, avatar, role)
VALUES 
  ('311ffebd-38a2-42e3-9688-bbef5af6db29', 
   '311ffebd-38a2-42e3-9688-bbef5af6db29'::uuid, 
   'MINH', 
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop', 
   'Sinh viên')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar;

-- Profile 2: User với profile ID rm-xxx
INSERT INTO public.profiles (id, name, avatar, role)
VALUES 
  ('rm-17808772828937', 
   'LONG', 
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', 
   'Sinh viên')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar;

-- Kiểm tra lại
SELECT * FROM profiles;
