import React, { useState, useRef, useEffect } from 'react';
import type { Bill } from '../types';
import { ChevronRight, Check, X, ShieldCheck } from 'lucide-react';

interface BillRequestModalProps {
  bill: Bill | null;
  onClose: () => void;
  onApprove: (billId: string) => void;
  onDecline: (billId: string) => void;
}

export const BillRequestModal: React.FC<BillRequestModalProps> = ({
  bill,
  onClose,
  onApprove,
  onDecline,
}) => {
  const [sliderPosition, setSliderPosition] = useState(0); // 0 to 100%
  const [isSliding, setIsSliding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSliderPosition(0);
    setIsSuccess(false);
  }, [bill]);

  if (!bill) return null;

  const userShare = bill.participants.find((p) => p.name.includes('You'))?.share || Math.round(bill.amount / bill.peopleCount);

  const handleStart = () => {
    if (isSuccess) return;
    setIsSliding(true);
  };

  const handleMove = (clientX: number) => {
    if (!isSliding || !sliderRef.current || isSuccess) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const handleWidth = 48;
    const maxDrag = rect.width - handleWidth;
    const currentDrag = Math.max(0, Math.min(clientX - rect.left - handleWidth / 2, maxDrag));
    const percentage = (currentDrag / maxDrag) * 100;
    setSliderPosition(percentage);

    if (percentage >= 85) {
      completeApproval();
    }
  };

  const handleEnd = () => {
    if (isSuccess) return;
    setIsSliding(false);
    if (sliderPosition < 85) {
      setSliderPosition(0);
    }
  };

  const completeApproval = () => {
    setSliderPosition(100);
    setIsSliding(false);
    setIsSuccess(true);
    setTimeout(() => {
      onApprove(bill.id);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-[412px] bg-[#14151b] text-white rounded-t-3xl p-5 shadow-2xl relative border-t border-white/10 animate-in slide-in-from-bottom duration-250 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Metadata */}
        <div className="mb-4">
          <p className="text-neutral-400 text-xs mb-0.5">{bill.creator} added you</p>
          <h2 className="text-xl font-bold text-white font-['Sora'] leading-snug">
            {bill.title}
          </h2>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/10 text-neutral-300 rounded-full text-[10px] font-medium">
            {bill.peopleCount} People • {bill.category}
          </span>
        </div>

        {/* Participant List */}
        <div className="space-y-2 mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
          {bill.participants.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-none"
            >
              <div className="flex items-center gap-2.5">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-[10px] text-white">
                    {person.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-neutral-200">
                  {person.name}
                </span>
              </div>
              <span className="font-bold text-xs text-white font-['Sora']">
                {bill.currency} {person.share.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Highlight Summary Card */}
        <div className="bg-[#f5c744] text-black rounded-xl p-4 mb-4 shadow-md">
          <div className="flex justify-between items-center text-[11px] font-semibold text-black/70 mb-1">
            <span>Bill Total</span>
            <span className="text-xs text-black font-bold font-['Sora']">
              {bill.currency} {bill.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-0.5">
            <span className="text-sm font-semibold text-black">Your Share</span>
            <span className="text-2xl font-extrabold text-black font-['Sora'] tracking-tight">
              {bill.currency} {userShare.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Slider Action or Settled Banner */}
        {bill.status === 'Settled' || isSuccess ? (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-full flex items-center justify-center gap-2 font-bold text-xs mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Bill Approved & Settled!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Interactive Slide to Approve Bar */}
            <div
              ref={sliderRef}
              onMouseDown={handleStart}
              onMouseMove={(e) => handleMove(e.clientX)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              onTouchEnd={handleEnd}
              onClick={() => completeApproval()}
              className="relative w-full h-[52px] bg-[#1d1f27] rounded-full p-1 flex items-center cursor-pointer select-none overflow-hidden group border border-white/10"
            >
              {/* Progress track fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#f5c744] transition-all duration-75 rounded-full"
                style={{ width: `${sliderPosition}%` }}
              />

              {/* Slider Handle */}
              <div
                className="absolute top-1 bottom-1 w-[44px] bg-[#f5c744] rounded-full shadow-md flex items-center justify-center text-black font-bold transition-transform duration-75 group-hover:scale-105"
                style={{
                  left: `calc(4px + (100% - 52px) * ${sliderPosition / 100})`,
                }}
              >
                {isSuccess ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <div className="flex -space-x-1">
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                    <ChevronRight className="w-4 h-4 stroke-[3] -ml-2" />
                  </div>
                )}
              </div>

              {/* Text */}
              <span className="w-full text-center text-white group-hover:text-black font-bold text-xs tracking-wide z-10 font-['Sora'] pointer-events-none transition-colors">
                {isSuccess ? 'Approved!' : 'Slide to approve'}
              </span>
            </div>

            {/* Decline Option */}
            <button
              onClick={() => onDecline(bill.id)}
              className="w-full py-1.5 text-center text-neutral-400 hover:text-rose-400 text-xs font-medium transition-colors"
            >
              Decline Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

