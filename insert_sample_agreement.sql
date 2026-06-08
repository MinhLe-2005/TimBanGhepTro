-- Insert sample completed agreement for testing review functionality
-- This creates a completed agreement between two users so they can review each other

-- Example: User A (your current user) completed agreement with "Minh Anh"
INSERT INTO agreements (
  user1_id,
  user2_id,
  roommate_id,
  title,
  content,
  status,
  "completedAt",
  "startDate",
  "endDate"
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID from auth.users
  'MINH_ANH_USER_ID', -- Replace with Minh Anh's user ID
  'MINH_ANH_ROOMMATE_ID', -- Replace with Minh Anh's roommate record ID
  'Hợp đồng ở ghép 6 tháng',
  'Hai bên cam kết chia sẻ chi phí thuê phòng, điện nước đều nhau. Thời gian hợp đồng 6 tháng từ 01/01/2026 đến 30/06/2026.',
  'completed',
  NOW(),
  '2026-01-01',
  '2026-06-30'
);

-- Check agreements
SELECT 
  id,
  user1_id,
  user2_id,
  title,
  status,
  "completedAt"
FROM agreements
WHERE status = 'completed';
