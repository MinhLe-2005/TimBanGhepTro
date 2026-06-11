import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Import useDialog
content = content.replace('import ImageCropperModal from "./ImageCropperModal";', 'import ImageCropperModal from "./ImageCropperModal";\nimport { useDialog } from "./ui/DialogProvider";')

# Add hook inside component
content = content.replace('const [activeTab, setActiveTab] = useState<"roommate" | "room">(initialTab);', 'const { toast } = useDialog();\n  const [activeTab, setActiveTab] = useState<"roommate" | "room">(initialTab);')

# Replace success logic for roommate
old_roommate_success = """    if (!submitted) return;
    setSuccessMessage(editingData ? `Đã cập nhật bài Tìm bạn ở ghép cho ${rmName} thành công!` : `Đã đăng bài Tìm bạn ở ghép cho ${rmName} thành công lên cộng đồng RoomieMatch!`);
    setIsSuccess(true);"""
new_roommate_success = """    if (!submitted) return;
    toast(editingData ? `Đã cập nhật bài tìm bạn ở ghép cho ${rmName} thành công!` : `Đã đăng bài tìm bạn ở ghép cho ${rmName} thành công!`, "success");
    onClose();"""
content = content.replace(old_roommate_success, new_roommate_success)

# Replace success logic for room
old_room_success = """    if (!submitted) return;
    setSuccessMessage(editingData ? `Đã cập nhật bài cho thuê / ghép phòng "${rTitle}" thành công!` : `Đã đăng bài cho thuê / ghép phòng "${rTitle}" thành công!`);
    setIsSuccess(true);"""
new_room_success = """    if (!submitted) return;
    toast(editingData ? `Đã cập nhật tin đăng phòng "${rTitle}" thành công!` : `Đã đăng tin phòng "${rTitle}" thành công!`, "success");
    onClose();"""
content = content.replace(old_room_success, new_room_success)

# Replace validation error scroll UX (optional but nice)
content = content.replace('setFormError("Vui lòng cuộn lên và nhập đầy đủ: Tiêu đề, Giá thuê và Địa chỉ phòng.");', 'setFormError("Vui lòng cuộn lên và nhập đầy đủ: Tiêu đề, Giá thuê và Địa chỉ phòng.");\n      document.querySelector(".overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });')
content = content.replace('setFormError("Vui lòng nhập Tên và Số điện thoại.");', 'setFormError("Vui lòng cuộn lên và nhập đầy đủ Tên và Số điện thoại.");\n      document.querySelector(".overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });')


with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated success handling and validation scroll.")
