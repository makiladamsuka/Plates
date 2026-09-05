import { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Plus, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { useData } from '../lib/DataContext';
import { IncomingBillModal } from '../components/IncomingBillModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Avatar } from '../components/Avatar';

interface FriendDetailProps {
  session?: any;
  friendId: string;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
}

export function FriendDetail({ session, friendId, onBack, onBillClick }: FriendDetailProps) {
  const { bills, friends } = useData();
  const cachedFriend = friends.find((f: any) => f.id === friendId);

  const [friend, setFriend] = useState<any>(() => cachedFriend ? {
    id: cachedFriend.id,
    full_name: cachedFriend.name,
    username: cachedFriend.username ? cachedFriend.username.replace('@', '') : '',
    avatar_url: cachedFriend.avatar_url
  } : null);
  const [loading, setLoading] = useState(!cachedFriend);
  const [userId, setUserId] = useState<string>(session?.user?.id || '');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // 3-Dots Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const init = async () => {
      if (!friend && !cachedFriend) {
        setLoading(true);
      }
      try {
        // 1. Get current user ID
        const { data: { session: s } } = await supabase.auth.getSession();
        const currentUid = s?.user?.id || session?.user?.id || '';
        setUserId(currentUid);

        // 2. Fetch friend profile
        const { data: friendProfile, error: friendErr } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', friendId)
          .single();
        
        if (friendErr) throw friendErr;
        setFriend(friendProfile);
      } catch (err) {
        console.error('Error in FriendDetail:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [friendId, session]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex items-center justify-center font-['Sora'] text-black dark:text-white transition-colors">Loading...</div>;
  if (!friend) return null;

  // Filter bills shared between current user and this friend
  const sharedBills = bills.filter(bill => {
    const parts = bill.participants || [];
    const isMeInBill = bill.creator_id === userId || parts.some((p: any) => p.friend_id === userId || p.friendId === userId);
    const isFriendInBill = bill.creator_id === friendId || parts.some((p: any) => p.friend_id === friendId || p.friendId === friendId);
    return isMeInBill && isFriendInBill;
  });

  // Calculate net balance with this friend (positive = friend owes me, negative = I owe friend)
  let friendBalance = 0;
  sharedBills.forEach(bill => {
    if (bill.status === 'Settled') return;
    const isCreatorMe = bill.creator_id === userId;
    const friendPart = (bill.participants || []).find((p: any) => p.friend_id === friendId || p.friendId === friendId);
    const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);

    if (isCreatorMe && friendPart && !friendPart.paid) {
      friendBalance += Number(friendPart.share || 0);
    } else if (!isCreatorMe && myPart && !myPart.paid) {
      friendBalance -= Number(myPart.share || 0);
    }
  });

  // Check if there are unsettled bills between user and friend
  const unsettledBills = sharedBills.filter(bill => {
    if (bill.status !== 'Settled') {
      const isCreatorMe = bill.creator_id === userId;
      const isFriendCreator = bill.creator_id === friendId;
      const friendPart = (bill.participants || []).find((p: any) => p.friend_id === friendId || p.friendId === friendId);
      const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);

      if (isCreatorMe && friendPart && !friendPart.paid) return true;
      if (isFriendCreator && myPart && !myPart.paid) return true;
      if (!bill.status || bill.status !== 'Settled') {
        if ((friendPart && !friendPart.paid) || (myPart && !myPart.paid)) return true;
      }
    }
    return false;
  });

  const hasUnsettledBills = unsettledBills.length > 0 || Math.abs(friendBalance) > 0.01;

  const handleDeleteFriend = async () => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      // Execute backend deletion with unsettled bills validation
      await api.deleteFriend(userId, friendId);

      // Dual-write Supabase cleanup
      await Promise.allSettled([
        supabase.from('friends').delete().eq('user_id', userId).eq('friend_id', friendId),
        supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', userId)
      ]);

      setIsDeleteModalOpen(false);
      onBack();
    } catch (err: any) {
      console.error('Error deleting friend:', err);
      setDeleteErrorMessage(err.message || 'Failed to remove friend. Please ensure all bills are settled.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 relative overflow-hidden font-['Sora'] transition-colors">
      <div className="max-w-[480px] md:max-w-4xl mx-auto md:px-10 md:pt-6">
        
        {/* Header Area */}
        <div className="pt-6 px-6 md:px-0 relative">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center -ml-2 cursor-pointer text-[#1A1A1A] dark:text-zinc-100"
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
            </button>

            {/* 3-Dots Options Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                title="Options"
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                  isMenuOpen 
                    ? 'bg-black/15 dark:bg-white/20 text-black dark:text-white' 
                    : 'bg-black/5 dark:bg-zinc-800 text-black/70 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-zinc-700'
                }`}
              >
                <MoreVertical size={18} strokeWidth={2.3} />
              </button>

              {/* Animated Dropdown Menu Popup */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-1.5 z-50 origin-top-right transition-all animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setDeleteErrorMessage(null);
                      setIsDeleteModalOpen(true);
                    }}
                    disabled={hasUnsettledBills}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      hasUnsettledBills
                        ? 'text-black/30 dark:text-zinc-600 cursor-not-allowed'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    <span>{hasUnsettledBills ? 'Unsettled Bills Pending' : 'Remove Friend'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h1 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl md:text-3xl font-bold font-display">{friend.full_name || friend.username || 'Friend'}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Avatar 
                  src={friend.avatar_url} 
                  name={friend.full_name || friend.username} 
                  className="w-[50px] h-[50px]"
                />
                <span className="text-black/70 dark:text-zinc-400 text-[15px] font-normal">
                  {friend.username ? `@${friend.username}` : (friend.full_name ? `@${friend.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {friendBalance !== 0 ? (
                <>
                  {friendBalance > 0 ? (
                    <ArrowDownLeft size={24} strokeWidth={2.5} className="text-[#4C8C3C] dark:text-[#5FAD4B]" />
                  ) : (
                    <ArrowUpRight size={24} strokeWidth={2.5} className="text-red-500" />
                  )}
                  <span className={`text-xl font-semibold ${friendBalance > 0 ? 'text-[#4C8C3C] dark:text-[#5FAD4B]' : 'text-red-500'}`}>
                    LKR {Math.abs(friendBalance).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold px-3.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-black/50 dark:text-zinc-400">
                  Settled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shared Bills List */}
        <div className="px-5 md:px-0 mt-8 flex flex-col gap-3">
          {sharedBills.map(bill => {
            const isCreatorMe = bill.creator_id === userId;
            const friendPart = (bill.participants || []).find((p: any) => p.friend_id === friendId || p.friendId === friendId);
            const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);

            const isIncoming = isCreatorMe;
            const amount = isCreatorMe ? (friendPart?.share || 0) : (myPart?.share || 0);

            return (
              <div 
                key={bill.id}
                onClick={() => {
                  if (onBillClick) {
                    onBillClick(bill.id);
                  } else {
                    setSelectedBill(bill);
                  }
                }}
                className="w-full h-[56px] bg-[#D9D9D9] dark:bg-zinc-900 rounded-[35px] px-6 flex items-center justify-between cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
              >
                <span className="text-[#1A1A1A] dark:text-zinc-100 text-base font-semibold truncate mr-4">
                  {bill.title}
                </span>
                
                <div className="flex items-center gap-2 shrink-0">
                  {isIncoming ? (
                    <ArrowDownLeft size={20} strokeWidth={2.5} className="text-black dark:text-zinc-100" />
                  ) : (
                    <ArrowUpRight size={20} strokeWidth={2.5} className="text-black dark:text-zinc-100" />
                  )}
                  <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm font-semibold whitespace-nowrap">
                    LKR {amount}
                  </span>
                </div>
              </div>
            );
          })}

          {sharedBills.length === 0 && (
            <div className="text-center text-black/50 dark:text-zinc-500 mt-10 text-sm">
              No shared bills with {friend.full_name?.split(' ')[0] || 'this friend'}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] md:bottom-10 left-0 md:left-auto md:right-10 w-full md:w-auto z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] md:w-auto relative">
          <button 
            className="absolute bottom-0 right-6 md:static w-20 h-20 md:w-16 md:h-16 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={32} strokeWidth={2.5} className="text-[#EDEDF1] dark:text-zinc-950" />
          </button>
        </div>
      </div>

      {/* Shared Bill Details Bottom Sheet Modal */}
      <IncomingBillModal 
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        userId={userId}
        readOnly={true}
      />

      {/* Delete Friend Confirmation / Blocked Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleDeleteFriend}
        title={hasUnsettledBills || deleteErrorMessage ? 'Cannot Remove Friend' : 'Remove Friend'}
        description={
          deleteErrorMessage
            ? deleteErrorMessage
            : hasUnsettledBills
            ? `Active balance: LKR ${Math.abs(friendBalance).toLocaleString()} (${unsettledBills.length} unsettled bill${unsettledBills.length === 1 ? '' : 's'}). Settle all shared bills before removing.`
            : `Are you sure you want to remove ${friend.full_name || 'this friend'} from your friends list?`
        }
        confirmText="Remove"
        isBlocked={hasUnsettledBills || !!deleteErrorMessage}
        isLoading={isDeleting}
        itemType="friend"
      />

    </div>
  );
}

