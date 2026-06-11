import io

with io.open('src/lib/supabase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

upload_utility = """
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
"""

if "uploadImageToSupabase" not in content:
    content += upload_utility
    with io.open('src/lib/supabase.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added uploadImageToSupabase")
else:
    print("Already exists")
