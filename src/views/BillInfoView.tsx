import React, { useState } from 'react';
import type { Bill } from '../types';
import { ChevronLeft, ChevronsRight } from 'lucide-react';

interface BillInfoViewProps {
  bill: Bill | null;
  onClose: () => void;
  onPay: () => void;
}

export const BillInfoView: React.FC<BillInfoViewProps> = ({
  bill,
  onClose,
  onPay,
}) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  
  const handleWidth = 50;
  const padding = 12;

  React.useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (sliderRef.current) {
          const maxPos = sliderRef.current.clientWidth - handleWidth - (padding * 2);
          if (sliderPos > maxPos * 0.8) {
            setSliderPos(maxPos);
            setTimeout(() => onPay(), 300);
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
  }, [isDragging, sliderPos, onPay]);

  if (!bill) return null;

  const userShare = bill.participants.find((p) => p.name.includes('You'))?.share || Math.round(bill.amount / bill.peopleCount);
  const isPending = bill.status === 'Pending';

  let tagColor = 'bg-[#f6d6da]';
  if (bill.category.toLowerCase().includes('grocery')) tagColor = 'bg-[#d7ecd1]';
  else if (bill.category.toLowerCase().includes('travel')) tagColor = 'bg-[#e2d1f0]';

  return (
    <div className="fixed inset-0 z-40 bg-[#ededf1] overflow-y-auto font-['Sora'] pb-32 animate-in slide-in-from-right duration-300">
      <div className="relative min-h-screen px-[25px] pt-[23px]">
        {/* Back Button */}
        <button onClick={onClose} className="absolute left-[17px] top-[23px] text-black z-10 w-[30px] h-[30px] flex items-center justify-center">
          <ChevronLeft className="w-8 h-8" strokeWidth={2} />
        </button>

        {/* Status Pending Pill */}
        {isPending && (
          <div className="absolute top-[23px] right-[25px] z-10">
            <div className="bg-[#f5c744] h-[30px] rounded-[30px] flex items-center justify-center px-[16px]">
              <span className="text-[13px] font-semibold text-black leading-none pb-[1px]">Pending</span>
            </div>
          </div>
        )}

        {/* Large Container Card (Assuming white/grey background based on Figma bounds) */}
        <div className="w-full bg-[#d9d9d9]/30 min-h-[753px] rounded-[35px] mt-[60px] p-[25px] relative">
          
          {/* Title */}
          <h1 className="text-[24px] font-semibold text-[#1a1a1a] mb-[25px]">
            {bill.title}
          </h1>

          {/* Details */}
          <div className="flex flex-col gap-[7px] mb-[40px]">
            <div className={`${tagColor} h-[23px] rounded-[30px] flex items-center justify-center px-[10px] w-fit`}>
              <span className="text-[15px] font-normal text-black leading-none pb-[2px]">{bill.category}</span>
            </div>
            <p className="text-[15px] font-normal text-black">{bill.date}</p>
            <p className="text-[15px] font-normal text-black">Created by @username</p>
          </div>

          {/* Total Amount */}
          <div className="absolute right-[25px] top-[400px]">
            <span className="text-[24px] font-semibold text-[#1a1a1a]">LKR {bill.amount}</span>
          </div>

          {/* Friends List section */}
          <div className="mt-[60px] space-y-[8px]">
            {bill.participants.map((p, idx) => (
              <div key={idx} className="bg-[#d9d9d9] h-[59px] rounded-[30px] flex items-center px-[15px] relative">
                <span className="text-[14px] font-normal text-black ml-[10px]">{p.name}</span>
                <span className="absolute right-[65px] text-[20px] font-semibold text-[#1a1a1a]">LKR {p.share}</span>
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="absolute right-[10px] w-[39px] h-[39px] rounded-full object-cover" />
                ) : (
                  <div className="absolute right-[10px] w-[39px] h-[39px] rounded-full bg-neutral-300 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-black">{p.name[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-[30px] left-0 w-full px-[25px]">
            <div className="flex justify-between items-center mb-[15px]">
              <span className="text-[20px] font-semibold text-[#1a1a1a]">Your Share</span>
              <span className="text-[20px] font-semibold text-[#ededf1] bg-[#1a1a1a] px-[15px] py-[5px] rounded-full">Pay LKR {userShare}</span>
            </div>

            {/* Slide to approve / pay */}
            {isPending && (
              <div 
                ref={sliderRef}
                className="w-full h-[74px] rounded-[37px] bg-gradient-to-r from-neutral-800 to-black relative flex items-center overflow-hidden"
              >
                <p className="absolute w-full text-center text-[18px] font-bold text-white pointer-events-none">
                  Slide to Pay
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
