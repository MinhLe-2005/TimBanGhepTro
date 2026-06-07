import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra xem đã có API Key THẬT chưa (phải bắt đầu bằng http)
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

if (!isConfigured) {
  console.warn("⚠️ Chưa cấu hình Supabase API Keys. Đang chạy ở chế độ Local Mock Data.");
}

// Nếu chưa có API Key, trả về một Mock Object để app không bị crash khi gọi supabase.auth
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: async () => ({ data: null, error: { message: 'Not configured' } })
      })
    } as any);
