import { useState, useEffect, useRef, useMemo } from "react";
import { INITIAL_ROOMMATES, INITIAL_ROOMS, SUGGGESTED_CHATS } from "./data";
import { Roommate, Room } from "./types";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import RoommatesView from "./components/RoommatesView";
import RoomsView from "./components/RoomsView";
import ChatView from "./components/ChatView";
import AgreementView from "./components/AgreementView";
import HistoryView from "./components/HistoryView";
import InfoView from "./components/InfoView";
import AdminDashboard from "./components/AdminDashboard";
import { CHAT_REPORT_PREFIX, getModerationChannel, isSystemChannel, REVIEW_REPORT_PREFIX } from "./lib/moderation";
import { isInlineImage, removePublicStorageUrls, uploadInlineImage } from "./lib/storage";
import { useDialog } from "./components/ui/DialogProvider";

import RoommateModal from "./components/RoommateModal";
import RoomModal from "./components/RoomModal";
import CreateProfileModal from "./components/CreateProfileModal";
import LoginModal from "./components/LoginModal";
import PostListingModal from "./components/PostListingModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import ReportModal from "./components/ReportModal";

type ListingKind = "room" | "roommate";
type ListingAction = "create" | "update";

const ROOM_DB_KEYS = [
  'id', 'title', 'price', 'location', 'district', 'type', 'images', 'features',
  'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName',
  'hostAvatar', 'hostRole', 'description', 'phoneNumber', 'pets', 'gender',
  'electricity', 'water', 'parking', 'proximity', 'roommateInfo', 'habits',
  'postedBy', 'user_id', 'createdAt', 'rejectReason'
] as const;

const ROOMMATE_DB_KEYS = [
  'id', 'name', 'age', 'role', 'school', 'phoneNumber', 'avatar', 'status',
  'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags',
  'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id',
  'is_listing', 'createdAt', 'rejectReason'
] as const;

const withoutExtendedRoomFields = (room: Record<string, any>) => {
  const {
    electricity, water, parking, proximity, hostRole, roommateInfo, habits,
    rejectReason,
    ...legacyRoom
  } = room;
  const extendedFeatures = [...(legacyRoom.features || [])];
  if (electricity) extendedFeatures.push(`ELECTRICITY:${electricity}`);
  if (water) extendedFeatures.push(`WATER:${water}`);
  if (parking) extendedFeatures.push(`PARKING:${parking}`);
  if (proximity) extendedFeatures.push(`PROXIMITY:${proximity}`);
  if (hostRole) extendedFeatures.push(`HOSTROLE:${hostRole}`);
  if (roommateInfo) extendedFeatures.push(`ROOMMATE_INFO:${JSON.stringify(roommateInfo)}`);
  if (habits) extendedFeatures.push(`HABITS:${JSON.stringify(habits)}`);
  
  legacyRoom.features = extendedFeatures;
  return legacyRoom;
};

const withoutExtendedRoommateFields = (roommate: Record<string, any>) => {
  const { school, rejectReason, ...legacyRoommate } = roommate;
  const extendedTags = [...(legacyRoommate.tags || [])];
  if (school) extendedTags.push(`SCHOOL:${school}`);
  legacyRoommate.tags = extendedTags;
  return legacyRoommate;
};

const getListingErrorMessage = (
  error: { code?: string; message?: string } | null,
  kind: ListingKind,
  action: ListingAction,
) => {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  const subject = kind === "room" ? "tin phòng" : "bài tìm bạn";
  const actionText = action === "create" ? "đăng" : "cập nhật";

  if (code === "22003" || message.includes("out of range")) {
    return kind === "room"
      ? "Giá thuê đang quá lớn. Vui lòng kiểm tra lại mức giá rồi thử lại."
      : "Ngân sách đang quá lớn. Vui lòng kiểm tra lại mức ngân sách rồi thử lại.";
  }
  if (code === "23502" || message.includes("not-null constraint")) {
    return `Một số thông tin cần thiết của ${subject} còn thiếu. Vui lòng kiểm tra lại các ô có dấu *.`;
  }
  if (code === "23505" || message.includes("duplicate key")) {
    return `${subject.charAt(0).toUpperCase() + subject.slice(1)} này đã được lưu. Vui lòng tải lại trang để kiểm tra.`;
  }
  if (code === "42501" || message.includes("row-level security") || message.includes("permission denied")) {
    return `Bạn chưa có quyền ${actionText} ${subject}. Vui lòng đăng nhập lại rồi thử lại.`;
  }
  if (code === "PGRST204" || code === "42703" || message.includes("schema cache")) {
    return "Dữ liệu hệ thống đang được cập nhật. Vui lòng thử lại sau ít phút.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "Kết nối đến máy chủ chưa ổn định. Vui lòng kiểm tra mạng và thử lại.";
  }

  return `Chưa thể ${actionText} ${subject} lúc này. Vui lòng thử lại sau.`;
};

