import io

with io.open('src/components/CreateProfileModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n')):
    if "FileReader" in line or "readAsDataURL" in line or "handleImageUpload" in line:
        for j in range(max(0, i-2), min(i+15, len(content.split('\n')))):
            print(f"Line {j+1}: {content.split('\n')[j]}")
        break
