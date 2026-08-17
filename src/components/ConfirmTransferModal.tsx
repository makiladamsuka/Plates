import React, { useState, useRef, useEffect } from 'react';

interface ConfirmTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  username: string;
}

export function ConfirmTransferModal({ isOpen, onClose, onConfirm, amount, username }: ConfirmTransferModalProps) {
  const [slideProgress, setSlideProgress] = useState(12);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Reset progress when opened
  useEffect(() => {
    if (isOpen) {
      setSlideProgress(12);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 50; 
    
    const minX = 12;
    const maxX = trackRect.width - thumbWidth - 12;
    
    let newX = e.clientX - trackRect.left - (thumbWidth / 2);
    newX = Math.max(minX, Math.min(newX, maxX));
    
    setSlideProgress(newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 50;
    const maxX = trackRect.width - thumbWidth - 12;
    
    // If slid past 90%, confirm it!
    if (slideProgress > maxX * 0.9) {
      setSlideProgress(maxX);
      setTimeout(() => {
        onConfirm();
      }, 300);
    } else {
      // Snap back to start
      setSlideProgress(12);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-center pointer-events-none">
      <div className="w-full max-w-[480px] h-full relative flex flex-col justify-end pointer-events-none">
        
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 pointer-events-auto animate-fade-in" 
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="w-full bg-[#1A1A1A] rounded-t-[35px] p-6 relative flex flex-col items-center pointer-events-auto animate-slide-up shadow-2xl h-[422px]">
          
          {/* Header Content */}
          <div className="mt-4 text-center">
            <h2 className="text-white text-2xl font-normal font-['Sora']">Confirm Transfer</h2>
            <p className="text-[#D9D9D9] text-sm font-normal font-['Sora'] mt-1">to {username}</p>
          </div>
          
          {/* Amount */}
          <div className="text-white text-3xl font-semibold font-['Sora'] mt-6">
            LKR {amount}
          </div>

          {/* Slide to Approve Track */}
          <div 
            ref={trackRef}
            className="w-full max-w-[365px] h-[74px] bg-[#D9D9D9] rounded-[50px] mt-10 relative flex items-center justify-center select-none touch-none"
          >
            <span className="text-black text-lg font-bold font-['Sora'] pointer-events-none transition-opacity duration-300" style={{ opacity: slideProgress > 50 ? 0 : 1 }}>
              Slide to approve
            </span>
            
            {/* Draggable Thumb */}
            <div 
              className="absolute left-0 top-[12px] w-[50px] h-[50px] bg-[#F5C744] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md touch-none"
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

          {/* Decline Button */}
          <button 
            onClick={onClose}
            className="text-white text-[15px] font-normal font-['Sora'] mt-auto mb-4 active:scale-95 transition-transform"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
