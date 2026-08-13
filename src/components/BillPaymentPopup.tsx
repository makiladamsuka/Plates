import React, { useState, useRef, useEffect } from 'react';
import type { Bill } from '../types';
import { ChevronsRight } from 'lucide-react';

interface BillPaymentPopupProps {
  bill: Bill | null;
  amount: number;
  onClose: () => void;
  onApprove: () => void;
}

export const BillPaymentPopup: React.FC<BillPaymentPopupProps> = ({
  bill,
  amount,
  onClose,
  onApprove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const handleWidth = 50;
  const padding = 12;

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (sliderRef.current) {
          const maxPos = sliderRef.current.clientWidth - handleWidth - (padding * 2);
          if (sliderPos > maxPos * 0.8) {
            setSliderPos(maxPos);
            setTimeout(() => onApprove(), 300);
          } else {
            setSliderPos(0);
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      let newPos = clientX - sliderRect.left - padding - (handleWidth / 2);
      const maxPos = sliderRect.width - handleWidth - (padding * 2);
      if (newPos < 0) newPos = 0;
      if (newPos > maxPos) newPos = maxPos;
      setSliderPos(newPos);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, sliderPos, onApprove]);

  if (!bill) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 transition-opacity font-['Sora']">
      <div
        className="w-full max-w-[402px] h-[422px] rounded-t-[30px] flex flex-col items-center pt-[30px] pb-[30px] shadow-2xl relative bg-[#1a1a1a] text-white animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[24px] font-normal mb-[15px]">
          Confirm Transfer
        </h2>
        
        <h3 className="text-[24px] font-normal mb-[40px]">
          {bill.currency} {amount}
        </h3>

        {/* Slide to approve container */}
        <div 
          ref={sliderRef}
          className="w-[365px] h-[74px] rounded-[37px] bg-[#d9d9d9] relative flex items-center mb-[10px] overflow-hidden"
        >
          <p className="absolute w-full text-center text-[18px] font-bold text-black pointer-events-none">
            Slide to approve
          </p>
          
          <div
            className="absolute h-[50px] w-[50px] rounded-full bg-[#f6d6da] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm z-10 transition-transform"
            style={{ 
              transform: `translateX(${sliderPos}px)`,
              left: `${padding}px`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <ChevronsRight className="text-black w-6 h-6" />
          </div>
        </div>

        <p className="text-[14px] font-normal text-[#d9d9d9] mb-[auto]">
          to @username
        </p>

        {/* Decline Button */}
        <button
          onClick={onClose}
          className="text-[15px] font-normal text-white/80 hover:text-white pb-[20px] transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
};
