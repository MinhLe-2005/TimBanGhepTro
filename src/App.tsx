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
import { getModerationChannel, isSystemChannel, REVIEW_REPORT_PREFIX } from "./lib/moderation";
import { useDialog } from "./components/ui/DialogProvider";

import RoommateModal from "./components/RoommateModal";
import RoomModal from "./components/RoomModal";
import CreateProfileModal from "./components/CreateProfileModal";
import LoginModal from "./components/LoginModal";
import PostListingModal from "./components/PostListingModal";

type ListingKind = "room" | "roommate";
type ListingAction = "create" | "update";

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
  const [authLoading, setAuthLoading] = useState(true); // Add loading state
  const [isBanned, setIsBanned] = useState(false);
  const [supabaseBannedIds, setSupabaseBannedIds] = useState<string[]>([]);

  useEffect(() => {
    // Failsafe timeout to prevent infinite loading
    const authTimeout = setTimeout(() => setAuthLoading(false), 5000);

    const checkBanStatus = (userId: string) => {
      supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS')
        .then(({ data: banMsgs }) => {
          if (banMsgs && banMsgs.some((m: any) => m.text.includes(userId))) {
            supabase.auth.signOut().then(() => {
              setCurrentUser(null);
              setCurrentUserProfile(null);
              localStorage.removeItem("roomiematch_user_profile");
              toast('Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.', 'error', 8000);
            });
          }
        })
        .catch(e => console.error("Error checking ban status", e));
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkBanStatus(session.user.id);

        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        });
      }
      clearTimeout(authTimeout);
      setAuthLoading(false); // Done loading
    }).catch(err => {
      console.error("getSession error:", err);
      clearTimeout(authTimeout);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event, session?.user?.email);
      
      if (event === 'INITIAL_SESSION') {
        clearTimeout(authTimeout);
        setAuthLoading(false);
      }

      if (session?.user) {
        checkBanStatus(session.user.id);

        const user = session.user;
        console.log('[Auth] User logged in:', user.email, user.id);
        
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
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

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchSupabaseData = async () => {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setIsRoommatesLoading(false); // No Supabase, use local data only
        return;
      }

      // --- 1. Optimistic UI / Cache loading ---
      try {
        const cachedRoommates = localStorage.getItem('roomiematch_cached_roommates');
        const cachedRooms = localStorage.getItem('roomiematch_cached_rooms');
        const cachedReviews = localStorage.getItem('roomiematch_cached_reviews');
        
        if (cachedRoommates) {
          const parsed = JSON.parse(cachedRoommates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSupabaseRoommates(parsed);
          }
        }
        if (cachedRooms) {
          const parsed = JSON.parse(cachedRooms);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSupabaseRooms(parsed);
          }
        }
        if (cachedReviews) {
          const parsed = JSON.parse(cachedReviews);
          if (Array.isArray(parsed)) {
            setSupabaseReviews(parsed);
          }
        }
        
      } catch (e) {
        console.error("Lỗi đọc cache:", e);
      }

      // --- 2. Fetch fresh data from server ---
      try {
        const [roommatesResult, roomsResult] = await Promise.all([
          supabase.from('roommates').select('*'),
          supabase.from('rooms').select('*'),
        ]);

        if (roommatesResult.error) {
          console.error("[Listings] Failed to fetch roommates:", roommatesResult.error);
        }
        const roommatesData = roommatesResult.data;
        if (roommatesData) {
          let freshRoommates = roommatesData;
          const localRoommates = JSON.parse(localStorage.getItem("roomiematch_posted_roommates") || "[]");
          const remoteRoommateIds = new Set(freshRoommates.map((roommate: any) => String(roommate.id)));
          const unsyncedRoommates = localRoommates.filter(
            (roommate: any) => {
              if (!roommate?.id || remoteRoommateIds.has(String(roommate.id))) return false;
              const ownerId = String(roommate.user_id || roommate.postedBy || "");
              const ownerName = String(roommate.name || "").trim().toLowerCase();
              const cachedProfile = JSON.parse(localStorage.getItem("roomiematch_user_profile") || "null");
              const currentName = String(cachedProfile?.name || currentUser?.name || "").trim().toLowerCase();
              return !ownerId || ownerId === currentUser?.id || (!!currentName && ownerName === currentName);
            }
          );

          if (currentUser?.id && unsyncedRoommates.length > 0) {
            const allowedKeys = ['id', 'name', 'age', 'role', 'phoneNumber', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt'];
            const ownedRoommates = unsyncedRoommates.map((roommate: any) => {
              const cleanRoommate: any = {};
              allowedKeys.forEach((key) => {
                if (roommate[key] !== undefined) cleanRoommate[key] = roommate[key];
              });
              cleanRoommate.postedBy = currentUser.id;
              cleanRoommate.user_id = currentUser.id;
              cleanRoommate.is_listing = true;
              return cleanRoommate;
            });

            const syncResults = await Promise.all(
              ownedRoommates.map((roommate: any) =>
                supabase.from("roommates").upsert(roommate, { onConflict: "id" }).select().single()
              )
            );
            const syncedRoommates = syncResults.flatMap((result) => result.data ? [result.data] : []);
            const failedRoommates = syncResults.filter((result) => result.error);
            failedRoommates.forEach((result) => {
              console.error("[Listings] Failed to sync a local roommate:", result.error);
            });
            if (syncedRoommates.length) {
              freshRoommates = [...syncedRoommates, ...freshRoommates];
              localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(
                localRoommates.map((roommate: any) => {
                  const synced = syncedRoommates.find((item: any) => item.id === roommate.id);
                  return synced || roommate;
                })
              ));
            }
          }

          const enhancedRoommates = freshRoommates.map((rm: any) => ({
            ...rm,
            reviews: []
          }));
          setSupabaseRoommates(enhancedRoommates);
          localStorage.setItem('roomiematch_cached_roommates', JSON.stringify(enhancedRoommates));
        }

        if (roomsResult.error) {
          console.error("[Listings] Failed to fetch rooms:", roomsResult.error);
        }
        if (roomsResult.data) {
          let freshRooms = roomsResult.data;
          const localRooms = JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]");
          const remoteRoomIds = new Set(freshRooms.map((room: any) => String(room.id)));
          const unsyncedRooms = localRooms.filter((room: any) => {
            if (!room?.id || remoteRoomIds.has(String(room.id))) return false;
            const ownerId = String(room.user_id || room.postedBy || "");
            const ownerName = String(room.hostName || "").trim().toLowerCase();
            const cachedProfile = JSON.parse(localStorage.getItem("roomiematch_user_profile") || "null");
            const currentName = String(cachedProfile?.name || currentUser?.name || "").trim().toLowerCase();
            return !ownerId || ownerId === currentUser?.id || (!!currentName && ownerName === currentName);
          });

          if (currentUser?.id && unsyncedRooms.length > 0) {
            const allowedKeys = ['id', 'title', 'price', 'location', 'district', 'type', 'images', 'features', 'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName', 'hostAvatar', 'description', 'phoneNumber', 'pets', 'gender', 'postedBy', 'user_id', 'createdAt'];
            const ownedRooms = unsyncedRooms.map((room: any) => {
              const cleanRoom: any = {};
              allowedKeys.forEach((key) => {
                if (room[key] !== undefined) cleanRoom[key] = room[key];
              });
              cleanRoom.postedBy = currentUser.id;
              cleanRoom.user_id = currentUser.id;
              return cleanRoom;
            });

            const syncResults = await Promise.all(
              ownedRooms.map((room: any) =>
                supabase.from("rooms").upsert(room, { onConflict: "id" }).select().single()
              )
            );
            const syncedRooms = syncResults.flatMap((result) => result.data ? [result.data] : []);
            const failedRooms = syncResults.filter((result) => result.error);
            failedRooms.forEach((result) => {
              console.error("[Listings] Failed to sync a local room:", result.error);
            });
            if (syncedRooms.length) {
              freshRooms = [...syncedRooms, ...freshRooms];
              localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(
                localRooms.map((room: any) => {
                  const synced = syncedRooms.find((item: any) => item.id === room.id);
                  return synced || room;
                })
              ));
            }
          }

          setSupabaseRooms(freshRooms);
          localStorage.setItem('roomiematch_cached_rooms', JSON.stringify(freshRooms));
        }
      } catch (err) {
        console.error("Error fetching listings from Supabase:", err);
      } finally {
        setIsRoommatesLoading(false);
      }

      // Secondary data must not delay the public listing pages.
      try {
        const [reviewsResult, bansResult] = await Promise.all([
          supabase.from('reviews').select('*'),
          supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS'),
        ]);

        if (reviewsResult.error) {
          console.error("[Listings] Failed to fetch reviews:", reviewsResult.error);
        }
        if (reviewsResult.data) {
          setSupabaseReviews(reviewsResult.data);
          localStorage.setItem('roomiematch_cached_reviews', JSON.stringify(reviewsResult.data));
        }

        if (bansResult.error) {
          console.error("[Auth] Failed to fetch banned users:", bansResult.error);
        }
        // Fetch Banned list
        const bansData = bansResult.data;
        if (bansData) {
          const bannedIds = bansData
            .filter((message: any) => String(message.text || "").startsWith("[BAN]"))
            .map((message: any) => String(message.text).replace("[BAN]", "").trim());
          if (currentUser?.id && bannedIds.includes(currentUser.id)) setIsBanned(true);
          setSupabaseBannedIds(bannedIds);
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
          console.log('[Realtime] roommates changed:', payload.eventType);
          
          // Optimize: Only update the changed record instead of refetching all
          if (payload.eventType === 'INSERT' && payload.new) {
            setSupabaseRoommates(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setSupabaseRoommates(prev => prev.map(rm => rm.id === payload.new.id ? payload.new as any : rm));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSupabaseRoommates(prev => prev.filter(rm => rm.id !== payload.old.id));
          }
          // Removed fallback refetch - avoid full reload causing layout shift
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async (payload) => {
          console.log('[Realtime] rooms changed:', payload.eventType);
          
          // Optimize: Only update the changed record instead of refetching all
          if (payload.eventType === 'INSERT' && payload.new) {
            setSupabaseRooms(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setSupabaseRooms(prev => prev.map(r => r.id === payload.new.id ? payload.new as any : r));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setSupabaseRooms(prev => prev.filter(r => r.id !== payload.old.id));
          } else {
            // Fallback: refetch if needed
            const { data } = await supabase.from('rooms').select('*').order('createdAt', { ascending: false });
            if (data) setSupabaseRooms(data);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, currentUser?.name]);

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return;

    const refreshBannedUsers = async () => {
      const { data } = await supabase
        .from("messages")
        .select("text")
        .eq("chat_id", "SYSTEM_BANS");
      const bannedIds: string[] = (data || [])
        .filter((message: any) => String(message.text || "").startsWith("[BAN]"))
        .map((message: any) => String(message.text).replace("[BAN]", "").trim());
      const uniqueBannedIds = [...new Set<string>(bannedIds)];
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
  const [isRoommatesLoading, setIsRoommatesLoading] = useState(false);
  
  const [supabaseRooms, setSupabaseRooms] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("roomiematch_cached_rooms") || "[]");
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
  const isAdmin = currentUser?.email === adminEmail || currentUser?.email === "quanly@roomiematch.com" || currentUser?.id === "7a1b28ab-058f-49b6-85bb-3cb61406db31";

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasPendingAgreement, setHasPendingAgreement] = useState(false);
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
    const combined = [...supabaseRoommates, ...roommates];
    console.log('[App] Merging roommates:', {
      supabaseCount: supabaseRoommates.length,
      localCount: roommates.length,
      combinedCount: combined.length
    });
    
    const uniqueByIdMap = new Map();
    
    combined.forEach(rm => {
      const existingById = uniqueByIdMap.get(rm.id);
      // If same ID appears twice, prefer the listing version over profile
      // Also strictly prefer the version that has been enriched with reviews
      if (!existingById || 
          (rm.is_listing && !existingById.is_listing) ||
          ((rm.reviews?.length || 0) > (existingById.reviews?.length || 0)) ||
          (rm.reviews && !existingById.reviews)
      ) {
        uniqueByIdMap.set(rm.id, rm);
      }
    });
    
    const result = Array.from(uniqueByIdMap.values());

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

  // Merge local rooms with Supabase rooms (deduplicate by id)
  const allRooms = useMemo(() => {
    const combined = [...supabaseRooms, ...rooms];
    console.log('[App] Merging rooms:', {
      supabaseCount: supabaseRooms.length,
      localCount: rooms.length,
      combinedCount: combined.length
    });
    
    const uniqueByIdMap = new Map();
    
    combined.forEach(r => {
      // If same ID appears twice, prefer Supabase version (most up-to-date)
      if (!uniqueByIdMap.has(r.id) || supabaseRooms.some(sr => sr.id === r.id)) {
        uniqueByIdMap.set(r.id, r);
      }
    });
    
    let result = Array.from(uniqueByIdMap.values());

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
  }, [supabaseRooms, rooms, currentUserProfile, currentUser]);

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
    setEditingListingData(null);
    setPostModalInitialTab(tab);
    setIsPostModalOpen(true);
  };

  const handleEditRoommate = (roommate: Roommate) => {
    setEditingListingData(roommate);
    setPostModalInitialTab("roommate");
    setIsPostModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingListingData(room);
    setPostModalInitialTab("room");
    setIsPostModalOpen(true);
  };

  const handleAddRoom = async (newRoom: Room): Promise<boolean> => {
    const roomWithOwner = { ...newRoom, postedBy: currentUser?.id || "", user_id: currentUser?.id || "" };
    
    if (editingListingData) {
      // Optimistic UI Update for Edit
      const updatedRoom = { ...roomWithOwner, id: editingListingData.id };
      setRooms((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoom : r));
      
      // Local cache update
      const saved = localStorage.getItem("roomiematch_posted_rooms");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed.map((r: any) => r.id === editingListingData.id ? updatedRoom : r)));
      }

      // Supabase State Update (optimistic for Supabase override)
      setSupabaseRooms((prev) => prev.map(r => r.id === editingListingData.id ? updatedRoom : r));

      // Supabase Update
      if (import.meta.env.VITE_SUPABASE_URL) {
        const validRoomKeys = ['id', 'title', 'price', 'location', 'district', 'type', 'images', 'features', 'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName', 'hostAvatar', 'description', 'phoneNumber', 'pets', 'gender', 'postedBy', 'user_id', 'createdAt'];
        const dbRoom: any = {};
        for (const key of validRoomKeys) {
          if (updatedRoom[key as keyof Room] !== undefined) {
            dbRoom[key] = updatedRoom[key as keyof Room];
          }
        }

        let { error } = await supabase.from('rooms').update(dbRoom).eq('id', editingListingData.id);
        if (error && (error.code === 'PGRST204' || error.code === '42703')) {
          const { postedBy, ...dbRoomFallback } = dbRoom;
          error = (await supabase.from('rooms').update(dbRoomFallback).eq('id', editingListingData.id)).error;
        }
        if (error) {
          console.error("Error updating room to Supabase:", error);
          toast(getListingErrorMessage(error, "room", "update"), 'error', 5000);
          return false;
        }
      }
      setEditingListingData(null);
      return true;
    }

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      const validRoomKeys = ['id', 'title', 'price', 'location', 'district', 'type', 'images', 'features', 'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName', 'hostAvatar', 'description', 'phoneNumber', 'pets', 'gender', 'postedBy', 'user_id', 'createdAt'];
      const dbRoom: any = {};
      for (const key of validRoomKeys) {
        if (roomWithOwner[key as keyof Room] !== undefined) {
          dbRoom[key] = roomWithOwner[key as keyof Room];
        }
      }

      let { error, data } = await supabase.from('rooms').insert(dbRoom).select();
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        const { postedBy, user_id, ...dbRoomFallback } = dbRoom;
        const result = await supabase.from('rooms').insert(dbRoomFallback).select();
        error = result.error;
        data = result.data;
      }
      if (error) {
        console.error("Error inserting room to Supabase:", error);
        toast(getListingErrorMessage(error, "room", "create"), 'error', 5500);
        return false;
      } else if (data && data.length > 0) {
        console.log("[App] Successfully inserted room to Supabase:", data[0]);
        setSupabaseRooms((prev) => [data[0], ...prev]);
        localStorage.setItem(
          "roomiematch_posted_rooms",
          JSON.stringify([data[0], ...JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]")])
        );
        return true;
      }
      toast('Tin phòng chưa được lưu thành công. Vui lòng thử lại.', 'error', 5000);
      return false;
    }

    setRooms((prev) => [roomWithOwner, ...prev]);
    const saved = JSON.parse(localStorage.getItem("roomiematch_posted_rooms") || "[]");
    localStorage.setItem("roomiematch_posted_rooms", JSON.stringify([roomWithOwner, ...saved]));
    return true;
  };

  const handleAddRoommate = async (newRoommate: Roommate): Promise<boolean> => {
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
        const validRoommateKeys = ['id', 'name', 'age', 'role', 'phoneNumber', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt'];
        const dbRoommate: any = {};
        for (const key of validRoommateKeys) {
          if (updatedRoommate[key as keyof Roommate] !== undefined) {
            dbRoommate[key] = updatedRoommate[key as keyof Roommate];
          }
        }

        let { error } = await supabase.from('roommates').update(dbRoommate).eq('id', editingListingData.id);
        if (error && (error.code === 'PGRST204' || error.code === '42703')) {
          const { postedBy, ...dbRoommateFallback } = dbRoommate;
          error = (await supabase.from('roommates').update(dbRoommateFallback).eq('id', editingListingData.id)).error;
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
      const validRoommateKeys = ['id', 'name', 'age', 'role', 'phoneNumber', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt'];
      const dbRoommate: any = {};
      for (const key of validRoommateKeys) {
        if (roommateWithOwner[key as keyof Roommate] !== undefined) {
          dbRoommate[key] = roommateWithOwner[key as keyof Roommate];
        }
      }
      dbRoommate.is_listing = true; // Force true for listings

      let { error, data } = await supabase.from('roommates').insert(dbRoommate).select();
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        const { postedBy, user_id, ...dbRoommateFallback1 } = dbRoommate;
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
      } else if (data && data.length > 0) {
        console.log("[App] Successfully inserted roommate to Supabase:", data[0]);
        setSupabaseRoommates((prev) => [data[0], ...prev]);
        localStorage.setItem(
          "roomiematch_posted_roommates",
          JSON.stringify([data[0], ...JSON.parse(localStorage.getItem("roomiematch_posted_roommates") || "[]")])
        );
        return true;
      }
      toast('Bài tìm bạn chưa được lưu thành công. Vui lòng thử lại.', 'error', 5000);
      return false;
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
    // 1. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
    }

    // 2. Remove from Supabase state optimistically
    setSupabaseRooms((prev) => prev.filter((r) => r.id !== id));
    
    // 3. Supabase Delete
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) console.error("Error deleting room from Supabase:", error);
    }
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
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }

    // 4. Remove from Supabase state optimistically
    setSupabaseRoommates((prev) => prev.filter((r) => r.id !== id));

    // 5. Supabase Delete - delete the record
    if (import.meta.env.VITE_SUPABASE_URL) {
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
      
      console.log("[DEBUG] Fetching roommate likes...", { data, error });
      
      if (error || !data) {
        console.log("[DEBUG] Error or no data:", error);
        return;
      }

      // Count all likes, excluding self-likes (where user likes their own profile)
      const counts: Record<string, number> = {};
      
      data.forEach((like: any) => {
        const target = allRoommates.find((roommate) => roommate.id === like.roommate_id);
        
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
      
      console.log("[DEBUG] Calculated like counts:", counts);
      console.log("[DEBUG] All roommates count:", allRoommates.length);
      
      if (currentUser?.id) {
        const savedLikes: string[] = JSON.parse(
          localStorage.getItem("roomiematch_liked_roommates") || "[]"
        );
        const ownLikes = data
          .filter((like) => like.user_id === currentUser.id)
          .map((like) => like.roommate_id);
        const missingLikes = savedLikes.filter((id) => {
          if (ownLikes.includes(id)) return false;
          const target = allRoommates.find((roommate) => roommate.id === id);
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

      console.log("[DEBUG] Final like counts being set:", counts);
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
        (payload) => {
          console.log("[DEBUG] Realtime event received:", payload);
          // Refetch counts when likes change
          fetchRoommateLikes();
        }
      )
      .subscribe((status) => {
        console.log("[DEBUG] Realtime subscription status:", status);
      });
    
    return () => {
      supabase.removeChannel(likesChannel);
    };
  }, [currentUser?.id, allRoommates]);

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
  const [roomUserHasSignedAgreement, setRoomUserHasSignedAgreement] = useState(false);
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
      if (path && ["home", "roommates", "rooms", "chat", "agreement", "history", "info"].includes(path)) {
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
    const isAnyModalOpen = !!(selectedRoommate || selectedRoom || isPostModalOpen || isProfileModalOpen || isLoginModalOpen || isRequireProfileAlertOpen);
    if (isAnyModalOpen && !wasModalOpen.current) {
      window.history.pushState({ modal: true, tab: activeTab }, "", window.location.pathname);
      wasModalOpen.current = true;
    } else if (!isAnyModalOpen && wasModalOpen.current) {
      wasModalOpen.current = false;
    }
  }, [selectedRoommate, selectedRoom, isPostModalOpen, isProfileModalOpen, isLoginModalOpen, isRequireProfileAlertOpen, activeTab]);

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
  const [supabaseReviews, setSupabaseReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('"createdAt"', { ascending: false });
      if (!error && data) {
        setSupabaseReviews(data);
      }
    };
    fetchReviews();
    
    // NOTE: Realtime disabled temporarily due to duplicate issues
    // Will re-enable after fixing subscription logic
  }, []);

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
    });
    setRoommates(updated);
  }, [currentUserProfile, supabaseReviews, currentUser, supabaseRoommates]);

  // Sync rooms with updated profile
  useEffect(() => {
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    const parsed = saved ? JSON.parse(saved) : [];
    
    // Deduplicate: INITIAL_ROOMS override older Supabase entries
    const initialRoomIds = INITIAL_ROOMS.map(r => r.id);
    const filteredSupabaseRooms = supabaseRooms.filter(r => !initialRoomIds.includes(r.id));
    
    const allRoomsRaw = [...parsed, ...filteredSupabaseRooms, ...INITIAL_ROOMS];
    const uniqueRoomsMap = new Map();
    allRoomsRaw.forEach(r => {
      // Overwrite existing to ensure INITIAL_ROOMS (at the end) wins
      uniqueRoomsMap.set(r.id, r);
    });
    let allRooms = Array.from(uniqueRoomsMap.values());

    if (currentUserProfile) {
      allRooms = allRooms.map(r => {
        const isOwner = (currentUser && r.postedBy === currentUser.id) || r.hostName === currentUserProfile.name;
        return {
          ...r,
          price: r.price || 0,
          hostAvatar: isOwner ? currentUserProfile.avatar : r.hostAvatar,
          hostName: isOwner ? currentUserProfile.name : r.hostName,
          postedBy: isOwner && currentUser ? currentUser.id : (r.postedBy || r.user_id),
        };
      });
    }
    setRooms(allRooms);
  }, [currentUserProfile, currentUser, supabaseRooms]);

  const handleSaveProfile = async (profile: any) => {
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
           const validRoommateKeys = ['id', 'name', 'age', 'role', 'phoneNumber', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt'];
           const upsertData: any = {};
           for (const key of validRoommateKeys) {
             if (profile[key as keyof Roommate] !== undefined) {
               upsertData[key] = profile[key as keyof Roommate];
             }
           }
           upsertData.user_id = currentUser.id;
           upsertData.postedBy = currentUser.id;
           upsertData.is_listing = false;
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
      // 0. Check if user is banned
      try {
        const { data: banMsgs } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
        if (banMsgs) {
          const isBanned = banMsgs.some((m: any) => m.text.includes(user.id));
          if (isBanned) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setCurrentUserProfile(null);
            localStorage.removeItem("roomiematch_user_profile");
            alert("Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.");
            return;
          }
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
    if (!isAuth) return false;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const newReview = {
            id: `rev-${Date.now()}`,
            reviewerName: review.reviewerName || "Người dùng ẩn danh",
            reviewerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
            rating: review.rating,
            comment: review.comment,
            images: review.images,
            createdAt: new Date().toLocaleDateString("vi-VN"),
          };
          const updatedReviews = [newReview, ...(r.reviews || [])];
          const updatedRoom = {
            ...r,
            reviews: updatedReviews,
          };

          if (selectedRoom && selectedRoom.id === roomId) {
            setSelectedRoom(updatedRoom);
          }

          return updatedRoom;
        }
        return r;
      })
    );
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
            rooms={rooms}
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
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
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
              rooms={rooms}
              onDeleteRoommate={handleDeleteRoommate}
              onDeleteRoom={handleDeleteRoom}
              onReviewDeleted={handleAdminReviewDeleted}
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
          onClose={handleCloseModal}
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
          hasChatWithRoommate={(() => {
            // Check if there's any real chat history by looking for stored messages
            const myId = currentUser?.id || currentUserProfile?.id;
            if (!myId) return false;
            // Check if there's a chat session with messages stored in localStorage
            const chatKey = [myId, selectedRoommate.id].sort().join('_');
            const storedMessages = localStorage.getItem(`roomiematch_messages_${chatKey}`);
            const hasStoredMessages = storedMessages && JSON.parse(storedMessages).length > 0;
            // Also check legacy chat note
            const chatNote = localStorage.getItem(`chat_notes_${selectedRoommate.id}`) || '';
            return !!hasStoredMessages || chatNote.length > 0;
          })()}
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
        />
      )}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          roommates={allRoommates}
          onClose={handleCloseModal}
          onInquire={handleRoomInquiry}
          onAddReview={handleAddRoomReview}
          isOwnProfile={!!currentUser && (selectedRoom.postedBy === currentUser.id || (selectedRoom as any).user_id === currentUser.id)}
          hasSignedAgreement={roomUserHasSignedAgreement}
          onDeleteRoom={(id) => {
            handleDeleteRoom(id);
            setSelectedRoom(null);
            toast('✅ Đã xóa tin đăng thành công!', 'success');
          }}
          onEditRoom={handleEditRoom}
          isAdmin={isAdmin}
          onViewHostProfile={(roommate) => {
            console.log('[App] View host profile from RoomModal:', roommate);
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


    </div>
  );
}
