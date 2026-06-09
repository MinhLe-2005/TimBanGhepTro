-- KỊCH BẢN TẠO BẢNG (CHẠY TRÊN SUPABASE SQL EDITOR)

-- Xóa các bảng cũ nếu đã tồn tại để làm mới hoàn toàn
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.roommates CASCADE;

-- 1. TẠO BẢNG ROOMMATES
CREATE TABLE public.roommates (
  id text PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  role text NOT NULL,
  "majorKhoidoi" text,
  "phoneNumber" text,
  avatar text NOT NULL,
  status text,
  location text NOT NULL,
  district text,
  type text,
  "matchScore" integer NOT NULL,
  "reputationScore" integer NOT NULL,
  tags jsonb NOT NULL,
  "isVerified" boolean NOT NULL DEFAULT false,
  bio text NOT NULL,
  budget integer NOT NULL,
  gender text NOT NULL,
  lifestyle jsonb NOT NULL,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TẠO BẢNG ROOMS
CREATE TABLE public.rooms (
  id text PRIMARY KEY,
  title text NOT NULL,
  price integer NOT NULL,
  location text NOT NULL,
  district text NOT NULL,
  type text NOT NULL,
  images jsonb NOT NULL,
  features jsonb NOT NULL,
  "isHot" boolean NOT NULL DEFAULT false,
  status text,
  "isVerifiedRoom" boolean DEFAULT false,
  bedrooms integer NOT NULL,
  wc text NOT NULL,
  kitchen text NOT NULL,
  "hostName" text NOT NULL,
  "hostAvatar" text NOT NULL,
  description text NOT NULL,
  "phoneNumber" text,
  pets text,
  gender text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TẠO BẢNG REVIEWS
CREATE TABLE public.reviews (
  id text PRIMARY KEY,
  "roommateId" text NOT NULL REFERENCES public.roommates(id) ON DELETE CASCADE,
  "reviewerName" text NOT NULL,
  "reviewerAvatar" text,
  rating numeric NOT NULL,
  comment text NOT NULL,
  "imageUrl" text,
  "createdAt" text NOT NULL
);

-- ĐỔ DỮ LIỆU FAKE CHO ROOMMATES (Sử dụng link ảnh Unsplash cho đẹp)
INSERT INTO public.roommates (id, name, age, role, "majorKhoidoi", "phoneNumber", avatar, status, location, district, type, "matchScore", "reputationScore", tags, "isVerified", bio, budget, gender, lifestyle)
VALUES
  ('minh-anh', 'Minh Anh', 22, 'Sinh viên', 'Khối Kinh tế', '0943 123 456', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop', 'Đã có phòng', 'Khu đô thị FPT, Ngũ Hành Sơn, Đà Nẵng', 'Ngũ Hành Sơn', 'Chung cư', 98, 98, '["Cú đêm", "Yêu mèo", "Không hút thuốc"]', true, 'Mình là sinh viên năm 4 ngành Kinh doanh, hoạt bát vui vẻ.', 3500000, 'Nữ', '{"sleep": "Cú đêm", "pets": "Yêu mèo", "smoke": "Không hút thuốc", "cook": "Đôi khi nấu", "interaction": "Hướng ngoại", "neatness": "Sạch sẽ"}'),
  
  ('hoang-nam', 'Hoàng Nam', 25, 'IT Developer', 'Khối Kỹ thuật', '0932 789 012', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop', 'Chưa có phòng', 'Đường Hùng Vương, Hải Châu, Đà Nẵng', 'Hải Châu', 'Ký túc xá', 92, 95, '["Ngủ sớm", "Ngăn nắp", "Thích nấu ăn"]', true, 'IT Dev hiền lành, thích code và nấu ăn ngon.', 3000000, 'Nam', '{"sleep": "Ngủ sớm", "pets": "Thoải mái", "smoke": "Không hút thuốc", "cook": "Thích nấu ăn", "interaction": "Cân bằng", "neatness": "Ngăn nắp"}'),
  
  ('trang-le', 'Trang Lê', 21, 'Sinh viên', 'Khối Nghệ thuật', '0387 456 123', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop', 'Đã có phòng', 'Đường Điện Biên Phủ, Thanh Khê, Đà Nẵng', 'Thanh Khê', 'Phòng trọ', 89, 92, '["Hướng nội", "Sạch sẽ", "Nữ tính"]', true, 'Mình đang học Thiết kế đồ họa tại Đà Nẵng. Mình tương đối hướng nội.', 4000000, 'Nữ', '{"sleep": "Bình thường", "pets": "Thoải mái", "smoke": "Không hút thuốc", "cook": "Ăn ngoài", "interaction": "Hướng nội", "neatness": "Sạch sẽ"}'),
  
  ('duc-tri', 'Đức Trí', 24, 'Designer', 'Khối Nghệ thuật', '0915 222 333', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop', 'Chưa có phòng', 'Gần ĐH Bách Khoa, Liên Chiểu, Đà Nẵng', 'Liên Chiểu', 'Studio', 85, 90, '["Thích thể thao", "Thoải mái", "Vui tính"]', true, 'Designer tự do, thích không gian sáng tạo và thể thao ngoài trời.', 3200000, 'Nam', '{"sleep": "Cú đêm", "pets": "Thoải mái", "smoke": "Không hút thuốc", "cook": "Đôi khi nấu", "interaction": "Hướng ngoại", "neatness": "Bình thường"}'),
  
  ('khanh-vy', 'Khánh Vy', 23, 'Marketing Manager', 'Khối Kinh tế', '0988 777 666', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop', 'Đã có phòng', 'Quận Hải Châu, Đà Nẵng', 'Hải Châu', 'Chung cư', 91, 96, '["Marketing", "Thoải mái", "Ngủ sớm"]', true, 'Nhân viên Marketing yêu cái đẹp, thích sống ngăn nắp.', 4500000, 'Nữ', '{"sleep": "Ngủ sớm", "pets": "Không nuôi", "smoke": "Không hút thuốc", "cook": "Ít nấu", "interaction": "Cân bằng", "neatness": "Sạch sẽ"}')
ON CONFLICT (id) DO NOTHING;

-- ĐỔ DỮ LIỆU FAKE CHO ROOMS
INSERT INTO public.rooms (id, title, price, location, district, type, images, features, "isHot", status, "isVerifiedRoom", bedrooms, wc, kitchen, "hostName", "hostAvatar", description)
VALUES
  ('room-1', 'Phòng Trọ Gác Lửng', 2500000, 'Hải Châu, Đà Nẵng', 'Hải Châu', 'Phòng trọ', '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"]', '["Máy lạnh", "Tủ lạnh", "Máy giặt", "Chỗ để xe", "Bảo vệ 24/7"]', true, 'còn phòng', true, 1, 'Khép kín', 'Chung', 'Chị Lan', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop', 'Phòng trọ gác lửng mới xây, khu vực an ninh, không chung chủ.')
ON CONFLICT (id) DO NOTHING;
