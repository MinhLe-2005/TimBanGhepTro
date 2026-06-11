import io
import re

with io.open('src/components/ChatView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const sentImage = attachedImage;
    setInputText("");
    setAttachedImage(null);"""

replacement = """    let sentImage = attachedImage;
    if (sentImage && sentImage.startsWith('data:image')) {
      try {
        sentImage = await uploadInlineImage('room-images', `chat_${Date.now()}_${myChatId}.png`, sentImage);
      } catch (err) {
        console.error("Failed to upload chat image", err);
      }
    }
    
    setInputText("");
    setAttachedImage(null);"""

if "await uploadInlineImage('room-images'" not in content:
    content = content.replace(target, replacement)
    with io.open('src/components/ChatView.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated handleSend")
else:
    print("Already updated")
