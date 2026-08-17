import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Check, X } from 'lucide-react';
import { SearchFriendModal } from '../components/SearchFriendModal';
import { MOCK_FRIENDS } from '../data/mockData';
import type { Friend } from '../data/mockData';

interface FriendsListProps {
  onFriendClick?: (friendId: string) => void;
}

export function FriendsList({ onFriendClick }: FriendsListProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide header if scrolling down & past 50px
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      } 
      // Show header if scrolling up
      else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter friends based on tab
  const friends = MOCK_FRIENDS.filter(f => f.id !== 'me').filter(f => {
    if (activeTab === 'pending') return f.isPendingRequest;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 pt-[160px]">
      
      {/* Fixed Header Container */}
      <div 
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#EDEDF1] transition-transform duration-300 ease-in-out ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[480px] mx-auto">
          <div className="px-6 pt-10 pb-4 flex justify-between items-center">
            <h1 className="text-black text-5xl font-bold font-['Sora']">Friends</h1>
            {/* Search Icon */}
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Search size={24} strokeWidth={2.5} className="text-black" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('all')}
              className={`h-8 px-5 rounded-[35px] text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center transition-colors ${activeTab === 'all' ? 'bg-[#1A1A1A] text-[#EDEDF1]' : 'bg-[#D9D9D9] text-black'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`h-8 px-5 rounded-[35px] text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center transition-colors ${activeTab === 'pending' ? 'bg-[#1A1A1A] text-[#EDEDF1]' : 'bg-[#D9D9D9] text-black'}`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Main Content constrained to max width for desktop viewing */}
      <div className="max-w-[480px] mx-auto">
        
        {/* Friends Cards */}
        <div className="px-5 flex flex-col gap-4">
          {friends.map((friend, i) => (
            <div 
              key={friend.id}
              onClick={() => onFriendClick?.(friend.id)}
              className="w-full h-[100px] bg-[#D9D9D9] rounded-[35px] px-5 relative flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
            >
              {/* Left Side: Avatar & Details */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-[50px] h-[50px] rounded-full opacity-50 shrink-0" 
                  style={{ backgroundColor: friend.color }}
                />
                <div className="flex flex-col">
                  <span className="text-[#1A1A1A] text-2xl font-semibold font-['Sora'] leading-tight">
                    {friend.name}
                  </span>
                  <span className="text-black text-[15px] font-normal font-['Sora'] mt-1">
                    {friend.username}
                  </span>
                </div>
              </div>

              {/* Right Side: Action Icons OR Balances */}
              {activeTab === 'pending' ? (
                <div className="flex items-center gap-4 shrink-0 pr-2">
                  <button className="w-[30px] h-[30px] flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] border border-black/10 shadow-sm">
                    <Check size={18} strokeWidth={3} className="text-[#4C8C3C]" />
                  </button>
                  <button className="w-6 h-6 flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] border border-black/10 shadow-sm">
                    <X size={14} strokeWidth={3} className="text-[#F6D6DA]" />
                  </button>
                </div>
              ) : (
                friend.balance !== 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    {friend.balance > 0 ? (
                      // They owe you -> incoming arrow
                      <ArrowDownLeft size={24} strokeWidth={2.5} className="text-black" />
                    ) : (
                      // You owe them -> outgoing arrow
                      <ArrowUpRight size={24} strokeWidth={2.5} className="text-black" />
                    )}
                    <span className="text-[#1A1A1A] text-xl font-semibold font-['Sora'] whitespace-nowrap">
                      LKR {Math.abs(friend.balance)}
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
          {friends.length === 0 && (
            <div className="text-center mt-10 text-black/50 font-['Sora']">
              {activeTab === 'pending' ? 'No pending requests.' : 'No friends found.'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Friend Modal */}
      <SearchFriendModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

    </div>
  );
}
