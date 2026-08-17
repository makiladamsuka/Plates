import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../services/api';

interface IncomingBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any;
  userId: string;
  onSuccess?: () => void;
}

export function IncomingBillModal({ 
  isOpen, 
  onClose, 
  bill, 
  userId, 
  onSuccess 
}: IncomingBillModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !bill) return null;

  const myParticipant = (bill.participants || []).find((p: any) => p.friend_id === userId);
  const myShare = myParticipant ? myParticipant.share : 0;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await api.acceptBill(bill.id, userId);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error accepting bill:', err);
      alert('Failed to accept bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await api.declineBill(bill.id, userId);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error declining bill:', err);
      alert('Failed to decline bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60">
      
      {/* The Bottom Sheet Modal */}
      <div className="w-full max-w-[480px] mx-auto bg-zinc-900 rounded-t-[35px] max-h-[85vh] relative flex flex-col px-6 pb-8 pt-4">
        
        {/* Drag Handle */}
        <div className="w-16 h-1 bg-zinc-600 rounded-[50px] mx-auto mb-6 shrink-0" />

        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar font-['Sora']">
          
          {/* Header Info */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-white text-3xl font-bold font-display mb-1">{bill.title}</h2>
              <div className="text-amber-300 text-sm font-semibold mb-2">Incoming Bill Request</div>
              <div className="text-white/70 text-sm">{bill.category} · {bill.participants?.length || 0} Participants</div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1">
              <X size={24} />
            </button>
          </div>

          {/* Participants Card */}
          <div className="bg-neutral-800 rounded-[25px] p-4 flex flex-col gap-2.5 mb-6">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Participants & Shares</span>
            {(bill.participants || []).map((p: any, i: number) => (
              <div key={i} className="w-full bg-zinc-300/10 rounded-[20px] p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.friend_id === userId ? 'You' : 'P'}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {p.friend_id === userId ? 'You' : `Friend ${p.friend_id.substring(0, 4)}`}
                  </span>
                </div>
                <div className="text-white text-base font-semibold">LKR {p.share}</div>
              </div>
            ))}
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

        </div>
      </div>
    </div>
  );
}
