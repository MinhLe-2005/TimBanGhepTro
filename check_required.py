import io

with io.open('src/components/PostListingModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
in_room_form = False
for line in lines:
    if "<form onSubmit={handleRoomSubmit}" in line:
        in_room_form = True
    if in_room_form and "required" in line:
        print(line.strip())
