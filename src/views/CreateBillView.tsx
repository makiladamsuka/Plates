import React, { useState, useRef, useEffect } from 'react';
import type { Bill, CategoryType } from '../types';
import { ChevronLeft, ChevronsRight } from 'lucide-react';

interface CreateBillViewProps {
  onClose: () => void;
  onCreate: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
}

export const CreateBillView: React.FC<CreateBillViewProps> = ({
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Restaurant');
  
  // Slider logic
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
            setTimeout(() => handleCreate(), 300);
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
  }, [isDragging, sliderPos, title, amount, category]);

  const handleCreate = () => {
    if (!title || !amount) {
      setSliderPos(0); // reset if invalid
      return; 
    }
    const numAmount = parseFloat(amount);
    
    onCreate({
      title,
      category,
      date: 'Just now',
      amount: numAmount,
      currency: 'LKR',
      status: 'Pending',
      creator: 'You',
      peopleCount: 4, // Hardcoded for demo to match Figma visual style
      participants: [
        { id: 'p-you', name: 'You', share: Math.round(numAmount / 4), paid: true },
        { id: 'p-1', name: 'Agam Munbo', share: Math.round(numAmount / 4), paid: false },
        { id: 'p-2', name: 'Senu Diya', share: Math.round(numAmount / 4), paid: false },
        { id: 'p-3', name: 'Adhan Dilva', share: Math.round(numAmount / 4), paid: false },
      ],
    });
  };

  const categories: CategoryType[] = ['Restaurant', 'Grocery', 'Travel'];

  return (
    <div className="absolute inset-0 z-40 bg-[#ededf1] overflow-y-auto font-['Sora'] animate-in slide-in-from-right duration-300">
      <div className="relative min-h-full px-[24px] pt-[24px] pb-[100px]">
        {/* Back Button */}
        <button onClick={onClose} className="absolute left-[20px] top-[24px] text-[#1a1a1a] z-10 w-[40px] h-[40px] rounded-full bg-white/50 border border-black/[0.04] flex items-center justify-center hover:bg-white shadow-sm transition-colors">
          <ChevronLeft className="w-[20px] h-[20px]" strokeWidth={2.5} />
        </button>

        {/* Large Container Card */}
        <div className="w-full bg-white/80 border border-black/[0.04] min-h-[753px] rounded-[32px] mt-[72px] p-[24px] relative shadow-sm">
          
          {/* Title Input */}
          <input
            type="text"
            placeholder="Create a bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[32px] font-bold text-[#1a1a1a] mb-[20px] tracking-tight leading-tight bg-transparent border-none outline-none w-full placeholder-[#1a1a1a]/30 pr-[60px]"
          />

          {/* Details / Category */}
          <div className="flex gap-[8px] mb-[40px]">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`h-[24px] rounded-full flex items-center justify-center px-[12px] transition-colors ${category === cat ? 'bg-[#f6d6da] border border-black/20' : 'bg-white border border-black/10 shadow-sm'}`}
              >
                <span className={`text-[13px] font-bold ${category === cat ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/60'} leading-none pb-[2px]`}>{cat}</span>
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="absolute right-[24px] top-[320px] flex items-center justify-end">
            <span className="text-[20px] font-bold text-[#1a1a1a] mr-[4px]">LKR</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[40px] font-bold text-[#1a1a1a] tracking-tight bg-transparent border-none outline-none w-[120px] text-right placeholder-[#1a1a1a]/20"
            />
          </div>

          {/* Mock Friends List (matching Figma) */}
          <div className="mt-[120px] space-y-[12px]">
            {['Agam Munbo', 'Senu Diya', 'Adhan Dilva'].map((name, idx) => (
              <div key={idx} className="bg-[#ededf1] border border-black/[0.04] h-[64px] rounded-[32px] flex items-center px-[16px] relative cursor-pointer active:scale-[0.99] transition-transform hover:border-black/10">
                <span className="text-[15px] font-semibold text-[#1a1a1a] ml-[8px]">{name}</span>
                <div className="absolute right-[12px] w-[40px] h-[40px] rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm">
                  <span className="text-[15px] font-bold text-[#1a1a1a]">{name[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-[32px] left-0 w-full px-[24px]">
            <div className="flex justify-between items-center mb-[16px]">
              <span className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">Your Share</span>
              <span className="text-[18px] font-bold text-white bg-[#1a1a1a] px-[20px] py-[10px] rounded-full shadow-md">
                LKR {amount ? Math.round(parseFloat(amount) / 4).toLocaleString() : 0}
              </span>
            </div>

            {/* Slide to create */}
            <div 
              ref={sliderRef}
              className="w-full h-[74px] rounded-full bg-gradient-to-r from-[#1a1a1a]/10 to-[#1a1a1a]/5 border border-black/5 relative flex items-center overflow-hidden"
            >
              <p className="absolute w-full text-center text-[16px] font-bold text-[#1a1a1a]/60 pointer-events-none tracking-wide">
                Slide to Create
              </p>
              <div
                className="absolute h-[50px] w-[50px] rounded-full bg-[#1a1a1a] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10 transition-transform"
                style={{ 
                  transform: `translateX(${sliderPos}px)`,
                  left: `${padding}px`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <ChevronsRight className="text-white w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
