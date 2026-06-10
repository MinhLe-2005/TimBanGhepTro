-- Chạy trong Supabase SQL Editor để kiểm tra dữ liệu điện/nước hiện tại
SELECT 
  id,
  title,
  "hostName",
  electricity,
  water,
  "createdAt"
FROM public.rooms
ORDER BY "createdAt" DESC;
