import { useState } from "react";
import { Search, MapPin, Building, Sparkles } from "lucide-react";
import { Room } from "../types";
import RoomCard from "./RoomCard";

interface RoomsViewProps {
  rooms: Room[];
  onViewRoom: (room: Room) => void;
  likedRoomIds: string[];
  onLikeRoom: (id: string, isLiked: boolean) => void;
  onOpenPostModal?: () => void;
}

export default function RoomsView({
  rooms,
  onViewRoom,
  likedRoomIds,
  onLikeRoom,
  onOpenPostModal,
}: RoomsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [capacityFilter, setCapacityFilter] = useState("Tất cả");
  const [petsFilter, setPetsFilter] = useState("Tất cả");
  const [genderFilter, setGenderFilter] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(20000000); // 20 million VND default max
  const [priceTag, setPriceTag] = useState<string>("Tất cả");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const handlePriceTagClick = (tag: string) => {
    setPriceTag(tag);
    switch (tag) {
      case "Dưới 1tr":
        setMinPrice(0);
        setMaxPrice(1000000);
        break;
      case "1-2tr":
        setMinPrice(1000000);
        setMaxPrice(2000000);
        break;
      case "2-3tr":
        setMinPrice(2000000);
        setMaxPrice(3000000);
        break;
      case "3-5tr":
        setMinPrice(3000000);
        setMaxPrice(5000000);
        break;
      case "trên 5tr":
        setMinPrice(5000000);
        setMaxPrice(20000000);
        break;
      default:
        setMinPrice(0);
        setMaxPrice(20000000);
        break;
    }
  };

  // Requested facilities definition
  const AMENITIES_LIST = [
    { id: "dieuhoa", label: "Điều hòa", keywords: ["điều hoa", "máy lạnh", "điều hoà"] },
    { id: "maygiat", label: "Máy giặt", keywords: ["máy giặt", "giặt"] },
    { id: "nhabep", label: "Nhà bếp", keywords: ["nhà bếp", "bếp", "nấu ăn"] },
    { id: "wifi", label: "Wifi", keywords: ["wifi", "internet", "mạng"] },
    { id: "tulanh", label: "Tủ lạnh", keywords: ["tủ lạnh", "fridge"] },
    { id: "tv", label: "TV", keywords: ["tv", "tivi"] },
    { id: "baove", label: "Có bảo vệ", keywords: ["bảo vệ", "an ninh", "an toàn"] },
    { id: "baigieuxe", label: "Bãi giữ xe", keywords: ["bãi giữ xe", "chỗ để xe", "gửi xe", "để xe", "đỗ xe"] },
  ];

  // Filter listings
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDistrict = districtFilter === "Tất cả" || room.district === districtFilter;
    const matchesType = typeFilter === "Tất cả" || (room.type && room.type === typeFilter);
    const matchesCapacity =
      capacityFilter === "Tất cả" ||
      (capacityFilter === "1" && room.bedrooms === 1) ||
      (capacityFilter === "2" && room.bedrooms === 2) ||
      (capacityFilter === "3" && room.bedrooms === 3) ||
      (capacityFilter === "4" && room.bedrooms === 4) ||
      (capacityFilter === "5+" && room.bedrooms >= 5);

    const matchesPets =
      petsFilter === "Tất cả" || room.pets === petsFilter;

    const matchesGender =
      genderFilter === "Tất cả" || room.gender === genderFilter;

    const matchesPrice = room.price >= minPrice && room.price <= maxPrice;

    // Check if room offers all selected amenities
    const matchesAmenities = selectedAmenities.every((amenityId) => {
      const amenity = AMENITIES_LIST.find((a) => a.id === amenityId);
      if (!amenity) return true;
      return amenity.keywords.some((keyword) => {
        const inFeatures = room.features.some((f) => f.toLowerCase().includes(keyword));
        const inDescription = room.description.toLowerCase().includes(keyword);
        const inTitle = room.title.toLowerCase().includes(keyword);
        const inKitchen = room.kitchen && room.kitchen.toLowerCase().includes(keyword);
        return inFeatures || inDescription || inTitle || inKitchen;
      });
    });

    return matchesSearch && matchesDistrict && matchesType && matchesCapacity && matchesPets && matchesGender && matchesPrice && matchesAmenities;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Phòng trọ đang tìm bạn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt danh sách các căn hộ, phòng trọ, kí túc xá và homestay đang đăng tuyển roommate ở ghép cùng ngay hôm nay.
          </p>
        </div>
        <button
          onClick={onOpenPostModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#006590] hover:bg-[#005176] text-white font-extrabold text-xs rounded-full cursor-pointer duration-150 shadow-md shrink-0 border border-slate-100"
        >
          <Sparkles className="h-4.5 w-4.5 fill-white/10" />
          <span>Đăng tin cho thuê / ghép phòng</span>
        </button>
      </div>

      {/* Filter layout wrapper */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.02)] space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4.5 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo dự án chung cư, tên đường phố, quận huyện hoặc tiện nghi..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#006590] focus:ring-1 focus:ring-[#006590] focus:bg-white duration-200"
            />
          </div>

          {/* Gender Filter Tab group */}
          <div className="flex border border-slate-100 rounded-xl p-1 bg-slate-50 overflow-x-auto max-w-full">
            {(["Tất cả", "Nam", "Nữ", "LGBT", "Khác"] as const).map((genderVal) => (
              <button
                key={genderVal}
                onClick={() => setGenderFilter(genderVal)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  genderFilter === genderVal
                    ? "bg-white text-[#006590] shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {genderVal === "Tất cả" ? "Tất cả giới" : genderVal}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Dropdown Specs selectors row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {/* Địa chỉ (District selection) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">📍 ĐỊA CHỈ (QUẬN / HUYỆN)</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả địa chỉ / khu vực</option>
              {/* Requested Da Nang Districts */}
              <option value="Hải Châu">Hải Châu</option>
              <option value="Thanh Khê">Thanh Khê</option>
              <option value="Liên Chiểu">Liên Chiểu</option>
              <option value="Sơn Trà">Sơn Trà</option>
              <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
              <option value="Cẩm Lệ">Cẩm Lệ</option>
              <option value="Hòa Vang">Hòa Vang</option>
            </select>
          </div>

          {/* Loại hình (Accommodation type) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🏠 LOẠI HÌNH PHÒNG</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả loại hình</option>
              <option value="Phòng trọ">Phòng trọ</option>
              <option value="Ký túc xá">Ký túc xá</option>
              <option value="Căn hộ">Căn hộ</option>
              <option value="Chung cư">Chung cư</option>
              <option value="Homestay">Homestay</option>
            </select>
          </div>

          {/* Số người ở */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🚹 SỐ NGƯỜI Ở</label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả số người</option>
              <option value="1">1 Người</option>
              <option value="2">2 Người</option>
              <option value="3">3 Người</option>
              <option value="4">4 Người</option>
              <option value="5+">5+ Người</option>
            </select>
          </div>

          {/* Thú cưng */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">🐾 THÚ CƯNG</label>
            <select
              value={petsFilter}
              onChange={(e) => setPetsFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#006590] focus:bg-white duration-200"
            >
              <option value="Tất cả">Tất cả ý kiến</option>
              <option value="thoải mái">Thoải mái</option>
              <option value="không cho nuôi">Không cho nuôi thú cưng</option>
            </select>
          </div>
        </div>

        {/* Price Range Sizing */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="shrink-0">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">💵 Khoảng giá thuê (đầu người):</label>
              <div className="text-sm font-extrabold text-[#006590]">
                {minPrice === 0 && maxPrice === 20000000 
                  ? "Tất cả mức giá" 
                  : `${minPrice === 0 ? "Dưới 1" : (minPrice / 1000000).toFixed(0)}tr - ${maxPrice === 20000000 ? "Không giới hạn" : `${(maxPrice / 1000000).toFixed(0)}tr`}`}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 flex-1 max-w-xl">
              {(["Tất cả", "Dưới 1tr", "1-2tr", "2-3tr", "3-5tr", "trên 5tr"] as const).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handlePriceTagClick(tag)}
                  className={`px-4.5 py-2.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer border ${
                    priceTag === tag
                      ? "bg-[#dff6ff] border-[#006590]/30 text-[#006590] scale-[1.02] shadow-sm font-extrabold"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:text-[#006590] hover:bg-slate-100"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tiện ích đi kèm (Selectable checkboxes) */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">⚡️ TIỆN ÍCH ĐI KÈM (TRỰC TIẾP BẤM TÍCH CHỌN)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {AMENITIES_LIST.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 select-none ${
                    isSelected
                      ? "bg-[#006590]/15 border-[#006590] text-[#006590] font-bold"
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        setSelectedAmenities(selectedAmenities.filter((id) => id !== amenity.id));
                      } else {
                        setSelectedAmenities([...selectedAmenities, amenity.id]);
                      }
                    }}
                    className="accent-[#006590] h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                  <span>{amenity.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rooms Card rendering grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onViewDetails={onViewRoom}
              onLikeChange={onLikeRoom}
              isInitiallyLiked={likedRoomIds.includes(room.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-gray-100 p-12 text-center max-w-md mx-auto">
          <p className="text-slate-400 text-lg font-bold mb-2">Không tìm thấy phòng trọ trống</p>
          <p className="text-sm text-slate-500 leading-normal mb-4">
            Vui lòng thay đổi lại tiêu chí lọc hoặc điều chỉnh khoảng tiền thuê để khám phá nhiều tin đăng lý tưởng khác nhé.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setDistrictFilter("Tất cả");
              setTypeFilter("Tất cả");
              setCapacityFilter("Tất cả");
              setPetsFilter("Tất cả");
              setGenderFilter("Tất cả");
              setMinPrice(0);
              setMaxPrice(20000000);
              setPriceTag("Tất cả");
              setSelectedAmenities([]);
            }}
            className="bg-[#006590] text-white font-bold py-2.5 px-6 rounded-full text-sm hover:bg-[#005176] duration-150 cursor-pointer"
          >
            Reset danh sách
          </button>
        </div>
      )}
    </div>
  );
}
