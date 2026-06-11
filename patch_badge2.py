import io

with io.open('src/components/HomeView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_badge = "Trải nghiệm dịch vụ cùng chúng tôi"
new_badge = "NỀN TẢNG TÌM BẠN Ở GHÉP UY TÍN"

if old_badge in content:
    content = content.replace(old_badge, new_badge)
    with io.open('src/components/HomeView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS BADGE UPDATE")
else:
    print("FAILED TO FIND BADGE")

