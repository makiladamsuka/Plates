import React, { useState } from 'react';
import type { Friend } from '../types';
import { Search, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { FriendRequestPopup } from '../components/FriendRequestPopup';

interface FriendsViewProps {
  friends: Friend[];
  onAddFriend: (name: string, username: string) => void;
  onAcceptRequest: (friendId: string) => void;
  onSelectFriend?: (friend: Friend) => void;
  isDark?: boolean;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  onAddFriend: _onAddFriend,
  onAcceptRequest,
  onSelectFriend,
  isDark = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending'>('all');
  const [selectedPendingFriend, setSelectedPendingFriend] = useState<Friend | null>(null);
  
  // NOTE: In an exact replica, we remove the form modal and just stick to the design. 
  // We'll leave the floating button but maybe it just opens a simple native prompt or dummy modal.

  const activeFriends = friends.filter((f) => !f.isPendingRequest);
  const pendingRequests = friends.filter((f) => f.isPendingRequest);

  const displayedFriends = activeFilter === 'all' ? activeFriends : pendingRequests;

  return (
    <div className={`absolute inset-0 z-10 w-full font-['Sora'] overflow-hidden ${isDark ? 'bg-[#090a0f]' : 'bg-[#ededf1]'}`}>
      
      {/* Soft Pink Background Shape */}
      <div className="absolute top-[-46px] left-0 right-0 h-[135px] bg-[#f6d6da] pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col pt-[48px]">
        {/* Header Title and Search */}
        <div className="px-[24px] flex items-center justify-between pb-[16px]">
          <h1 className="text-[40px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
            Friends
          </h1>
          <button className="w-[40px] h-[40px] rounded-full bg-white/50 border border-black/[0.04] flex items-center justify-center text-[#1a1a1a] shadow-sm hover:bg-white/80 transition-colors">
            <Search className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="px-[24px] flex items-center gap-[12px] pb-[8px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`h-[36px] px-[20px] rounded-full text-[14px] font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#1a1a1a] text-white shadow-md'
                : 'bg-white/80 text-[#1a1a1a] hover:bg-white border border-black/[0.04] shadow-sm'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`h-[36px] px-[20px] rounded-full text-[14px] font-bold transition-all ${
              activeFilter === 'pending'
                ? 'bg-[#1a1a1a] text-white shadow-md'
                : 'bg-white/80 text-[#1a1a1a] hover:bg-white border border-black/[0.04] shadow-sm'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto mt-[16px] px-[24px] pb-[120px] space-y-[12px]">
          {displayedFriends.map((friend) => {
            const isOwed = friend.balance >= 0;
            return (
              <div
                key={friend.id}
                onClick={() => {
                  if (friend.isPendingRequest) {
                    setSelectedPendingFriend(friend);
                  } else if (onSelectFriend) {
                    onSelectFriend(friend);
                  }
                }}
                className={`w-full h-[88px] rounded-[24px] relative cursor-pointer active:scale-[0.99] transition-transform border border-black/[0.04] shadow-sm ${
                  isDark ? 'bg-[#2a2a2a]' : 'bg-white/80 hover:bg-white'
                }`}
              >
                {/* Avatar */}
                <div className="absolute left-[16px] top-[16px] w-[56px] h-[56px] rounded-full overflow-hidden shadow-sm">
                   <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Names */}
                <div className="absolute left-[84px] top-[20px]">
                  <h3 className={`text-[18px] font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    {friend.name}
                  </h3>
                  <p className={`text-[14px] font-medium mt-[4px] ${isDark ? 'text-neutral-400' : 'text-[#1a1a1a]/60'}`}>
                    {friend.username}
                  </p>
                </div>

                {/* Amount / Action */}
                {!friend.isPendingRequest ? (
                  <div className="absolute right-[20px] top-[32px] flex items-center gap-[4px]">
                    {isOwed ? (
                      <ArrowUpRight className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-[#4c8c3c]'}`} />
                    ) : (
                      <ArrowDownLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`} />
                    )}
                    <span className={`text-[18px] font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                      LKR {Math.abs(friend.balance).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="absolute right-[20px] top-[24px] flex items-center gap-[10px]">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Reject logic here
                      }}
                      className="w-[40px] h-[40px] rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptRequest(friend.id);
                      }}
                      className="w-[40px] h-[40px] rounded-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors"
                    >
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 5.5L6 9.5L14 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Button (Exact match from Figma) */}
      <div className="absolute right-[20px] bottom-[110px] w-[64px] h-[64px] bg-[#1a1a1a] rounded-full shadow-lg flex items-center justify-center cursor-pointer z-20 hover:scale-105 active:scale-95 transition-transform">
        <Plus className="w-8 h-8 text-white" />
      </div>

      {/* Pending Request Popup (Figma 26:67) */}
      <FriendRequestPopup 
        friend={selectedPendingFriend} 
        onClose={() => setSelectedPendingFriend(null)} 
        onApprove={() => {
          if (selectedPendingFriend) {
            onAcceptRequest(selectedPendingFriend.id);
            setSelectedPendingFriend(null);
          }
        }}
        isDark={isDark}
      />
    </div>
  );
};


