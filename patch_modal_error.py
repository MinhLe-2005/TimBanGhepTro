import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add formError state
state_old = "const [isSubmitting, setIsSubmitting] = useState(false);"
state_new = """const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);"""
content = content.replace(state_old, state_new)

# 2. Update handleRoomSubmit
submit_old = """  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim() || !rPrice || !rAddress.trim()) {
      alert("Vui lòng nhập tiêu đề, giá và địa chỉ phòng!");
      return;
    }

    setIsSubmitting(true);"""

submit_new = """  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!rTitle.trim() || !rPrice || !rAddress.trim()) {
      setFormError("Vui lòng cuộn lên và nhập đầy đủ: Tiêu đề, Giá thuê và Địa chỉ phòng.");
      return;
    }

    setIsSubmitting(true);"""
content = content.replace(submit_old, submit_new)

# 3. Update handleRoommateSubmit
rm_submit_old = """  const handleRoommateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmName.trim() || !rmBudget || !rmPhone) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setIsSubmitting(true);"""

rm_submit_new = """  const handleRoommateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!rmName.trim() || !rmBudget || !rmDistrict) {
      setFormError("Vui lòng cuộn lên và điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    setIsSubmitting(true);"""
content = content.replace(rm_submit_old, rm_submit_new)

# 4. Display formError above the submit buttons
render_old = """                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}"""

render_new = """                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-medium rounded-xl text-center">
                    {formError}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}"""
content = content.replace(render_old, render_new)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
