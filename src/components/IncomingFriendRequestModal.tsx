import React, { useState, useRef, useEffect } from 'react';
import type { Friend } from '../data/mockData';

interface IncomingFriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  friend?: Friend;
}

export function IncomingFriendRequestModal({ 
  isOpen, 
  onClose, 
  onApprove, 
  friend 
}: IncomingFriendRequestModalProps) {
  const [slideProgress, setSlideProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setSlideProgress(0);
    }
  }, [isOpen]);

  if (!isOpen || !friend) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 50; 
    const padding = 12;
    const maxX = trackRect.width - thumbWidth - (padding * 2);
    
    let newX = e.clientX - trackRect.left - padding - (thumbWidth / 2);
    newX = Math.max(0, Math.min(newX, maxX));
    
    setSlideProgress(newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 50;
    const padding = 12;
    const maxX = trackRect.width - thumbWidth - (padding * 2);
    
    // If slid past 85%, approve request
    if (slideProgress > maxX * 0.85) {
      setSlideProgress(maxX);
      setTimeout(() => {
        onApprove();
      }, 300);
    } else {
      // Snap back to start
      setSlideProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-center pointer-events-none font-['Sora']">
      <div className="w-full max-w-[480px] h-full relative flex flex-col justify-end pointer-events-none">
        
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 pointer-events-auto transition-opacity animate-in fade-in duration-300" 
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="w-full bg-[#1A1A1A] rounded-t-[35px] px-5 pt-6 pb-8 relative flex flex-col items-center pointer-events-auto animate-in slide-in-from-bottom-32 duration-300 shadow-2xl min-h-[422px]">
          
          {/* Friend Request Card */}
          <div className="w-full max-w-[360px] h-[127px] bg-[#F6D6DA] rounded-[30px] p-5 flex flex-col justify-between shadow-md mt-2">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-[50px] h-[50px] rounded-full opacity-40 shrink-0" 
                style={{ backgroundColor: friend.color || '#4C8C3C' }}
              />
              <div className="flex flex-col">
                <span className="text-[#1A1A1A] text-2xl font-semibold leading-tight">
                  {friend.name}
                </span>
                <span className="text-black text-[15px] font-normal leading-tight mt-0.5">
                  {friend.username}
                </span>
              </div>
            </div>

            <div className="text-black text-base font-normal pl-1">
              Wants to Follow You
            </div>
          </div>

          {/* Slide to Approve Track */}
          <div 
            ref={trackRef}
            className="w-full max-w-[365px] h-[74px] shrink-0 bg-[#D9D9D9] rounded-[50px] mt-6 relative flex items-center justify-center select-none touch-none"
          >
            <span 
              className="text-black text-lg font-bold pointer-events-none transition-opacity duration-200" 
              style={{ opacity: slideProgress > 40 ? 0 : 1 }}
            >
              Slide to approve
            </span>
            
            {/* Draggable Thumb Bounds */}
            <div className="absolute inset-y-[12px] left-[12px] right-[12px] pointer-events-none">
              <div 
                className="absolute left-0 top-0 w-[50px] h-[50px] shrink-0 bg-[#F6D6DA] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md pointer-events-auto touch-none"
                style={{ 
                  transform: `translateX(${slideProgress}px)`,
                  transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* Double Arrow Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black ml-0.5">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Decline Button */}
          <button 
            onClick={onClose}
            className="text-white text-[15px] font-normal mt-5 active:scale-95 transition-transform"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
