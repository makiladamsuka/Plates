import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { IncomingBillModal } from '../components/IncomingBillModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface FriendDetailProps {
  session?: any;
  friendId: string;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
}

export function FriendDetail({ session, friendId, onBack, onBillClick }: FriendDetailProps) {
  const [friend, setFriend] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(session?.user?.id || '');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Get current user ID
        const { data: { session: s } } = await supabase.auth.getSession();
        const currentUid = s?.user?.id || session?.user?.id || '';
        setUserId(currentUid);

        // 2. Fetch friend profile
        const { data: friendProfile, error: friendErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', friendId)
          .single();
        
        if (friendErr) throw friendErr;
        setFriend(friendProfile);

        // 3. Fetch bills for current user
        if (currentUid) {
          const userBills = await api.getBills(currentUid);
          setBills(userBills || []);
        }
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
      
      {/* Header Area */}
      <div className="pt-6 px-6 relative">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-2 cursor-pointer text-[#1A1A1A] dark:text-zinc-100"
          >
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>

          {/* Delete Friend Action Button */}
          <button
            onClick={() => {
              setDeleteErrorMessage(null);
              setIsDeleteModalOpen(true);
            }}
            title="Remove Friend"
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Trash2 size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl font-bold font-display">{friend.full_name || friend.name || 'Friend'}</h1>
            <div className="flex items-center gap-4 mt-2">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt="" className="w-[50px] h-[50px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-[#D9D9D9] dark:bg-zinc-800 flex items-center justify-center font-bold text-black dark:text-white text-xl shrink-0 opacity-80">
                  {(friend.full_name || friend.email || 'F')[0].toUpperCase()}
                </div>
              )}
              <span className="text-black/70 dark:text-zinc-400 text-[15px] font-normal">{friend.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {friendBalance !== 0 && (
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
            )}
          </div>
        </div>
      </div>

      {/* Shared Bills List */}
      <div className="px-5 mt-8 flex flex-col gap-3">
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

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer"
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
          hasUnsettledBills || deleteErrorMessage
            ? `You have unsettled bills or an active balance with ${friend.full_name || 'this friend'}.`
            : `Are you sure you want to remove ${friend.full_name || 'this friend'} from your friends list?`
        }
        confirmText="Remove Friend"
        isBlocked={hasUnsettledBills || !!deleteErrorMessage}
        blockedReason={
          deleteErrorMessage ||
          `Active unsettled balance: LKR ${Math.abs(friendBalance).toLocaleString()} (${unsettledBills.length} pending bill${unsettledBills.length === 1 ? '' : 's'}). All shared bills must be settled before you can remove a friend.`
        }
        isLoading={isDeleting}
        itemType="friend"
      />

    </div>
  );
}

