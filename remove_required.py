import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("type=\"text\" required value={rmName}", "type=\"text\" value={rmName}")
content = content.replace("type=\"text\" required value={rAddress}", "type=\"text\" value={rAddress}")

# ensure form has noValidate
content = content.replace('<form onSubmit={activeTab === "roommate" ? handleRoommateSubmit : handleRoomSubmit}', '<form noValidate onSubmit={activeTab === "roommate" ? handleRoommateSubmit : handleRoomSubmit}')

with io.open('src/components/PostListingModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed native required constraints.")
