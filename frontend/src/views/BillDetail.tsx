import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { ConfirmTransferModal } from '../components/ConfirmTransferModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { MOCK_FRIENDS } from '../data/mockData';

interface BillDetailProps {
  onBack: () => void;
  billId: string | null;
  session?: any;
}

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return 'bg-[#F6D6DA] dark:bg-red-900/40';
    case 'Grocery': return 'bg-[#D7ECD1] dark:bg-green-900/40';
    case 'Entertainment': return 'bg-[#CDE1FF] dark:bg-blue-900/40';
    default: return 'bg-zinc-200 dark:bg-zinc-800';
  }
};

const formatTime = (ts: any) => {
  if (!ts) return 'Recent';
  const date = new Date(typeof ts === 'string' && !isNaN(Number(ts)) ? Number(ts) : ts);
  if (isNaN(date.getTime())) return 'Recent';
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `Today ${hours}${ampm}`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function BillDetail({ onBack, billId, session }: BillDetailProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(() => session?.user?.id || '');

  // Bill Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const fetchBill = async () => {
    if (!billId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      try {
        const data = await api.getBill(billId);
        if (data && data.id) {
          setBill(data);
          if (data?.creator_id) {
            const { data: creator } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', data.creator_id)
              .maybeSingle();
            if (creator) {
              setCreatorName(creator.full_name || creator.email || '');
            }
          }
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('API bill fetch failed, falling back to direct Supabase:', e);
      }

      // Direct Supabase query
      const { data: rawBill } = await supabase
        .from('bills')
        .select('*, participants(*)')
        .eq('id', billId)
        .maybeSingle();

      if (rawBill) {
        const allFriendIds = new Set<string>();
        if (rawBill.creator_id) allFriendIds.add(rawBill.creator_id);
        (rawBill.participants || []).forEach((p: any) => {
          if (p.friend_id) allFriendIds.add(p.friend_id);
        });

        let profilesMap: Record<string, any> = {};
        if (allFriendIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', Array.from(allFriendIds));

          (profiles || []).forEach((prof: any) => {
            profilesMap[prof.id] = prof;
          });
        }

        const enriched = {
          ...rawBill,
          participants: (rawBill.participants || []).map((p: any) => ({
            ...p,
            profile: profilesMap[p.friend_id] || null,
            full_name: profilesMap[p.friend_id]?.full_name || null,
            avatar_url: profilesMap[p.friend_id]?.avatar_url || null
          }))
        };

        setBill(enriched);
        const creatorProf = profilesMap[rawBill.creator_id];
        if (creatorProf) {
          setCreatorName(creatorProf.full_name || creatorProf.email || '');
        }
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
    fetchBill();

    if (billId) {
      const channel = supabase
        .channel(`realtime-bill-${billId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `id=eq.${billId}` }, fetchBill)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `bill_id=eq.${billId}` }, fetchBill)
        .subscribe();

      const handleFocus = () => fetchBill();
      window.addEventListener('focus', handleFocus);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [billId]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center font-['Sora']">Loading...</div>;

  if (!bill) {
    return (
      <div className="min-h-screen bg-[#EDEDF1] flex flex-col items-center justify-center p-6 text-center font-['Sora']">
        <p className="text-gray-700 text-lg font-semibold mb-2">Bill Not Found</p>
        <p className="text-gray-500 text-sm mb-6">The requested bill could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-full text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isCreator = bill.creator_id === userId;
  const myParticipant = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
  const myShare = myParticipant ? Number(myParticipant.share || 0) : 0;
  const isMySharePaid = isCreator || myParticipant?.paid === true;
  const isMyPaymentSent = myParticipant?.payment_sent === true && !myParticipant?.paid;
  const isFullySettled = bill.status === 'Settled';

  const getEffectiveUid = async (): Promise<string> => {
    if (userId) return userId;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || '';
  };

  const handlePay = async () => {
    setIsConfirmModalOpen(false);
    try {
      const activeUid = await getEffectiveUid();
      if (!activeUid) return;

      // Optimistic UI update
      setBill((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: (prev.participants || []).map((p: any) =>
            (p.friend_id === activeUid || p.friendId === activeUid)
              ? { ...p, payment_sent: true, accepted: true, paid: false }
              : p
          )
        };
      });

      // Dual-write: Direct Supabase + Backend API
      await Promise.allSettled([
        api.sendPayment(bill.id, activeUid),
        supabase
          .from('participants')
          .update({ payment_sent: true, accepted: true, paid: false })
          .eq('bill_id', bill.id)
          .eq('friend_id', activeUid)
      ]);

      fetchBill();
    } catch (err) {
      console.error('Error sending payment:', err);
    }
  };

  const handleConfirmParticipant = async (friendId: string) => {
    try {
      // Optimistic UI update
      setBill((prev: any) => {
        if (!prev) return prev;
        const updatedParts = (prev.participants || []).map((p: any) =>
          (p.friend_id === friendId || p.friendId === friendId)
            ? { ...p, paid: true, payment_sent: true }
            : p
        );
        const allPaid = updatedParts.every((p: any) => p.paid === true);
        return {
          ...prev,
          status: allPaid ? 'Settled' : prev.status,
          participants: updatedParts
        };
      });

      // Dual-write: Backend API + Direct Supabase
      await Promise.allSettled([
        api.confirmPayment(bill.id, friendId),
        (async () => {
          await supabase
            .from('participants')
            .update({ paid: true, payment_sent: true, accepted: true })
            .eq('bill_id', bill.id)
            .eq('friend_id', friendId);

          const { data: parts } = await supabase
            .from('participants')
            .select('paid')
            .eq('bill_id', bill.id);

          const allPaid = parts && parts.length > 0 && parts.every((p: any) => p.paid === true);
          if (allPaid) {
            await supabase
              .from('bills')
              .update({ status: 'Settled' })
              .eq('id', bill.id);
          }
        })()
      ]);

      fetchBill();
    } catch (err) {
      console.error('Error confirming participant payment:', err);
      fetchBill();
    }
  };

  const handleDeclineParticipant = async (friendId: string) => {
    try {
      setBill((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: (prev.participants || []).map((p: any) =>
            (p.friend_id === friendId || p.friendId === friendId)
              ? { ...p, payment_sent: false, paid: false }
              : p
          )
        };
      });

      await Promise.allSettled([
        api.declinePayment(bill.id, friendId),
        supabase
          .from('participants')
          .update({ payment_sent: false, paid: false })
          .eq('bill_id', bill.id)
          .eq('friend_id', friendId)
      ]);

      fetchBill();
    } catch (err) {
      console.error('Error declining participant payment:', err);
      fetchBill();
    }
  };

  const isBlockedFromDeleting = !isCreator && !isFullySettled;

  const handleDeleteBill = async () => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await api.deleteBill(bill.id, userId);

      // Dual-write Supabase cleanup for immediate realtime sync
      if (isCreator) {
        await Promise.allSettled([
          supabase.from('participants').delete().eq('bill_id', bill.id),
          supabase.from('bills').delete().eq('id', bill.id)
        ]);
      } else {
        await supabase.from('participants').delete().eq('bill_id', bill.id).eq('friend_id', userId);
      }

      setIsDeleteModalOpen(false);
      onBack();
    } catch (err: any) {
      console.error('Error deleting bill:', err);
      setDeleteErrorMessage(err.message || 'Failed to delete bill.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-40 font-['Sora'] relative overflow-hidden transition-colors">
      <div className="max-w-[480px] md:max-w-4xl mx-auto md:px-10 md:pt-6">
        
        {/* Header Section */}
        <div className="pt-6 pb-2 relative">
          <div className="flex justify-between items-center w-full px-6 md:px-0 gap-2">
            {/* Back Button */}
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center cursor-pointer text-[#1A1A1A] dark:text-zinc-100 shrink-0">
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            
            {/* Title styled with display font */}
            <h1 className="text-[#1A1A1A] dark:text-zinc-100 text-[24px] md:text-[28px] font-bold font-display leading-tight break-words flex-1 truncate mx-2">{bill.title}</h1>
            
            {/* Status Pill & Delete Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`rounded-[30px] px-3.5 py-1.5 flex items-center justify-center shrink-0 ${
                isFullySettled ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
              }`}>
                <span className="text-[12px] font-semibold">{isFullySettled ? 'Settled' : 'Pending'}</span>
              </div>

              {/* Delete / Remove Action Button - Only show if creator or fully settled */}
              {(isCreator || isFullySettled) && (
                <button
                  onClick={() => {
                    setDeleteErrorMessage(null);
                    setIsDeleteModalOpen(true);
                  }}
                  title={isCreator ? "Delete Bill" : "Remove Bill"}
                  className="h-9 px-3 rounded-[30px] bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-950/40 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white border border-red-500/30 flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 size={15} strokeWidth={2.2} />
                  <span>{isCreator ? "Delete" : "Remove"}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Tags and Meta */}
          <div className="mt-5 px-6 md:px-0 flex flex-col gap-2">
            <div className={`${getTagColor(bill.category)} rounded-[30px] px-4 py-1.5 w-fit flex items-center justify-center -ml-1`}>
              <span className="text-black dark:text-zinc-100 text-[15px] font-normal">{bill.category}</span>
            </div>
            <div className="text-black/60 dark:text-zinc-400 text-[14px] font-normal ml-1 mt-1">{formatTime(bill.created_at || bill.createdAt)}</div>
            {creatorName && (
              <div className="text-black/70 dark:text-zinc-300 text-[14px] font-normal ml-1">Created by {creatorName}</div>
            )}
          </div>
        </div>

        {/* Friends List Section */}
        <div className="px-6 md:px-0 mt-6 flex flex-col gap-3 relative">
          {(bill.participants || []).map((participant: any, i: number) => {
            const isPMe = participant.friendId === 'me' || participant.friend_id === userId || participant.friendId === userId;
            const mockFriend = MOCK_FRIENDS.find(f => f.id === (participant.friendId || participant.friend_id));
            const pName = isPMe ? 'You' : (participant.full_name || participant.profile?.full_name || mockFriend?.name || `Friend ${(participant.friendId || participant.friend_id || '').substring(0, 4)}`);
            const pAvatar = participant.avatar_url || participant.profile?.avatar_url;
            const isPCreator = bill.creator_id === (participant.friend_id || participant.friendId);
            const isPPaid = isPCreator || participant.paid;
            const isPPaymentSent = participant.payment_sent === true && !participant.paid;
            const pFriendId = participant.friend_id || participant.friendId;

            return (
              <div key={i} className="w-full min-h-[59px] py-2.5 bg-[#D9D9D9] dark:bg-zinc-900 rounded-[30px] px-4 flex items-center justify-between shadow-sm relative border border-transparent dark:border-white/5">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {pAvatar ? (
                    <img src={pAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 bg-zinc-400 dark:bg-zinc-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(pName || 'P')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-black dark:text-zinc-100 text-[14px] font-medium truncate">
                      {pName}
                    </span>
                    {isPCreator && <span className="text-black/50 dark:text-zinc-500 text-[10px]">Creator (Paid upfront)</span>}
                    {isPPaymentSent && <span className="text-amber-800 dark:text-amber-400 text-[10px]">Sent payment · Awaiting confirmation</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#1A1A1A] dark:text-zinc-100 text-[18px] font-semibold">LKR {Number(participant.share || 0).toFixed(0)}</span>
                  
                  {isPPaid ? (
                    <span className="text-[10px] bg-[#4C8C3C] text-white px-2 py-0.5 rounded-full font-bold">Paid</span>
                  ) : isPPaymentSent ? (
                    isCreator ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConfirmParticipant(pFriendId)}
                          title="Confirm received payment"
                          className="bg-[#4C8C3C] hover:bg-[#437d35] active:scale-95 text-white text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-transform shadow-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleDeclineParticipant(pFriendId)}
                          title="Not received"
                          className="bg-zinc-700 hover:bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-transform"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-yellow-600 text-white px-2 py-0.5 rounded-full font-bold">Sent</span>
                    )
                  ) : (
                    <span className="text-[10px] bg-[#F5C744] text-black px-2 py-0.5 rounded-full font-bold">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Amount */}
        <div className="px-8 md:px-0 mt-10 flex justify-end">
           <div className="text-[#1A1A1A] dark:text-zinc-100 text-[28px] font-bold font-display">LKR {bill.total}</div>
        </div>

        {/* Delete / Remove Bill Button at Bottom - Only show if creator or fully settled */}
        {(isCreator || isFullySettled) && (
          <div className="px-6 md:px-0 mt-12 mb-6 flex flex-col items-center">
            <button
              onClick={() => {
                setDeleteErrorMessage(null);
                setIsDeleteModalOpen(true);
              }}
              className="w-full max-w-sm py-3.5 px-6 rounded-[25px] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white"
            >
              <Trash2 size={16} />
              <span>{isCreator ? 'Delete Bill' : 'Remove Settled Bill'}</span>
            </button>
          </div>
        )}

      </div>

      {/* Floating Action Bar - Only show if not paid and not settled */}
      {!isMySharePaid && !isFullySettled && (
        <div className="fixed bottom-[130px] left-0 w-full z-[55] flex justify-center px-4 pointer-events-none">
          {isMyPaymentSent ? (
            <div className="w-full max-w-[365px] bg-[#1A1A1A] dark:bg-zinc-900 border border-transparent dark:border-white/10 text-[#EDEDF1] rounded-[50px] p-4 text-center pointer-events-auto shadow-lg flex flex-col items-center gap-0.5">
              <span className="text-base font-semibold text-[#F5C744]">✓ Payment Sent (LKR {myShare.toFixed(0)})</span>
              <span className="text-xs text-white/60">Waiting for {creatorName || 'creator'} to confirm receipt</span>
            </div>
          ) : (
            <button 
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full max-w-[365px] h-[74px] bg-[#1A1A1A] dark:bg-zinc-100 rounded-[50px] flex items-center justify-center pointer-events-auto shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              <span className="text-[#EDEDF1] dark:text-zinc-950 text-[20px] font-semibold">Pay LKR {myShare.toFixed(0)}</span>
            </button>
          )}
        </div>
      )}

      {/* Slide to Confirm Transfer Modal */}
      <ConfirmTransferModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handlePay}
        amount={myShare}
        username={creatorName || "Creator"}
      />

      {/* Delete / Remove Bill Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteErrorMessage(null);
        }}
        onConfirm={handleDeleteBill}
        title={
          deleteErrorMessage
            ? 'Error Deleting Bill'
            : isBlockedFromDeleting
            ? 'Cannot Delete Bill'
            : isCreator
            ? 'Delete Bill'
            : 'Remove Bill'
        }
        description={
          deleteErrorMessage
            ? deleteErrorMessage
            : isBlockedFromDeleting
            ? 'Only the bill creator can delete this bill while it is unsettled.'
            : isCreator
            ? 'Are you sure you want to permanently delete this bill? This will remove it for all participants.'
            : 'Are you sure you want to remove this settled bill from your history?'
        }
        confirmText={isCreator ? 'Delete Bill' : 'Remove from List'}
        isBlocked={isBlockedFromDeleting || !!deleteErrorMessage}
        blockedReason={
          deleteErrorMessage ||
          'This bill is currently unsettled. Participants cannot delete unsettled bills. You can only remove it once all shares are settled.'
        }
        isLoading={isDeleting}
        itemType="bill"
      />

    </div>
  );
}
