import React, { useState } from 'react';
import { Search, ChevronLeft, UserPlus, Check } from 'lucide-react';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Friend } from '../data/mockData';

interface SearchFriendsProps {
  onBack: () => void;
  onAddFriend?: (friend: Friend) => void;
}

const ALL_USERS: Friend[] = [
  ...MOCK_FRIENDS.filter(f => f.id !== 'me'),
  { id: 'u1', name: 'Kasun Bandara', username: '@kasun_b', color: '#4C8C3C', balance: 0 },
  { id: 'u2', name: 'Dilshan Silva', username: '@dilshans', color: '#F5C744', balance: 0 },
  { id: 'u3', name: 'Nirosha Perera', username: '@niro_p', color: '#F6D6DA', balance: 0 },
  { id: 'u4', name: 'Sanuka Wick', username: '@sanuka_w', color: '#CDE1FF', balance: 0 },
  { id: 'u5', name: 'Dhanushka R', username: '@dhanu_r', color: '#4F7F3B', balance: 0 },
  { id: 'u6', name: 'Prabath Jay', username: '@prabath_j', color: '#FDD356', balance: 0 },
];

export function SearchFriends({ onBack, onAddFriend }: SearchFriendsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const filteredUsers = ALL_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = (userId: string, friend: Friend) => {
    setSentRequests(prev => [...prev, userId]);
    onAddFriend?.(friend);
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-36 font-['Sora'] relative">
      
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-4 active:scale-95 transition-transform"
        >
          <ChevronLeft size={30} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </button>

        {/* Search Bar matching Figma */}
        <div className="w-full flex items-center bg-[#D9D9D9]/80 rounded-[30px] px-4 py-2.5 shadow-sm">
          <Search size={20} strokeWidth={2.5} className="text-black/60 mr-3 shrink-0" />
          <input 
            type="text"
            placeholder="Search People"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="bg-transparent text-[#1A1A1A] placeholder:text-black/50 text-[15px] font-light outline-none w-full"
          />
        </div>
      </div>

      {/* User Results List */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        {filteredUsers.map((user) => {
          const isSent = sentRequests.includes(user.id);
          return (
            <div 
              key={user.id}
              className="w-full h-[59px] bg-[#D9D9D9] rounded-[35px] px-4 flex items-center justify-between shadow-sm"
            >
              {/* User Avatar + Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-[39px] h-[39px] rounded-full opacity-40 shrink-0"
                  style={{ backgroundColor: user.color }}
                />
                <div className="flex flex-col truncate">
                  <span className="text-[#1A1A1A] text-[13px] font-semibold leading-tight truncate">
                    {user.name}
                  </span>
                  <span className="text-black text-[11px] font-light leading-tight mt-0.5 truncate">
                    {user.username}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => !isSent && handleSendRequest(user.id, user)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSent 
                    ? 'bg-[#4C8C3C] text-white' 
                    : 'bg-[#1A1A1A] text-[#EDEDF1] active:scale-95'
                }`}
              >
                {isSent ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <UserPlus size={16} strokeWidth={2} />
                )}
              </button>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-black/40 text-sm font-light">
            No people found matching "{searchQuery}"
          </div>
        )}
      </div>

    </div>
  );
}
