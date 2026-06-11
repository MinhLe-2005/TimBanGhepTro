import io

with io.open('src/components/RoomCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { Heart, Flame, Bed, Bath, Shield, ChefHat, MapPin, Cpu, Car, Eye, Star, Trash2, Ban, Users, AlertCircle } from "lucide-react";',
    'import { Heart, Flame, Bed, Bath, Shield, ChefHat, MapPin, Cpu, Car, Eye, Star, Trash2, Ban, Users, AlertCircle, Building, User } from "lucide-react";'
)

# Replace the bulky grid and tags
start_marker = "{/* Detailed Info Grid */}"
end_marker = "{/* Host Info */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_html = """{/* Compact Info Row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 mb-3">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Building className="w-3.5 h-3.5 text-[#006590]" />
            <span className="truncate max-w-[80px]">{room.type}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Bed className="w-3.5 h-3.5 text-[#006590]" />
            <span>{room.bedrooms} PN</span>
          </div>
          {room.gender && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <User className="w-3.5 h-3.5 text-[#006590]" />
              <span className="truncate max-w-[60px]">{room.gender}</span>
            </div>
          )}
        </div>

        {/* Feature Tags - Very Compact */}
        <div className="flex items-center flex-wrap gap-1 mb-3 text-[10px] font-medium text-slate-500 h-[22px] overflow-hidden">
          {filteredFeatures.slice(0, 3).map((f, i) => (
             <span key={i} className="px-1.5 py-0.5 bg-slate-50 rounded text-slate-500 border border-slate-100 truncate max-w-[80px]">{f}</span>
          ))}
          {filteredFeatures.length > 3 && <span className="px-1.5 py-0.5 text-slate-400">+{filteredFeatures.length - 3}</span>}
          {room.pets && <span className="px-1.5 py-0.5 bg-slate-50 rounded text-slate-500 border border-slate-100">{room.pets === "thoải mái" ? "Pet OK" : "No Pet"}</span>}
        </div>

        """
    content = content[:start_idx] + new_html + content[end_idx:]
    with io.open('src/components/RoomCard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS")
else:
    print("FAIL TO FIND MARKERS")
