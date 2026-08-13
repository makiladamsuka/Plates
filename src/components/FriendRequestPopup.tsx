import React, { useState, useRef, useEffect } from 'react';
import type { Friend } from '../types';
import { ChevronsRight } from 'lucide-react';

interface FriendRequestPopupProps {
  friend: Friend | null;
  onClose: () => void;
  onApprove: () => void;
  isDark?: boolean;
}

export const FriendRequestPopup: React.FC<FriendRequestPopupProps> = ({
  friend,
  onClose,
  onApprove,
  isDark: _isDark = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(0); // in pixels
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const handleWidth = 50;
  const padding = 12; // 12px from left

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        
        if (sliderRef.current) {
          const maxPos = sliderRef.current.clientWidth - handleWidth - (padding * 2);
          if (sliderPos > maxPos * 0.8) {
            // Reached the end (80%+)
            setSliderPos(maxPos);
            setTimeout(() => onApprove(), 300);
          } else {
            // Snap back
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

  if (!friend) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 transition-opacity font-['Sora']">
      <div
        className="w-full max-w-[402px] h-[422px] rounded-t-[30px] flex flex-col items-center pt-[20px] pb-[30px] shadow-2xl relative bg-[#1a1a1a] text-white animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[24px] font-semibold mb-[20px]">
          Friend Request
        </h2>

        {/* User Info Card (Soft Pink) */}
        <div className="w-[360px] h-[127px] rounded-[30px] bg-[#f6d6da] relative mb-[20px] flex flex-col justify-center px-[30px]">
          <div className="flex items-center gap-[15px]">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-[54px] h-[54px] rounded-full object-cover"
            />
            <div>
              <h3 className="text-[24px] font-semibold text-[#1a1a1a] leading-tight">
                {friend.name}
              </h3>
              <p className="text-[15px] font-normal text-black">
                {friend.username}
              </p>
            </div>
          </div>
          <p className="text-[16px] font-normal text-black mt-[15px] ml-[70px]">
            Wants to Follow You
          </p>
        </div>

        {/* Slide to approve container */}
        <div 
          ref={sliderRef}
          className="w-[365px] h-[74px] rounded-[37px] bg-[#d9d9d9] relative flex items-center mb-[20px] overflow-hidden"
        >
          <p className="absolute w-full text-center text-[18px] font-bold text-black pointer-events-none ml-[20px]">
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

        {/* Decline Button */}
        <button
          onClick={onClose}
          className="text-[15px] text-white/80 hover:text-white mt-[10px] py-2 px-6 rounded-full transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
};
