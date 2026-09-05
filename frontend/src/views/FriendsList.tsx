import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownLeft, Check, X } from 'lucide-react';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
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
        <div className="px-5 md:px-0 mt-2 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="w-full bg-[#D9D9D9] dark:bg-zinc-900 rounded-[30px] px-6 py-4.5 relative flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
              >
                {/* Left Side: Avatar & Details */}
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt="" className="w-[44px] h-[44px] rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-[44px] h-[44px] rounded-full bg-[#E5E7EB] dark:bg-zinc-800 opacity-50 shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#1A1A1A] dark:text-zinc-100 text-xl font-semibold leading-tight truncate">
                      {friend.name}
                    </span>
                    <span className="text-black/60 dark:text-zinc-400 text-xs font-normal mt-0.5 truncate">
                      {friend.username}
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Icons OR Balances + Quick Delete */}
                {activeTab === 'pending' ? (
                  <div className="flex items-center gap-3 shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleApprove(friend.id)}
                      title="Accept Request"
                      className="w-[32px] h-[32px] flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-sm cursor-pointer hover:bg-[#4C8C3C] dark:hover:bg-[#4C8C3C] hover:text-white group"
                    >
                      <Check size={18} strokeWidth={3} className="text-[#4C8C3C] dark:text-[#5FAD4B] group-hover:text-white" />
                    </button>
                    <button 
                      onClick={() => handleDecline(friend.id)}
                      title="Decline Request"
                      className="w-[32px] h-[32px] flex items-center justify-center rounded-full active:scale-95 transition-transform bg-[#EDEDF1] dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-sm cursor-pointer hover:bg-[#F6D6DA] dark:hover:bg-red-900/50 group"
                    >
                      <X size={16} strokeWidth={3} className="text-[#F6D6DA] dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    {friend.balance !== 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {friend.balance > 0 ? (
                          <ArrowDownLeft size={20} strokeWidth={2.5} className="text-[#4C8C3C] dark:text-[#5FAD4B]" />
                        ) : (
                          <ArrowUpRight size={20} strokeWidth={2.5} className="text-red-500" />
                        )}
                        <span className="text-[#1A1A1A] dark:text-zinc-100 text-lg font-semibold whitespace-nowrap">
                          LKR {Math.abs(friend.balance)}
                        </span>
                      </div>
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
      <div className="fixed bottom-[140px] md:bottom-10 left-0 md:left-auto md:right-10 w-full md:w-auto z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] md:w-auto relative">
          <button 
            onClick={onSearchClick}
            className="absolute bottom-0 right-6 md:static w-20 h-20 md:w-16 md:h-16 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer hover:bg-black/80 dark:hover:bg-zinc-300"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1] dark:text-zinc-950">
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
