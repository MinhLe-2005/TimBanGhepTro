import io

with io.open('src/lib/supabase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

delete_utility = """
export async function deleteImagesFromSupabase(urls: string[], bucketName: string = 'room-images') {
  if (!isConfigured || !urls || urls.length === 0) return;
  
  // Lọc ra các URL có chứa tên miền của Supabase (để tránh xóa nhầm ảnh external như unsplash)
  const supabaseUrls = urls.filter(url => url && url.includes(supabaseUrl as string));
  
  if (supabaseUrls.length === 0) return;

  try {
    // Trích xuất filePath từ URL
    // Public URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[filePath]
    const filePaths = supabaseUrls.map(url => {
      const parts = url.split(`/${bucketName}/`);
      if (parts.length > 1) {
        return parts[1]; // lấy phần sau tên bucket
      }
      return null;
    }).filter(Boolean) as string[];

    if (filePaths.length > 0) {
      console.log(`[Supabase] Deleting ${filePaths.length} images from ${bucketName}...`);
      const { error } = await supabase.storage.from(bucketName).remove(filePaths);
      if (error) {
        console.error('[Supabase] Error deleting images:', error);
      } else {
        console.log('[Supabase] Successfully deleted images.');
      }
    }
  } catch (err) {
    console.error('Unexpected error during image deletion:', err);
  }
}
"""

if "deleteImagesFromSupabase" not in content:
    content += delete_utility
    with io.open('src/lib/supabase.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added deleteImagesFromSupabase")
else:
    print("Already exists")
