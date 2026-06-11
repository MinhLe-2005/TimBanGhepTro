import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """                      {/* Thumbnails list */}
                      {rImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">"""

new_code = """                      {/* Thumbnails list */}
                      {rImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">"""

content = content.replace(old_code, new_code)

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
