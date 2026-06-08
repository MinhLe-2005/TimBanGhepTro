import couchRoommates from "./assets/images/couch_roommates_1780041205895.png";
import girlMinhanh from "./assets/images/girl_minhanh_1780041224492.png";
import guyHoangnam from "./assets/images/guy_hoangnam_1780041244017.png";
import girlTrangle from "./assets/images/girl_trangle_1780041260188.png";
import guyDuctri from "./assets/images/guy_ductri_1780041275912.png";
import roomMasteri from "./assets/images/room_masteri_1780041295116.png";
import roomCaugiay from "./assets/images/room_caugiay_1780041315234.png";
import roomVinhomes from "./assets/images/room_vinhomes_1780041335502.png";

import { Roommate, Room } from "./types";

export const IMAGES = {
  couchRoommates,
  girlMinhanh,
  guyHoangnam,
  girlTrangle,
  guyDuctri,
  roomMasteri,
  roomCaugiay,
  roomVinhomes,
};

export const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: "minh-anh",
    name: "Minh Anh",
    age: 22,
    role: "Sinh viên",
    school: "ĐH Kinh Tế (Ngũ Hành Sơn)",
    phoneNumber: "0943 123 456",
    avatar: "/portrait_minh_anh.png",
    status: "Đang trao đổi",
    location: "Khu đô thị FPT, Ngũ Hành Sơn, Đà Nẵng",
    district: "Ngũ Hành Sơn",
    type: "Chung cư",
    matchScore: 98,
    reputationScore: 98,
    tags: ["Cú đêm", "Yêu mèo", "Không hút thuốc"],
    isVerified: true,
    is_listing: true,
    bio: "Mình là sinh viên năm 4 ngành Kinh doanh, hoạt bát vui vẻ. Cần tìm bạn nữ gọn gàng ở ghép chung cư.",
    budget: 3500000,
    gender: "Nữ",
    lifestyle: {
      sleep: "Cú đêm",
      pets: "Yêu mèo",
      smoke: "Không hút thuốc",
      cook: "Đôi khi nấu",
      interaction: "Hướng ngoại",
      neatness: "Sạch sẽ",
    },
    reviews: [
      {
        id: "rev-ma-1",
        reviewerName: "Huyền Trang",
        reviewerAvatar: "/avatar_huyen_trang.png",
        rating: 5,
        comment: "Minh Anh siêu dễ thương và cực kỳ sạch sẽ luôn!",
        imageUrl: "/review_minh_anh_cat.png",
        createdAt: "15/04/2026"
      }
    ]
  },
  {
    id: "hoang-nam",
    name: "Hoàng Nam",
    age: 25,
    role: "IT Developer",
    school: "ĐH Bách Khoa (Liên Chiểu)",
    phoneNumber: "0932 789 012",
    avatar: "/portrait_hoang_nam.png",
    status: "Đang tìm",
    location: "Đường Hùng Vương, Hải Châu, Đà Nẵng",
    district: "Hải Châu",
    type: "Ký túc xá",
    matchScore: 92,
    reputationScore: 95,
    tags: ["Ngủ sớm", "Ngăn nắp", "Thích nấu ăn"],
    isVerified: true,
    is_listing: true,
    bio: "IT Dev hiền lành, thích code và nấu ăn ngon. Mình có thói quen ngủ sớm dậy sớm tập thể thao. Tìm roommate nam lịch sự, tôn trọng không gian riêng tư và chia sẻ tiền phòng sòng phẳng.",
    budget: 3000000,
    gender: "Nam",
    lifestyle: {
      sleep: "Ngủ sớm",
      pets: "Thoải mái",
      smoke: "Không hút thuốc",
      cook: "Thích nấu ăn",
      interaction: "Cân bằng",
      neatness: "Ngăn nắp",
    },
    reviews: [
      {
        id: "rev-hn-1",
        reviewerName: "Thanh Tùng",
        reviewerAvatar: "/avatar_thanh_tung.png",
        rating: 5,
        comment: "Nam nấu ăn cực đỉnh và rất đúng giờ giấc.",
        imageUrl: "/review_hoang_nam_food.png",
        createdAt: "20/05/2026"
      }
    ]
  },
  {
    id: "trang-le",
    name: "Trang Lê",
    age: 21,
    role: "Sinh viên",
    school: "ĐH Kiến Trúc (Hải Châu)",
    phoneNumber: "0387 456 123",
    avatar: "/portrait_trang_le.png",
    status: "Đang trao đổi",
    location: "Đường Điện Biên Phủ, Thanh Khê, Đà Nẵng",
    district: "Thanh Khê",
    type: "Phòng trọ",
    matchScore: 89,
    reputationScore: 92,
    tags: ["Hướng nội", "Sạch sẽ", "Nữ tính"],
    isVerified: true,
    is_listing: true,
    bio: "Mình đang học Thiết kế đồ họa tại Đà Nẵng. Mình tương đối hướng nội, thích vẽ tranh và đọc sách yên tĩnh. Thích nuôi mèo nhưng chưa có dịp nuôi, nếu bạn có mèo mình sẽ phụ chăm nha!",
    budget: 4000000,
    gender: "Nữ",
    lifestyle: {
      sleep: "Bình thường",
      pets: "Thoải mái",
      smoke: "Không hút thuốc",
      cook: "Ăn ngoài",
      interaction: "Hướng nội",
      neatness: "Sạch sẽ",
    },
    reviews: [
      {
        id: "rev-tl-1",
        reviewerName: "Như Quỳnh",
        reviewerAvatar: "/avatar_nhu_quynh.png",
        rating: 4.3,
        comment: "Trang Lê siêu yên tĩnh và tôn trọng không gian riêng tư. Bạn ấy vẽ tường trang trí chân dung siêu nghệ thuật!",
        imageUrl: "/review_trang_le_art.png",
        createdAt: "12/03/2026"
      }
    ]
  },
  {
    id: "duc-tri",
    name: "Đức Trí",
    age: 24,
    role: "Designer",
    school: "ĐH Duy Tân (Hải Châu)",
    phoneNumber: "0915 222 333",
    avatar: "/portrait_duc_tri.png",
    status: "Đang tìm",
    location: "Quận Sơn Trà, Đà Nẵng",
    district: "Sơn Trà",
    type: "Căn hộ",
    matchScore: 86,
    reputationScore: 88,
    tags: ["Thích thể thao", "Thoải mái", "Vui tính"],
    isVerified: false,
    bio: "Designer tự do, thích chơi bóng rổ và tụ tập bạn bè cuối tuần ngoài quán cà phê. Tính tình cởi mở, thoải mái dọn dẹp cuối tuần. Cần roommate sòng phẳng tài chính và có chung sở thích thể thao.",
    budget: 2500000,
    gender: "Nam",
    lifestyle: {
      sleep: "Cú đêm",
      pets: "Yêu chó",
      smoke: "Hút thuốc ngoài ban công",
      cook: "Ăn ngoài",
      interaction: "Hướng ngoại",
      neatness: "Thoải mái",
    },
    reviews: [
      {
        id: "rev-dt-1",
        reviewerName: "Minh Quân",
        reviewerAvatar: "/avatar_minh_quan.png",
        rating: 4,
        comment: "Trí sòng phẳng tiền bạc, vui vẻ năng động hoàn toàn hợp tính cách. Cuối tuần rủ đá banh tập thể thao siêu nhiệt tình.",
        imageUrl: "/review_duc_tri_sports.png",
        createdAt: "05/01/2026"
      }
    ]
  },
  {
    id: "khanh-vy",
    name: "Khánh Vy",
    age: 23,
    role: "Marketing Manager",
    school: "ĐH Ngoại Ngữ (Cẩm Lệ)",
    phoneNumber: "0988 777 666",
    avatar: "/portrait_khanh_vy.png",
    status: "Đang trao đổi",
    location: "Quận Hải Châu, Đà Nẵng",
    district: "Hải Châu",
    type: "Ký túc xá",
    matchScore: 91,
    reputationScore: 96,
    tags: ["Marketing", "Thoải mái", "Ngủ sớm"],
    isVerified: true,
    is_listing: true,
    bio: "Mình là chuyên viên phòng Marketing năng động, sành điệu. Thích nấu ăn ngon và thỉnh thoảng đi cắm trại chụp hình. Tìm bạn đồng hành vui tính, phóng khoáng tại Hải Châu.",
    budget: 4500000,
    gender: "Nữ",
    lifestyle: {
      sleep: "Ngủ sớm",
      pets: "Thoải mái",
      smoke: "Không hút thuốc",
      cook: "Thích nấu ăn",
      interaction: "Hướng ngoại",
      neatness: "Sạch sẽ",
    },
    reviews: [
      {
        id: "rev-kv-1",
        reviewerName: "Bảo Thy",
        reviewerAvatar: "/avatar_bao_thy.png",
        rating: 5,
        comment: "Chị Vy siêu giỏi luôn, hướng dẫn mình bao nhiêu thứ về marketing. Sống chung cực kỳ dễ thở và vui vẻ!",
        imageUrl: "/review_khanh_vy_work.png",
        createdAt: "28/04/2026"
      }
    ]
  },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: "room-haichau",
    title: "Phòng Trọ Gác Lửng, Hải Châu, Đà Nẵng",
    price: 1500000,
    location: "120 Hùng Vương, Hải Châu, Đà Nẵng",
    district: "Hải Châu",
    type: "Ký túc xá",
    images: ["https://images.unsplash.com/photo-1555854817-5b2260d50c47?q=80&w=600&auto=format&fit=crop"],
    features: ["Bao điện nước", "Giường tầng", "Khu học tập chung", "Điều hòa", "Máy giặt", "Wifi", "Có bảo vệ", "Bãi giữ xe"],
    isHot: true,
    bedrooms: 1,
    wc: "WC chung tầng",
    kitchen: "Bếp ăn tập thể",
    hostName: "Khánh Linh",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0943 234 567",
    description: "Kí túc xá giường đơn cực xịn sò ngay trung tâm Hải Châu, gần cầu Sông Hàn. Phòng sạch sẽ, trang bị sẵn nệm tủ khóa cá nhân, có máy sấy quần áo và dọn phòng hàng tuần.",
    pets: "không cho nuôi",
    gender: "Nữ",
    electricity: "⚡ Điện 3.5k",
    water: "💧 Nước 50k",
    parking: "🛵 Có chỗ để xe",
    proximity: "Cách ĐH FPT 500m",
    hostRole: "Sinh viên năm 2",
    roommateInfo: "Cần tìm bạn nữ sinh viên ở ghép, sạch sẽ, lễ phép, tôn trọng không gian sống chung",
    habits: ["Có nấu ăn", "Không hút thuốc", "Ngăn nắp"],
    reviews: [
      {
        id: "rev-r1-1",
        reviewerName: "Bảo Ngọc",
        reviewerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
        rating: 5,
        comment: "Kí túc xá rất sạch sẽ, đúng như hình đăng. Giường tầng kiên cố, không bị rung lắc hay kêu cọt kẹt. Chị Vy chủ nhà siêu nhiệt tình hỗ trợ nhiệt tình lắm nha!",
        images: ["https://images.unsplash.com/photo-1555854817-5b2260d50c47?q=80&w=300&auto=format&fit=crop"],
        createdAt: "28/05/2026"
      },
      {
        id: "rev-r1-2",
        reviewerName: "Khánh Huyền",
        reviewerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
        rating: 4,
        comment: "Phòng đầy đủ tiện ích cơ bản, sạch sẽ. Chỗ phơi đồ hơi chật chút xíu nhưng được cái bãi xe an toàn, có chú bảo vệ 24/24.",
        images: [],
        createdAt: "22/05/2026"
      }
    ]
  },
  {
    id: "room-sontra",
    title: "Căn Hộ View Biển Mỹ Khê, Sơn Trà, Đà Nẵng",
    price: 6500000,
    location: "Đường Phạm Văn Đồng, Sơn Trà, Đà Nẵng",
    district: "Sơn Trà",
    type: "Căn hộ",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=600&auto=format&fit=crop"],
    features: ["View biển", "Full nội thất", "Ban công rộng", "Điều hòa", "Máy giặt", "Nhà bếp", "Wifi", "Tủ lạnh", "TV", "Có bảo vệ", "Bãi giữ xe"],
    isHot: true,
    bedrooms: 2,
    wc: "2 WC riêng",
    kitchen: "Bếp nấu kính cao cấp",
    hostName: "Duy Mạnh",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0905 111 222",
    description: "Căn hộ lầu cao cực mát nhìn thẳng ra biển Mỹ Khê. Căn hộ của mình đã decor hoàn thiện phong cách vintage gỗ ấm áp, nay cần tìm 01 roommate sòng phẳng chia tiền thuê.",
    pets: "thoải mái",
    gender: "Nam",
    electricity: "⚡ Điện 4.2k",
    water: "💧 Nước 100k",
    parking: "🛵 Có bãi xe rộng",
    proximity: "Cách CĐ Lương thực Thực phẩm 900m",
    reviews: [
      {
        id: "rev-r2-1",
        reviewerName: "Quang Hải",
        reviewerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        rating: 5,
        comment: "Trời ơi view biển Mỹ Khê đỉnh chóp luôn á mọi người! Anh Mạnh siêu dễ tính, sòng phẳng tài chính và cũng đam mê decor gỗ retro nữa. Highly recommend căn hộ này nha!",
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=300&auto=format&fit=crop"],
        createdAt: "29/05/2026"
      }
    ]
  },
  {
    id: "room-thanhkhe",
    title: "Phòng Trọ Gác Lửng Hiện Đại, Thanh Khê, Đà Nẵng",
    price: 2500000,
    location: "234 Điện Biên Phủ, Thanh Khê, Đà Nẵng",
    district: "Thanh Khê",
    type: "Phòng trọ",
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop"],
    features: ["Gác lửng", "Cửa khóa vân tay", "Không chung chủ", "Điều hòa", "Wifi", "TV", "Bãi giữ xe"],
    isHot: false,
    bedrooms: 1,
    wc: "Khép kín rộng rãi",
    kitchen: "Kệ bếp nấu ăn riêng",
    hostName: "Tuấn Kiệt",
    hostAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0349 666 777",
    description: "Căn phòng trọ mới xây 100% có gác lửng cao ráo không đụng đầu. Điện nước giá nhà nước, khu vực an ninh tuyệt đối có camera 24/7, phù hợp with các bạn trẻ học tập và làm việc.",
    pets: "thoải mái",
    gender: "Khác",
    electricity: "⚡ Điện 3.5k",
    water: "💧 Nước 50k",
    parking: "🛵 Có camera bãi xe",
    proximity: "Cách ĐH Thể dục Thể thao 600m",
    reviews: [
      {
        id: "rev-r3-1",
        reviewerName: "An Bùi",
        reviewerAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
        rating: 4,
        comment: "Phòng trọ mới xây nên cực kỳ mới, cửa vân tay bảo mật tốt đi về giờ nào cũng tiện. Có gác lửng cao ráo lắm. Đi xe ra Điện Biên Phủ rất gần.",
        images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=300&auto=format&fit=crop"],
        createdAt: "24/05/2026"
      }
    ]
  },
  {
    id: "room-nguhanhson",
    title: "Chung Cư Cao Cấp FPT City, Ngũ Hành Sơn, Đà Nẵng",
    price: 4500000,
    location: "Đường Nam Kỳ Khởi Nghĩa, Ngũ Hành Sơn, Đà Nẵng",
    district: "Ngũ Hành Sơn",
    type: "Chung cư",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600&auto=format&fit=crop"],
    features: ["Ngay FPT City", "Có hồ bơi", "An ninh 3 lớp", "Điều hòa", "Máy giặt", "Nhà bếp", "Wifi", "Tủ lạnh", "TV", "Có bảo vệ", "Bãi giữ xe"],
    isHot: false,
    bedrooms: 2,
    wc: "WC khép kín riêng",
    kitchen: "Bếp đảo hiện đại",
    hostName: "Minh Anh",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0943 123 456",
    description: "Chung cư hoàn hảo cho dân IT hoặc các bạn làm việc khu vực Nam Đà Nẵng. Nhà rộng rãi full option tủ lạnh inverter hai cánh, sofa nằm xem phim thoải mái. Ghép nữ phòng phụ.",
    pets: "không cho nuôi",
    gender: "Nữ",
    electricity: "⚡ Điện 3.8k",
    water: "💧 Nước 80k",
    parking: "🛵 Free bãi đỗ xe",
    proximity: "Cách ĐH FPT 500m",
    reviews: []
  },
  {
    id: "room-lienchieu",
    title: "Homestay Sống Xanh Gần ĐH Bách Khoa, Liên Chiểu",
    price: 3200000,
    location: "Đường Tôn Đức Thắng, Liên Chiểu, Đà Nẵng",
    district: "Liên Chiểu",
    type: "Homestay",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop"],
    features: ["Sân vườn mát mẻ", "BBQ nướng ngoài trời", "Bao giặt phơi", "Điều hòa", "Máy giặt", "Nhà bếp", "Wifi", "Tủ lạnh"],
    isHot: false,
    bedrooms: 1,
    wc: "WC xịn",
    kitchen: "Thoải mái nấu ăn",
    hostName: "Thanh Hằng",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0973 888 999",
    description: "Ngôi nhà xinh xắn ngập mọc hoa mười giờ gần trường học. Phong cách homestay cực chill thích hợp with những bạn học hành chịu áp lực cao cần không gian sảng khoái lấy lại động lực.",
    pets: "thoải mái",
    gender: "Nữ",
    electricity: "⚡ Điện 3.5k",
    water: "💧 Nước 50k",
    parking: "🛵 Sân giữ xe riêng",
    proximity: "Cách ĐH Bách Khoa 300m",
    reviews: []
  },
  {
    id: "room-camle",
    title: "Phòng Trọ Giá Rẻ An Ninh, Cẩm Lệ, Đà Nẵng",
    price: 1800000,
    location: "Đường Cách Mạng Tháng Tám, Cẩm Lệ, Đà Nẵng",
    district: "Cẩm Lệ",
    type: "Phòng trọ",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop"],
    features: ["Giá siêu rẻ", "Giờ giấc tự do", "Phòng thoáng", "Wifi", "Bãi giữ xe", "Có bảo vệ"],
    isHot: false,
    bedrooms: 1,
    wc: "Khép kín",
    kitchen: "Bếp mini hành lang",
    hostName: "Quốc Bảo",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0868 111 222",
    description: "Tìm 01 nam sinh viên hoặc người đi làm ăn ở hiền lành ghép chung. Phòng rộng rầm, gió lùa thoáng sạch, có bệ để xe an ninh không lo trộm cắp. Điện giá rẻ sinh viên.",
    pets: "không cho nuôi",
    gender: "Nam",
    electricity: "⚡ Điện 3.2k",
    water: "💧 Nước 40k",
    parking: "🛵 Chỗ để xe an toàn",
    proximity: "Cách ĐH Ngoại ngữ 800m",
    reviews: []
  },
  {
    id: "room-hoavang",
    title: "Nhà Vườn Ở Ghép Yên Bình, Hòa Vang, Đà Nẵng",
    price: 2200000,
    location: "Đường Quốc Lộ 14G, Hòa Vang, Đà Nẵng",
    district: "Hòa Vang",
    type: "Cán bộ",
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=600&auto=format&fit=crop"],
    features: ["Cảnh đẹp ngoại ô", "Rau sạch tự trồng", "Vô cùng yên tĩnh", "Nhà bếp", "Wifi", "Bãi giữ xe"],
    isHot: false,
    bedrooms: 2,
    wc: "WC chung thoải mái",
    kitchen: "Bếp rộng rãi lò nướng",
    hostName: "Thúy Quỳnh",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    phoneNumber: "0922 444 666",
    description: "Yêu thích sự ngoại ô dịu êm, nhà mình có sân trồng rau nuôi cá cực thơ mộng. Tìm bạn sống chung học ngành nghệ thuật, nhân văn hoặc cây cỏ yêu đời mộc mạc.",
    pets: "thoải mái",
    gender: "Khác",
    electricity: "⚡ Điện 3k",
    water: "💧 Nước 30k",
    parking: "🛵 Chỗ đậu thoải mái",
    proximity: "Cảnh quan ngoại ô mộc mạc",
    reviews: []
  }
];