export default function App() {
  const { toast } = useDialog();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\/+/, "");
    if (path && ["home", "roommates", "rooms", "chat", "agreement", "history", "info", "admin"].includes(path)) {
      return path;
    }
    const hash = window.location.hash.replace("#", "").split("?")[0];
    return hash && ["home", "roommates", "rooms", "chat", "agreement", "history", "info", "admin"].includes(hash) ? hash : "home";
  });
  
  useEffect(() => {
    const handleGlobalHash = () => {
      const hash = window.location.hash.replace("#", "").split("?")[0];
      if (hash && ["home", "roommates", "rooms", "chat", "agreement", "history", "info"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleGlobalHash);
    return () => window.removeEventListener("hashchange", handleGlobalHash);
  }, []);
  
  const [globalSearchFilters, setGlobalSearchFilters] = useState<any>(null);
  
  // Authentication states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [previousRoom, setPreviousRoom] = useState<Room | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Add loading state
  const [isBanned, setIsBanned] = useState(false);
  const [supabaseBannedIds, setSupabaseBannedIds] = useState<string[]>([]);
  const [reportingProfileFromModal, setReportingProfileFromModal] = useState<Roommate | null>(null);

  useEffect(() => {
    // Failsafe timeout to prevent infinite loading
    const authTimeout = setTimeout(() => setAuthLoading(false), 5000);

    const checkBanStatus = async (userId: string) => {
      try {
        const { data: profileData } = await supabase.from('profiles').select('is_locked').eq('auth_id', userId).maybeSingle();
        const { data: roommateData } = await supabase.from('roommates').select('is_locked').eq('user_id', userId).eq('is_listing', false).maybeSingle();
        const { data: banMsgs } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
        
        const isProfileLocked = profileData?.is_locked === true || profileData?.is_locked === 'true';
        const isRoommateLocked = roommateData?.is_locked === true || roommateData?.is_locked === 'true';
        const isLegacyBanned = banMsgs && banMsgs.some((m: any) => m.text.includes(userId));

        if (isProfileLocked || isRoommateLocked || isLegacyBanned) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentUserProfile(null);
          localStorage.removeItem("roomiematch_user_profile");
          toast('Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.', 'error', 8000);
        }
      } catch (e) {
        console.error("Error checking ban status", e);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (sessionStorage.getItem('isRecovering') === 'true') {
          console.log('[Auth] In password recovery flow - ignoring session until password is reset');
          return;
        }
        checkBanStatus(session.user.id);

        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
          provider: session.user.app_metadata?.provider || "email",
        });
      }
      clearTimeout(authTimeout);
      setAuthLoading(false); // Done loading
    }).catch(err => {
      console.error("getSession error:", err);
      clearTimeout(authTimeout);
      setAuthLoading(false);
    });

    const handleAuthRefresh = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || "Thành viên Roomie",
            avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
            provider: session.user.app_metadata?.provider || "email",
          });
        }
      });
    };
    window.addEventListener("auth_refresh", handleAuthRefresh);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event, session?.user?.email);
      
      if (event === 'INITIAL_SESSION') {
        clearTimeout(authTimeout);
        setAuthLoading(false);
      }

      if (session?.user) {
        if (sessionStorage.getItem('isRecovering') === 'true') {
          console.log('[Auth] In password recovery flow - ignoring session until password is reset');
          return;
        }
        checkBanStatus(session.user.id);

        // Khi quên mật khẩu, Supabase tạo session nhưng chưa được đặt lại mk
        // → KHÔNG đăng nhập tự động, để LoginModal hoàn tất bước reset_password trước
        if (event === 'PASSWORD_RECOVERY') {
          console.log('[Auth] PASSWORD_RECOVERY event — skipping auto-login, waiting for user to set new password');
          return;
        }

        const user = session.user;
        console.log('[Auth] User logged in:', user.email, user.id);
        
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
          provider: user.app_metadata?.provider || "email",
        });
        
        // 1. Dùng cache tạm thời để UI không bị giật
        const savedProfileStr = localStorage.getItem("roomiematch_user_profile");
        let localProfile = null;
        try { if (savedProfileStr) localProfile = JSON.parse(savedProfileStr); } catch(e) {}
        if (localProfile) setCurrentUserProfile(localProfile);

        // 2. Luôn đồng bộ với Supabase roommates table để người khác thấy
        if (import.meta.env.VITE_SUPABASE_URL) {
          try {
            // Try multiple strategies to find profile
            let profileData = null;
            let error = null;
            
            // Strategy 1: Find by user_id (most reliable)
            console.log('[Auth] Strategy 1: Searching by user_id:', user.id);
            const result1 = await supabase.from('roommates').select('*').eq('user_id', user.id).eq('is_listing', false).maybeSingle();
            console.log('[Auth] Strategy 1 result:', { data: result1.data, error: result1.error, status: result1.status });
            if (result1.data && !result1.error) {
              profileData = result1.data;
              console.log('[Auth] ✅ Found profile by user_id');
            } else if (result1.error) {
              console.error('[Auth] ❌ Strategy 1 error:', result1.error);
            }
            
            // Strategy 2: Find by id (if profile ID == auth ID)
            if (!profileData) {
              console.log('[Auth] Strategy 2: Searching by id:', user.id);
              const result2 = await supabase.from('roommates').select('*').eq('id', user.id).eq('is_listing', false).maybeSingle();
              console.log('[Auth] Strategy 2 result:', { data: result2.data, error: result2.error, status: result2.status });
              if (result2.data && !result2.error) {
                profileData = result2.data;
                console.log('[Auth] ✅ Found profile by id');
              } else if (result2.error) {
                console.error('[Auth] ❌ Strategy 2 error:', result2.error);
              }
            }
            
            // Strategy 3: Find by postedBy (legacy)
            if (!profileData) {
              console.log('[Auth] Strategy 3: Searching by postedBy:', user.id);
              const result3 = await supabase.from('roommates').select('*').eq('postedBy', user.id).eq('is_listing', false).maybeSingle();
              console.log('[Auth] Strategy 3 result:', { data: result3.data, error: result3.error, status: result3.status });
              if (result3.data && !result3.error) {
                profileData = result3.data;
                console.log('[Auth] ✅ Found profile by postedBy');
              } else if (result3.error) {
                console.error('[Auth] ❌ Strategy 3 error:', result3.error);
              }
            }
            
            if (profileData) {
              console.log('[Auth] Loaded profile from Supabase roommates:', profileData.name);
              // Preserve local avatar if Supabase avatar looks like a placeholder/empty
              const localAvatar = localProfile?.avatar;
              if (localAvatar && localAvatar.startsWith('data:') && !profileData.avatar?.startsWith('data:')) {
                profileData = { ...profileData, avatar: localAvatar };
                console.log('[Auth] Preserved local base64 avatar over Supabase avatar');
              }
              setCurrentUserProfile(profileData);
              localStorage.setItem("roomiematch_user_profile", JSON.stringify(profileData));
            } else if (localProfile) {
              console.log('[Auth] No Supabase profile, keeping localStorage profile:', localProfile.name);
              setCurrentUserProfile(localProfile);
            } else {
              console.log('[Auth] No profile found for user:', user.id, '-> User needs to create profile');
              setCurrentUserProfile(null);
            }
          } catch(e) {
            console.error('[Auth] Error syncing profile with Supabase:', e);
          }
        }
      } else {
        console.log('[Auth] User logged out or no session');
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("auth_refresh", handleAuthRefresh);
    };
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchSupabaseData = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setIsRoomsLoading(false);
        setIsRoommatesLoading(false); // No Supabase, use local data only
        return;
      }

      // --- Helper functions for unpacking extended fields ---
      const unpackRoommate = (rm: any) => {
        if (rm.tags && Array.isArray(rm.tags)) {
          rm.tags.forEach((t: string) => {
            if (typeof t !== 'string') return;
            if (t.startsWith('SCHOOL:')) rm.school = t.substring(7);
          });
          rm.tags = rm.tags.filter((t: string) => typeof t === 'string' && !t.startsWith('SCHOOL:'));
        }
        return rm;
      };

      const unpackRoom = (room: any) => {
        if (room.features && Array.isArray(room.features)) {
          room.features.forEach((f: string) => {
            if (typeof f !== 'string') return;
            if (f.startsWith('ELECTRICITY:')) room.electricity = f.substring(12);
            if (f.startsWith('WATER:')) room.water = f.substring(6);
            if (f.startsWith('PARKING:')) room.parking = f.substring(8);
            if (f.startsWith('PROXIMITY:')) room.proximity = f.substring(10);
            if (f.startsWith('HOSTROLE:')) room.hostRole = f.substring(9);
            if (f.startsWith('ROOMMATE_INFO:')) {
              try { room.roommateInfo = JSON.parse(f.substring(14)); } catch (e) {}
            }
            if (f.startsWith('HABITS:')) {
              try { room.habits = JSON.parse(f.substring(7)); } catch (e) {}
            }
          });
          room.features = room.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ELECTRICITY|WATER|PARKING|PROXIMITY|HOSTROLE|ROOMMATE_INFO|HABITS):/));
        }
        return room;
      };

      // --- 1. Optimistic UI / Cache loading ---
      try {
        const cachedRoommates = localStorage.getItem('roomiematch_cached_roommates');
        const cachedRooms = localStorage.getItem('roomiematch_cached_rooms');
        const cachedReviews = localStorage.getItem('roomiematch_cached_reviews');
        
        if (cachedRoommates) {
          const parsed = JSON.parse(cachedRoommates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSupabaseRoommates(parsed);
            setIsRoommatesLoading(false); // Have cache, no need for skeleton
          }
        }
        if (cachedRooms) {
          const parsed = JSON.parse(cachedRooms);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSupabaseRooms(parsed);
            setIsRoomsLoading(false); // Have cache, no need for skeleton
          }
        }
        if (cachedReviews) {
          const parsed = JSON.parse(cachedReviews);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSupabaseReviews(parsed);
          }
        }
        
      } catch (e) {
        console.error("Lỗi đọc cache:", e);
      }

      // --- 2. Fetch fresh data from server ---
      try {
        const [roommatesResult, roomsResult] = await Promise.all([
          supabase.from('roommates').select('*').order('createdAt', { ascending: false }),
          supabase.from('rooms').select('*').order('createdAt', { ascending: false }),
        ]);

        const nowMs = Date.now();
        const currentUserId = currentUser?.id;

        if (roommatesResult.error) {
          console.error("[Profiles] Failed to fetch roommates:", roommatesResult.error);
        }
        const roommatesData = roommatesResult.data;
        if (!roommatesResult.error && roommatesData?.length) {
          const validRoommatesData = roommatesData.filter((r: any) => 
            !r.locked_until || new Date(r.locked_until).getTime() <= nowMs || r.user_id === currentUserId || r.auth_id === currentUserId || r.postedBy === currentUserId
          );
          const freshRoommates = validRoommatesData.map(unpackRoommate);
          const enhancedRoommates = freshRoommates.map((rm: any) => ({
            ...rm,
            reviews: []
          }));
          setSupabaseRoommates(enhancedRoommates);
          try {
            localStorage.setItem('roomiematch_cached_roommates', JSON.stringify(enhancedRoommates));
          } catch (e) {
            console.warn("Could not cache roommates (quota exceeded):", e);
          }
        }

        if (roomsResult.error) {
          console.error("[Listings] Failed to fetch rooms:", roomsResult.error);
          setIsRoomsLoading(false); // Stop skeleton even on error
        }
        if (!roomsResult.error && roomsResult.data?.length) {
          const validRoomsData = roomsResult.data.filter((r: any) => 
            !r.locked_until || new Date(r.locked_until).getTime() <= nowMs || r.user_id === currentUserId || r.postedBy === currentUserId
          );
          const freshRooms = validRoomsData.map(unpackRoom);
          setSupabaseRooms(freshRooms);
          try {
            localStorage.setItem('roomiematch_cached_rooms', JSON.stringify(freshRooms));
          } catch (e) {
            console.warn("Could not cache rooms (quota exceeded):", e);
          }
        }
      } catch (err) {
        console.error("Error fetching listings from Supabase:", err);
        setIsRoomsLoading(false); // Stop skeleton on exception too
      } finally {
        setIsRoomsLoading(false);
        setIsRoommatesLoading(false);
      }

      // Secondary data must not delay the public listing pages.
      try {
        const [reviewsResult, roomReviewsResult] = await Promise.all([
          supabase.from('reviews').select('*'),
          supabase.from('room_reviews').select('*'),
        ]);

        if (reviewsResult.error) {
          console.error("[Listings] Failed to fetch reviews:", reviewsResult.error);
        }
        if (reviewsResult.data) {
          setSupabaseReviews(reviewsResult.data);
          localStorage.setItem('roomiematch_cached_reviews', JSON.stringify(reviewsResult.data));
        }

        if (roomReviewsResult.data) {
          setSupabaseRoomReviews(roomReviewsResult.data);
          localStorage.setItem('roomiematch_cached_room_reviews', JSON.stringify(roomReviewsResult.data));
        } else if (roomReviewsResult.error && roomReviewsResult.error.code !== "42P01") {
          console.error("[Room reviews] Fetch failed:", roomReviewsResult.error);
        }

      } catch (err) {
        console.error("Error fetching secondary Supabase data:", err);
      }
    };

    fetchSupabaseData();

    // Realtime: auto-refresh when someone posts a new listing or room
    const channel = supabase
      .channel('roommates-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roommates' },
        async (payload) => {
          // Optimize: Only update the changed record instead of refetching all
          if (payload.eventType === 'INSERT' && payload.new) {
            // Note: Since unpackRoommate and unpackRoom were moved, these will now work correctly
            const newRm = payload.new;
            if (newRm.features && Array.isArray(newRm.features)) {
              newRm.features.forEach((f: string) => {
                if (typeof f !== 'string') return;
                if (f.startsWith('ROLE:')) newRm.role = f.substring(5);
                if (f.startsWith('TARGET_TENANTS:')) newRm.targetTenants = parseInt(f.substring(15));
                if (f.startsWith('HABITS:')) {
                  try { newRm.habits = JSON.parse(f.substring(7)); } catch (e) {}
                }
              });
              newRm.features = newRm.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ROLE|TARGET_TENANTS|HABITS):/));
            }
            setSupabaseRoommates(prev => [
              newRm,
              ...prev.filter((roommate) => String(roommate.id) !== String(newRm.id)),
            ]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const newRm = payload.new;
            if (newRm.features && Array.isArray(newRm.features)) {
              newRm.features.forEach((f: string) => {
                if (typeof f !== 'string') return;
                if (f.startsWith('ROLE:')) newRm.role = f.substring(5);
                if (f.startsWith('TARGET_TENANTS:')) newRm.targetTenants = parseInt(f.substring(15));
                if (f.startsWith('HABITS:')) {
                  try { newRm.habits = JSON.parse(f.substring(7)); } catch (e) {}
                }
              });
              newRm.features = newRm.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ROLE|TARGET_TENANTS|HABITS):/));
            }
            setSupabaseRoommates(prev => prev.map(
              (roommate) => String(roommate.id) === String(newRm.id) ? newRm : roommate
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSupabaseRoommates(prev => prev.filter(
              (roommate) => String(roommate.id) !== String(payload.old.id)
            ));
          }
          // Removed fallback refetch - avoid full reload causing layout shift
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async (payload) => {
          // Optimize: Only update the changed record instead of refetching all
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRoom = payload.new;
            if (newRoom.features && Array.isArray(newRoom.features)) {
              newRoom.features.forEach((f: string) => {
                if (typeof f !== 'string') return;
                if (f.startsWith('ELECTRICITY:')) newRoom.electricity = f.substring(12);
                if (f.startsWith('WATER:')) newRoom.water = f.substring(6);
                if (f.startsWith('PARKING:')) newRoom.parking = f.substring(8);
                if (f.startsWith('PROXIMITY:')) newRoom.proximity = f.substring(10);
                if (f.startsWith('HOSTROLE:')) newRoom.hostRole = f.substring(9);
                if (f.startsWith('ROOMMATE_INFO:')) {
                  try { newRoom.roommateInfo = JSON.parse(f.substring(14)); } catch (e) {}
                }
                if (f.startsWith('HABITS:')) {
                  try { newRoom.habits = JSON.parse(f.substring(7)); } catch (e) {}
                }
              });
              newRoom.features = newRoom.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ELECTRICITY|WATER|PARKING|PROXIMITY|HOSTROLE|ROOMMATE_INFO|HABITS):/));
            }
            setSupabaseRooms(prev => [
              newRoom,
              ...prev.filter((room) => String(room.id) !== String(newRoom.id)),
            ]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const newRoom = payload.new;
            if (newRoom.features && Array.isArray(newRoom.features)) {
              newRoom.features.forEach((f: string) => {
                if (typeof f !== 'string') return;
                if (f.startsWith('ELECTRICITY:')) newRoom.electricity = f.substring(12);
                if (f.startsWith('WATER:')) newRoom.water = f.substring(6);
                if (f.startsWith('PARKING:')) newRoom.parking = f.substring(8);
                if (f.startsWith('PROXIMITY:')) newRoom.proximity = f.substring(10);
                if (f.startsWith('HOSTROLE:')) newRoom.hostRole = f.substring(9);
                if (f.startsWith('ROOMMATE_INFO:')) {
                  try { newRoom.roommateInfo = JSON.parse(f.substring(14)); } catch (e) {}
                }
                if (f.startsWith('HABITS:')) {
                  try { newRoom.habits = JSON.parse(f.substring(7)); } catch (e) {}
                }
              });
              newRoom.features = newRoom.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ELECTRICITY|WATER|PARKING|PROXIMITY|HOSTROLE|ROOMMATE_INFO|HABITS):/));
            }
            setSupabaseRooms(prev => prev.map(
              (room) => String(room.id) === String(newRoom.id) ? newRoom : room
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSupabaseRooms(prev => prev.filter(
              (room) => String(room.id) !== String(payload.old.id)
            ));
          } else {
            // Fallback: refetch if needed
            const { data } = await supabase.from('rooms').select('*').order('createdAt', { ascending: false });
            if (data) {
              const freshRooms = data.map((room: any) => {
                if (room.features && Array.isArray(room.features)) {
                  room.features.forEach((f: string) => {
                    if (typeof f !== 'string') return;
                    if (f.startsWith('ELECTRICITY:')) room.electricity = f.substring(12);
                    if (f.startsWith('WATER:')) room.water = f.substring(6);
                    if (f.startsWith('PARKING:')) room.parking = f.substring(8);
                    if (f.startsWith('PROXIMITY:')) room.proximity = f.substring(10);
                    if (f.startsWith('HOSTROLE:')) room.hostRole = f.substring(9);
                    if (f.startsWith('ROOMMATE_INFO:')) {
                      try { room.roommateInfo = JSON.parse(f.substring(14)); } catch (e) {}
                    }
                    if (f.startsWith('HABITS:')) {
                      try { room.habits = JSON.parse(f.substring(7)); } catch (e) {}
                    }
                  });
                  room.features = room.features.filter((f: string) => typeof f === 'string' && !f.match(/^(ELECTRICITY|WATER|PARKING|PROXIMITY|HOSTROLE|ROOMMATE_INFO|HABITS):/));
                }
                return room;
              });
              setSupabaseRooms(freshRooms);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_reviews' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setSupabaseRoomReviews((previous) => [
              payload.new,
              ...previous.filter((review) => review.id !== payload.new.id),
            ]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setSupabaseRoomReviews((previous) =>
              previous.map((review) => review.id === payload.new.id ? payload.new : review)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSupabaseRoomReviews((previous) =>
              previous.filter((review) => review.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    const refreshBannedUsers = async () => {
      // 1. Fetch legacy bans
      const { data } = await supabase
        .from("messages")
        .select("text")
        .eq("chat_id", "SYSTEM_BANS");
      const legacyBannedIds: string[] = (data || [])
        .filter((message: any) => String(message.text || "").startsWith("[BAN]"))
        .map((message: any) => String(message.text).replace("[BAN]", "").trim());

      // 2. Fetch new database locked users
      const { data: lockedRoommates } = await supabase
        .from("roommates")
        .select("id, user_id, is_locked")
        .eq("is_locked", true);
      const dbLockedIds: string[] = (lockedRoommates || [])
        .map(r => r.user_id || r.id)
        .filter(Boolean);

      const uniqueBannedIds = [...new Set<string>([...legacyBannedIds, ...dbLockedIds])];
      setSupabaseBannedIds(uniqueBannedIds);
    };

    refreshBannedUsers();
    const channel = supabase
      .channel("ban-status-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "chat_id=eq.SYSTEM_BANS",
        },
        refreshBannedUsers
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        refreshBannedUsers
      )
      .subscribe();

    window.addEventListener("focus", refreshBannedUsers);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", refreshBannedUsers);
    };
  }, []);


  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRequireProfileAlertOpen, setIsRequireProfileAlertOpen] = useState(false);

  // Persistence for user profile
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(() => {
    // Auto-clear old cache version to fix ghost profiles
    const CACHE_VERSION = '3.0';
    const currentVersion = localStorage.getItem('roomiematch_version');
    
    if (currentVersion !== CACHE_VERSION) {
      console.log('[App] Clearing old cache, upgrading to version', CACHE_VERSION);
      localStorage.removeItem('roomiematch_user_profile');
      localStorage.removeItem('roomiematch_profiles_map');
      localStorage.setItem('roomiematch_version', CACHE_VERSION);
      return null;
    }
    
    const saved = localStorage.getItem("roomiematch_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // States to hold Supabase fetched lists
  const [supabaseRoommates, setSupabaseRoommates] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("roomiematch_cached_roommates") || "[]");
    } catch {
      return [];
    }
  });
  const [isRoommatesLoading, setIsRoommatesLoading] = useState(true);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  
  // Fallback safety timeout: force stop loading after 10s if Supabase hangs
  useEffect(() => {
    const t1 = setTimeout(() => setIsRoommatesLoading(false), 10000);
    const t2 = setTimeout(() => setIsRoomsLoading(false), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const [supabaseRooms, setSupabaseRooms] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("roomiematch_cached_rooms") || "[]");
    } catch {
      return [];
    }
  });
  const [supabaseRoomReviews, setSupabaseRoomReviews] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("roomiematch_cached_room_reviews") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("roomiematch_cached_roommates", JSON.stringify(supabaseRoommates));
    } catch (error) {
      console.warn("[Cache] Could not cache roommates:", error);
    }
  }, [supabaseRoommates]);

  useEffect(() => {
    try {
      localStorage.setItem("roomiematch_cached_room_reviews", JSON.stringify(supabaseRoomReviews));
    } catch (error) {
      console.warn("[Cache] Could not cache room reviews:", error);
    }
  }, [supabaseRoomReviews]);

  useEffect(() => {
    try {
      localStorage.setItem("roomiematch_cached_rooms", JSON.stringify(supabaseRooms));
    } catch (error) {
      console.warn("[Cache] Could not cache rooms:", error);
    }
  }, [supabaseRooms]);

  // Auto-sync profile when logging in or refreshing
  useEffect(() => {
    if (currentUser && !currentUserProfile) {
      console.log('[App] User logged in but no profile found in local storage, fetching from Supabase...');
      
      const fetchProfile = async () => {
        try {
          if (!import.meta.env.VITE_SUPABASE_URL) return;
          const { data, error } = await supabase.from('roommates').select('*').eq('user_id', currentUser.id).eq('is_listing', false).maybeSingle();
          
          if (data) {
            console.log('[App] Profile found in Supabase, restoring...');
            setCurrentUserProfile(data);
            localStorage.setItem("roomiematch_user_profile", JSON.stringify(data));
          } else {
            console.log('[App] No profile found in Supabase, checking if we already prompted...');
            const hasPrompted = localStorage.getItem(`prompted_profile_${currentUser.id}`);
            if (!hasPrompted) {
              localStorage.setItem(`prompted_profile_${currentUser.id}`, "true");
              setTimeout(() => {
                setIsProfileModalOpen(true);
              }, 500);
            } else {
              console.log('[App] Already prompted this user before. Skipping auto-open.');
            }
          }
        } catch (err) {
          console.error('[App] Error fetching profile:', err);
        }
      };

      fetchProfile();
      
    } else if (currentUser && currentUserProfile && currentUserProfile.id === "me") {
      // Migrate "me" ID to actual Supabase UUID to prevent shared chats
      setCurrentUserProfile({ ...currentUserProfile, id: currentUser.id });
    }
  }, [currentUser, currentUserProfile]);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@roomiematch.com";
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('admin_roles').select('user_id').then(({ data }) => {
      if (data) setAdminUserIds(data.map((r: any) => r.user_id));
    });
  }, []);

  const isAdmin = currentUser?.email === adminEmail
    || currentUser?.email === "quanly@roomiematch.com"
    || currentUser?.id === "7a1b28ab-058f-49b6-85bb-3cb61406db31"
    || (!!currentUser?.id && adminUserIds.includes(currentUser.id));

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasPendingAgreement, setHasPendingAgreement] = useState(false);
  const [hideInactiveRoommates, setHideInactiveRoommates] = useState(false);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'chat') {
      setHasUnreadMessages(false);
    }
    if (activeTab === 'agreement') {
      setHasPendingAgreement(false);
    }
  }, [activeTab]);

  // Listen for unread messages and incoming agreement drafts
  useEffect(() => {
    const myChatId = currentUser?.id || currentUserProfile?.id;
    if (!myChatId) return;
    
    const sub = supabase.channel('header_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (
          newMessage.sender_id !== myChatId &&
          newMessage.chat_id.includes(myChatId) &&
          !isSystemChannel(newMessage.chat_id)
        ) {
          const isAgreementSystemMessage =
            newMessage.text?.startsWith('[AGREEMENT_SIGNED]') ||
            newMessage.text?.startsWith('[AGREEMENT_CANCELLED]');
          // Unread message badge for Tin Nhắn
          if (activeTabRef.current !== 'chat' && !isAgreementSystemMessage) {
            setHasUnreadMessages(true);
          }
          // Pending agreement badge for Thỏa Thuận
          if (
            newMessage.text?.startsWith('[AGREEMENT_DRAFT]') &&
            activeTabRef.current !== 'agreement'
          ) {
            setHasPendingAgreement(true);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [currentUser, currentUserProfile]);

  // State lists
  const [roommates, setRoommates] = useState<Roommate[]>(() => {
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const parsed = saved ? JSON.parse(saved) : [];
    return [...parsed, ...INITIAL_ROOMMATES];
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    const parsed = saved ? JSON.parse(saved) : [];
    return [...parsed, ...INITIAL_ROOMS];
  });

  // Merge local roommates with Supabase roommates (deduplicate by id AND name)
  const allRoommates = useMemo(() => {
    let result = [...roommates];
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      const initialRoommateIds = new Set(INITIAL_ROOMMATES.map((r) => String(r.id)));
      
      result = result.filter(r => {
        // Keep if it exists in Supabase
        if (supabaseRoommates.some(sr => sr.id === r.id)) return true;
        // Keep if it's initial mock data
        if (initialRoommateIds.has(String(r.id))) return true;
        // Drop ghost local posts
        return false;
      });
    }

    // Filter out unapproved posts or expired posts (unless Admin or Post Owner)
    result = result.filter(r => {
      const isOwner = currentUser && (r.user_id === currentUser.id || r.postedBy === currentUser.id);
      
      const createdDate = new Date(r.created_at || r.createdAt || Date.now());
      const daysElapsed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if ((r.status === "Hết hạn" || daysElapsed > 30) && !isAdmin && !isOwner) return false;
      
      if (r.isVerified === true || r.isVerified === undefined) return true; // Approved or legacy dummy data
      if (isAdmin) return true; // Admins see everything
      if (isOwner) return true; // Owner sees their own pending post
      return false; // Hide pending posts from public
    });

    // Sort: newest listings on top. Sample data (fixed IDs) gets timestamp 0 → goes to bottom
    result.sort((a, b) => {
      const getTs = (r: any): number => {
        if (r.createdAt) {
          const d = new Date(r.createdAt);
          if (!isNaN(d.getTime())) return d.getTime();
        }
        const match = String(r.id).match(/rm-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getTs(b) - getTs(a);
    });

    return result;
  }, [supabaseRoommates, roommates]);

  const allRoommatesRef = useRef(allRoommates);
  useEffect(() => {
    allRoommatesRef.current = allRoommates;
  }, [allRoommates]);

  // Merge local rooms with Supabase rooms (deduplicate by id)
  const allRooms = useMemo(() => {
    const currentName = String(currentUserProfile?.name || currentUser?.name || "").trim().toLowerCase();
    const visibleLocalRooms = import.meta.env.VITE_SUPABASE_URL
      ? rooms.filter((room) => {
          if (supabaseRooms.some(sr => String(sr.id) === String(room.id))) return true;
          if (INITIAL_ROOMS.some(ir => String(ir.id) === String(room.id))) return true;
          const ownerId = String(room.user_id || room.postedBy || "");
          const ownerName = String(room.hostName || "").trim().toLowerCase();
          return !!currentUser?.id && (
            ownerId === currentUser.id ||
            (!ownerId && !!currentName && ownerName === currentName)
          );
        })
      : rooms;
    const combined = [...supabaseRooms, ...visibleLocalRooms];
    const supabaseRoomIdSet = new Set(supabaseRooms.map((sr: any) => String(sr.id)));
    const uniqueByIdMap = new Map();
    
    combined.forEach(r => {
      const existing = uniqueByIdMap.get(r.id);
      if (!existing) {
        uniqueByIdMap.set(r.id, r);
        return;
      }
      // If same ID appears twice, prefer the version with richer electricity/water data
      // Supabase version is preferred UNLESS local has electricity/water and Supabase doesn't
      const incomingIsSupabase = supabaseRoomIdSet.has(String(r.id));
      const existingIsSupabase = supabaseRoomIdSet.has(String(existing.id));
      if (incomingIsSupabase && !existingIsSupabase) {
        // Prefer Supabase, but merge in local electricity/water if Supabase lacks them
        const merged = { ...existing, ...r };
        if (!r.electricity && existing.electricity) merged.electricity = existing.electricity;
        if (!r.water && existing.water) merged.water = existing.water;
        if (!r.parking && existing.parking) merged.parking = existing.parking;
        uniqueByIdMap.set(r.id, merged);
      } else if (!incomingIsSupabase && existingIsSupabase) {
        // Keep existing Supabase version, but merge in local electricity/water if missing
        const merged = { ...r, ...existing };
        if (!existing.electricity && r.electricity) merged.electricity = r.electricity;
        if (!existing.water && r.water) merged.water = r.water;
        if (!existing.parking && r.parking) merged.parking = r.parking;
        uniqueByIdMap.set(r.id, merged);
      } else {
        // Both same source - prefer incoming (newer in the array)
        uniqueByIdMap.set(r.id, r);
      }
    });
    
    let result = Array.from(uniqueByIdMap.values()).map((room) => {
      const databaseReviews = supabaseRoomReviews
        .filter((review) => (review.room_id || review.roomId) === room.id)
        .map((review) => ({
          id: review.id,
          reviewerId: review.reviewer_id || review.reviewerId,
          reviewerName: review.reviewer_name || review.reviewerName || "Thành viên RoomieMatch",
          reviewerAvatar: review.reviewer_avatar || review.reviewerAvatar,
          rating: Number(review.rating),
          comment: review.comment || "",
          images: Array.isArray(review.images) ? review.images : [],
          createdAt: review.created_at
            ? new Date(review.created_at).toLocaleDateString("vi-VN")
            : review.createdAt,
        }));
      const databaseReviewIds = new Set(databaseReviews.map((review) => review.id));
      return {
        ...room,
        reviews: [
          ...databaseReviews,
          ...(room.reviews || []).filter((review) => !databaseReviewIds.has(review.id)),
        ],
      };
    });

    // Update with current user's avatar if they own the room
    if (currentUserProfile) {
      result = result.map(r => {
        const isOwner = (currentUser && r.postedBy === currentUser.id) || (r.user_id === currentUser?.id);
        return {
          ...r,
          price: r.price || 0,
          hostAvatar: isOwner ? currentUserProfile.avatar : r.hostAvatar,
          hostName: isOwner ? currentUserProfile.name : r.hostName,
          postedBy: isOwner && currentUser ? currentUser.id : (r.postedBy || r.user_id),
        };
      });
    }

    // Filter out unapproved rooms or expired rooms (unless Admin or Post Owner)
    result = result.filter(r => {
      const ownerId = r.postedBy || r.user_id;
      const isOwner = currentUser && (r.user_id === currentUser.id || r.postedBy === currentUser.id);
      
      const isHostBanned = ownerId && supabaseBannedIds.includes(String(ownerId));
      if (isHostBanned && !isAdmin && !isOwner) {
        return false;
      }
      
      const createdDate = new Date(r.created_at || r.createdAt || Date.now());
      const daysElapsed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if ((r.status === "Hết hạn" || daysElapsed > 30) && !isAdmin && !isOwner) return false;

      if (r.isVerifiedRoom === true || r.isVerifiedRoom === undefined) return true; // Approved or legacy dummy data
      if (isAdmin) return true; // Admins see everything
      if (isOwner) return true; // Owner sees their own pending post
      return false; // Hide pending posts from public
    });

    // Sort: newest first by createdAt
    result.sort((a, b) => {
      const getTs = (r: any): number => {
        if (r.createdAt) {
          const d = new Date(r.createdAt);
          if (!isNaN(d.getTime())) return d.getTime();
        }
        return 0;
      };
      return getTs(b) - getTs(a);
    });

    return result;
  }, [supabaseRooms, supabaseRoomReviews, rooms, currentUserProfile, currentUser, supabaseBannedIds]);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postModalInitialTab, setPostModalInitialTab] = useState<"roommate" | "room">("roommate");

  const [editingListingData, setEditingListingData] = useState<any>(null);

  const handleOpenPostModal = async (tab: "roommate" | "room") => {
    let user = currentUser;
    if (!user) {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user;
      if (user) setCurrentUser(user);
    }
    
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!currentUserProfile) {
      setIsRequireProfileAlertOpen(true);
      return;
    }
    
    // Kiểm tra trực tiếp từ Database
    if (user?.id) {
      const { data: dbCheck } = await supabase.from('profiles').select('locked_until').eq('auth_id', user.id).maybeSingle();
      if (dbCheck?.locked_until && new Date(dbCheck.locked_until).getTime() > Date.now()) {
        toast("Tài khoản của bạn đã bị vô hiệu hóa vì nghi ngờ vi phạm", "error", 5000);
        return;
      }
    }
    
    setEditingListingData(null);
    setPostModalInitialTab(tab);
    setIsPostModalOpen(true);
  };

  const handleEditRoommate = async (roommate: Roommate) => {
    // Kiểm tra trực tiếp từ Database
    if (currentUser?.id) {
      const { data: dbCheck } = await supabase.from('profiles').select('locked_until').eq('auth_id', currentUser.id).maybeSingle();
      if (dbCheck?.locked_until && new Date(dbCheck.locked_until).getTime() > Date.now()) {
        toast("Tài khoản của bạn đã bị vô hiệu hóa vì nghi ngờ vi phạm", "error", 5000);
        return;
      }
    }
    setEditingListingData(roommate);
    setPostModalInitialTab("roommate");
    setIsPostModalOpen(true);
  };

  const handleEditRoom = async (room: Room) => {
    // Kiểm tra trực tiếp từ Database
    if (currentUser?.id) {
      const { data: dbCheck } = await supabase.from('profiles').select('locked_until').eq('auth_id', currentUser.id).maybeSingle();
      if (dbCheck?.locked_until && new Date(dbCheck.locked_until).getTime() > Date.now()) {
        toast("Tài khoản của bạn đã bị vô hiệu hóa vì nghi ngờ vi phạm", "error", 5000);
        return;
      }
    }
    setEditingListingData(room);
    setPostModalInitialTab("room");
    setIsPostModalOpen(true);
  };

  const handleAddRoom = async (newRoom: Room): Promise<boolean> => {
    if (!editingListingData) {
      const currentName = String(currentUserProfile?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "").trim().toLowerCase();
      const hasPostedRoom = rooms.some(r => {
        if (currentUser?.id && (r.postedBy === currentUser.id || r.user_id === currentUser.id)) return true;
        if (!currentUser?.id && currentUserProfile?.id && (r.postedBy === currentUserProfile.id || r.user_id === currentUserProfile.id)) return true;
        const ownerName = String(r.hostName || "").trim().toLowerCase();
        if (!currentUser?.id && currentName && ownerName === currentName) return true;
        return false;
      });
      if (hasPostedRoom) {
        toast('Bạn đã đăng 1 bài phòng trọ. Mỗi người chỉ được phép đăng tối đa 1 bài. Vui lòng xóa bài cũ nếu muốn tạo bài mới!', 'warning', 6000);
        return false;
      }
    }

    const roomId = editingListingData?.id || newRoom.id;
    const uploadedRoomImageUrls: string[] = [];
    let finalImages = newRoom.images;

    if (import.meta.env.VITE_SUPABASE_URL && currentUser?.id) {
      try {
        finalImages = [];
        for (const image of newRoom.images) {
          if (!isInlineImage(image)) {
            finalImages.push(image);
            continue;
          }
          const mimeType = image.slice(5, image.indexOf(";"));
          const extension = mimeType === "image/png"
            ? "png"
            : mimeType === "image/webp"
              ? "webp"
              : "jpg";
          const uploadedUrl = await uploadInlineImage(
            "room-images",
            `${currentUser.id}/${roomId}/${crypto.randomUUID()}.${extension}`,
            image
          );
          uploadedRoomImageUrls.push(uploadedUrl);
          finalImages.push(uploadedUrl);
        }
      } catch (error) {
        console.error("[Room images] Upload failed:", error);
        await removePublicStorageUrls(uploadedRoomImageUrls, "room-images").catch(() => {});
        toast("Không thể tải ảnh phòng lên kho lưu trữ. Vui lòng thử lại.", "error", 5000);
        return false;
      }
    }

    const roomWithOwner = {
      ...newRoom,
      id: roomId,
      images: finalImages,
      postedBy: currentUser?.id || "",
      user_id: currentUser?.id || "",
    };
    
    if (editingListingData) {
      // Optimistic UI Update for Edit
      const updatedRoom = { ...roomWithOwner, id: editingListingData.id };

      // Supabase Update
      if (import.meta.env.VITE_SUPABASE_URL) {
        const dbRoom: any = {};
        for (const key of ROOM_DB_KEYS) {
          if (updatedRoom[key as keyof Room] !== undefined) {
            dbRoom[key] = updatedRoom[key as keyof Room];
          }
        }

        let { error } = await supabase.from('rooms').update(dbRoom).eq('id', editingListingData.id);
        if (error && (error.code === 'PGRST204' || error.code === '42703')) {
          error = (
            await supabase.from('rooms')
              .update(withoutExtendedRoomFields(dbRoom))
              .eq('id', editingListingData.id)
          ).error;
        }
        if (error) {
          console.error("Error updating room to Supabase:", error);
          await removePublicStorageUrls(uploadedRoomImageUrls, "room-images").catch(() => {});
          toast(getListingErrorMessage(error, "room", "update"), 'error', 5000);
          return false;
        }
      }
      setRooms((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoom : r));
      setSupabaseRooms((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoom : r));
      const saved = JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]");
      localStorage.setItem(
        "roomiematch_posted_rooms",
        JSON.stringify(saved.map((r: any) => r.id === editingListingData.id ? updatedRoom : r))
      );
      localStorage.setItem(
        "roomiematch_cached_rooms",
        JSON.stringify(
          supabaseRooms.map((r) => r.id === editingListingData.id ? updatedRoom : r)
        )
      );
      const currentImageSet = new Set(finalImages);
      const oldUrls = (editingListingData.images || []).filter(
        (image: string) => !currentImageSet.has(image)
      );
      await removePublicStorageUrls(oldUrls, "room-images").catch((error) =>
        console.warn("[Room images] Could not remove replaced image:", error)
      );
      setEditingListingData(null);
      return true;
    }

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      const dbRoom: any = {};
      for (const key of ROOM_DB_KEYS) {
        if (roomWithOwner[key as keyof Room] !== undefined) {
          dbRoom[key] = roomWithOwner[key as keyof Room];
        }
      }

      let { error, data } = await supabase.from('rooms').insert(dbRoom).select();
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        const result = await supabase.from('rooms').insert(withoutExtendedRoomFields(dbRoom)).select();
        error = result.error;
        data = result.data;
      }
      if (error) {
        console.error("Error inserting room to Supabase:", error);
        await removePublicStorageUrls(uploadedRoomImageUrls, "room-images").catch(() => {});
        toast(getListingErrorMessage(error, "room", "create"), 'error', 5500);
        return false;
      } else {
        console.log("[App] Successfully inserted room to Supabase");
        const savedRoom = (data && data.length > 0) ? { ...roomWithOwner, ...data[0] } : roomWithOwner;
        setSupabaseRooms((prev) => [savedRoom, ...prev]);
        localStorage.setItem(
          "roomiematch_posted_rooms",
          JSON.stringify([savedRoom, ...JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]")])
        );
        return true;
      }
    }

    setRooms((prev) => [roomWithOwner, ...prev]);
    const saved = JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]");
    localStorage.setItem("roomiematch_posted_rooms", JSON.stringify([roomWithOwner, ...saved]));
    return true;
  };

  const handleAddRoommate = async (newRoommate: Roommate): Promise<boolean> => {
    if (!editingListingData) {
      const currentName = String(currentUserProfile?.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "").trim().toLowerCase();
      const hasPostedRoommate = roommates.some(r => {
        if (r.is_listing === false) return false;
        if (currentUser?.id && (r.postedBy === currentUser.id || r.user_id === currentUser.id)) return true;
        if (!currentUser?.id && currentUserProfile?.id && (r.postedBy === currentUserProfile.id || r.user_id === currentUserProfile.id)) return true;
        const ownerName = String(r.name || "").trim().toLowerCase();
        if (!currentUser?.id && currentName && ownerName === currentName) return true;
        return false;
      });
      if (hasPostedRoommate) {
        toast('Bạn đã đăng 1 bài tìm bạn ghép phòng. Mỗi người chỉ được phép đăng tối đa 1 bài. Vui lòng xóa bài cũ nếu muốn tạo bài mới!', 'warning', 6000);
        return false;
      }
    }

    const roommateWithOwner = { 
      ...newRoommate, 
      postedBy: currentUser?.id || "", 
      user_id: currentUser?.id || "",
      is_listing: true,  // Mark as roommate listing (can be deleted)
      createdAt: new Date().toISOString(), // So it sorts to the top
    };
    
    if (editingListingData) {
      // Optimistic UI Update for Edit
      const updatedRoommate = { ...roommateWithOwner, id: editingListingData.id };
      setRoommates((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoommate : r));
      
      // Local cache update
      const saved = localStorage.getItem("roomiematch_posted_roommates");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed.map((r: any) => r.id === editingListingData.id ? updatedRoommate : r)));
      }

      // Supabase State Update (optimistic for Supabase override)
      setSupabaseRoommates((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoommate : r));

      // Supabase Update
      if (import.meta.env.VITE_SUPABASE_URL) {
        const dbRoommate: any = {};
        for (const key of ROOMMATE_DB_KEYS) {
          if (updatedRoommate[key as keyof Roommate] !== undefined) {
            dbRoommate[key] = updatedRoommate[key as keyof Roommate];
          }
        }

        let { error } = await supabase.from('roommates').update(dbRoommate).eq('id', editingListingData.id);
        if (error && (error.code === 'PGRST204' || error.code === '42703')) {
          error = (
            await supabase.from('roommates')
              .update(withoutExtendedRoommateFields(dbRoommate))
              .eq('id', editingListingData.id)
          ).error;
        }
        if (error) {
          console.error("Error updating roommate to Supabase:", error);
          toast(getListingErrorMessage(error, "roommate", "update"), 'error', 5000);
          return false;
        }
        
        // SYNC: Nếu status thay đổi trong listing → cập nhật status trong profile luôn
        if (updatedRoommate.status && currentUserProfile?.status !== updatedRoommate.status) {
          console.log('[App] Syncing status from listing to profile:', updatedRoommate.status);
          
          const profileUpdateData: any = { status: updatedRoommate.status };
          
          // Update profile in Supabase
          await supabase.from('roommates')
            .update(profileUpdateData)
            .eq('user_id', currentUser?.id)
            .eq('is_listing', false);
          
          // Update local profile
          if (currentUserProfile) {
            const updatedProfile = { ...currentUserProfile, status: updatedRoommate.status };
            setCurrentUserProfile(updatedProfile);
            localStorage.setItem("roomiematch_user_profile", JSON.stringify(updatedProfile));
          }
        }
      }
      setEditingListingData(null);
      return true;
    }

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      const dbRoommate: any = {};
      for (const key of ROOMMATE_DB_KEYS) {
        if (roommateWithOwner[key as keyof Roommate] !== undefined) {
          dbRoommate[key] = roommateWithOwner[key as keyof Roommate];
        }
      }
      dbRoommate.is_listing = true; // Force true for listings

      let { error, data } = await supabase.from('roommates').insert(dbRoommate).select();
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        const dbRoommateFallback1 = withoutExtendedRoommateFields(dbRoommate);
        let result = await supabase.from('roommates').insert(dbRoommateFallback1).select();
        if (result.error && (result.error.code === 'PGRST204' || result.error.code === '42703')) {
           const { is_listing, ...dbRoommateFallback2 } = dbRoommateFallback1;
           result = await supabase.from('roommates').insert(dbRoommateFallback2).select();
        }
        error = result.error;
        data = result.data;
      }
      if (error) {
        console.error("Error inserting roommate to Supabase:", error);
        toast(getListingErrorMessage(error, "roommate", "create"), 'error', 5500);
        return false;
      } else {
        console.log("[App] Successfully inserted roommate to Supabase");
        const savedRoommate = (data && data.length > 0) ? { ...roommateWithOwner, ...data[0] } : roommateWithOwner;
        setSupabaseRoommates((prev) => [savedRoommate, ...prev]);
        localStorage.setItem(
          "roomiematch_posted_roommates",
          JSON.stringify([savedRoommate, ...JSON.parse(localStorage.getItem("roomiematch_posted_roommates") || "[]")])
        );
        return true;
      }
    }
    
    setRoommates((prev) => {
      const updated = [{ ...roommateWithOwner, is_listing: true }, ...prev];
      return updated;
    });
    const saved = JSON.parse(localStorage.getItem("roomiematch_posted_roommates") || "[]");
    localStorage.setItem("roomiematch_posted_roommates", JSON.stringify([{ ...roommateWithOwner, is_listing: true }, ...saved]));
    return true;
  };

  const handleDeleteRoom = async (id: string) => {
    const roomToDelete =
      allRooms.find((room) => room.id === id) ||
      supabaseRooms.find((room) => room.id === id) ||
      rooms.find((room) => room.id === id);

    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      if (error) {
        console.error("Error deleting room from Supabase:", error);
        toast("Không thể xóa bài đăng. Vui lòng thử lại.", "error");
        return false;
      }
    }

    setSelectedRoom((current) => current?.id === id ? null : current);
    setRooms((previous) => previous.filter((room) => String(room.id) !== String(id)));
    setSupabaseRooms((previous) => previous.filter((room) => String(room.id) !== String(id)));
    const localRooms = JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]")
      .filter((room: any) => String(room.id) !== String(id));
    const cachedRooms = JSON.parse(localStorage.getItem("roomiematch_cached_rooms") || "[]")
      .filter((room: any) => String(room.id) !== String(id));
    localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(localRooms));
    localStorage.setItem("roomiematch_cached_rooms", JSON.stringify(cachedRooms));

    await removePublicStorageUrls(roomToDelete?.images || [], "room-images").catch((error) =>
      console.warn("[Room images] Could not remove deleted room images:", error)
    );
    return true;
  };

  const handleDeleteRoommate = async (id: string) => {
    console.log('[App] Starting delete for ID:', id);
    console.log('[App] Currently selectedRoommate:', selectedRoommate?.id);
    
    // 1. Check if this is a user profile (is_listing = false) - should not be deleted
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { data: roommateData, error: fetchError } = await supabase.from('roommates').select('is_listing, user_id, name').eq('id', id).single();
      
      console.log('[Delete] Checking record:', { id, data: roommateData, error: fetchError });
      
      // Only block deletion if is_listing is explicitly FALSE (user profile)
      // Allow deletion if is_listing is TRUE or NULL (listings)
      if (roommateData && roommateData.is_listing === false) {
        toast('Không thể xóa hồ sơ cá nhân từ trang này. Hồ sơ cá nhân chỉ có thể chỉnh sửa, không thể xóa.', 'warning');
        return;
      }
      
      console.log('[Delete] Allowed to delete - is_listing:', roommateData?.is_listing);
    }
    
    // 2. Close modal if viewing this roommate - DO THIS FIRST!
    console.log('[App] Clearing selectedRoommate, current:', selectedRoommate?.id, 'deleting:', id);
    setSelectedRoommate(null);
    
    // 3. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => String(r.id) !== String(id));
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }
    // Update local state to immediately remove from UI
    setRoommates((prev) => prev.filter((r) => String(r.id) !== String(id)));

    // 4. Remove from Supabase state optimistically
    setSupabaseRoommates((prev) => prev.filter((r) => String(r.id) !== String(id)));

    // 5. Supabase Delete - delete the record
    if (import.meta.env.VITE_SUPABASE_URL) {
      // Chỉ xóa ảnh avatar của roommate listing NẾU nó khác với avatar của Profile hiện tại
      // và không phải là ảnh Preset có sẵn.
      const rmToDelete = supabaseRoommates.find(r => r.id === id) || JSON.parse(saved || "[]").find((r: any) => r.id === id);
      const AVATAR_PRESETS = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
      ];
      
      const currentProfile = currentUserProfile;
      
      if (rmToDelete && rmToDelete.avatar) {
        const isProfileAvatar = currentProfile?.avatar === rmToDelete.avatar;
        const isPreset = AVATAR_PRESETS.includes(rmToDelete.avatar);
        
        if (!isProfileAvatar && !isPreset) {
          await removePublicStorageUrls([rmToDelete.avatar], 'room-images').catch((error) =>
            console.warn("[Roommate image] Could not remove listing image:", error)
          );
        }
      }

      const { error } = await supabase.from('roommates').delete().eq('id', id);
      if (error) {
        console.error("[App] Error deleting roommate listing from Supabase:", error);
      } else {
        console.log('[App] Successfully deleted roommate listing:', id);
      }
    }
  };

  // Saved / Liked states
  const [likedRoommateIds, setLikedRoommateIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("roomiematch_liked_roommates");
    return saved ? JSON.parse(saved) : [];
  });
  const [roommateLikeCounts, setRoommateLikeCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("roomiematch_liked_roommates");
    const likedIds: string[] = saved ? JSON.parse(saved) : [];
    return likedIds.reduce<Record<string, number>>((counts, id) => {
      counts[id] = 1;
      return counts;
    }, {});
  });
  const [likedRoomIds, setLikedRoomIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("roomiematch_liked_rooms");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchRoommateLikes = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) return;

      const { data, error } = await supabase
        .from("roommate_likes")
        .select("roommate_id, user_id");
      
      if (error || !data) {
        if (error) console.error("[Likes] Could not load roommate likes:", error);
        return;
      }

      // Count all likes, excluding self-likes (where user likes their own profile)
      const counts: Record<string, number> = {};
      
      data.forEach((like: any) => {
        const target = allRoommatesRef.current.find((roommate) => roommate.id === like.roommate_id);
        
        // Skip if user is liking their own profile
        const isSelfLike = target && (
          target.postedBy === like.user_id || 
          target.user_id === like.user_id ||
          target.auth_id === like.user_id
        );
        
        if (!isSelfLike) {
          counts[like.roommate_id] = (counts[like.roommate_id] || 0) + 1;
        }
      });
      
      if (currentUser?.id) {
        const savedLikes: string[] = JSON.parse(
          localStorage.getItem("roomiematch_liked_roommates") || "[]"
        );
        const ownLikes = data
          .filter((like) => like.user_id === currentUser.id)
          .map((like) => like.roommate_id);
        const missingLikes = savedLikes.filter((id) => {
          if (ownLikes.includes(id)) return false;
          const target = allRoommatesRef.current.find((roommate) => roommate.id === id);
          return target && target.postedBy !== currentUser.id && target.user_id !== currentUser.id;
        });

        if (missingLikes.length > 0) {
          const { error: migrationError } = await supabase
            .from("roommate_likes")
            .upsert(
              missingLikes.map((roommateId) => ({
                roommate_id: roommateId,
                user_id: currentUser.id,
              })),
              { onConflict: "roommate_id,user_id" }
            );

          if (!migrationError) {
            missingLikes.forEach((id) => {
              counts[id] = (counts[id] || 0) + 1;
            });
          }
        }

        const syncedLikes = Array.from(new Set([...ownLikes, ...missingLikes]));
        setLikedRoommateIds(syncedLikes);
        localStorage.setItem("roomiematch_liked_roommates", JSON.stringify(syncedLikes));
      }

      setRoommateLikeCounts(counts);
    };

    fetchRoommateLikes();
    
    // Realtime subscription for roommate likes
    const likesChannel = supabase
      .channel('roommate_likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'roommate_likes'
        },
        () => fetchRoommateLikes()
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [currentUser?.id]);

  const handleLikeRoommate = async (id: string, isLiked: boolean) => {
    const isAuth = await requireAuth();
    if (!isAuth || !currentUser?.id) return false;

    const target = allRoommates.find((roommate) => roommate.id === id);
    if (target && (target.postedBy === currentUser.id || target.user_id === currentUser.id)) {
      return false;
    }

    setLikedRoommateIds((prev) => {
      const next = isLiked
        ? Array.from(new Set([...prev, id]))
        : prev.filter((x) => x !== id);
      localStorage.setItem("roomiematch_liked_roommates", JSON.stringify(next));
      return next;
    });

    setRoommateLikeCounts((previous) => ({
      ...previous,
      [id]: Math.max(0, (previous[id] || 0) + (isLiked ? 1 : -1)),
    }));

    if (import.meta.env.VITE_SUPABASE_URL) {
      const result = isLiked
        ? await supabase
            .from("roommate_likes")
            .upsert(
              { roommate_id: id, user_id: currentUser.id },
              { onConflict: "roommate_id,user_id" }
            )
        : await supabase
            .from("roommate_likes")
            .delete()
            .eq("roommate_id", id)
            .eq("user_id", currentUser.id);

      if (result.error) {
        console.warn("[Likes] Falling back to local likes:", result.error.message);
      }
    }
    return true;
  };

  const handleLikeRoom = (id: string, isLiked: boolean) => {
    if (!requireAuth()) return false;
    setLikedRoomIds((prev) => {
      const next = isLiked ? [...prev, id] : prev.filter((x) => x !== id);
      localStorage.setItem("roomiematch_liked_rooms", JSON.stringify(next));
      return next;
    });
    return true;
  };

  // Modal display states
  const [selectedRoommate, setSelectedRoommate] = useState<Roommate | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [roomUserHasSignedAgreement, setRoomUserHasSignedAgreement] = useState(false);
  const [hasChattedWithRoomHost, setHasChattedWithRoomHost] = useState(false);
  const [hasTwoWayMessagesWithSelected, setHasTwoWayMessagesWithSelected] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const requireAuth = async () => {
    let user = currentUser;
    if (!user) {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user;
      if (user) setCurrentUser(user);
    }

    if (!user) {
      setIsLoginModalOpen(true);
      return false;
    }
    if (!currentUserProfile) {
      setIsRequireProfileAlertOpen(true);
      return false;
    }
    return true;
  };

  // Sync selectedRoommate when roommates array updates (e.g. new reviews)
  useEffect(() => {
    if (selectedRoommate) {
      const updated = roommates.find(r => r.id === selectedRoommate.id);
      if (updated && JSON.stringify(updated.reviews) !== JSON.stringify(selectedRoommate.reviews)) {
        setSelectedRoommate(updated);
      }
    }
  }, [roommates, selectedRoommate]);

  useEffect(() => {
    if (!selectedRoom) return;
    const updated = allRooms.find((room) => room.id === selectedRoom.id);
    if (updated && JSON.stringify(updated.reviews) !== JSON.stringify(selectedRoom.reviews)) {
      setSelectedRoom(updated);
    }
  }, [allRooms, selectedRoom]);

  useEffect(() => {
    let relevantChatIds: string[] = [];

    const checkTwoWayMessages = async () => {
      const myId = currentUser?.id;
      if (!selectedRoommate || !myId) {
        setHasTwoWayMessagesWithSelected(false);
        return;
      }

      const partnerIds = [
        selectedRoommate.user_id,
        selectedRoommate.auth_id,
        selectedRoommate.postedBy,
        selectedRoommate.id,
      ].filter((id): id is string => !!id && id !== myId);

      relevantChatIds = [...new Set(partnerIds.map((partnerId) => [myId, partnerId].sort().join("_")))];
      if (relevantChatIds.length === 0) {
        setHasTwoWayMessagesWithSelected(false);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, text, image_url")
        .in("chat_id", relevantChatIds);

      if (error || !data) {
        setHasTwoWayMessagesWithSelected(false);
        return;
      }

      const userMessages = data.filter((message) => {
        const text = String(message.text || "").trim();
        return !!message.image_url || (text.length > 0 && !text.startsWith("["));
      });
      const hasMyMessage = userMessages.some((message) => message.sender_id === myId);
      const hasPartnerMessage = userMessages.some((message) => partnerIds.includes(message.sender_id));
      setHasTwoWayMessagesWithSelected(hasMyMessage && hasPartnerMessage);
    };

    checkTwoWayMessages();
    const channel = supabase
      .channel(`phone-unlock-${selectedRoommate?.id || "none"}-${currentUser?.id || "guest"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        if (relevantChatIds.includes(payload.new.chat_id)) {
          checkTwoWayMessages();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    selectedRoommate?.id,
    selectedRoommate?.user_id,
    selectedRoommate?.auth_id,
    selectedRoommate?.postedBy,
    currentUser?.id,
  ]);

  // Check if user has signed agreement with room host when room modal opens
  useEffect(() => {
    if (selectedRoom && currentUser) {
      checkHasSignedAgreement(selectedRoom.postedBy || selectedRoom.id).then(hasAgreement => {
        setRoomUserHasSignedAgreement(hasAgreement);
      });
    } else {
      setRoomUserHasSignedAgreement(false);
    }
  }, [selectedRoom?.id, currentUser?.id]);

  // Check if user has chatted with the room host (to allow reviews)
  useEffect(() => {
    if (!selectedRoom || !currentUser?.id) {
      setHasChattedWithRoomHost(false);
      return;
    }
    const hostId = selectedRoom.postedBy || (selectedRoom as any).user_id;
    if (!hostId || hostId === currentUser.id) {
      setHasChattedWithRoomHost(false);
      return;
    }
    const chatId = [currentUser.id, hostId].sort().join('_');
    supabase
      .from('messages')
      .select('sender_id')
      .eq('chat_id', chatId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Lấy danh sách những người đã gửi tin nhắn trong nhóm chat này
          const uniqueSenders = new Set(data.map(m => String(m.sender_id)));
          // Nếu có lớn hơn 1 người gửi (tức là cả 2 bên đã nhắn tin qua lại)
          setHasChattedWithRoomHost(uniqueSenders.size > 1);
        } else {
          setHasChattedWithRoomHost(false);
        }
      });
  }, [selectedRoom?.id, currentUser?.id]);

  // Browser History & Navigation Management
  const wasModalOpen = useRef(false);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      // Close all modals if we navigate back to a non-modal state
      if (!state?.modal) {
        setSelectedRoommate(null);
        setSelectedRoom(null);
        setIsPostModalOpen(false);
        setIsProfileModalOpen(false);
        setIsRequireProfileAlertOpen(false);
        setIsLoginModalOpen(false);
        wasModalOpen.current = false;
      }
      // Sync active tab with pathname
      const path = window.location.pathname.replace(/^\/+/, "");
      if (path && ["home", "roommates", "rooms", "chat", "agreement", "history", "info", "admin"].includes(path)) {
        setActiveTab(path);
      } else {
        setActiveTab("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update URL pathname when activeTab changes
  useEffect(() => {
    const currentPath = window.location.pathname.replace(/^\/+/, "");
    const targetPath = activeTab === "home" ? "" : activeTab;
    if (currentPath !== targetPath) {
      window.history.pushState({ tab: activeTab }, "", `/${targetPath}`);
    }
  }, [activeTab]);

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Push state when ANY modal opens
  useEffect(() => {
    const isAnyModalOpen = !!(selectedRoommate || selectedRoom || isPostModalOpen || isProfileModalOpen || isLoginModalOpen || isRequireProfileAlertOpen || isChangePasswordOpen);
    if (isAnyModalOpen && !wasModalOpen.current) {
      window.history.pushState({ modal: true, tab: activeTab }, "", window.location.pathname);
      wasModalOpen.current = true;
    } else if (!isAnyModalOpen && wasModalOpen.current) {
      wasModalOpen.current = false;
    }
  }, [selectedRoommate, selectedRoom, isPostModalOpen, isProfileModalOpen, isLoginModalOpen, isRequireProfileAlertOpen, isChangePasswordOpen, activeTab]);

  const handleCloseModal = () => {
    // If multiple modals are open, close the top-most one and return
    if (isRequireProfileAlertOpen) {
      setIsRequireProfileAlertOpen(false);
      return;
    }
    if (isLoginModalOpen) {
      setIsLoginModalOpen(false);
      return;
    }
    if (isProfileModalOpen) {
      setIsProfileModalOpen(false);
      return;
    }
    if (isChangePasswordOpen) {
      setIsChangePasswordOpen(false);
      return;
    }
    
    // If we reach here, it means we are closing the base modal (Roommate, Room, or Post)
    setSelectedRoommate(null);
    setSelectedRoom(null);
    setIsPostModalOpen(false);

    // Now pop the history state since all modals are closed
    if (window.history.state?.modal) {
      window.history.back();
    }
  };

  // Chat coordination
  const [activeChatRoommateId, setActiveChatRoommateId] = useState<string | null>(null);

  // States to hold Supabase fetched lists (moved to top to prevent ReferenceError)

  // Calculate matching scores dynamically if user profile changes
  const [supabaseReviews, setSupabaseReviews] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("roomiematch_cached_reviews") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const customOnes = saved ? JSON.parse(saved) : [];
    
    const legacyAiIds = ["r1", "r2", "r3", "r4", "r5", "khanh-vy", "minh-anh", "hoang-nam", "trang-le", "duc-tri", "ai_khanh_vy"];
    const aiNames = ["Minh Anh", "Hoàng Nam", "Trang Lê", "Đức Trí", "Khánh Vy"];
    
    // Filter out legacy AIs completely (by ID and by exact Name) to avoid UUID duplication from Supabase
    const cleanCustomOnes = customOnes.filter((r: Roommate) => !legacyAiIds.includes(r.id) && !aiNames.includes(r.name));
    const cleanSupabase = supabaseRoommates.filter((r: Roommate) => !legacyAiIds.includes(r.id) && !aiNames.includes(r.name));
    
    const allCandidatesRaw = [...cleanCustomOnes, ...cleanSupabase, ...INITIAL_ROOMMATES];
    const uniqueCandidatesMap = new Map();
    allCandidatesRaw.forEach(r => {
      // Overwrite existing to ensure INITIAL_ROOMMATES (at the end) wins
      uniqueCandidatesMap.set(r.id, r);
    });
    const allCandidates = Array.from(uniqueCandidatesMap.values());

    const ownerMapping: Record<string, string> = {};
    allCandidates.forEach(cand => {
      ownerMapping[cand.id] = cand.user_id || cand.auth_id || cand.postedBy || cand.id;
    });

    const updated = allCandidates.map((r) => {
      const rOwner = ownerMapping[r.id];
      const dbReviews = supabaseReviews
        .filter(rev => {
          const targetId = rev.roommate_id || rev.roommateId;
          const targetOwner = ownerMapping[targetId] || targetId;
          return targetOwner === rOwner;
        })
        .map(rev => ({
          id: rev.id,
          reviewerId: rev.reviewer_id,
          reviewerName: rev.reviewer_name || rev.reviewerName,
          reviewerAvatar: rev.reviewer_avatar || rev.reviewerAvatar,
          rating: Number(rev.rating),
          comment: rev.comment,
          imageUrl: rev.image_url || rev.imageUrl,
          createdAt: rev.created_at ? new Date(rev.created_at).toLocaleDateString("vi-VN") : rev.createdAt,
        }));
      const localReviews = (r.reviews || []).filter((rev: any) => rev.reviewerName);
      const seenReviewers = new Set<string>();
      const mergedReviews = [...dbReviews, ...localReviews].filter((review) => {
        const reviewerKey = review.reviewerId
          ? `id:${review.reviewerId}`
          : `name:${String(review.reviewerName || "").trim().toLowerCase()}`;
        if (seenReviewers.has(reviewerKey)) return false;
        seenReviewers.add(reviewerKey);
        return true;
      });
      const isOwner = !!currentUserProfile && (
        (currentUser && r.postedBy === currentUser.id) ||
        r.name === currentUserProfile.name
      );

      return {
        ...r,
        budget: r.budget || 0,
        matchScore: 0,
        reviews: mergedReviews,
        avatar: isOwner && !r.is_listing ? currentUserProfile.avatar : r.avatar,
        name: isOwner && !r.is_listing ? currentUserProfile.name : r.name,
        postedBy: isOwner && currentUser ? currentUser.id : r.postedBy,
      };
    }).filter((r) => {
      const ownerId = r.user_id || r.auth_id || r.postedBy || r.id;
      const isOwner = currentUser?.id && ownerId === currentUser.id;
      const isBanned = supabaseBannedIds.includes(String(ownerId)) || r.is_locked === true || r.is_locked === 'true';
      return !isBanned || isOwner;
    });
    setRoommates(updated);
  }, [currentUserProfile, supabaseReviews, currentUser, supabaseRoommates, supabaseBannedIds]);

  const handleSaveProfile = async (profile: any) => {
    // Kiểm tra trực tiếp từ Database
    if (currentUser?.id) {
      const { data: dbCheck } = await supabase.from('profiles').select('locked_until').eq('auth_id', currentUser.id).maybeSingle();
      if (dbCheck?.locked_until && new Date(dbCheck.locked_until).getTime() > Date.now()) {
        toast("Tài khoản của bạn đã bị vô hiệu hóa vì nghi ngờ vi phạm", "error", 5000);
        return;
      }
    }
    
    setCurrentUserProfile(profile);
    localStorage.setItem("roomiematch_user_profile", JSON.stringify(profile));
    
    // Save to a persistent map by user ID as a fallback
    if (currentUser?.id) {
       try {
         const mapStr = localStorage.getItem("roomiematch_profiles_map") || "{}";
         const map = JSON.parse(mapStr);
         map[currentUser.id] = profile;
         localStorage.setItem("roomiematch_profiles_map", JSON.stringify(map));
       } catch(e) {}

       // Also sync to Supabase so avatar + changes persist on reload
       if (import.meta.env.VITE_SUPABASE_URL) {
         try {
           const validRoommateKeys = ['id', 'name', 'age', 'role', 'phoneNumber', 'email', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt', 'rejectReason'];
           const upsertData: any = {};
           for (const key of validRoommateKeys) {
             if (profile[key as keyof Roommate] !== undefined) {
               upsertData[key] = profile[key as keyof Roommate];
             }
           }
           upsertData.user_id = currentUser.id;
           upsertData.postedBy = currentUser.id;
           upsertData.is_listing = false;
           if (currentUser.email && !upsertData.email) {
             upsertData.email = currentUser.email;
           }
           // Fallback to current user ID if profile id is missing or 'me'
           if (!upsertData.id || upsertData.id === 'me') {
               upsertData.id = currentUser.id;
           }

           await supabase.from('roommates').upsert(upsertData);
           console.log('[Profile] Synced profile update to Supabase');
         } catch(e) {
           console.error('[Profile] Failed to sync profile to Supabase:', e);
         }
       }
    }
  };


  const handleLoginSuccess = async (user: any) => {
    if (window.history.state?.modal) { window.history.back(); } else { setIsLoginModalOpen(false); }
    
    let hasProfile = false;
    if (user && user.id) {
      // 0. Check if user is banned or locked
      try {
        const { data: profileData } = await supabase.from('profiles').select('is_locked').eq('auth_id', user.id).maybeSingle();
        const { data: roommateData } = await supabase.from('roommates').select('is_locked').eq('user_id', user.id).eq('is_listing', false).maybeSingle();
        const { data: banMsgs } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
        
        const isProfileLocked = profileData?.is_locked === true || profileData?.is_locked === 'true';
        const isRoommateLocked = roommateData?.is_locked === true || roommateData?.is_locked === 'true';
        const isLegacyBanned = banMsgs && banMsgs.some((m: any) => m.text.includes(user.id));

        if (isProfileLocked || isRoommateLocked || isLegacyBanned) {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setCurrentUserProfile(null);
          localStorage.removeItem("roomiematch_user_profile");
          toast("Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.", "error", 6000);
          return;
        }
      } catch(e) {}

      // 1. Try Supabase by user_id column
      try {
        const { data: byUserId } = await supabase.from('roommates').select('*').eq('user_id', user.id).eq('is_listing', false).maybeSingle();
        if (byUserId) {
          hasProfile = true;
          setCurrentUserProfile(byUserId);
          localStorage.setItem("roomiematch_user_profile", JSON.stringify(byUserId));
        }
      } catch(e) {}

      // 2. Try Supabase by postedBy column (legacy)
      if (!hasProfile) {
        try {
          const { data: byPostedBy } = await supabase.from('roommates').select('*').eq('postedBy', user.id).eq('is_listing', false).maybeSingle();
          if (byPostedBy) {
            hasProfile = true;
            setCurrentUserProfile(byPostedBy);
            localStorage.setItem("roomiematch_user_profile", JSON.stringify(byPostedBy));
            // Migrate: update user_id in Supabase if possible
            await supabase.from('roommates').update({ user_id: user.id }).eq('id', byPostedBy.id).then(() => {});
          }
        } catch(e) {}
      }

      // 3. Try Local Fallback (profiles_map keyed by auth UUID)
      if (!hasProfile) {
        try {
          const mapStr = localStorage.getItem("roomiematch_profiles_map") || "{}";
          const map = JSON.parse(mapStr);
          if (map[user.id]) {
            hasProfile = true;
            setCurrentUserProfile(map[user.id]);
            localStorage.setItem("roomiematch_user_profile", JSON.stringify(map[user.id]));
            // Migrate: save user_id to Supabase for this profile
            await supabase.from('roommates').update({ user_id: user.id }).eq('id', map[user.id].id).then(() => {});
          }
        } catch(e) {}
      }

      // 4. Try cached profile from localStorage (roomiematch_user_profile)
      if (!hasProfile) {
        try {
          const cachedProfileStr = localStorage.getItem("roomiematch_user_profile");
          if (cachedProfileStr) {
            const cachedProfile = JSON.parse(cachedProfileStr);
            hasProfile = true;
            setCurrentUserProfile(cachedProfile);
            // Migrate: save user_id to Supabase for this profile
            await supabase.from('roommates').update({ user_id: user.id }).eq('id', cachedProfile.id).then(() => {});
          }
        } catch(e) {}
      }
    }

    if (!hasProfile && !currentUserProfile) {
      setTimeout(() => setIsProfileModalOpen(true), 100);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentUserProfile(null);
    localStorage.removeItem("roomiematch_user_profile");
    setActiveTab("home");
  };

  const startChatConversation = async (roommateId: string) => {
    const isAuth = await requireAuth();
    if (!isAuth) return;
    if (window.history.state?.modal) { window.history.back(); } else { setSelectedRoommate(null); setSelectedRoom(null); }
    
    // CRITICAL FIX: Tra DB lấy user_id (Auth UUID) của partner để chat_id luôn đồng bộ
    // Nếu roommateId là listing ID (rm-...), phải tìm user_id từ listing record
    let effectivePartnerId = roommateId;
    if (import.meta.env.VITE_SUPABASE_URL) {
      console.log('[App] Finding user_id for roommateId:', roommateId);
      
      // Query để lấy user_id (works cho cả profile và listing)
      const { data, error } = await supabase
        .from('roommates')
        .select('user_id, id, name, is_listing')
        .eq('id', roommateId)
        .maybeSingle();
      
      console.log('[App] Query result:', { data, error });
      
      if (data?.user_id) {
        effectivePartnerId = data.user_id; // Dùng Auth UUID của partner
        console.log('[App] Using user_id:', effectivePartnerId, 'for', data.name);
      } else {
        console.warn('[App] No user_id found for roommateId:', roommateId, '- using roommateId as fallback');
      }
    }
    
    setActiveChatRoommateId(effectivePartnerId);
    setTimeout(() => setActiveTab("chat"), 50);
  };




  const [pendingAgreementPayload, setPendingAgreementPayload] = useState<any>(null);

  const handleExtendPost = async (type: 'room' | 'roommate', id: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from(type === 'room' ? 'rooms' : 'roommates')
        .update({ created_at: now })
        .eq('id', id);
      
      // Bỏ qua lỗi nếu là bài đăng ở local (ví dụ Profile chưa đồng bộ lên Supabase)
      if (error && !String(error.message).includes('uuid')) {
         console.warn('Supabase update failed, might be local data:', error);
      }
      
      // Nếu là gia hạn Profile của chính mình, cập nhật luôn vào Local Storage để UI phản hồi ngay
      if (type === 'roommate' && currentUserProfile && (id === currentUserProfile.id || id === currentUser?.id)) {
        const updatedProfile = { ...currentUserProfile, created_at: now, createdAt: now };
        setCurrentUserProfile(updatedProfile);
        localStorage.setItem("roomiematch_user_profile", JSON.stringify(updatedProfile));
      }

      toast('Đã gia hạn bài đăng thành công! Bài của bạn đã được đẩy lên đầu.', 'success');
      
      if (type === 'room') {
        const { data } = await supabase.from('rooms').select('*').order('created_at', { ascending: false });
        if (data) setSupabaseRooms(data);
      } else {
        const { data } = await supabase.from('roommates').select('*').order('created_at', { ascending: false });
        if (data) setSupabaseRoommates(data);
      }
    } catch (err) {
      console.error('Error extending post:', err);
      toast('Có lỗi xảy ra khi gia hạn bài đăng.', 'error');
    }
  };

  const startAgreementForm = async (roommateId: string, payload?: any) => {
    const isAuth = await requireAuth();
    if (!isAuth) return;
    if (window.history.state?.modal) { window.history.back(); } else { setSelectedRoommate(null); setSelectedRoom(null); }
    setActiveChatRoommateId(roommateId);
    if (payload) {
      setPendingAgreementPayload(payload);
    } else {
      setPendingAgreementPayload(null);
    }
    setTimeout(() => setActiveTab("agreement"), 50);
  };

  const handleRoomInquiry = async (hostName: string) => {
    const isAuth = await requireAuth();
    if (!isAuth) return;
    if (window.history.state?.modal) { window.history.back(); } else { setSelectedRoommate(null); setSelectedRoom(null); }
    
    // Find matching roommate profile, or fallback to first roommate
    const matchedRoommate = roommates.find((r) => r.name === hostName) || roommates[0];
    setActiveChatRoommateId(matchedRoommate.id);
    setTimeout(() => setActiveTab("chat"), 50);
  };

  const handleAddReview = async (roommateId: string, review: { rating: number; comment: string; imageUrl?: string }) => {
    const isAuth = await requireAuth();
    if (!isAuth) return false;

    const reviewerName =
      currentUserProfile?.name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "Thành viên RoomieMatch";
    const reviewerAvatar =
      currentUserProfile?.avatar ||
      currentUser?.user_metadata?.avatar_url ||
      null;

    const alreadyReviewed = supabaseReviews.some((existingReview) => {
      if ((existingReview.roommate_id || existingReview.roommateId) !== roommateId) return false;
      if (currentUser?.id && existingReview.reviewer_id === currentUser.id) return true;
      return !existingReview.reviewer_id &&
        String(existingReview.reviewer_name || existingReview.reviewerName || "").trim().toLowerCase() === reviewerName.trim().toLowerCase();
    });
    if (alreadyReviewed) return false;

    const newDbReview = {
      roommate_id: roommateId,
      reviewer_name: reviewerName,
      reviewer_avatar: reviewerAvatar,
      rating: review.rating,
      comment: review.comment,
      image_url: review.imageUrl || null,
    };

    // Prefer account-linked reviews when the migration has been applied.
    let { data, error } = await supabase
      .from('reviews')
      .insert([{ ...newDbReview, reviewer_id: currentUser?.id }])
      .select();

    // Keep compatibility with databases that have not run add_review_identity.sql yet.
    if (error && /reviewer_id/i.test(`${error.message} ${error.details || ""}`)) {
      const legacyResult = await supabase.from('reviews').insert([newDbReview]).select();
      data = legacyResult.data;
      error = legacyResult.error;

      if (!error && data?.[0]?.id && currentUser?.id) {
        await supabase.from('messages').insert({
          chat_id: 'SYSTEM_REVIEW_IDENTITIES',
          sender_id: currentUser.id,
          text: `[REVIEW_IDENTITY]${JSON.stringify({
            review_id: data[0].id,
            reviewer_id: currentUser.id,
          })}`,
        });
      }
    }
    
    if (!error && data && data.length > 0) {
      // 2. Update local supabaseReviews state so it triggers the useEffect to recalculate roommates
      setSupabaseReviews(prev => [data[0], ...prev]);
    } else {
      console.error("Failed to insert review to Supabase", error);
      return false;
    }
    return true;
  };

  const handleUpdateReview = async (
    reviewId: string,
    review: { rating: number; comment: string; imageUrl?: string }
  ) => {
    if (!currentUser) return false;

    const existingReview = supabaseReviews.find((item) => item.id === reviewId);
    const isOwner =
      existingReview?.reviewer_id === currentUser.id ||
      (!existingReview?.reviewer_id &&
        String(existingReview?.reviewer_name || "").trim().toLowerCase() ===
          String(currentUserProfile?.name || "").trim().toLowerCase());
    if (!existingReview || !isOwner) return false;

    const duplicateReviewIds = supabaseReviews
      .filter((item) => {
        if (item.id === reviewId) return false;
        if ((item.roommate_id || item.roommateId) !== (existingReview.roommate_id || existingReview.roommateId)) return false;
        return item.reviewer_id === currentUser.id ||
          (!item.reviewer_id &&
            String(item.reviewer_name || "").trim().toLowerCase() ===
              String(currentUserProfile?.name || "").trim().toLowerCase());
      })
      .map((item) => item.id);

    const updates = {
      rating: review.rating,
      comment: review.comment,
      image_url: review.imageUrl || null,
    };
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();
    if (error || !data) return false;

    if (duplicateReviewIds.length > 0) {
      await supabase.from("reviews").delete().in("id", duplicateReviewIds);
    }

    setSupabaseReviews((previous) =>
      previous
        .filter((item) => !duplicateReviewIds.includes(item.id))
        .map((item) => (item.id === reviewId ? data : item))
    );
    setSelectedRoommate((previous) =>
      previous
        ? {
            ...previous,
            reviews: (previous.reviews || [])
              .filter((item) => !duplicateReviewIds.includes(item.id))
              .map((item) =>
                item.id === reviewId
                  ? {
                      ...item,
                      rating: review.rating,
                      comment: review.comment,
                      imageUrl: review.imageUrl,
                    }
                  : item
              ),
          }
        : previous
    );
    return true;
  };

  const handleDeleteOwnReview = async (reviewId: string) => {
    if (!currentUser) return false;

    const existingReview = supabaseReviews.find((item) => item.id === reviewId);
    const isOwner =
      existingReview?.reviewer_id === currentUser.id ||
      (!existingReview?.reviewer_id &&
        String(existingReview?.reviewer_name || "").trim().toLowerCase() ===
          String(currentUserProfile?.name || "").trim().toLowerCase());
    if (!existingReview || !isOwner) return false;

    const ownReviewIds = supabaseReviews
      .filter((item) => {
        if ((item.roommate_id || item.roommateId) !== (existingReview.roommate_id || existingReview.roommateId)) return false;
        return item.reviewer_id === currentUser.id ||
          (!item.reviewer_id &&
            String(item.reviewer_name || "").trim().toLowerCase() ===
              String(currentUserProfile?.name || "").trim().toLowerCase());
      })
      .map((item) => item.id);

    const { error } = await supabase.from("reviews").delete().in("id", ownReviewIds);
    if (error) return false;

    setSupabaseReviews((previous) => previous.filter((item) => !ownReviewIds.includes(item.id)));
    setSelectedRoommate((previous) =>
      previous
        ? {
            ...previous,
            reviews: (previous.reviews || []).filter((item) => !ownReviewIds.includes(item.id)),
          }
        : previous
    );
    return true;
  };

  const handleReportReview = async (reviewId: string, roommateId: string) => {
    const isAuth = await requireAuth();
    if (!isAuth || !currentUser) return false;

    const reviewToReport = supabaseReviews.find((review) => review.id === reviewId);
    const isOwnReview =
      reviewToReport?.reviewer_id === currentUser.id ||
      (!reviewToReport?.reviewer_id &&
        String(reviewToReport?.reviewer_name || reviewToReport?.reviewerName || "").trim().toLowerCase() ===
          String(currentUserProfile?.name || "").trim().toLowerCase());
    if (isOwnReview) return false;

    const report = {
      review_id: reviewId,
      roommate_id: roommateId,
      reporter_id: currentUser.id,
      reason: "Nội dung phản cảm hoặc không phù hợp",
      status: "pending",
    };

    const reportChannel = getModerationChannel(REVIEW_REPORT_PREFIX, currentUser.id);
    const { data: existingReports } = await supabase
      .from("messages")
      .select("text")
      .eq("chat_id", reportChannel)
      .eq("sender_id", currentUser.id);
    const alreadyReported = (existingReports || []).some((message) => {
      try {
        return JSON.parse(message.text.replace("[REVIEW_REPORT]", "").trim()).review_id === reviewId;
      } catch {
        return false;
      }
    });
    if (alreadyReported) return true;

    const { error } = await supabase.from("messages").insert({
      chat_id: reportChannel,
      sender_id: currentUser.id,
      text: `[REVIEW_REPORT]${JSON.stringify(report)}`,
    });
    return !error;
  };

  const handleAdminReviewDeleted = (reviewId: string) => {
    setSupabaseReviews((previous) => previous.filter((review) => review.id !== reviewId));
    setRoommates((previous) =>
      previous.map((roommate) => ({
        ...roommate,
        reviews: (roommate.reviews || []).filter((review) => review.id !== reviewId),
      }))
    );
  };

  // Check if currentUser has signed an agreement with the room host
  const checkHasSignedAgreement = async (roomHostId: string) => {
    if (!currentUser || !roomHostId) return false;
    
    try {
      const myAuthId = currentUser.id;
      
      // Query messages table for signed agreements between current user and room host
      const { data } = await supabase
        .from('messages')
        .select('text')
        .like('chat_id', `%${myAuthId}%`)
        .like('text', '%[AGREEMENT_SIGNED]%');
      
      if (!data || data.length === 0) return false;
      
      // Parse agreements and check if any are signed with the room host
      for (const msg of data) {
        try {
          const payload = JSON.parse(msg.text.replace('[AGREEMENT_SIGNED]', '').trim());
          if (payload.status === 'signed') {
            return true; // Found at least one signed agreement
          }
        } catch(e) {
          // Skip parsing errors
        }
      }
      
      return false;
    } catch (error) {
      console.error('[App] Error checking signed agreements:', error);
      return false;
    }
  };

  const handleAddRoomReview = async (roomId: string, review: { reviewerName: string; rating: number; comment: string; images: string[] }) => {
    const isAuth = await requireAuth();
    if (!isAuth || !currentUser) return false;

    const reviewerName =
      currentUserProfile?.name ||
      currentUser?.name ||
      currentUser?.email?.split("@")[0] ||
      "Thành viên RoomieMatch";
    const reviewerAvatar =
      currentUserProfile?.avatar ||
      currentUser?.avatar ||
      null;
    const existingReview = supabaseRoomReviews.find(
      (item) =>
        (item.room_id || item.roomId) === roomId &&
        (item.reviewer_id || item.reviewerId) === currentUser.id
    );
    const databaseReview = {
      id: existingReview?.id || `room-review-${crypto.randomUUID()}`,
      room_id: roomId,
      reviewer_id: currentUser.id,
      reviewer_name: reviewerName,
      reviewer_avatar: reviewerAvatar,
      rating: review.rating,
      comment: review.comment.trim(),
      images: review.images,
    };
    const { data, error } = await supabase
      .from("room_reviews")
      .upsert(databaseReview, { onConflict: "room_id,reviewer_id" })
      .select()
      .single();

    if (error || !data) {
      console.error("[Room reviews] Save failed:", error);
      toast(
        error?.code === "42P01"
          ? "Chưa có bảng đánh giá phòng. Hãy chạy file enable_room_reviews.sql trên Supabase."
          : "Không thể lưu đánh giá phòng. Vui lòng thử lại.",
        "error"
      );
      return false;
    }

    setSupabaseRoomReviews((previous) => [
      data,
      ...previous.filter((item) => item.id !== data.id && !(
        (item.room_id || item.roomId) === roomId &&
        (item.reviewer_id || item.reviewerId) === currentUser.id
      )),
    ]);
    toast(existingReview ? "Đã cập nhật đánh giá phòng." : "Đã gửi đánh giá phòng.", "success");
    return true;
  };

  useEffect(() => {
    const currentAccountIds = [
      currentUser?.id,
      currentUserProfile?.id,
      currentUserProfile?.user_id,
      currentUserProfile?.auth_id,
    ].filter(Boolean);
    setIsBanned(
      currentAccountIds.some((id) => supabaseBannedIds.includes(String(id)))
    );
  }, [currentUser?.id, currentUserProfile, supabaseBannedIds]);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-rose-200/20 blur-[120px] animate-pulse" />
          <div className="absolute top-[10%] right-[-10%] w-[50%] h-[70%] rounded-full bg-sky-300/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="text-center relative z-10">
          {/* Logo */}
          <div className="mb-8 animate-bounce">
            <div className="inline-flex items-center gap-2 bg-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] rounded-full shadow-lg"></div>
                <div className="w-8 h-8 bg-gradient-to-br from-[#4dabf7] to-[#339af0] rounded-full shadow-lg -ml-3"></div>
              </div>
              <h1 className="text-2xl font-black">
                <span className="text-slate-800">Roomie</span>
                <span className="text-[#ff6b6b]">Match</span>
              </h1>
            </div>
          </div>
          
          {/* Loading spinner */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-sky-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-sky-600 rounded-full animate-spin"></div>
          </div>
          
          {/* Loading text */}
          <p className="text-slate-600 font-semibold animate-pulse">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl max-w-md text-center shadow-xl border border-rose-100">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <span className="text-4xl">⛔</span>
          </div>
          <h2 className="text-2xl font-black text-rose-600 mb-3">Tài khoản đã bị khóa</h2>
          <p className="text-slate-600">
            Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng của RoomieMatch. 
            Bạn không thể tiếp tục sử dụng dịch vụ. Nếu có thắc mắc, vui lòng liên hệ admin@roomiematch.com.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] relative overflow-x-hidden flex flex-col justify-between">
      {/* Global Abstract Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-[1000px] pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-rose-200/30 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[70%] rounded-full bg-sky-300/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[40%] h-[60%] rounded-full bg-indigo-200/20 blur-[120px]" />
      </div>

      {/* 1. Sticky Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateProfile={() => setIsProfileModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        currentUserProfile={currentUserProfile}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
        hasPendingAgreement={hasPendingAgreement}
      />

      {/* 2. Primary Tab Contents Display Body */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex-grow">
        {activeTab === "home" && (
          <HomeView
            roommates={allRoommates}
            rooms={allRooms}
            likedRoommateIds={likedRoommateIds}
            roommateLikeCounts={roommateLikeCounts}
            likedRoomIds={likedRoomIds}
            onLikeRoommate={handleLikeRoommate}
            onLikeRoom={handleLikeRoom}
            onViewRoommate={setSelectedRoommate}
            onViewRoom={setSelectedRoom}
            onNavigateToTab={(tabId, filters) => {
              if (filters) setGlobalSearchFilters(filters);
              setActiveTab(tabId);
            }}
            onStartChat={startChatConversation}
            currentUserProfile={currentUserProfile}
            onRequireAuth={requireAuth}
            onOpenCreateProfile={() => setIsProfileModalOpen(true)}
            isAdmin={isAdmin}
            hideInactiveRoommates={hideInactiveRoommates}
          />
        )}

        {activeTab === "roommates" && (
          <RoommatesView
            roommates={allRoommates}
            isLoading={isRoommatesLoading}
            likedRoommateIds={likedRoommateIds}
            onLikeRoommate={handleLikeRoommate}
            onViewRoommate={setSelectedRoommate}
            currentUserProfile={currentUserProfile}
            onStartChat={startChatConversation}
            onOpenPostModal={isAdmin ? undefined : () => handleOpenPostModal("roommate")}
            onRequireAuth={requireAuth}
            onDeleteRoommate={handleDeleteRoommate}
            onEditRoommate={handleEditRoommate}
            currentUserId={currentUser?.id}
            initialFilters={globalSearchFilters}
            isAdmin={isAdmin}
            onClearSelectedRoommate={() => setSelectedRoommate(null)}
            hideFoundRoom={hideInactiveRoommates}
            setHideFoundRoom={setHideInactiveRoommates}
          />
        )}

        {activeTab === "rooms" && (
          <RoomsView
            rooms={allRooms}
            likedRoomIds={likedRoomIds}
            onLikeRoom={handleLikeRoom}
            onViewRoom={setSelectedRoom}
            onOpenPostModal={isAdmin ? undefined : () => handleOpenPostModal("room")}
            currentUserProfile={currentUserProfile}
            onRequireAuth={requireAuth}
            onDeleteRoom={handleDeleteRoom}
            onEditRoom={handleEditRoom}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
            isLoading={isRoomsLoading}
          />
        )}

        {activeTab === "chat" && (
          <ChatView
            roommates={allRoommates}
            initialChats={SUGGGESTED_CHATS}
            activeRoommateId={activeChatRoommateId}
            setActiveRoommateId={setActiveChatRoommateId}
            currentUserProfile={currentUserProfile}
            currentUser={currentUser}
            bannedUserIds={supabaseBannedIds}
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
            onNavigateToTab={setActiveTab}
            onStartAgreement={startAgreementForm}
            onViewProfile={(roommate) => {
              console.log('[App] View profile clicked for:', roommate.id, roommate.name);
              setSelectedRoommate(roommate);
            }}
          />
        )}

        {activeTab === "agreement" && (
          <AgreementView
            roommates={allRoommates}
            currentUserProfile={currentUserProfile}
            currentUser={currentUser}
            preSelectedRoommateId={activeChatRoommateId}
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
            pendingAgreementPayload={pendingAgreementPayload}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            currentUserProfile={currentUserProfile}
            currentUser={currentUser}
            roommates={allRoommates}
            rooms={allRooms}
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
            onExtendPost={handleExtendPost}
          />
        )}

        {activeTab === "info" && (
          <InfoView />
        )}

        {activeTab === "admin" && (
          isAdmin ? (
            <AdminDashboard 
              currentUser={currentUser}
              roommates={allRoommates}
              rooms={allRooms}
              onDeleteRoommate={handleDeleteRoommate}
              onDeleteRoom={handleDeleteRoom}
              onReviewDeleted={handleAdminReviewDeleted}
              onViewRoommate={setSelectedRoommate}
              onViewRoom={setSelectedRoom}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh] animate-fade-in">
              <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 max-w-md text-center">
                <h3 className="text-2xl font-black text-rose-600 mb-3 tracking-tight">Từ chối truy cập</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Bạn không có quyền quản trị viên để truy cập trang này.</p>
                <button onClick={() => setActiveTab("home")} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all duration-200">
                  Về Trang Chủ
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* 3. Footer Bar Section */}
      <Footer onNavigateToTab={setActiveTab} />

      {/* Modals Popup Layers */}
      {selectedRoommate && (
        <RoommateModal
          roommate={selectedRoommate}
          onClose={() => {
            handleCloseModal();
            if (previousRoom) {
              setSelectedRoom(previousRoom);
              setPreviousRoom(null);
            }
          }}
          onStartChat={startChatConversation}
          onStartAgreement={startAgreementForm}
          onAddReview={handleAddReview}
          onUpdateReview={handleUpdateReview}
          onDeleteReview={handleDeleteOwnReview}
          onReportReview={handleReportReview}
          currentReviewerId={currentUser?.id}
          currentReviewerName={
            currentUserProfile?.name ||
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split("@")[0]
          }
          currentReviewerAvatar={
            currentUserProfile?.avatar ||
            currentUser?.user_metadata?.avatar_url
          }
          isOwnProfile={!!currentUser && (selectedRoommate.postedBy === currentUser.id || (selectedRoommate as any).user_id === currentUser.id)}
          hasTwoWayMessages={hasTwoWayMessagesWithSelected}
          hasChatWithRoommate={hasTwoWayMessagesWithSelected}
          onDeleteProfile={(id) => {
            handleDeleteRoommate(id);
            if (currentUserProfile && currentUserProfile.id === id) {
              setCurrentUserProfile(null);
              localStorage.removeItem("roomiematch_user_profile");
            }
            setSelectedRoommate(null);
            toast('✅ Đã xóa hồ sơ thành công!', 'success');
          }}
          isAdmin={isAdmin}
          onReportProfile={(rm) => {
            if (!currentUser) {
              setIsLoginModalOpen(true);
              return;
            }
            setReportingProfileFromModal(rm);
          }}
        />
      )}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          roommates={allRoommates}
          onClose={handleCloseModal}
          onInquire={handleRoomInquiry}
          onAddReview={handleAddRoomReview}
          currentUserId={currentUser?.id}
          currentUserProfile={currentUserProfile}
          isOwnProfile={!!currentUser && (selectedRoom.postedBy === currentUser.id || (selectedRoom as any).user_id === currentUser.id)}
          hasSignedAgreement={roomUserHasSignedAgreement}
          onDeleteRoom={async (id) => {
            const deleted = await handleDeleteRoom(id);
            if (!deleted) return false;
            setSelectedRoom(null);
            toast('Đã xóa tin đăng thành công!', 'success');
            return true;
          }}
          onEditRoom={handleEditRoom}
          isAdmin={isAdmin}
          onViewHostProfile={(roommate) => {
            console.log('[App] View host profile from RoomModal:', roommate);
            setPreviousRoom(selectedRoom);
            setSelectedRoom(null);
            setSelectedRoommate(roommate);
          }}
        />
      )}

      {isPostModalOpen && (
        <PostListingModal
          isOpen={isPostModalOpen}
          onClose={() => {
            setIsPostModalOpen(false);
            setEditingListingData(null);
          }}
          initialTab={postModalInitialTab}
          onSubmitRoommate={handleAddRoommate}
          onSubmitRoom={handleAddRoom}
          currentProfile={currentUserProfile}
          editingData={editingListingData}
          onSuccess={(tab) => {
            if (tab === 'room') setActiveTab('rooms');
            if (tab === 'roommate') setActiveTab('roommates');
          }}
        />
      )}

      {isProfileModalOpen && (
        <CreateProfileModal
          onClose={handleCloseModal}
          onSave={handleSaveProfile}
          currentProfile={currentUserProfile}
          currentUser={currentUser}
        />
      )}

      {isRequireProfileAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsRequireProfileAlertOpen(false)}></div>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 bg-sky-100 text-[#006590] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="text-xl font-extrabold text-[#004e70] mb-2">Cập nhật Hồ sơ</h3>
            <p className="text-slate-500 mb-6 text-[15px]">
              Bạn cần cập nhật hồ sơ cá nhân trước khi sử dụng chức năng này.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsRequireProfileAlertOpen(false)}
                className="flex-1 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setIsRequireProfileAlertOpen(false);
                  setTimeout(() => setIsProfileModalOpen(true), 150);
                }}
                className="flex-1 bg-[#004e70] hover:bg-[#003852] text-white py-3 rounded-2xl font-bold transition-colors shadow-md"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={handleCloseModal}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}

      {reportingProfileFromModal && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingProfileFromModal(null)}
          onSubmit={async (reason) => {
            if (!currentUser?.id) return;
            const targetId = reportingProfileFromModal.user_id || reportingProfileFromModal.postedBy || reportingProfileFromModal.id;
            
            // Check if already reported
            const { data: existingReports } = await supabase
              .from('user_reports')
              .select('id')
              .eq('reporter_id', currentUser.id)
              .eq('reported_id', targetId);

            if (existingReports && existingReports.length > 0) {
              toast("Bạn đã báo cáo người dùng này rồi.", "warning");
              setReportingProfileFromModal(null);
              return;
            }

            const payload = {
              target_id: targetId,
              reason: reason,
              source: 'roommate_profile_modal',
              roommate_id: reportingProfileFromModal.id,
              roommate_name: reportingProfileFromModal.name
            };

            // Write to messages for legacy Admin view
            const reportChannel = getModerationChannel(CHAT_REPORT_PREFIX, currentUser.id);
            await supabase.from('messages').insert({
              chat_id: reportChannel,
              sender_id: currentUser.id,
              text: `[REPORT] ${JSON.stringify(payload)}`
            });

            // Write to new user_reports table
            const { error } = await supabase.from('user_reports').insert({
              reporter_id: currentUser.id,
              reported_id: targetId,
              reason: reason
            });

            if (error) {
              toast("Không thể gửi báo cáo, vui lòng thử lại sau.", "error");
            } else {
              toast("Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xem xét.", "success");
            }
            setReportingProfileFromModal(null);
          }}
          targetName={reportingProfileFromModal.name}
        />
      )}

    </div>
  );
}
