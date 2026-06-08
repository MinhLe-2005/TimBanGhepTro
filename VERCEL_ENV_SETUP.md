# Vercel Environment Variables Setup

## Bước 1: Vào Vercel Dashboard
1. Truy cập: https://vercel.com/dashboard
2. Chọn project: **roomiematch**
3. Click **Settings** (tab trên cùng)
4. Chọn **Environment Variables** (menu bên trái)

## Bước 2: Thêm biến môi trường

### Variable 1: VITE_SUPABASE_URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://rltolbnxdotqydyaxcdk.supabase.co`
- **Environment**: Production, Preview, Development (check tất cả)

### Variable 2: VITE_SUPABASE_ANON_KEY
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsdG9sYm54ZG90cXlkeWF4Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyMTMsImV4cCI6MjA5NjM4NDIxM30.V8IXemgeS95vsaBTjx62o_pAYteBVwingQTV2Mr5DbY`
- **Environment**: Production, Preview, Development (check tất cả)

## Bước 3: Redeploy
Sau khi thêm biến môi trường:
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click nút **...** (3 chấm) → **Redeploy**
4. Chọn **Redeploy with existing Build Cache**
5. Click **Redeploy**

## Bước 4: Test
- Đợi deployment xong (~1-2 phút)
- Hard reload trang (Ctrl + Shift + R)
- Thử đăng nhập lại
- Mở Console (F12) để xem logs

## Nếu vẫn lỗi
Check console logs và chụp cho tôi xem!
