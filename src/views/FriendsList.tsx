import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Check, X } from 'lucide-react';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
import { supabase } from '../lib/supabase';

interface FriendsListProps {
  session: any;
  onFriendClick?: (friendId: string) => void;
  onSearchClick?: () => void;
}

export function FriendsList({ 
  session, 
  onFriendClick, 
  onSearchClick 
}: FriendsListProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [incomingFriend, setIncomingFriend] = useState<any>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    fetchFriends();
  }, [session]);

  const fetchFriends = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend:profiles!friends_friend_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('user_id', session.user.id);
      
      if (error) {
        // Fallback simple fetch if join fails
        const { data: simpleData } = await supabase
          .from('friends')
          .select(`
            friend_id,
            profiles:friend_id (
              id,
              full_name,
              avatar_url,
              email
            )
          `)
          .eq('user_id', session.user.id);
        setFriendsList(simpleData?.map((d: any) => d.profiles) || []);
      } else {
        const friends = data?.map((f: any) => ({
          id: f.friend?.id || f.friend_id,
          name: f.friend?.full_name || 'Friend',
          username: f.friend?.email || '',
          color: '#D9D9D9',
          balance: 0,
          isPendingRequest: f.status === 'pending',
          avatar_url: f.friend?.avatar_url,
        })) || [];
        setFriendsList(friends);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      setFriendsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', session.user.id)
        .eq('friend_id', id);
      setIncomingFriend(null);
      fetchFriends();
    } catch (err) {
      console.error('Error approving friend:', err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', session.user.id)
        .eq('friend_id', id);
      setIncomingFriend(null);
      fetchFriends();
    } catch (err) {
      console.error('Error declining friend:', err);
    }
  };

  const filteredFriends = friendsList.filter(f => activeTab === 'pending' ? f.isPendingRequest : !f.isPendingRequest);

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 pt-[160px]">
      
      {/* Fixed Header Container */}
      <div 
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#EDEDF1] transition-transform duration-300 ease-in-out ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[480px] mx-auto">
          <div className="px-6 pt-10 pb-4 flex justify-between items-center h-[88px]">
            <h1 className="text-black text-5xl font-bold font-display tracking-tight leading-none">Friends</h1>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('all')}
              className={`h-8 px-5 rounded-[35px] text-lg font-semibold whitespace-nowrap flex items-center justify-center transition-colors cursor-pointer ${activeTab === 'all' ? 'bg-[#1A1A1A] text-[#EDEDF1]' : 'bg-[#D9D9D9] text-black'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`h-8 px-5 rounded-[35px] text-lg font-semibold whitespace-nowrap flex items-center justify-center transition-colors cursor-pointer ${activeTab === 'pending' ? 'bg-[#1A1A1A] text-[#EDEDF1]' : 'bg-[#D9D9D9] text-black'}`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] mx-auto">
        
        {/* Friends Cards */}
        <div className="px-5 flex flex-col gap-3.5">
          {isLoading ? (
            <div className="text-center mt-10 text-black/50">Loading friends...</div>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div 
                key={friend.id}
                onClick={() => {
                  if (activeTab === 'pending') {
                    setIncomingFriend(friend);
                  } else {
                    onFriendClick?.(friend.id);
                  }
                }}
                className="w-full bg-[#D9D9D9] rounded-[30px] px-6 py-4.5 relative flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
              >
                {/* Left Side: Avatar & Details */}
                <div className="flex items-center gap-3.5">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-[44px] h-[44px] rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-[44px] h-[44px] rounded-full bg-[#E5E7EB] opacity-50 shrink-0" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-[#1A1A1A] text-xl font-semibold leading-tight">
                      {friend.name}
                    </span>
                    <span className="text-black/60 text-xs font-normal mt-0.5">
                      {friend.username}
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Icons OR Balances */}
                {activeTab === 'pending' ? (
                  <div className="flex items-center gap-3 shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setIncomingFriend(friend)}
                      className="w-[32px] h-[32px] flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] border border-black/10 shadow-sm cursor-pointer"
                    >
                      <Check size={18} strokeWidth={3} className="text-[#4C8C3C]" />
                    </button>
                    <button 
                      onClick={() => handleDecline(friend.id)}
                      className="w-[32px] h-[32px] flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] border border-black/10 shadow-sm cursor-pointer"
                    >
                      <X size={16} strokeWidth={3} className="text-[#F6D6DA]" />
                    </button>
                  </div>
                ) : (
                  friend.balance !== 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      {friend.balance > 0 ? (
                        <ArrowDownLeft size={22} strokeWidth={2.5} className="text-black" />
                      ) : (
                        <ArrowUpRight size={22} strokeWidth={2.5} className="text-black" />
                      )}
                      <span className="text-[#1A1A1A] text-2xl font-semibold whitespace-nowrap">
                        LKR {Math.abs(friend.balance)}
                      </span>
                    </div>
                  )
                )}
              </div>
            ))
          ) : (
            <div className="text-center mt-10 text-black/50">
              {activeTab === 'pending' ? 'No pending requests.' : 'No friends found. Tap + to add friends!'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            onClick={onSearchClick}
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Incoming Friend Request Modal */}
      <IncomingFriendRequestModal 
        isOpen={!!incomingFriend}
        onClose={() => setIncomingFriend(null)}
        onApprove={() => incomingFriend && handleApprove(incomingFriend.id)}
        friend={incomingFriend || undefined}
      />

    </div>
  );
}
