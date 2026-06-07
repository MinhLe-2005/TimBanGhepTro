import { useState, useEffect, useRef } from "react";
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

import RoommateModal from "./components/RoommateModal";
import RoomModal from "./components/RoomModal";
import CreateProfileModal from "./components/CreateProfileModal";
import LoginModal from "./components/LoginModal";
import PostListingModal from "./components/PostListingModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\/+/, "");
    if (path && ["home", "roommates", "rooms", "chat", "agreement", "info"].includes(path)) {
      return path;
    }
    const hash = window.location.hash.replace("#", "").split("?")[0];
    return hash && ["home", "roommates", "rooms", "chat", "agreement", "info"].includes(hash) ? hash : "home";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || "Thành viên Roomie",
          avatar: session.user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop",
        });
      } else {
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
        const { data: roommatesData } = await supabase.from('roommates').select('*');
        if (roommatesData && roommatesData.length > 0) {
          const { data: reviewsData } = await supabase.from('reviews').select('*');
          const enhancedRoommates = roommatesData.map((rm: any) => ({
            ...rm,
            reviews: reviewsData?.filter((rev: any) => rev.roommateId === rm.id) || []
          }));
          setSupabaseRoommates(enhancedRoommates);
        }

        // Fetch Rooms
        const { data: roomsData } = await supabase.from('rooms').select('*');
        if (roomsData && roomsData.length > 0) {
          setSupabaseRooms(roomsData);
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      }
    };

    fetchSupabaseData();
  }, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRequireProfileAlertOpen, setIsRequireProfileAlertOpen] = useState(false);

  // Persistence for user profile
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(() => {
    const saved = localStorage.getItem("roomiematch_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // States to hold Supabase fetched lists
  const [supabaseRoommates, setSupabaseRoommates] = useState<any[]>([]);
  const [supabaseRooms, setSupabaseRooms] = useState<any[]>([]);

  // Auto-sync profile when logging in or refreshing
  useEffect(() => {
    if (currentUser && !currentUserProfile && supabaseRoommates.length > 0) {
      const myProfile = supabaseRoommates.find((r: any) => r.postedBy === currentUser.id);
      if (myProfile) {
        setCurrentUserProfile(myProfile);
        localStorage.setItem("roomiematch_user_profile", JSON.stringify(myProfile));
      }
    }
  }, [currentUser, currentUserProfile, supabaseRoommates]);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Listen for unread messages
  useEffect(() => {
    if (!currentUserProfile || activeTab === 'chat') return;
    const sub = supabase.channel('header_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id !== currentUserProfile.id && newMessage.chat_id.includes(currentUserProfile.id)) {
          setHasUnreadMessages(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [currentUserProfile, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setHasUnreadMessages(false);
    }
  }, [activeTab]);

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
    const roomWithOwner = { ...newRoom, postedBy: currentUser?.id || "" };
    
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

      // Supabase Update
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { reviews, ...dbRoom } = updatedRoom;
        let { error } = await supabase.from('rooms').update(dbRoom).eq('id', editingListingData.id);
        if (error && error.code === 'PGRST204') {
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
      const { reviews, ...dbRoom } = roomWithOwner;
      let { error } = await supabase.from('rooms').insert(dbRoom);
      if (error && error.code === 'PGRST204') {
        const { postedBy, ...dbRoomFallback } = dbRoom;
        error = (await supabase.from('rooms').insert(dbRoomFallback)).error;
      }
      if (error) console.error("Error inserting room to Supabase:", error);
    }
  };

  const handleAddRoommate = async (newRoommate: Roommate) => {
    const roommateWithOwner = { ...newRoommate, postedBy: currentUser?.id || "" };
    
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

      // Supabase Update
      if (import.meta.env.VITE_SUPABASE_URL) {
        const { reviews, ...dbRoommate } = updatedRoommate;
        let { error } = await supabase.from('roommates').update(dbRoommate).eq('id', editingListingData.id);
        if (error && error.code === 'PGRST204') {
          const { postedBy, ...dbRoommateFallback } = dbRoommate;
          error = (await supabase.from('roommates').update(dbRoommateFallback).eq('id', editingListingData.id)).error;
        }
        if (error) console.error("Error updating roommate to Supabase:", error);
      }
      setEditingListingData(null);
      return;
    }

    // Optimistic UI Update for Insert
    setRoommates((prev) => {
      const updated = [roommateWithOwner, ...prev];
      return updated;
    });

    // Local fallback cache
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const parsed = saved ? JSON.parse(saved) : [];
    localStorage.setItem("roomiematch_posted_roommates", JSON.stringify([roommateWithOwner, ...parsed]));

    // Supabase Insert
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { reviews, ...dbRoommate } = roommateWithOwner;
      let { error } = await supabase.from('roommates').insert(dbRoommate);
      if (error && error.code === 'PGRST204') {
        const { postedBy, ...dbRoommateFallback } = dbRoommate;
        error = (await supabase.from('roommates').insert(dbRoommateFallback)).error;
      }
      if (error) console.error("Error inserting roommate to Supabase:", error);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    // Optimistic UI Update
    setRooms((prev) => prev.filter((r) => r.id !== id));
    
    // Supabase Delete
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) console.error("Error deleting room from Supabase:", error);
    } else {
      // Local fallback
      const saved = localStorage.getItem("roomiematch_posted_rooms");
      if (saved) {
        const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
        localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(parsed));
      }
    }
  };

  const handleDeleteRoommate = async (id: string) => {
    // Optimistic UI Update
    setRoommates((prev) => prev.filter((r) => r.id !== id));

    // Supabase Delete
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error } = await supabase.from('roommates').delete().eq('id', id);
      if (error) console.error("Error deleting roommate from Supabase:", error);
    } else {
      // Local fallback
      const saved = localStorage.getItem("roomiematch_posted_roommates");
      if (saved) {
        const parsed = JSON.parse(saved).filter((r: any) => r.id !== id);
        localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(parsed));
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
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setSupabaseReviews(data);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const customOnes = saved ? JSON.parse(saved) : [];
    
    // Deduplicate: INITIAL_ROOMMATES override older Supabase entries
    const initialIds = INITIAL_ROOMMATES.map(r => r.id);
    const filteredSupabase = supabaseRoommates.filter(r => !initialIds.includes(r.id));
    
    const allCandidatesRaw = [...customOnes, ...filteredSupabase, ...INITIAL_ROOMMATES];
    const uniqueCandidatesMap = new Map();
    allCandidatesRaw.forEach(r => {
      if (!uniqueCandidatesMap.has(r.id)) {
        uniqueCandidatesMap.set(r.id, r);
      }
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
          matchScore: r.id === "me" ? 100 : normalized,
          reviews: [...dbReviews, ...(r.reviews || [])],
          avatar: isOwner ? currentUserProfile.avatar : r.avatar,
          name: isOwner ? currentUserProfile.name : r.name,
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
      if (!uniqueRoomsMap.has(r.id)) {
        uniqueRoomsMap.set(r.id, r);
      }
    });
    let allRooms = Array.from(uniqueRoomsMap.values());

    if (currentUserProfile) {
      allRooms = allRooms.map(r => {
        const isOwner = (currentUser && r.postedBy === currentUser.id) || r.hostName === currentUserProfile.name;
        return {
          ...r,
          hostAvatar: isOwner ? currentUserProfile.avatar : r.hostAvatar,
          hostName: isOwner ? currentUserProfile.name : r.hostName,
        };
      });
    }
    setRooms(allRooms);
  }, [currentUserProfile, currentUser, supabaseRooms]);

  const handleSaveProfile = (profile: any) => {
    setCurrentUserProfile(profile);
    localStorage.setItem("roomiematch_user_profile", JSON.stringify(profile));
  };

  const handleLoginSuccess = async (user: any) => {
    if (window.history.state?.modal) { window.history.back(); } else { setIsLoginModalOpen(false); }
    
    let hasProfile = false;
    if (user && user.id) {
      const { data } = await supabase.from('roommates').select('*').eq('postedBy', user.id).maybeSingle();
      if (data) {
        hasProfile = true;
        setCurrentUserProfile(data);
        localStorage.setItem("roomiematch_user_profile", JSON.stringify(data));
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
  };

  const startChatConversation = async (roommateId: string) => {
    const isAuth = await requireAuth();
    if (!isAuth) return;
    if (window.history.state?.modal) { window.history.back(); } else { setSelectedRoommate(null); setSelectedRoom(null); }
    setActiveChatRoommateId(roommateId);
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
      cookMatch: currentUserProfile.lifestyle.cook === roommate.lifestyle.cook,
      neatMatch: currentUserProfile.lifestyle.neatness === roommate.lifestyle.neatness,
    };
  };

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
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      />

      {/* 2. Primary Tab Contents Display Body */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-12 flex-grow">
        {activeTab === "home" && (
          <HomeView
            roommates={roommates}
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
          />
        )}

        {activeTab === "roommates" && (
          <RoommatesView
            roommates={roommates}
            likedRoommateIds={likedRoommateIds}
            onLikeRoommate={handleLikeRoommate}
            onViewRoommate={setSelectedRoommate}
            currentUserProfile={currentUserProfile}
            onStartChat={startChatConversation}
            onOpenPostModal={() => handleOpenPostModal("roommate")}
            onRequireAuth={requireAuth}
            onDeleteRoommate={handleDeleteRoommate}
            onEditRoommate={handleEditRoommate}
            currentUserId={currentUser?.id}
            initialFilters={globalSearchFilters}
          />
        )}

        {activeTab === "rooms" && (
          <RoomsView
            rooms={rooms}
            likedRoomIds={likedRoomIds}
            onLikeRoom={handleLikeRoom}
            onViewRoom={setSelectedRoom}
            onOpenPostModal={() => handleOpenPostModal("room")}
            currentUserProfile={currentUserProfile}
            onRequireAuth={requireAuth}
            onDeleteRoom={handleDeleteRoom}
            onEditRoom={handleEditRoom}
            currentUserId={currentUser?.id}
          />
        )}

        {activeTab === "chat" && (
          <ChatView
            roommates={roommates}
            initialChats={SUGGGESTED_CHATS}
            activeRoommateId={activeChatRoommateId}
            setActiveRoommateId={setActiveChatRoommateId}
            currentUserProfile={currentUserProfile}
            currentUser={currentUser}
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
            onNavigateToTab={setActiveTab}
            onStartAgreement={startAgreementForm}
            onViewProfile={(id) => setSelectedRoommate(roommates.find(r => r.id === id) || null)}
          />
        )}

        {activeTab === "agreement" && (
          <AgreementView
            roommates={roommates}
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
            roommates={roommates}
            onRequireAuth={requireAuth}
            onRequireProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === "info" && (
          <InfoView />
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
          onDeleteProfile={(id) => {
            handleDeleteRoommate(id);
            if (currentUserProfile && currentUserProfile.id === id) {
              setCurrentUserProfile(null);
              localStorage.removeItem("roomiematch_user_profile");
            }
            setSelectedRoommate(null);
            alert("Đã xóa hồ sơ thành công!");
          }}
        />
      )}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          roommates={roommates}
          onClose={handleCloseModal}
          onInquire={handleRoomInquiry}
          onAddReview={handleAddRoomReview}
          isOwnProfile={!!currentUser && ((selectedRoom.postedBy === currentUser.id) || (currentUserProfile && selectedRoom.hostName === currentUserProfile.name))}
          onDeleteRoom={(id) => {
            handleDeleteRoom(id);
            setSelectedRoom(null);
            alert("Đã xóa tin đăng thành công!");
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
