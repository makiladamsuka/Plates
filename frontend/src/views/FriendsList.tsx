import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownLeft, Check, X, Trash2 } from 'lucide-react';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [incomingFriend, setIncomingFriend] = useState<any>(null);
  // Deletion Modal State
  const [selectedDeleteFriend, setSelectedDeleteFriend] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingFriend, setIsDeletingFriend] = useState(false);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);
  useEffect(() => {
    // Real-time listener for friends changes
    const channel = supabase
      .channel('realtime-friends-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
        queryClient.invalidateQueries({ queryKey: ['friends', session?.user?.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['friends', session?.user?.id],
    queryFn: async () => {
      // 1. Fetch Accepted Friends
      const { data: rawAccepted } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', session.user.id)
        .or('status.eq.accepted,status.is.null');

      let accepted: any[] = [];
      if (rawAccepted && rawAccepted.length > 0) {
        const friendIds = rawAccepted.map((f: any) => f.friend_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', friendIds);
        
        accepted = (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Friend',
          username: p.username ? `@${p.username}` : '',
          avatar_url: p.avatar_url,
          balance: 0,
          isPendingRequest: false,
        }));
      }

      // 2. Fetch Pending Friend Requests
      const { data: rawPending } = await supabase
        .from('friends')
        .select('user_id, status')
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      let pending: any[] = [];
      if (rawPending && rawPending.length > 0) {
        const requesterIds = rawPending.map((f: any) => f.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', requesterIds);

        pending = (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'User',
          username: p.username ? `@${p.username}` : '',
          avatar_url: p.avatar_url,
          balance: 0,
          isPendingRequest: true,
        }));
      }
      
      return { accepted, pending };
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  const acceptedFriends = data?.accepted || [];
  const pendingRequests = data?.pending || [];

  const handleInitiateDeleteFriend = async (friend: any, e: React.MouseEvent) => {
    e.stopPropagation();
    let uid = session?.user?.id;
    if (!uid) {
      const { data: { session: s } } = await supabase.auth.getSession();
      uid = s?.user?.id;
    }
    if (!uid) return;

    setSelectedDeleteFriend(friend);
    setIsDeleteModalOpen(true);
    setDeleteBlockedReason(null);

    // Query shared bills to verify if deletion is allowed
    try {
      const { data: rawBills } = await supabase
        .from('bills')
        .select('id, title, status, creator_id, participants(*)');

      const sharedBills = (rawBills || []).filter((b: any) => {
        const parts = b.participants || [];
        const isMeInvolved = b.creator_id === uid || parts.some((p: any) => p.friend_id === uid);
        const isFriendInvolved = b.creator_id === friend.id || parts.some((p: any) => p.friend_id === friend.id);
        return isMeInvolved && isFriendInvolved;
      });

      const unsettled = sharedBills.filter((b: any) => {
        if (b.status === 'Settled') return false;
        const isMeCreator = b.creator_id === uid;
        const isFriendCreator = b.creator_id === friend.id;
        const friendPart = (b.participants || []).find((p: any) => p.friend_id === friend.id);
        const myPart = (b.participants || []).find((p: any) => p.friend_id === uid);

        if (isMeCreator && friendPart && !friendPart.paid) return true;
        if (isFriendCreator && myPart && !myPart.paid) return true;
        if (!b.status || b.status !== 'Settled') {
          if ((friendPart && !friendPart.paid) || (myPart && !myPart.paid)) return true;
        }
        return false;
      });

      if (unsettled.length > 0) {
        setDeleteBlockedReason(
          `You have ${unsettled.length} unsettled bill(s) with ${friend.name || 'this friend'}. Please settle all bills before deleting.`
        );
      }
    } catch (err) {
      console.error('Error checking bills:', err);
    }
  };

  const handleConfirmDeleteFriend = async () => {
    if (!selectedDeleteFriend) return;
    let uid = session?.user?.id;
    if (!uid) {
      const { data: { session: s } } = await supabase.auth.getSession();
      uid = s?.user?.id;
    }
    if (!uid) return;

    setIsDeletingFriend(true);
    try {
      await api.deleteFriend(uid, selectedDeleteFriend.id);
      await Promise.allSettled([
        supabase.from('friends').delete().eq('user_id', uid).eq('friend_id', selectedDeleteFriend.id),
        supabase.from('friends').delete().eq('user_id', selectedDeleteFriend.id).eq('friend_id', uid)
      ]);
      setIsDeleteModalOpen(false);
      setSelectedDeleteFriend(null);
      queryClient.invalidateQueries({ queryKey: ['friends', session?.user?.id] });
    } catch (err: any) {
      setDeleteBlockedReason(err.message || 'Failed to remove friend.');
    } finally {
      setIsDeletingFriend(false);
    }
  };

  const acceptMutation = useMutation({
    mutationFn: async (requesterId: string) => {
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
    },
    onMutate: async (requesterId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['friends', session?.user?.id] });

      // Snapshot the previous value
      const previousFriends = queryClient.getQueryData(['friends', session?.user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['friends', session?.user?.id], (old: any) => {
        if (!old) return old;
        
        // Find the pending user
        const pendingUser = old.pending.find((p: any) => p.id === requesterId);
        if (!pendingUser) return old;

        // Move them to accepted
        return {
          accepted: [...old.accepted, { ...pendingUser, isPendingRequest: false }],
          pending: old.pending.filter((p: any) => p.id !== requesterId)
        };
      });

      setIncomingFriend(null);

      // Return a context object with the snapshotted value
      return { previousFriends };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _requesterId, context) => {
      if (context?.previousFriends) {
        queryClient.setQueryData(['friends', session?.user?.id], context.previousFriends);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', session?.user?.id] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (requesterId: string) => {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', session.user.id);
    },
    onMutate: async (requesterId) => {
      await queryClient.cancelQueries({ queryKey: ['friends', session?.user?.id] });
      const previousFriends = queryClient.getQueryData(['friends', session?.user?.id]);

      queryClient.setQueryData(['friends', session?.user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pending: old.pending.filter((p: any) => p.id !== requesterId)
        };
      });

      setIncomingFriend(null);
      return { previousFriends };
    },
    onError: (_err, _requesterId, context) => {
      if (context?.previousFriends) {
        queryClient.setQueryData(['friends', session?.user?.id], context.previousFriends);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', session?.user?.id] });
    },
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
          {isLoading ? (
            <div className="text-center mt-10 text-black/50 dark:text-zinc-500 text-sm">Loading friends...</div>
          ) : displayList.length > 0 ? (
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
                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                    
                    {/* Quick Delete Friend Button */}
                    <button
                      onClick={(e) => handleInitiateDeleteFriend(friend, e)}
                      title="Remove Friend"
                      className="w-8 h-8 rounded-full bg-[#EDEDF1] dark:bg-zinc-800 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <Trash2 size={15} strokeWidth={2.2} />
                    </button>
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

      {/* Delete Friend Confirmation / Blocked Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeleteFriend(null);
          setDeleteBlockedReason(null);
        }}
        onConfirm={handleConfirmDeleteFriend}
        title={deleteBlockedReason ? 'Cannot Remove Friend' : 'Remove Friend'}
        description={
          deleteBlockedReason
            ? deleteBlockedReason
            : `Are you sure you want to remove ${selectedDeleteFriend?.name || 'this friend'} from your friends list?`
        }
        confirmText="Remove Friend"
        isBlocked={!!deleteBlockedReason}
        blockedReason={deleteBlockedReason || undefined}
        isLoading={isDeletingFriend}
        itemType="friend"
      />

    </div>
  );
}
