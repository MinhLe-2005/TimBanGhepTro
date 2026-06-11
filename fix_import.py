import io

with io.open('src/components/RoomModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_old = 'import { X, Flame, ChevronLeft, ChevronRight, Shield, Zap, Droplet, Building, MapPin, Bed, Bath, User, MessageSquare, Handshake, Check, Info, Star, Upload, Trash2, Moon, Dog, ChefHat, Compass, Sparkles, Heart, Smile, FileText, Phone, Ban, Users } from "lucide-react";'
import_new = 'import { X, Flame, ChevronLeft, ChevronRight, Shield, Zap, Droplet, Building, MapPin, Bed, Bath, User, MessageSquare, Handshake, Check, Info, Star, Upload, Trash2, Moon, Dog, ChefHat, Compass, Sparkles, Heart, Smile, FileText, Phone, Ban, Users, Image as ImageIcon } from "lucide-react";'

content = content.replace(import_old, import_new)

with io.open('src/components/RoomModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
