import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_badge = "NỀN TẢNG GHÉP PHÒNG SỐ 1 ĐÀ NẴNG"
new_badge = "TRẢI NGHIỆM DỊCH VỤ CÙNG CHÚNG TÔI"

if old_badge in content:
    content = content.replace(old_badge, new_badge)
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS BADGE TEXT UPDATE")
else:
    print("FAILED TO FIND BADGE TEXT")

