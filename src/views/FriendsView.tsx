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
    <div className={`relative h-full w-full font-['Sora'] overflow-hidden ${isDark ? 'bg-[#090a0f]' : 'bg-[#ededf1]'}`}>
      
      {/* Soft Pink Background Shape (Figma 70:129 & 70:130) */}
      <div className="absolute top-[-46px] left-0 right-0 h-[135px] bg-[#f6d6da] pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col pt-[36px]">
        {/* Header Title and Search */}
        <div className="px-[22px] flex items-center justify-between">
          <h1 className="text-[48px] font-bold text-black leading-none">
            Freinds
          </h1>
          <button className="p-2 -mr-2 mt-2">
            <Search className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mt-[20px] px-[22px] flex items-center gap-[9px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`h-[32px] px-[20px] rounded-[35px] text-[18px] font-semibold flex items-center justify-center transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#1a1a1a] text-[#ededf1]'
                : isDark ? 'bg-white/10 text-white' : 'bg-[#d9d9d9] text-black'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`h-[32px] px-[20px] rounded-[35px] text-[18px] font-semibold flex items-center justify-center transition-colors ${
              activeFilter === 'pending'
                ? 'bg-[#1a1a1a] text-[#ededf1]'
                : isDark ? 'bg-white/10 text-white' : 'bg-[#d9d9d9] text-black'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto mt-[18px] px-[9px] pb-[120px] space-y-[10px]">
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
                className={`w-full h-[100px] rounded-[35px] relative cursor-pointer ${
                  isDark ? 'bg-[#2a2a2a]' : 'bg-[#d9d9d9]'
                }`}
              >
                {/* Avatar */}
                <div className="absolute left-[13px] top-[17.74px] w-[54px] h-[54px] rounded-full overflow-hidden">
                   <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Names */}
                <div className="absolute left-[70.76px] top-[17.74px]">
                  <h3 className={`text-[24px] font-semibold leading-[normal] ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    {friend.name}
                  </h3>
                  <p className={`text-[15px] font-normal leading-[normal] mt-[10px] ${isDark ? 'text-neutral-400' : 'text-black'}`}>
                    {friend.username}
                  </p>
                </div>

                {/* Amount / Action */}
                {!friend.isPendingRequest && (
                  <div className="absolute right-[17px] top-[60px] flex items-center gap-[3px]">
                    {isOwed ? (
                      <ArrowUpRight className={`w-6 h-6 stroke-[2] ${isDark ? 'text-white' : 'text-black'}`} />
                    ) : (
                      <ArrowDownLeft className={`w-6 h-6 stroke-[2] ${isDark ? 'text-white' : 'text-black'}`} />
                    )}
                    <span className={`text-[20px] font-semibold leading-[normal] ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                      LKR {Math.abs(friend.balance)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Button (Exact match from Figma) */}
      <div className="absolute right-[15px] bottom-[110px] w-[80px] h-[80px] bg-[#1a1a1a] dark:bg-white rounded-[24px] shadow-lg flex items-center justify-center cursor-pointer z-20">
        <Plus className={`w-8 h-8 ${isDark ? 'text-black' : 'text-white'}`} />
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


