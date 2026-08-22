import { useState } from 'react';
import { Search, ChevronLeft, UserPlus, Check } from 'lucide-react';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Friend } from '../data/mockData';

interface SearchFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend?: (friend: Friend) => void;
}

// Extra mock users that can be searched and added
const ALL_USERS: Friend[] = [
  ...MOCK_FRIENDS.filter(f => f.id !== 'me'),
  { id: 'u1', name: 'Kasun Bandara', username: '@kasun_b', color: '#4C8C3C', balance: 0 },
  { id: 'u2', name: 'Dilshan Silva', username: '@dilshans', color: '#F5C744', balance: 0 },
  { id: 'u3', name: 'Nirosha Perera', username: '@niro_p', color: '#F6D6DA', balance: 0 },
  { id: 'u4', name: 'Sanuka Wick', username: '@sanuka_w', color: '#CDE1FF', balance: 0 },
];

export function SearchFriendModal({ isOpen, onClose, onAddFriend }: SearchFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  if (!isOpen) return null;

  const filteredUsers = ALL_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = (userId: string, friend: Friend) => {
    setSentRequests(prev => [...prev, userId]);
    onAddFriend?.(friend);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[360px] bg-[#EDEDF1] rounded-[24px] p-6 shadow-2xl relative flex flex-col max-h-[85vh] border border-black/5 font-['Sora']">
        
        {/* Top Header with Back button */}
        <div className="flex items-center gap-3 mb-5">
          <button 
            onClick={onClose}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft size={28} strokeWidth={2.5} className="text-[#1A1A1A]" />
          </button>
          
          {/* Search Input Bar */}
          <div className="flex-1 flex items-center bg-[#D9D9D9]/70 rounded-[30px] px-3.5 py-2">
            <Search size={18} strokeWidth={2.5} className="text-black/60 mr-2 shrink-0" />
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

        {/* Results List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar max-h-[360px] pr-0.5">
          {filteredUsers.map((user) => {
            const isSent = sentRequests.includes(user.id);
            return (
              <div 
                key={user.id}
                className="w-full h-[59px] bg-[#D9D9D9] rounded-[35px] px-4 flex items-center justify-between shadow-sm transition-all"
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

                {/* Add Friend / Requested button */}
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
            <div className="text-center py-8 text-black/40 text-sm font-light">
              No people found matching "{searchQuery}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
