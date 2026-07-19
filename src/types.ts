export interface LifestylePreference {
  id: string;
  category: "sinhhoat" | "thucung" | "taichinh" | "canhan";
  title: string;
  description: string;
  value: boolean;
}

export interface RoommateReview {
  id: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Roommate {
  id: string;
  name: string;
  age: number;
  role: string;
  avatar: string;
  location: string;
  district?: string;
  type?: string;
  matchScore: number;
  reputationScore: number;
  tags: string[];
  isVerified: boolean;
  status?: "Đang tìm" | "Đã tìm được" | "Đã có phòng" | "Chưa có phòng";
  bio: string;
  budget: number;
  gender: "Nam" | "Nữ" | "Khác";
  school?: string;
  phoneNumber?: string;
  email?: string;
  postedBy?: string; // user ID who posted this listing
  user_id?: string;
  auth_id?: string;
  is_listing?: boolean;
  is_locked?: boolean;
  created_at?: string;
  rejectReason?: string; // reason if the listing was rejected by admin
  lifestyle: {
    sleep: "Cú đêm" | "Ngủ sớm" | "Bình thường";
    pets: "Yêu mèo" | "Yêu chó" | "Không tiện nuôi" | "Thoải mái";
    smoke: "Không hút thuốc" | "Hút thuốc ngoài ban công" | "Không quan trọng";
    cook: "Thích nấu ăn" | "Ăn ngoài" | "Đôi khi nấu";
    interaction: "Hướng nội" | "Hướng ngoại" | "Cân bằng";
    neatness: "Ngăn nắp" | "Sạch sẽ" | "Thoải mái";
  };
  reviews: RoommateReview[];
}

export interface Room {
  id: string;
  title: string;
  price: number;
  location: string;
  district: string;
  type: string;
  images: string[];
  features: string[];
  isHot: boolean;
  status?: "còn phòng" | "hết phòng";
  isVerifiedRoom?: boolean;
  bedrooms: number;
  wc: string;
  kitchen: string;
  hostName: string;
  hostAvatar: string;
  description: string;
  phoneNumber?: string;
  pets?: "thoải mái" | "không cho nuôi";
  gender?: "Nam" | "Nữ" | "Khác" | "Tất cả";
  reviews?: RoomReview[];
  electricity?: string;
  water?: string;
  utilityImage?: string;
  parking?: string;
  proximity?: string;
  hostRole?: string;
  roommateInfo?: string;
  habits?: string[];
  postedBy?: string; // user ID who posted this listing
  user_id?: string;
  created_at?: string;
}

export interface RoomReview {
  id: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  images: string[]; // array of images added by reviewer
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'me' or roommate's id
  text: string;
  timestamp: string; // ISO string
  imageUrl?: string; // Optional image URL
  reactions?: Record<string, string[]>; // { "❤️": ["user1", "user2"], "😂": ["user3"] }
  isSystem?: boolean;
}

export interface Agreement {
  id: string;
  roommateId: string;
  roomId?: string;
  rules: {
    cleaningSchedule: boolean; // Lịch dọn vệ sinh chung
    noiseRules: boolean; // Quy định về tiếng ồn
    visitorRules: boolean; // Đưa bạn bè về chơi
    petRules: boolean; // Nuôi thú cưng
    billSharing: boolean; // Chia sẻ hóa đơn
  };
  signature: string; // base64 drawing data
  status: "nháp" | "cho_xac_nhan" | "da_ky";
  createdAt: string;
}
