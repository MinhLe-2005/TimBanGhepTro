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

import RoommateModal from "./components/RoommateModal";
import RoomModal from "./components/RoomModal";
import CreateProfileModal from "./components/CreateProfileModal";
import LoginModal from "./components/LoginModal";
import PostListingModal from "./components/PostListingModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\/+/, "");
    if (path && ["home", "roommates", "rooms", "chat", "agreement", "info", "admin"].includes(path)) {
      return path;
    }
    const hash = window.location.hash.replace("#", "").split("?")[0];
    return hash && ["home", "roommates", "rooms", "chat", "agreement", "info", "admin"].includes(hash) ? hash : "home";
  });
  
  useEffect(() => {
    const handleGlobalHash = () => {
      const hash = window.location.hash.replace("#", "").split("?")[0];
      if (hash && ["home", "roommates", "rooms", "chat", "agreement", "info"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleGlobalHash);
    return () => window.removeEventListener("hashchange", handleGlobalHash);
  }, []);
  
  const [globalSearchFilters, setGlobalSearchFilters] = useState<any>(null);
  
  // Authentication states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Check ban
        try {
          const { data: banMsgs } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
          if (banMsgs && banMsgs.some((m: any) => m.text.includes(session.user.id))) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setCurrentUserProfile(null);
            localStorage.removeItem("roomiematch_user_profile");
            alert("Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.");
            return;
          }
        } catch(e) {}

        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Check ban
        try {
          const { data: banMsgs } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
          if (banMsgs && banMsgs.some((m: any) => m.text.includes(session.user.id))) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setCurrentUserProfile(null);
            localStorage.removeItem("roomiematch_user_profile");
            alert("Tài khoản của bạn đã bị khóa do bị report vi phạm. Vui lòng liên hệ Admin để biết thêm chi tiết.");
            return;
          }
        } catch(e) {}

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
      if (!import.meta.env.VITE_SUPABASE_URL) return; // Fallback to local data if not configured

      try {
        // Fetch Roommates
        const { data: roommatesData } = await supabase.from('roommates').select('*').order('createdAt', { ascending: false });
        if (roommatesData && roommatesData.length > 0) {
          const { data: reviewsData } = await supabase.from('reviews').select('*');
          const enhancedRoommates = roommatesData.map((rm: any) => ({
            ...rm,
            reviews: reviewsData?.filter((rev: any) => rev.roommateId === rm.id) || []
          }));
          setSupabaseRoommates(enhancedRoommates);
        }

        // Fetch Rooms
        const { data: roomsData } = await supabase.from('rooms').select('*').order('createdAt', { ascending: false });
        if (roomsData && roomsData.length > 0) {
          setSupabaseRooms(roomsData);
        }

        // Fetch Banned list
        const { data: bansData } = await supabase.from('messages').select('text').eq('chat_id', 'SYSTEM_BANS');
        if (bansData && bansData.length > 0) {
          const bannedIds = bansData.map((m: any) => m.text.replace('[BAN]', '').trim());
          if (currentUser?.id && bannedIds.includes(currentUser.id)) setIsBanned(true);
          // Note: we can't check currentUserProfile.id perfectly here if it's not loaded, 
          // but we'll re-check when currentUserProfile changes.
          setSupabaseBannedIds(bannedIds);
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      } finally {
        setIsSupabaseLoading(false);
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
          // Refetch all roommates to get the updated list
          const { data } = await supabase.from('roommates').select('*').order('createdAt', { ascending: false });
          if (data) {
            const { data: reviewsData } = await supabase.from('reviews').select('*');
            const enhanced = data.map((rm: any) => ({
              ...rm,
              reviews: reviewsData?.filter((rev: any) => rev.roommateId === rm.id) || []
            }));
            setSupabaseRoommates(enhanced);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          console.log('[Realtime] rooms changed');
          const { data } = await supabase.from('rooms').select('*').order('createdAt', { ascending: false });
          if (data) setSupabaseRooms(data);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);


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
  const [supabaseRoommates, setSupabaseRoommates] = useState<any[]>([]);
  const [supabaseRooms, setSupabaseRooms] = useState<any[]>([]);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(!!import.meta.env.VITE_SUPABASE_URL);

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
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'chat') {
      setHasUnreadMessages(false);
    }
  }, [activeTab]);

  // Listen for unread messages
  useEffect(() => {
    const myChatId = currentUser?.id || currentUserProfile?.id;
    if (!myChatId) return;
    
    const sub = supabase.channel('header_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id !== myChatId && newMessage.chat_id.includes(myChatId)) {
          if (activeTabRef.current !== 'chat') {
            setHasUnreadMessages(true);
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
    const uniqueByNameMap = new Map();
    
    combined.forEach(rm => {
      // Strategy 1: Deduplicate by ID
      const existingById = uniqueByIdMap.get(rm.id);
      if (!existingById || (rm.is_listing && !existingById.is_listing)) {
        uniqueByIdMap.set(rm.id, rm);
      }
      
      // Strategy 2: Deduplicate by NAME (case-insensitive)
      // Always prioritize listings over profiles with same name
      const normalizedName = rm.name.toUpperCase().trim();
      const existingByName = uniqueByNameMap.get(normalizedName);
      
      if (!existingByName) {
        uniqueByNameMap.set(normalizedName, rm);
      } else if (rm.id !== existingByName.id) {
        // If new record is a listing and existing is a profile, replace it
        if (rm.is_listing === true && existingByName.is_listing !== true) {
          uniqueByNameMap.set(normalizedName, rm);
          // Also remove the old profile from ID map
          uniqueByIdMap.delete(existingByName.id);
          uniqueByIdMap.set(rm.id, rm);
        }
        // If new record is a profile and existing is a listing, keep the listing
        else if (rm.is_listing !== true && existingByName.is_listing === true) {
          // Keep existing listing, ignore new profile
          uniqueByIdMap.delete(rm.id);
        }
        else {
          // both are profiles or both are listings. Delete the new one from ID map to only keep one
          uniqueByIdMap.delete(rm.id);
        }
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

  const handleAddRoom = async (newRoom: Room) => {
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
        const validRoomKeys = ['title', 'price', 'location', 'district', 'type', 'images', 'features', 'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName', 'hostAvatar', 'description', 'phoneNumber', 'pets', 'gender', 'postedBy', 'user_id', 'createdAt'];
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
        if (error) console.error("Error updating room to Supabase:", error);
      }
      setEditingListingData(null);
      return;
    }

    // Optimistic UI Update for Insert
    setRooms((prev) => {
      const updated = [roomWithOwner, ...prev];
      return updated;
    });

    // Local fallback cache
    const saved = localStorage.getItem("roomiematch_posted_rooms");
    const parsed = saved ? JSON.parse(saved) : [];
    localStorage.setItem("roomiematch_posted_rooms", JSON.stringify([roomWithOwner, ...parsed]));

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      // ✅ Only send columns that actually exist in Supabase table
      const validRoomKeys = ['id', 'title', 'price', 'location', 'district', 'type', 'images', 'features', 'isHot', 'status', 'isVerifiedRoom', 'bedrooms', 'wc', 'kitchen', 'hostName', 'hostAvatar', 'description', 'phoneNumber', 'pets', 'gender', 'postedBy', 'user_id', 'createdAt'];
      const dbRoom: any = {};
      for (const key of validRoomKeys) {
        if (roomWithOwner[key as keyof Room] !== undefined) {
          dbRoom[key] = roomWithOwner[key as keyof Room];
        }
      }

      let { error, data } = await supabase.from('rooms').insert(dbRoom).select();
      if (error && (error.code === 'PGRST204' || error.code === '42703')) {
        const { postedBy, ...dbRoomFallback } = dbRoom;
        const result = await supabase.from('rooms').insert(dbRoomFallback).select();
        error = result.error;
        data = result.data;
      }
      if (error) {
        console.error("Error inserting room to Supabase:", error);
      } else if (data && data.length > 0) {
        console.log("[App] Successfully inserted room to Supabase:", data[0]);
        setSupabaseRooms((prev) => [data[0], ...prev]);
      }
    }
  };

  const handleAddRoommate = async (newRoommate: Roommate) => {
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
        const validRoommateKeys = ['name', 'age', 'role', 'phoneNumber', 'avatar', 'status', 'location', 'district', 'type', 'matchScore', 'reputationScore', 'tags', 'isVerified', 'bio', 'budget', 'gender', 'lifestyle', 'postedBy', 'user_id', 'is_listing', 'createdAt'];
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
        if (error) console.error("Error updating roommate to Supabase:", error);
      }
      setEditingListingData(null);
      return;
    }

    // Local fallback cache
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const parsed = saved ? JSON.parse(saved) : [];
    localStorage.setItem("roomiematch_posted_roommates", JSON.stringify([{ ...roommateWithOwner, is_listing: true }, ...parsed]));

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      // ✅ Only send columns that actually exist in Supabase table
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
        const { postedBy, ...dbRoommateFallback } = dbRoommate;
        const result = await supabase.from('roommates').insert(dbRoommateFallback).select();
        error = result.error;
        data = result.data;
      }
      if (error) {
        console.error("Error inserting roommate to Supabase:", error);
      } else if (data && data.length > 0) {
        console.log("[App] Successfully inserted roommate to Supabase:", data[0]);
        setSupabaseRoommates((prev) => [data[0], ...prev]);
      }
    }
    
    // Optimistic UI Update for Insert (after Supabase confirmation)
    setRoommates((prev) => {
      const updated = [{ ...roommateWithOwner, is_listing: true }, ...prev];
      return updated;
    });
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
    // 1. Check if this is a user profile (is_listing = false) - should not be deleted
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { data: roommateData, error: fetchError } = await supabase.from('roommates').select('is_listing, user_id, name').eq('id', id).single();
      
      console.log('[Delete] Checking record:', { id, data: roommateData, error: fetchError });
      
      // Only block deletion if is_listing is explicitly FALSE (user profile)
      // Allow deletion if is_listing is TRUE or NULL (listings)
      if (roommateData && roommateData.is_listing === false) {
        alert('Không thể xóa hồ sơ cá nhân từ trang này. Hồ sơ cá nhân chỉ có thể chỉnh sửa, không thể xóa.');
        return;
      }
      
      console.log('[Delete] Allowed to delete - is_listing:', roommateData?.is_listing);
    }
    
    // 2. Remove from local fallback
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    if (saved) {
      const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
    }

    // 3. Remove from Supabase state optimistically
    setSupabaseRoommates((prev) => prev.filter((r) => r.id !== id));

    // 4. Supabase Delete - delete the record
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
  const [likedRoomIds, setLikedRoomIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("roomiematch_liked_rooms");
    return saved ? JSON.parse(saved) : [];
  });

  const handleLikeRoommate = (id: string, isLiked: boolean) => {
    if (!requireAuth()) return false;
    setLikedRoommateIds((prev) => {
      const next = isLiked ? [...prev, id] : prev.filter((x) => x !== id);
      localStorage.setItem("roomiematch_liked_roommates", JSON.stringify(next));
      return next;
    });
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
    
    const initialIds = INITIAL_ROOMMATES.map(r => r.id);
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

    if (currentUserProfile) {
      const updated = allCandidates.map((r) => {
        let score = 55; // Base compatibility match

        // 1. Sleep matching
        if (currentUserProfile.lifestyle.sleep === r.lifestyle.sleep) {
          score += 15;
        } else if (
          (currentUserProfile.lifestyle.sleep === "Cú đêm" && r.lifestyle.sleep === "Ngủ sớm") ||
          (currentUserProfile.lifestyle.sleep === "Ngủ sớm" && r.lifestyle.sleep === "Cú đêm")
        ) {
          score -= 10;
        }

        // 2. Pet tolerance
        if (currentUserProfile.lifestyle.pets === r.lifestyle.pets || r.lifestyle.pets === "Thoải mái") {
          score += 15;
        }

        // 3. Smoke tolerance
        if (currentUserProfile.lifestyle.smoke === r.lifestyle.smoke) {
          score += 15;
        } else if (currentUserProfile.lifestyle.smoke === "Không hút thuốc" && r.lifestyle.smoke.includes("Hút thuốc")) {
          score -= 15;
        }

        // 4. Cooking preference
        if (currentUserProfile.lifestyle.cook === r.lifestyle.cook) {
          score += 5;
        }

        // 5. Neatness/Cleanliness comparison
        if (currentUserProfile.lifestyle.neatness === r.lifestyle.neatness) {
          score += 10;
        }

        // Normalization bounds: 65% up to 99%
        const normalized = Math.min(99, Math.max(65, score));
        
        // Merge Supabase reviews
        const dbReviews = supabaseReviews
          .filter(rev => rev.roommate_id === r.id)
          .map(rev => ({
            id: rev.id,
            reviewerName: rev.reviewer_name,
            reviewerAvatar: rev.reviewer_avatar,
            rating: rev.rating,
            comment: rev.comment,
            imageUrl: rev.image_url,
            createdAt: new Date(rev.created_at).toLocaleDateString("vi-VN"),
          }));

        const isOwner = (currentUser && r.postedBy === currentUser.id) || r.name === currentUserProfile.name;

        return {
          ...r,
          budget: r.budget || 0,
          matchScore: isOwner ? 100 : normalized,
          reviews: [...dbReviews, ...(r.reviews || [])],
          avatar: isOwner ? currentUserProfile.avatar : r.avatar,
          name: isOwner ? currentUserProfile.name : r.name,
          postedBy: isOwner && currentUser ? currentUser.id : r.postedBy,
        };
      });

      // Sort by match score from largest to smallest
      setRoommates(updated.sort((a, b) => b.matchScore - a.matchScore));
    } else {
      const updated = allCandidates.map(r => {
        const dbReviews = supabaseReviews
          .filter(rev => rev.roommate_id === r.id)
          .map(rev => ({
            id: rev.id,
            reviewerName: rev.reviewer_name,
            reviewerAvatar: rev.reviewer_avatar,
            rating: rev.rating,
            comment: rev.comment,
            imageUrl: rev.image_url,
            createdAt: new Date(rev.created_at).toLocaleDateString("vi-VN"),
          }));
        return {
          ...r,
          budget: r.budget || 0,
          reviews: [...dbReviews, ...(r.reviews || [])],
        };
      });
      setRoommates(updated);
    }
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
    
    // Tra DB lấy user_id (Auth UUID) của partner để chat_id luôn đồng bộ mọi thiết bị
    let effectivePartnerId = roommateId;
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { data } = await supabase.from('roommates').select('user_id').eq('id', roommateId).maybeSingle();
      if (data?.user_id) effectivePartnerId = data.user_id; // dùng Auth UUID của partner
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

  const handleAddReview = async (roommateId: string, review: { reviewerName: string; rating: number; comment: string; imageUrl?: string }) => {
    const isAuth = await requireAuth();
    if (!isAuth) return false;

    const newDbReview = {
      roommate_id: roommateId,
      reviewer_name: review.reviewerName || "Bạn ở ghép ẩn danh",
      reviewer_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      rating: review.rating,
      comment: review.comment,
      image_url: review.imageUrl || null,
    };

    // 1. Insert into Supabase
    const { data, error } = await supabase.from('reviews').insert([newDbReview]).select();
    
    if (!error && data && data.length > 0) {
      // 2. Update local supabaseReviews state so it triggers the useEffect to recalculate roommates
      setSupabaseReviews(prev => [data[0], ...prev]);
    } else {
      console.error("Failed to insert review to Supabase", error);
      // Fallback: update state anyway if Supabase fails (e.g. RLS issues or offline)
      setRoommates((prev) =>
        prev.map((r) => {
          if (r.id === roommateId) {
            const fallbackReview = {
              id: `rev-${Date.now()}`,
              reviewerName: newDbReview.reviewer_name,
              reviewerAvatar: newDbReview.reviewer_avatar,
              rating: newDbReview.rating,
              comment: newDbReview.comment,
              imageUrl: newDbReview.image_url || undefined,
              createdAt: new Date().toLocaleDateString("vi-VN"),
            };
            const updatedReviews = [fallbackReview, ...(r.reviews || [])];
            
            let newScore = r.reputationScore;
            if (review.rating >= 4) {
              newScore = Math.min(100, r.reputationScore + 1);
            } else {
              newScore = Math.max(50, r.reputationScore - 10);
            }
  
            return {
              ...r,
              reviews: updatedReviews,
              reputationScore: newScore,
            };
          }
          return r;
        })
      );
    }
    return true;
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

  const [supabaseBannedIds, setSupabaseBannedIds] = useState<string[]>([]);
  useEffect(() => {
    if (currentUserProfile?.id && supabaseBannedIds.includes(currentUserProfile.id)) {
      setIsBanned(true);
    }
  }, [currentUserProfile, supabaseBannedIds]);

  // Helper calculating specific category matching details for modal displays
  const getCompatibilityDetails = (roommate: Roommate | null) => {
    if (!roommate || !currentUserProfile) {
      return {
        sleepMatch: true,
        petsMatch: true,
        smokeMatch: true,
        cookMatch: true,
        neatMatch: true,
      };
    }
    return {
      sleepMatch: currentUserProfile.lifestyle.sleep === roommate.lifestyle.sleep,
      petsMatch: currentUserProfile.lifestyle.pets === roommate.lifestyle.pets || roommate.lifestyle.pets === "Thoải mái",
      smokeMatch: currentUserProfile.lifestyle.smoke === roommate.lifestyle.smoke,
      cookMatch: currentUserProfile.lifestyle.smoke === roommate.lifestyle.smoke,
      neatMatch: currentUserProfile.lifestyle.neatness === roommate.lifestyle.neatness,
    };
  };

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
      />

      {/* 2. Primary Tab Contents Display Body */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex-grow">
        {activeTab === "home" && (
          <HomeView
            roommates={allRoommates}
            rooms={rooms}
            likedRoommateIds={likedRoommateIds}
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
          isSupabaseLoading ? (
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
               <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#006590]"></div>
               <p className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <RoommatesView
              roommates={allRoommates}
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
            />
          )
        )}

        {activeTab === "rooms" && (
          <RoomsView
            rooms={rooms}
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
          compatibilityDetails={getCompatibilityDetails(selectedRoommate)}
          onAddReview={handleAddReview}
          isOwnProfile={!!currentUser && ((selectedRoommate.postedBy === currentUser.id) || (currentUserProfile && selectedRoommate.name === currentUserProfile.name))}
          hasChatWithRoommate={(() => {
            // Check if there's any chat history with this roommate via localStorage chat notes
            const chatNote = localStorage.getItem(`chat_notes_${selectedRoommate.id}`) || '';
            const roommateNote = localStorage.getItem(`roommate_notes_${selectedRoommate.id}`) || '';
            // Also check if there are any messages stored for this chat pair
            const myId = currentUser?.id || currentUserProfile?.id;
            const chatKey = myId && selectedRoommate.id ? [myId, selectedRoommate.id].sort().join('_') : null;
            return chatNote.length > 0 || roommateNote.length > 0 || !!chatKey;
          })()}
          onDeleteProfile={(id) => {
            handleDeleteRoommate(id);
            if (currentUserProfile && currentUserProfile.id === id) {
              setCurrentUserProfile(null);
              localStorage.removeItem("roomiematch_user_profile");
            }
            setSelectedRoommate(null);
            alert("Đã xóa hồ sơ thành công!");
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
          isOwnProfile={!!currentUser && ((selectedRoom.postedBy === currentUser.id) || (currentUserProfile && selectedRoom.hostName === currentUserProfile.name))}
          onDeleteRoom={(id) => {
            handleDeleteRoom(id);
            setSelectedRoom(null);
            alert("Đã xóa tin đăng thành công!");
          }}
          onEditRoom={handleEditRoom}
          isAdmin={isAdmin}
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
              Bạn cần cập nhật hồ sơ cá nhân (thói quen, tính cách...) trước khi thực hiện chức năng này để hệ thống tính toán độ tương thích.
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

