import React, { useState, useRef, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { ConfirmTransferModal } from './ConfirmTransferModal';

interface IncomingBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
  userId?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
}

function SlideToAccept({ onAccept, isSubmitting }: { onAccept: () => void; isSubmitting: boolean }) {
  const [slideProgress, setSlideProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSubmitting) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current || isSubmitting) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 64; 
    const minX = 0;
    const maxX = trackRect.width - thumbWidth - 16;

    let newX = e.clientX - trackRect.left - (thumbWidth / 2);
    newX = Math.max(minX, Math.min(newX, maxX));

    setSlideProgress(newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 64;
    const maxX = trackRect.width - thumbWidth - 16;

    if (slideProgress > maxX * 0.7) {
      setSlideProgress(maxX);
      onAccept();
    } else {
      setSlideProgress(0);
    }
  };

  return (
    <div 
      ref={trackRef}
      className="w-full max-w-[365px] h-[74px] shrink-0 bg-[#D9D9D9] rounded-[50px] relative flex items-center px-2 shadow-inner overflow-hidden select-none touch-none"
    >
      {/* Slider Knob */}
      <div 
        className="w-16 h-16 bg-[#F5C744] hover:bg-[#f3bd24] active:scale-95 rounded-full flex items-center justify-center z-20 shadow-md cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        style={{ 
          transform: `translateX(${slideProgress}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black ml-0.5">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </div>

      {/* Text */}
      <div 
        className="absolute inset-0 flex items-center justify-center text-black text-lg font-bold font-['Sora'] pointer-events-none transition-opacity duration-200"
        style={{ opacity: slideProgress > 60 ? 0.2 : 1 }}
      >
        {isSubmitting ? 'Accepting...' : 'Slide to accept'}
      </div>
    </div>
  );
}

export function IncomingBillModal({ 
  isOpen, 
  onClose, 
  bill, 
  userId, 
  onSuccess,
  readOnly = false
}: IncomingBillModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);
  const [enrichedParticipants, setEnrichedParticipants] = useState<any[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [effectiveUserId, setEffectiveUserId] = useState<string>(userId || '');

  useEffect(() => {
    if (!isOpen || !bill) return;

    let isMounted = true;

    const enrichData = async () => {
      try {
        let activeUid = userId;
        if (!activeUid) {
          const { data: { session } } = await supabase.auth.getSession();
          activeUid = session?.user?.id || '';
          if (session?.user?.user_metadata?.avatar_url) {
            setCurrentUserAvatar(session.user.user_metadata.avatar_url);
          }
        }
        if (isMounted) setEffectiveUserId(activeUid || '');

        // 1. Try to fetch fully enriched bill from backend API first
        if (bill.id) {
          try {
            const apiBill = await api.getBill(bill.id);
            if (isMounted && apiBill && apiBill.participants && apiBill.participants.length > 0) {
              setEnrichedParticipants(apiBill.participants);
              return;
            }
          } catch (e) {
            console.warn('API bill fetch failed, falling back to direct profiles query:', e);
          }
        }

        // 2. Direct Supabase query fallback
        const rawParts = bill.participants || [];
        const allIds = new Set<string>();
        if (bill.creator_id) allIds.add(bill.creator_id);
        if (activeUid) allIds.add(activeUid);
        rawParts.forEach((p: any) => {
          if (p.friend_id) allIds.add(p.friend_id);
          if (p.friendId && p.friendId !== 'me') allIds.add(p.friendId);
        });

        if (allIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', Array.from(allIds));

          const profilesMap: Record<string, any> = {};
          (profiles || []).forEach((prof: any) => {
            profilesMap[prof.id] = prof;
          });

          if (activeUid && profilesMap[activeUid]?.avatar_url) {
            setCurrentUserAvatar(profilesMap[activeUid].avatar_url);
          }

          if (bill.creator_id && profilesMap[bill.creator_id]) {
            setCreatorProfile(profilesMap[bill.creator_id]);
          }

          const enriched = rawParts.map((p: any) => {
            const fid = p.friend_id || p.friendId || (p.friendId === 'me' ? activeUid : null);
            const prof = (fid && profilesMap[fid]) ? profilesMap[fid] : (p.profile || {});
            return {
              ...p,
              friend_id: fid,
              full_name: prof.full_name || p.full_name || null,
              avatar_url: prof.avatar_url || p.avatar_url || null,
              username: prof.username || p.username || null,
            };
          });

          if (isMounted) setEnrichedParticipants(enriched);
        } else {
          if (isMounted) setEnrichedParticipants(rawParts);
        }
      } catch (err) {
        console.error('Error enriching participants in IncomingBillModal:', err);
        if (isMounted) setEnrichedParticipants(bill.participants || []);
      }
    };

    enrichData();

    return () => {
      isMounted = false;
    };
  }, [bill, isOpen, userId]);

  if (!isOpen || !bill) return null;

  const currentParticipants = enrichedParticipants.length > 0 ? enrichedParticipants : (bill.participants || []);
  const myParticipant = currentParticipants.find((p: any) => p.friend_id === effectiveUserId || p.friendId === effectiveUserId || (effectiveUserId && p.friendId === 'me'));
  const myShare = myParticipant ? Number(myParticipant.share || 0) : 0;
  const isCreator = bill.creator_id === effectiveUserId;
  const isAcceptedByMe = isCreator || (myParticipant ? myParticipant.accepted === true : false);
  const isEffectiveReadOnly = readOnly || isAcceptedByMe;
  const isMySharePaid = isCreator || myParticipant?.paid === true;
  const isFullySettled = bill.status === 'Settled';
  const isMyPaymentSent = myParticipant?.payment_sent === true && !myParticipant?.paid;
  const billTotal = bill.total || bill.amount || currentParticipants.reduce((sum: number, p: any) => sum + Number(p.share || 0), 0);

  const getEffectiveUserId = async (): Promise<string> => {
    if (effectiveUserId) return effectiveUserId;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || '';
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const activeUid = await getEffectiveUserId();
      if (!activeUid) throw new Error('User not authenticated');

      // 1. Direct Supabase update for immediate DB write
      await supabase
        .from('participants')
        .update({ accepted: true, paid: false })
        .eq('bill_id', bill.id)
        .eq('friend_id', activeUid);

      await supabase
        .from('bills')
        .update({ status: 'Pending' })
        .eq('id', bill.id);

      // 2. Also notify backend API (in background, non-blocking)
      api.acceptBill(bill.id, activeUid).catch(console.warn);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error accepting bill:', err);
      alert(err.message || 'Failed to accept bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      const activeUid = await getEffectiveUserId();
      if (!activeUid) throw new Error('User not authenticated');

      await supabase
        .from('participants')
        .update({ accepted: false, paid: false })
        .eq('bill_id', bill.id)
        .eq('friend_id', activeUid);

      await supabase
        .from('bills')
        .update({ status: 'Rejected' })
        .eq('id', bill.id);

      api.declineBill(bill.id, activeUid).catch(console.warn);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error declining bill:', err);
      alert(err.message || 'Failed to decline bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteSettle = async () => {
    setIsSubmitting(true);
    try {
      const activeUid = await getEffectiveUserId();
      if (!activeUid) throw new Error('User not authenticated');

      // Route through backend API (uses service role key, bypasses RLS)
      await api.sendPayment(bill.id, activeUid);

      if (onSuccess) onSuccess();
      setIsConfirmTransferOpen(false);
      onClose();
    } catch (err: any) {
      console.error('Error sending payment confirmation:', err);
      alert(err.message || 'Failed to send payment confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmParticipantPayment = async (friendId: string) => {
    setIsSubmitting(true);
    try {
      // Route through backend API (uses service role key, bypasses RLS)
      await api.confirmPayment(bill.id, friendId);

      // Local optimistic update
      setEnrichedParticipants(prev => prev.map(p => {
        if (p.friend_id === friendId || p.friendId === friendId) {
          return { ...p, paid: true, payment_sent: false };
        }
        return p;
      }));

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error confirming participant payment:', err);
      alert(err.message || 'Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclineParticipantPayment = async (friendId: string) => {
    setIsSubmitting(true);
    try {
      // Route through backend API (uses service role key, bypasses RLS)
      await api.declinePayment(bill.id, friendId);

      // Local optimistic update
      setEnrichedParticipants(prev => prev.map(p => {
        if (p.friend_id === friendId || p.friendId === friendId) {
          return { ...p, payment_sent: false };
        }
        return p;
      }));

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error declining participant payment:', err);
      alert(err.message || 'Failed to decline payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 font-['Sora']">
        
        {/* The Bottom Sheet Modal */}
        <div className="w-full max-w-[480px] mx-auto bg-zinc-900 rounded-t-[35px] max-h-[85vh] relative flex flex-col px-6 pb-8 pt-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Drag Handle */}
          <div className="w-16 h-1 bg-zinc-600 rounded-[50px] mx-auto mb-6 shrink-0" />

          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar font-['Sora']">
            
            {/* Header Info */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-white text-3xl font-bold font-display mb-1">{bill.title}</h2>
                {!isEffectiveReadOnly ? (
                  <div className="text-amber-300 text-sm font-semibold mb-2">Incoming Bill Request</div>
                ) : (
                  <div className={`text-xs font-semibold px-3 py-1 rounded-full w-fit mb-2 ${
                    isFullySettled ? 'bg-[#4C8C3C] text-white' :
                    bill.status === 'Accepted' || bill.status === 'Pending' ? 'bg-[#F5C744] text-black' :
                    bill.status === 'Rejected' || bill.status === 'Declined' ? 'bg-red-500 text-white' :
                    'bg-[#F5C744] text-black'
                  }`}>
                    {isFullySettled ? 'Settled' : (bill.status || 'Pending')}
                  </div>
                )}
                <div className="text-white/70 text-sm">
                  {bill.category ? `${bill.category} · ` : ''}{currentParticipants.length} Participants
                </div>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white p-1 cursor-pointer">
                <X size={24} />
              </button>
            </div>

            {/* Participants Card */}
            <div className="bg-neutral-800 rounded-[25px] p-4 flex flex-col gap-2.5 mb-6">
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Participants & Shares</span>
              {currentParticipants.map((p: any, i: number) => {
                const isPMe = p.friend_id === effectiveUserId || p.friendId === effectiveUserId || (effectiveUserId && p.friendId === 'me');
                const isPCreator = bill.creator_id === (p.friend_id || p.friendId);
                const isPPaid = isPCreator || p.paid;
                const isPPaymentSent = p.payment_sent === true && !p.paid;
                const pName = isPMe ? 'You' : (p.full_name || (p.username ? `@${p.username}` : 'Friend'));
                const pAvatar = isPMe ? (currentUserAvatar || p.avatar_url) : p.avatar_url;
                const pFriendId = p.friend_id || p.friendId;

                return (
                  <div key={i} className="w-full bg-zinc-300/10 rounded-[20px] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {pAvatar ? (
                        <img src={pAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(pName || 'P')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-medium truncate">
                          {pName}
                        </span>
                        {isPCreator && <span className="text-amber-300 text-[10px]">Creator (Paid upfront)</span>}
                        {isPPaymentSent && <span className="text-yellow-400 text-[10px]">Sent payment · Awaiting confirmation</span>}
                        {!isPCreator && !isPPaymentSent && p.username && !isPMe && (
                          <span className="text-white/50 text-[10px] truncate">@{p.username}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-white text-base font-semibold">LKR {Number(p.share || 0).toFixed(0)}</span>
                      
                      {isPPaid ? (
                        <span className="text-[10px] bg-green-900/60 text-green-300 px-2 py-0.5 rounded-full font-bold">Paid</span>
                      ) : isPPaymentSent ? (
                        isCreator ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleConfirmParticipantPayment(pFriendId)}
                              title="Confirm received payment"
                              className="bg-[#4C8C3C] text-white px-2 py-1 rounded-full text-[10px] font-bold active:scale-95 transition-transform cursor-pointer hover:bg-[#437d35]"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleDeclineParticipantPayment(pFriendId)}
                              title="Not received"
                              className="bg-red-900/60 text-red-300 px-2 py-1 rounded-full text-[10px] font-bold active:scale-95 transition-transform cursor-pointer hover:bg-red-900"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded-full font-bold">Sent</span>
                        )
                      ) : (
                        <span className="text-[10px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full font-bold">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Section */}
            <div className="flex justify-between items-end mb-8 border-t border-zinc-800 pt-4">
              <div className="flex flex-col gap-1">
                <div className="text-white/70 text-sm">Bill Total</div>
                <div className="text-white/70 text-lg">Your Share</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-white/70 text-sm">LKR {Number(billTotal).toFixed(0)}</div>
                <div className="text-amber-300 text-3xl font-bold font-display">LKR {Number(myShare).toFixed(0)}</div>
              </div>
            </div>

            {/* Actions */}
            {!isEffectiveReadOnly ? (
              <div className="flex flex-col items-center gap-4 mt-2">
                <SlideToAccept onAccept={handleAccept} isSubmitting={isSubmitting} />

                <button 
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  className="text-white/60 text-base font-normal font-['Sora'] py-2 hover:text-white transition-colors cursor-pointer"
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!isMySharePaid && !isFullySettled ? (
                  isMyPaymentSent ? (
                    <div className="w-full py-3.5 px-4 text-center text-yellow-300 text-sm font-semibold bg-yellow-950/40 rounded-[25px] border border-yellow-800/50 mb-1 flex flex-col items-center gap-0.5">
                      <span>✓ Payment Sent (LKR {Number(myShare).toFixed(0)})</span>
                      <span className="text-xs text-white/60 font-normal">Waiting for the creator to confirm receipt</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsConfirmTransferOpen(true)}
                      disabled={isSubmitting}
                      className={`w-full h-14 bg-amber-400 hover:bg-amber-300 text-black text-lg font-semibold rounded-[30px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}
                    >
                      <CreditCard size={20} strokeWidth={2.5} />
                      <span>{isSubmitting ? 'Processing...' : `Settle LKR ${Number(myShare).toFixed(0)}`}</span>
                    </button>
                  )
                ) : (
                  <div className="w-full py-3 text-center text-green-400 text-sm font-semibold bg-green-950/40 rounded-[20px] border border-green-800/40 mb-1">
                    ✓ {isCreator ? 'You created this plate (Paid upfront)' : 'Your share is confirmed paid'}
                  </div>
                )}

                <button 
                  onClick={onClose}
                  className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white text-base font-semibold rounded-[30px] flex items-center justify-center transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Confirm Transfer Slide Modal */}
      <ConfirmTransferModal 
        isOpen={isConfirmTransferOpen}
        onClose={() => setIsConfirmTransferOpen(false)}
        onConfirm={handleExecuteSettle}
        amount={myShare}
        username={isCreator ? "the group" : (creatorProfile?.full_name || (creatorProfile?.username ? `@${creatorProfile.username}` : 'Creator'))}
      />
    </>
  );
}
