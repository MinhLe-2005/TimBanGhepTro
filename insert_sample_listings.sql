-- Xóa các listings mẫu cũ (nếu có)
DELETE FROM roommates WHERE name IN ('Minh Anh', 'Đức Trí', 'Khánh Vy', 'Hoàng Nam', 'Thùy Quỳnh') AND is_listing = true;

-- Thêm 5 mẫu listings đẹp cho tab "Tìm Bạn"
INSERT INTO roommates (
  id, name, age, gender, role, avatar, location, district, type, "matchScore",
  "reputationScore", tags, "isVerified", status, bio, budget, "majorKhoidoi",
  "phoneNumber", lifestyle, reviews, is_listing, "postedBy", user_id
) VALUES
-- 1. Minh Anh - Nữ sinh viên kinh tế
(
  'rm-sample-1',
  'Minh Anh',
  21,
  'Nữ',
  'Sinh viên',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
  'Gần ĐH Kinh Tế, Quận Hải Châu, Đà Nẵng',
  'Hải Châu',
  'Phòng trọ',
  92,
  95,
  ARRAY['Yêu sạch sẽ', 'Thích nấu ăn', 'Hòa đồng'],
  true,
  'Chưa có phòng',
  'Mình là sinh viên năm 3 ĐH Kinh Tế, đang tìm bạn nữ ở ghép khu vực Hải Châu. Mình thích nấu ăn, sống có trách nhiệm và tôn trọng không gian riêng. Mong tìm được bạn có lối sống tương tự để cùng chia sẻ chi phí nhé!',
  2500000,
  'Khối Kinh tế',
  '0905123456',
  '{"sleep": "Ngủ sớm", "pets": "Yêu mèo", "smoke": "Không hút thuốc", "cook": "Thích nấu ăn", "interaction": "Hướng ngoại", "neatness": "Ngăn nắp"}',
  '[]',
  true,
  'demo-user-1',
  'demo-user-1'
),

-- 2. Đức Trí - Nam sinh viên kỹ thuật
(
  'rm-sample-2',
  'Đức Trí',
  22,
  'Nam',
  'Sinh viên',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
  'Gần ĐH Bách Khoa, Quận Thanh Khê, Đà Nẵng',
  'Thanh Khê',
  'Căn hộ',
  88,
  98,
  ARRAY['Cú đêm', 'Yêu công nghệ', 'Tự giác'],
  true,
  'Đã có phòng',
  'Mình là dev/sinh viên IT, đã có căn hộ 2 phòng ngủ gần ĐH Bách Khoa và đang tìm bạn nam chia sẻ. Phòng đầy đủ tiện nghi: wifi cao cấp, điều hòa, máy giặt. Mình làm việc remote nên thường ở nhà, thích không gian yên tĩnh để code.',
  3000000,
  'Khối Kỹ thuật',
  '0912345678',
  '{"sleep": "Cú đêm", "pets": "Không tiện nuôi", "smoke": "Không hút thuốc", "cook": "Ăn ngoài", "interaction": "Hướng nội", "neatness": "Sạch sẽ"}',
  '[]',
  true,
  'demo-user-2',
  'demo-user-2'
),

-- 3. Khánh Vy - Nữ giảng viên
(
  'rm-sample-3',
  'Khánh Vy',
  28,
  'Nữ',
  'Giảng viên',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
  'Khu K300, Quận Sơn Trà, Đà Nẵng',
  'Sơn Trà',
  'Chung cư',
  95,
  100,
  ARRAY['Chuyên nghiệp', 'Yêu yoga', 'Healthy lifestyle'],
  true,
  'Đã có phòng',
  'Mình là giảng viên ĐH Ngoại Ngữ, đã có chung cư 2PN view biển tại Sơn Trà. Tìm bạn nữ văn minh, yêu thể thao và lối sống lành mạnh. Chung cư có hồ bơi, gym, ban công rộng rãi. Mình thường xuyên tập yoga buổi sáng, nếu bạn thích thể thao thì perfect!',
  4000000,
  'Khối Sư phạm',
  '0923456789',
  '{"sleep": "Ngủ sớm", "pets": "Thoải mái", "smoke": "Không hút thuốc", "cook": "Đôi khi nấu", "interaction": "Cân bằng", "neatness": "Ngăn nắp"}',
  '[]',
  true,
  'demo-user-3',
  'demo-user-3'
),

-- 4. Hoàng Nam - Nam nhân viên văn phòng
(
  'rm-sample-4',
  'Hoàng Nam',
  25,
  'Nam',
  'Nhân viên văn phòng',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
  'Gần BigC, Quận Hải Châu, Đà Nẵng',
  'Hải Châu',
  'Phòng trọ',
  85,
  92,
  ARRAY['Đi làm đều', 'Yêu thể thao', 'Easy-going'],
  true,
  'Chưa có phòng',
  'Mình làm marketing cho một công ty IT, đang tìm bạn ở ghép khu BigC hoặc gần chợ Hàn. Mình đi làm từ 8h-5h, chiều về thường đi gym hoặc đá bóng với team. Cuối tuần hay đi cafe, du lịch gần. Tìm bạn cùng hoà đồng, thích thể thao!',
  2800000,
  'Khối Kinh tế',
  '0934567890',
  '{"sleep": "Bình thường", "pets": "Không tiện nuôi", "smoke": "Không hút thuốc", "cook": "Ăn ngoài", "interaction": "Hướng ngoại", "neatness": "Sạch sẽ"}',
  '[]',
  true,
  'demo-user-4',
  'demo-user-4'
),

-- 5. Thùy Quỳnh - Nữ sinh viên y dược
(
  'rm-sample-5',
  'Thùy Quỳnh',
  20,
  'Nữ',
  'Sinh viên',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
  'Gần BV Đà Nẵng, Quận Hải Châu, Đà Nẵng',
  'Hải Châu',
  'Ký túc xá',
  90,
  96,
  ARRAY['Học chăm', 'Yêu động vật', 'Vui tính'],
  true,
  'Chưa có phòng',
  'Mình là sinh viên năm 2 Y Dược, đang tìm bạn nữ ở ghép gần bệnh viện để thuận tiện đi học thực hành. Mình học khá nhiều nhưng cũng thích giao lưu, xem phim, đi cafe. Có nuôi mèo nên hy vọng tìm bạn cũng yêu động vật hoặc ít nhất là không ngại nha!',
  2200000,
  'Khối Y Dược',
  '0945678901',
  '{"sleep": "Bình thường", "pets": "Yêu mèo", "smoke": "Không hút thuốc", "cook": "Thích nấu ăn", "interaction": "Cân bằng", "neatness": "Sạch sẽ"}',
  '[]',
  true,
  'demo-user-5',
  'demo-user-5'
);

-- Verify inserted data
SELECT 
  id, 
  name, 
  age, 
  gender, 
  district, 
  budget, 
  is_listing,
  status
FROM roommates 
WHERE is_listing = true
ORDER BY name;
