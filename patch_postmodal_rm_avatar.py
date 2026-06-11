import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add rmAvatarFile state
old_state = "const [rmAvatar, setRmAvatar] = useState(AVATAR_PRESETS[0]);"
new_state = """const [rmAvatar, setRmAvatar] = useState(AVATAR_PRESETS[0]);
  const [rmAvatarFile, setRmAvatarFile] = useState<File | null>(null);"""
content = content.replace(old_state, new_state)

# Update handleCropComplete
old_crop = """      if (cropType === "avatar") {
        setRmAvatar(base64data);
      } else if (cropType === "room") {"""
new_crop = """      if (cropType === "avatar") {
        setRmAvatar(base64data);
        // Note: For now, since we crop and get base64, we don't have a File object anymore unless we convert Blob to File
        // We will convert the blob to File so we can upload it
        const file = new File([croppedBlob], `avatar_${Date.now()}.png`, { type: 'image/png' });
        setRmAvatarFile(file);
      } else if (cropType === "room") {"""
content = content.replace(old_crop, new_crop)

# Update handleRoommateSubmit
old_submit = """  const handleRoommateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmName.trim() || !rmBudget || !rmPhone) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    const newRoommate: Roommate = {"""

new_submit = """  const handleRoommateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmName.trim() || !rmBudget || !rmPhone) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setIsSubmitting(true);

    let uploadedAvatarUrl = rmAvatar; // Default to existing base64 or profile url
    if (rmAvatarFile && import.meta.env.VITE_SUPABASE_URL) {
      const { uploadImageToSupabase } = await import('../lib/supabase');
      const url = await uploadImageToSupabase(rmAvatarFile, 'room-images'); // Using room-images bucket for simplicity
      if (url) {
        uploadedAvatarUrl = url;
      }
    }

    const newRoommate: Roommate = {"""
content = content.replace(old_submit, new_submit)

# Also update avatar mapping
content = content.replace('avatar: rmAvatar,', 'avatar: uploadedAvatarUrl,')

old_submit_end = """    };

    setIsSubmitting(true);
    let submitted = false;
    try {"""
new_submit_end = """    };

    let submitted = false;
    try {"""
content = content.replace(old_submit_end, new_submit_end)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
