// ========================================
// XÓA HẾT FAKE DATA AI - CHỈ DÙNG DATA THẬT TỪ SUPABASE
// ========================================

import { Roommate, Room } from "./types";

export const INITIAL_ROOMMATES: Roommate[] = [];

export const INITIAL_ROOMS: Room[] = [];

export const SUGGGESTED_CHATS: any[] = [];

// Keep SCHOOLS_BY_DISTRICT for form dropdowns
export const SCHOOLS_BY_DISTRICT: Record<string, { value: string; label: string }[]> = {
  "Hải Châu": [
    { value: "ĐH Sư phạm Kỹ thuật (Hải Châu)", label: "ĐH Sư phạm Kỹ thuật" },
    { value: "ĐH Kiến trúc (Hải Châu)", label: "ĐH Kiến trúc" },
    { value: "ĐH Kỹ thuật Y - Dược (Hải Châu)", label: "ĐH Kỹ thuật Y - Dược" },
    { value: "ĐH Đông Á (Hải Châu)", label: "ĐH Đông Á" },
  ],
  "Liên Chiểu": [
    { value: "ĐH Bách khoa (Liên Chiểu)", label: "ĐH Bách khoa" },
    { value: "ĐH Sư phạm (Liên Chiểu)", label: "ĐH Sư phạm" },
    { value: "ĐH Duy Tân (Liên Chiểu)", label: "ĐH Duy Tân" },
    { value: "CĐ Kinh tế - Kế hoạch (Liên Chiểu)", label: "CĐ Kinh tế - Kế hoạch" },
  ],
  "Ngũ Hành Sơn": [
    { value: "ĐH Kinh tế (Ngũ Hành Sơn)", label: "ĐH Kinh tế" },
    { value: "ĐH CNTT & TT Việt - Hàn (Ngũ Hành Sơn)", label: "ĐH CNTT & TT Việt - Hàn" },
    { value: "Trường Y Dược - ĐH ĐN (Ngũ Hành Sơn)", label: "Trường Y Dược - ĐH Đà Nẵng" },
    { value: "ĐH FPT (Ngũ Hành Sơn)", label: "ĐH FPT" },
    { value: "CĐ Du lịch Đà Nẵng (Ngũ Hành Sơn)", label: "CĐ Du lịch" },
  ],
  "Cẩm Lệ": [
    { value: "ĐH Ngoại ngữ (Cẩm Lệ)", label: "ĐH Ngoại ngữ" },
    { value: "CĐ Bách khoa (Cẩm Lệ)", label: "CĐ Bách khoa Đà Nẵng" },
  ],
  "Thanh Khê": [
    { value: "ĐH Thể dục Thể thao III (Thanh Khê)", label: "ĐH Thể dục Thể thao III" },
    { value: "CĐ Thương mại (Thanh Khê)", label: "CĐ Thương mại" },
  ],
  "Sơn Trà": [
    { value: "ĐH Greenwich (Sơn Trà)", label: "ĐH Greenwich" },
    { value: "CĐ Nghề Đà Nẵng (Sơn Trà)", label: "CĐ Nghề Đà Nẵng" },
  ]
};