export const SUGGGESTED_CHATS = [
  {
    roommateId: "minh-anh",
    messages: [
      { id: "m1", chatId: "minh-anh", senderId: "minh-anh", text: "Chào bạn nha! Mình thấy độ tương thích của chúng mình lên tới 98% nè 😄", timestamp: "2026-05-29T07:10:00Z" },
      { id: "m2", chatId: "minh-anh", senderId: "me", text: "Hi Minh Anh! Đúng rồi á, mình cũng thích mèo và học muộn giống bạn vậy.", timestamp: "2026-05-29T07:12:00Z" },
      { id: "m3", chatId: "minh-anh", senderId: "minh-anh", text: "Thế thì tốt quá! Bạn định khi nào chuyển phòng trọ nhỉ? Mình muốn thỏa thuận một số quy tắc chung trước.", timestamp: "2026-05-29T07:15:00Z" },
    ]
  },
  {
    roommateId: "hoang-nam",
    messages: [
      { id: "m4", chatId: "hoang-nam", senderId: "hoang-nam", text: "Chào bro, mình làm IT ở Hải Châu. Bạn có ngó qua căn phòng Kí Túc Xá bên Hùng Vương chưa?", timestamp: "2026-05-29T06:30:00Z" },
      { id: "m5", chatId: "hoang-nam", senderId: "me", text: "Mình có qua xem qua tin đăng rồi, trông phòng gọn gàng xịn sò quá.", timestamp: "2026-05-29T06:32:00Z" },
    ]
  }
];
