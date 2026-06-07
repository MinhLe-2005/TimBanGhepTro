import { useState, useEffect } from "react";
import { INITIAL_ROOMMATES, INITIAL_ROOMS, SUGGGESTED_CHATS } from "./data";
import { Roommate, Room } from "./types";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import RoommatesView from "./components/RoommatesView";
import RoomsView from "./components/RoomsView";
import ChatView from "./components/ChatView";
import AgreementView from "./components/AgreementView";

import RoommateModal from "./components/RoommateModal";
import RoomModal from "./components/RoomModal";
import CreateProfileModal from "./components/CreateProfileModal";
import LoginModal from "./components/LoginModal";
import PostListingModal from "./components/PostListingModal";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  
  // Authentication states
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("roomiematch_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Persistence for user profile
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(() => {
    const saved = localStorage.getItem("roomiematch_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

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

  const handleOpenPostModal = (tab: "roommate" | "room") => {
    setPostModalInitialTab(tab);
    setIsPostModalOpen(true);
  };

  const handleAddRoom = (newRoom: Room) => {
    setRooms((prev) => {
      const updated = [newRoom, ...prev];
      const customRooms = updated.filter((r) => r.id.startsWith("room-"));
      localStorage.setItem("roomiematch_posted_rooms", JSON.stringify(customRooms));
      return updated;
    });
  };

  const handleAddRoommate = (newRoommate: Roommate) => {
    setRoommates((prev) => {
      const updated = [newRoommate, ...prev];
      const customRoommates = updated.filter((r) => r.id.startsWith("rm-"));
      localStorage.setItem("roomiematch_posted_roommates", JSON.stringify(customRoommates));
      return updated;
    });
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
    setLikedRoommateIds((prev) => {
      const next = isLiked ? [...prev, id] : prev.filter((x) => x !== id);
      localStorage.setItem("roomiematch_liked_roommates", JSON.stringify(next));
      return next;
    });
  };

  const handleLikeRoom = (id: string, isLiked: boolean) => {
    setLikedRoomIds((prev) => {
      const next = isLiked ? [...prev, id] : prev.filter((x) => x !== id);
      localStorage.setItem("roomiematch_liked_rooms", JSON.stringify(next));
      return next;
    });
  };

  // Modal display states
  const [selectedRoommate, setSelectedRoommate] = useState<Roommate | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Chat coordination
  const [activeChatRoommateId, setActiveChatRoommateId] = useState<string | null>(null);

  // Calculate matching scores dynamically if user profile changes
  useEffect(() => {
    const saved = localStorage.getItem("roomiematch_posted_roommates");
    const customOnes = saved ? JSON.parse(saved) : [];
    const allCandidates = [...customOnes, ...INITIAL_ROOMMATES];

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
        return {
          ...r,
          matchScore: r.id === "me" ? 100 : normalized,
        };
      });

      // Sort by match score from largest to smallest
      setRoommates(updated.sort((a, b) => b.matchScore - a.matchScore));
    } else {
      setRoommates(allCandidates);
    }
  }, [currentUserProfile, roommates.length]);

  const handleSaveProfile = (profile: any) => {
    setCurrentUserProfile(profile);
    localStorage.setItem("roomiematch_user_profile", JSON.stringify(profile));
    setIsProfileModalOpen(false);
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("roomiematch_user", JSON.stringify(user));
    setIsLoginModalOpen(false);

    // Automatically synchronize or pre-fill roommate profile info if none exists
    if (!currentUserProfile) {
      const defaultProfile = {
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        age: 21,
        gender: "Nam",
        district: "Liên Chiểu",
        role: "Sinh viên",
        budget: 2500000,
        bio: "Xin chào! Mình vừa đăng nhập và đang muốn tìm bạn ở ghép tử tế, thân thiện tại Đà Nẵng.",
        isVerified: false,
        status: "chưa tìm được bạn",
        matchScore: 100,
        tags: ["Ngủ sớm", "Kín đáo", "Không"],
        lifestyle: {
          sleep: "Ngủ sớm",
          neatness: "Kín đáo",
          smoke: "Không",
          cook: "Thường xuyên",
          pets: "Không nuôi"
        }
      };
      setCurrentUserProfile(defaultProfile);
      localStorage.setItem("roomiematch_user_profile", JSON.stringify(defaultProfile));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("roomiematch_user");
    
    // Reset/clear current local profile matching details as well
    setCurrentUserProfile(null);
    localStorage.removeItem("roomiematch_user_profile");
  };

  const startChatConversation = (roommateId: string) => {
    setSelectedRoommate(null);
    setActiveChatRoommateId(roommateId);
    setActiveTab("chat");
  };

  const startAgreementForm = (roommateId: string) => {
    setSelectedRoommate(null);
    setActiveChatRoommateId(roommateId);
    setActiveTab("agreement");
  };

  const handleRoomInquiry = (hostName: string) => {
    setSelectedRoom(null);
    
    // Find matching roommate profile, or fallback to first roommate
    const matchedRoommate = roommates.find((r) => r.name === hostName) || roommates[0];
    setActiveChatRoommateId(matchedRoommate.id);
    setActiveTab("chat");
  };

  const handleAddReview = (roommateId: string, review: { reviewerName: string; rating: number; comment: string; imageUrl?: string }) => {
    setRoommates((prev) =>
      prev.map((r) => {
        if (r.id === roommateId) {
          const newReview = {
            id: `rev-${Date.now()}`,
            reviewerName: review.reviewerName || "Bạn ở ghép ẩn danh",
            reviewerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
            rating: review.rating,
            comment: review.comment,
            imageUrl: review.imageUrl,
            createdAt: new Date().toLocaleDateString("vi-VN"),
          };
          const updatedReviews = [newReview, ...(r.reviews || [])];
          
          let newScore = r.reputationScore;
          if (review.rating >= 4) {
            newScore = Math.min(100, r.reputationScore + 1);
          } else {
            newScore = Math.max(50, r.reputationScore - 10);
          }

          const updatedRoommate = {
            ...r,
            reviews: updatedReviews,
            reputationScore: newScore,
          };

          if (selectedRoommate && selectedRoommate.id === roommateId) {
            setSelectedRoommate(updatedRoommate);
          }

          return updatedRoommate;
        }
        return r;
      })
    );
  };

  const handleAddRoomReview = (roomId: string, review: { reviewerName: string; rating: number; comment: string; images: string[] }) => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#f6fafe] to-white flex flex-col justify-between">
      {/* 1. Sticky Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateProfile={() => setIsProfileModalOpen(true)}
        currentUserProfile={currentUserProfile}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Primary Tab Contents Display Body */}
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
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
            onNavigateToTab={setActiveTab}
            onStartChat={startChatConversation}
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
          />
        )}

        {activeTab === "rooms" && (
          <RoomsView
            rooms={rooms}
            likedRoomIds={likedRoomIds}
            onLikeRoom={handleLikeRoom}
            onViewRoom={setSelectedRoom}
            onOpenPostModal={() => handleOpenPostModal("room")}
          />
        )}

        {activeTab === "chat" && (
          <ChatView
            roommates={roommates}
            initialChats={SUGGGESTED_CHATS}
            activeRoommateId={activeChatRoommateId}
            setActiveRoommateId={setActiveChatRoommateId}
          />
        )}

        {activeTab === "agreement" && (
          <AgreementView
            roommates={roommates}
            currentUserProfile={currentUserProfile}
            preSelectedRoommateId={activeChatRoommateId}
          />
        )}
      </main>

      {/* 3. Footer Bar Section */}
      <Footer />

      {/* Modals Popup Layers */}
      {selectedRoommate && (
        <RoommateModal
          roommate={selectedRoommate}
          onClose={() => setSelectedRoommate(null)}
          onStartChat={startChatConversation}
          onStartAgreement={startAgreementForm}
          compatibilityDetails={getCompatibilityDetails(selectedRoommate)}
          onAddReview={handleAddReview}
        />
      )}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onInquire={handleRoomInquiry}
          onAddReview={handleAddRoomReview}
          roommates={roommates}
        />
      )}

      {isProfileModalOpen && (
        <CreateProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          onSave={handleSaveProfile}
          currentProfile={currentUserProfile}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isPostModalOpen && (
        <PostListingModal
          onClose={() => setIsPostModalOpen(false)}
          onAddRoom={handleAddRoom}
          onAddRoommate={handleAddRoommate}
          initialTab={postModalInitialTab}
        />
      )}
    </div>
  );
}
