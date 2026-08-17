import React, { useState } from 'react';
import { X, Check, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

interface IncomingBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
  userId: string;
  onSuccess?: () => void;
  readOnly?: boolean;
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

  if (!isOpen || !bill) return null;

  const myParticipant = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
  const myShare = myParticipant ? myParticipant.share : 0;
  const isCreator = bill.creator_id === userId;
  const isMySharePaid = isCreator || myParticipant?.paid === true;
  const isFullySettled = bill.status === 'Settled';

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      // 1. Try API endpoint
      try {
        await api.acceptBill(bill.id, userId);
      } catch (apiErr) {
        // 2. Direct Supabase fallback
        const { error } = await supabase
          .from('participants')
          .update({ accepted: true })
          .eq('bill_id', bill.id)
          .eq('friend_id', userId);
        if (error) throw error;

        await supabase
          .from('bills')
          .update({ status: 'Accepted' })
          .eq('id', bill.id);
      }

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
      try {
        await api.declineBill(bill.id, userId);
      } catch (apiErr) {
        const { error } = await supabase
          .from('participants')
          .update({ accepted: false })
          .eq('bill_id', bill.id)
          .eq('friend_id', userId);
        if (error) throw error;

        await supabase
          .from('bills')
          .update({ status: 'Rejected' })
          .eq('id', bill.id);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error declining bill:', err);
      alert(err.message || 'Failed to decline bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    setIsSubmitting(true);
    try {
      try {
        await api.payBill(bill.id, userId);
      } catch (apiErr) {
        const { error } = await supabase
          .from('participants')
          .update({ paid: true })
          .eq('bill_id', bill.id)
          .eq('friend_id', userId);
        if (error) throw error;

        await supabase
          .from('bills')
          .update({ status: 'Settled' })
          .eq('id', bill.id);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error settling bill:', err);
      alert(err.message || 'Failed to settle bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60">
      
      {/* The Bottom Sheet Modal */}
      <div className="w-full max-w-[480px] mx-auto bg-zinc-900 rounded-t-[35px] max-h-[85vh] relative flex flex-col px-6 pb-8 pt-4 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Drag Handle */}
        <div className="w-16 h-1 bg-zinc-600 rounded-[50px] mx-auto mb-6 shrink-0" />

        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar font-['Sora']">
          
          {/* Header Info */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-white text-3xl font-bold font-display mb-1">{bill.title}</h2>
              {!readOnly ? (
                <div className="text-amber-300 text-sm font-semibold mb-2">Incoming Bill Request</div>
              ) : (
                <div className={`text-xs font-semibold px-3 py-1 rounded-full w-fit mb-2 ${
                  isFullySettled ? 'bg-[#4C8C3C] text-white' :
                  bill.status === 'Accepted' ? 'bg-[#4C8C3C] text-white' :
                  bill.status === 'Rejected' || bill.status === 'Declined' ? 'bg-red-500 text-white' :
                  'bg-[#F5C744] text-black'
                }`}>
                  {isFullySettled ? 'Settled' : (bill.status || 'Active')}
                </div>
              )}
              <div className="text-white/70 text-sm">{bill.category} · {bill.participants?.length || 0} Participants</div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1 cursor-pointer">
              <X size={24} />
            </button>
          </div>

          {/* Participants Card */}
          <div className="bg-neutral-800 rounded-[25px] p-4 flex flex-col gap-2.5 mb-6">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Participants & Shares</span>
            {(bill.participants || []).map((p: any, i: number) => {
              const isPMe = p.friend_id === userId || p.friendId === userId;
              const isPCreator = bill.creator_id === (p.friend_id || p.friendId);
              const isPPaid = isPCreator || p.paid;

              return (
                <div key={i} className="w-full bg-zinc-300/10 rounded-[20px] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {isPMe ? 'You' : 'P'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium">
                        {isPMe ? 'You' : `Friend ${(p.friend_id || p.friendId || '').substring(0, 4)}`}
                      </span>
                      {isPCreator && <span className="text-amber-300 text-[10px]">Creator (Paid)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-base font-semibold">LKR {p.share}</span>
                    {isPPaid && <span className="text-[10px] bg-green-900/60 text-green-300 px-2 py-0.5 rounded-full font-bold">Paid</span>}
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
              <div className="text-white/70 text-sm">LKR {bill.total}</div>
              <div className="text-amber-300 text-3xl font-bold font-display">LKR {myShare}</div>
            </div>
          </div>

          {/* Actions */}
          {!readOnly ? (
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAccept}
                disabled={isSubmitting}
                className={`w-full h-14 bg-amber-400 hover:bg-amber-300 text-black text-lg font-semibold rounded-[30px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}
              >
                <Check size={20} strokeWidth={3} />
                <span>{isSubmitting ? 'Accepting...' : 'Accept Bill'}</span>
              </button>

              <button 
                onClick={handleDecline}
                disabled={isSubmitting}
                className="text-white/60 hover:text-white text-sm py-2 text-center transition-colors cursor-pointer"
              >
                Decline Request
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {!isMySharePaid && !isFullySettled ? (
                <button 
                  onClick={handleSettle}
                  disabled={isSubmitting}
                  className={`w-full h-14 bg-amber-400 hover:bg-amber-300 text-black text-lg font-semibold rounded-[30px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  <CreditCard size={20} strokeWidth={2.5} />
                  <span>{isSubmitting ? 'Settling...' : `Settle LKR ${myShare}`}</span>
                </button>
              ) : (
                <div className="w-full py-2 text-center text-green-400 text-sm font-semibold bg-green-950/40 rounded-[20px] border border-green-800/40 mb-1">
                  ✓ {isCreator ? 'You created this plate (Paid)' : 'Your share is settled'}
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
  );
}
