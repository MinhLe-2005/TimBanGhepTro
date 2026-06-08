# Fix: Xóa bài đăng KHÔNG xóa hồ sơ cá nhân

## Vấn đề:
- Khi xóa bài đăng tìm bạn → Hồ sơ cá nhân bị xóa luôn
- Phải nhập lại thông tin mỗi khi đăng tin mới

## Giải pháp:
Tách biệt **User Profile** (hồ sơ cá nhân) và **Roommate Listing** (bài đăng)

---

## Bước 1: Chạy SQL trong Supabase Dashboard

Vào **Supabase Dashboard** → **SQL Editor**, chạy:

```sql
-- Add column is_listing to roommates table
ALTER TABLE public.roommates ADD COLUMN IF NOT EXISTS is_listing BOOLEAN DEFAULT true;

-- Mark existing user profiles as NOT listings
UPDATE roommates SET is_listing = false WHERE user_id IS NOT NULL AND user_id != '';

-- Mark existing listings without user_id as listings
UPDATE roommates SET is_listing = true WHERE user_id IS NULL OR user_id = '';
```

**Giải thích:**
- `is_listing = false` → Hồ sơ cá nhân (KHÔNG xóa được)
- `is_listing = true` → Bài đăng tìm bạn (XÓA được)

---

## Bước 2: Deploy code mới

Code đã được fix trong:
1. `CreateProfileModal.tsx` → Đánh dấu user profile là `is_listing = false`
2. `App.tsx` → 
   - `handleAddRoommate` → Bài đăng mới có `is_listing = true`
   - `handleDeleteRoommate` → Chỉ xóa listings (`is_listing = true`), không xóa profiles

---

## Bước 3: Test

1. **Test xóa hồ sơ cá nhân:**
   - Vào tab "Tìm Bạn"
   - Tìm hồ sơ cá nhân của bạn (LONG)
   - Click "Xóa hồ sơ" → **Sẽ báo lỗi: "Không thể xóa hồ sơ cá nhân"**

2. **Test xóa bài đăng:**
   - Đăng tin mới "Tìm bạn ở ghép"
   - Vào tab "Tìm Bạn" → Tick "Bài của tôi"
   - Click "Xóa" trên bài đăng mới → **Xóa thành công**
   - Reload trang → Hồ sơ cá nhân vẫn còn, không cần nhập lại

---

## Kết quả:
✅ Xóa bài đăng → Không mất hồ sơ cá nhân
✅ Không phải nhập lại thông tin
✅ Hồ sơ cá nhân được bảo vệ khỏi xóa nhầm
