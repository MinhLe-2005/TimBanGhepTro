-- Cập nhật thủ công điện/nước cho các phòng đang NULL
-- Sửa lại giá trị cho từng phòng nếu biết giá thực tế

UPDATE public.rooms
SET 
  electricity = '3.500đ/kWh',
  water = '10.000đ/m³'
WHERE electricity IS NULL OR water IS NULL;

-- Kiểm tra kết quả
SELECT id, title, "hostName", electricity, water FROM public.rooms;
