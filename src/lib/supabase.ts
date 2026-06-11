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

export async function uploadImageToSupabase(file: File, bucketName: string = 'room-images'): Promise<string | null> {
  if (!isConfigured) {
    console.warn("⚠️ Cannot upload image, Supabase is not configured.");
    return null;
  }
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected error during upload:', err);
    return null;
  }
}
