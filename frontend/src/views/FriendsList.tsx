import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownLeft, Check, X } from 'lucide-react';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
import { Avatar } from '../components/Avatar';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { useData } from '../lib/DataContext';

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
  const { bills, friends, setFriends, pendingFriendRequests, setPendingFriendRequests, fetchFriends, fetchPendingFriends } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [incomingFriend, setIncomingFriend] = useState<any>(null);

  const currentUid = session?.user?.id || '';

  // Calculate real-time friend balances from cached bills
  const acceptedFriends = (friends || []).map((f: any) => {
    let bal = 0;
    if (currentUid && f.id) {
      (bills || []).forEach((b: any) => {
        if (b.status === 'Settled') return;
        const isCreatorMe = b.creator_id === currentUid;
        const isFriendCreator = b.creator_id === f.id;
        const parts = b.participants || [];
        const friendPart = parts.find((p: any) => p.friend_id === f.id || p.friendId === f.id);
        const myPart = parts.find((p: any) => p.friend_id === currentUid || p.friendId === currentUid);

        if (isCreatorMe && friendPart && !friendPart.paid) {
          bal += Number(friendPart.share || 0);
        } else if (isFriendCreator && myPart && !myPart.paid) {
          bal -= Number(myPart.share || 0);
        }
      });
    }
    return { ...f, balance: bal };
  });

  const pendingRequests = pendingFriendRequests || [];

  const acceptMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      // Optimistically update local cache
      const pendingUser = pendingRequests.find((p: any) => p.id === requesterId);
      if (pendingUser) {
        setFriends(prev => [...prev, { ...pendingUser, isPendingRequest: false }]);
        setPendingFriendRequests(prev => prev.filter((p: any) => p.id !== requesterId));
      }
      setIncomingFriend(null);

      // 1. Try Supabase RPC
      const { error: rpcErr } = await supabase.rpc('accept_friend_request', {
        p_requester_id: requesterId,
        p_friend_id: session.user.id
      });

      if (rpcErr) {
        // Fallback direct updates
        await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', requesterId)
          .eq('friend_id', session.user.id);

        await supabase
          .from('friends')
          .upsert({ user_id: session.user.id, friend_id: requesterId, status: 'accepted' });
      }

      await api.acceptFriend(requesterId, session.user.id).catch(console.warn);
      fetchFriends(session.user.id);
      fetchPendingFriends(session.user.id);
    }
  });

  const declineMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      setPendingFriendRequests(prev => prev.filter((p: any) => p.id !== requesterId));
      setIncomingFriend(null);

      await supabase
        .from('friends')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', session.user.id);
        
      fetchPendingFriends(session.user.id);
    }
  });

  const handleApprove = (id: string) => acceptMutation.mutate(id);
  const handleDecline = (id: string) => declineMutation.mutate(id);

  const displayList = activeTab === 'pending' ? pendingRequests : acceptedFriends;

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-[160px] md:pt-0 font-['Sora'] transition-colors">
      
      {/* Header Container */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#EDEDF1] dark:bg-zinc-950 md:sticky md:left-0 md:translate-x-0 md:max-w-full md:px-10 md:pt-4 transition-colors">
        <div className="max-w-[480px] md:max-w-6xl mx-auto">
          <div className="px-6 md:px-0 pt-10 pb-4 flex justify-between items-center h-[88px] md:hidden">
            <h1 className="text-black dark:text-zinc-100 text-5xl font-bold font-display tracking-tight leading-none">Friends</h1>
            <button 
              onClick={onSearchClick}
              className="w-6 h-6 flex items-center justify-center cursor-pointer text-black dark:text-zinc-100 active:scale-95 transition-transform"
              title="Search Friends"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 md:px-0 pb-4 md:pt-12 flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('all')}
              className={`h-8 px-4 md:px-5 rounded-[35px] text-sm md:text-base font-semibold whitespace-nowrap shrink-0 flex items-center justify-center transition-colors cursor-pointer ${activeTab === 'all' ? 'bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950' : 'bg-[#D9D9D9] dark:bg-zinc-900 text-black dark:text-zinc-100'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={`h-8 px-4 md:px-5 rounded-[35px] text-sm md:text-base font-semibold whitespace-nowrap shrink-0 flex items-center justify-center transition-colors cursor-pointer ${activeTab === 'pending' ? 'bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950' : 'bg-[#D9D9D9] dark:bg-zinc-900 text-black dark:text-zinc-100'}`}
            >
              Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] md:max-w-6xl mx-auto md:px-10">
        
        {/* Friends Cards */}
        <div className="px-5 md:px-0 mt-2 flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-6">
          {displayList.length > 0 ? (
            displayList.map((friend) => (
              <div 
                key={friend.id}
                onClick={() => {
                  if (activeTab === 'pending') {
                    setIncomingFriend(friend);
                  } else {
                    onFriendClick?.(friend.id);
                  }
                }}
                className="w-full bg-[#D9D9D9] dark:bg-zinc-900 rounded-[28px] px-4.5 sm:px-5 py-3.5 sm:py-4 relative flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5 gap-3"
              >
                {/* Left Side: Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar 
                    src={friend.avatar_url} 
                    name={friend.name} 
                    className="w-10 h-10 sm:w-11 sm:h-11"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm sm:text-base font-bold leading-tight break-words line-clamp-2">
                      {friend.name}
                    </span>
                    <span className="text-black/50 dark:text-zinc-400 text-[11px] sm:text-xs font-normal mt-0.5 truncate">
                      {friend.username || (friend.name ? `@${friend.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '')}
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Icons OR Balances */}
                {activeTab === 'pending' ? (
                  <div className="flex items-center gap-2 shrink-0 pr-0.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleApprove(friend.id)}
                      title="Accept Request"
                      className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-sm cursor-pointer hover:bg-[#4C8C3C] dark:hover:bg-[#4C8C3C] hover:text-white group"
                    >
                      <Check size={16} strokeWidth={3} className="text-[#4C8C3C] dark:text-[#5FAD4B] group-hover:text-white" />
                    </button>
                    <button 
                      onClick={() => handleDecline(friend.id)}
                      title="Decline Request"
                      className="w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-sm cursor-pointer hover:bg-[#F6D6DA] dark:hover:bg-red-900/50 group"
                    >
                      <X size={15} strokeWidth={3} className="text-[#F6D6DA] dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    {friend.balance !== 0 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {friend.balance > 0 ? (
                          <ArrowDownLeft size={18} strokeWidth={2.5} className="text-[#4C8C3C] dark:text-[#5FAD4B]" />
                        ) : (
                          <ArrowUpRight size={18} strokeWidth={2.5} className="text-red-500" />
                        )}
                        <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm sm:text-base font-bold whitespace-nowrap">
                          LKR {Math.abs(friend.balance).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-black/50 dark:text-zinc-400">
                        Settled
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center mt-10 text-black/50 dark:text-zinc-500 text-sm">
              {activeTab === 'pending' ? 'No pending friend requests.' : 'No friends found. Tap + to search and add friends!'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[115px] md:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[480px] md:w-auto md:left-auto md:right-10 md:translate-x-0 z-40 pointer-events-none">
        <div className="w-full relative">
          <button 
            onClick={onSearchClick}
            className="absolute bottom-0 right-6 md:static w-16 h-16 md:w-16 md:h-16 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer hover:bg-black/80 dark:hover:bg-zinc-300"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1] dark:text-zinc-950">
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
