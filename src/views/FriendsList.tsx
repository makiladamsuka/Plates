import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [incomingFriend, setIncomingFriend] = useState<any>(null);
  const [acceptedFriends, setAcceptedFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [session]);

  const fetchFriendsAndRequests = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      // 1. Fetch Accepted Friends for current user (where user_id = session.user.id)
      const { data: rawAccepted } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', session.user.id)
        .or('status.eq.accepted,status.is.null');

      if (rawAccepted && rawAccepted.length > 0) {
        const friendIds = rawAccepted.map((f: any) => f.friend_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', friendIds);
        
        const friends = (profs || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Friend',
          username: p.email || '',
          avatar_url: p.avatar_url,
          balance: 0,
          isPendingRequest: false,
        }));
        setAcceptedFriends(friends);
      } else {
        setAcceptedFriends([]);
      }

      // 2. Fetch Pending Friend Requests sent TO current user (where friend_id = session.user.id and status = 'pending')
      const { data: rawPending } = await supabase
        .from('friends')
        .select('user_id, status')
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      if (rawPending && rawPending.length > 0) {
        const requesterIds = rawPending.map((f: any) => f.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', requesterIds);

        const pending = (profs || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'User',
          username: p.email || '',
          avatar_url: p.avatar_url,
          balance: 0,
          isPendingRequest: true,
        }));
        setPendingRequests(pending);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requesterId: string) => {
    try {
      // Step A: Mark incoming request as accepted
      await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('friend_id', session.user.id);

      // Step B: Insert reciprocal relationship so current user sees requester in their friends list
      await supabase
        .from('friends')
        .upsert({
          user_id: session.user.id,
          friend_id: requesterId,
          status: 'accepted'
        }, { onConflict: 'user_id,friend_id' });

      setIncomingFriend(null);
      fetchFriendsAndRequests();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleDecline = async (requesterId: string) => {
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', session.user.id);

      setIncomingFriend(null);
      fetchFriendsAndRequests();
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const displayList = activeTab === 'pending' ? pendingRequests : acceptedFriends;

  return (
    <div className="w-full pb-24 md:pb-8 font-sans-app">
      
      {/* Header Container */}
      <div className="px-5 pt-6 pb-4 md:px-0 md:pt-0 md:pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-[#1A1A1A]">
            Friends
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-sans-app mt-1">
            Manage your dining circle and pending invitations.
          </p>
        </div>

        {/* Desktop Add Friend Button */}
        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Friend</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 md:px-0 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('all')}
          className={`h-8 px-4 rounded-full text-xs font-semibold whitespace-nowrap flex items-center justify-center transition-all cursor-pointer border ${
            activeTab === 'all' 
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs' 
              : 'bg-white text-gray-600 border-black/8 hover:bg-gray-50'
          }`}
        >
          All Friends ({acceptedFriends.length})
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`h-8 px-4 rounded-full text-xs font-semibold whitespace-nowrap flex items-center justify-center transition-all cursor-pointer border ${
            activeTab === 'pending' 
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs' 
              : 'bg-white text-gray-600 border-black/8 hover:bg-gray-50'
          }`}
        >
          Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </button>
      </div>

      {/* Main Content: Responsive Grid */}
      <div className="px-5 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">Loading friends...</div>
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
              className="w-full bg-white border border-black/8 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-black/20 hover:shadow-xs transition-all"
            >
              {/* Left Side: Avatar & Details */}
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 border border-black/5" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#EDEDF1] border border-black/5 flex items-center justify-center font-bold text-sm text-[#1A1A1A] shrink-0">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[#1A1A1A] text-base font-bold leading-tight truncate">
                    {friend.name}
                  </span>
                  <span className="text-gray-400 text-xs font-normal truncate mt-0.5">
                    {friend.username}
                  </span>
                </div>
              </div>

              {/* Right Side: Action Icons OR Balances */}
              {activeTab === 'pending' ? (
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleApprove(friend.id)}
                    title="Accept Request"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => handleDecline(friend.id)}
                    title="Decline Request"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                friend.balance !== 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {friend.balance > 0 ? (
                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-xl text-xs font-bold">
                        <ArrowDownLeft size={14} strokeWidth={2.5} />
                        <span>LKR {Math.abs(friend.balance)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-xl text-xs font-bold">
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                        <span>LKR {Math.abs(friend.balance)}</span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center text-gray-400 text-sm">
            {activeTab === 'pending' ? '✨ No pending friend requests.' : '✨ No friends found yet. Click "Add Friend" to search by username!'}
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-5 z-40">
        <button 
          onClick={onSearchClick}
          className="w-14 h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
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
