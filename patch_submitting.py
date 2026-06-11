import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim() || !rPrice || !rAddress.trim()) {
      alert("Vui lòng nhập tiêu đề, giá và địa chỉ phòng!");
      return;
    }

    // Convert amenities state to array of features string"""

new_code = """  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim() || !rPrice || !rAddress.trim()) {
      alert("Vui lòng nhập tiêu đề, giá và địa chỉ phòng!");
      return;
    }

    setIsSubmitting(true);

    // Convert amenities state to array of features string"""

content = content.replace(old_code, new_code)

old_code2 = """    };

    setIsSubmitting(true);
    let submitted = false;
    try {"""

new_code2 = """    };

    let submitted = false;
    try {"""

content = content.replace(old_code2, new_code2)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
