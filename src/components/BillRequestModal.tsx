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
    const handleWidth = 56;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-[412px] bg-[#1a1a1a] text-white rounded-t-[36px] p-6 shadow-2xl relative border-t border-white/10 animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Metadata */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-1">{bill.creator} added you</p>
          <h2 className="text-3xl font-extrabold text-white font-['Sora'] leading-tight">
            {bill.title}
          </h2>
          <span className="inline-block mt-2 px-3 py-0.5 bg-white/10 text-gray-300 rounded-full text-xs font-medium">
            {bill.peopleCount} People
          </span>
        </div>

        {/* Participant List */}
        <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
          {bill.participants.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-none"
            >
              <div className="flex items-center gap-3">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
                    {person.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-200">
                  {person.name}
                </span>
              </div>
              <span className="font-bold text-sm text-white font-['Sora']">
                {bill.currency} {person.share}
              </span>
            </div>
          ))}
        </div>

        {/* Highlight Summary Card */}
        <div className="bg-[#f5c744] text-black rounded-[28px] p-5 mb-6 shadow-lg">
          <div className="flex justify-between items-center text-xs font-semibold text-black/70 mb-2">
            <span>Bill Total</span>
            <span className="text-sm text-black font-bold font-['Sora']">
              {bill.currency} {bill.amount}
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="text-lg font-semibold text-black">Your Share</span>
            <span className="text-3xl font-extrabold text-black font-['Sora']">
              {bill.currency} {userShare}
            </span>
          </div>
        </div>

        {/* Slider Action or Settled Banner */}
        {bill.status === 'Settled' || isSuccess ? (
          <div className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 p-4 rounded-full flex items-center justify-center gap-2 font-bold mb-4">
            <ShieldCheck className="w-6 h-6" />
            <span>Bill Approved & Settled!</span>
          </div>
        ) : (
          <div className="space-y-4">
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
              className="relative w-full h-[64px] bg-[#d9d9d9] rounded-full p-1 flex items-center cursor-pointer select-none overflow-hidden group shadow-inner"
            >
              {/* Progress track fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#f5c744] transition-all duration-75 rounded-full"
                style={{ width: `${sliderPosition}%` }}
              />

              {/* Slider Handle */}
              <div
                className="absolute top-1 bottom-1 w-[56px] bg-[#f5c744] rounded-full shadow-md flex items-center justify-center text-black font-bold transition-transform duration-75 group-hover:scale-105"
                style={{
                  left: `calc(4px + (100% - 64px) * ${sliderPosition / 100})`,
                }}
              >
                {isSuccess ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : (
                  <div className="flex -space-x-1">
                    <ChevronRight className="w-5 h-5 stroke-[3]" />
                    <ChevronRight className="w-5 h-5 stroke-[3] -ml-2" />
                  </div>
                )}
              </div>

              {/* Text */}
              <span className="w-full text-center text-black font-extrabold text-base tracking-wide z-10 font-['Sora'] pointer-events-none">
                {isSuccess ? 'Approved!' : 'Slide to approve'}
              </span>
            </div>

            {/* Decline Option */}
            <button
              onClick={() => onDecline(bill.id)}
              className="w-full py-2 text-center text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
