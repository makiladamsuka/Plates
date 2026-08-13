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
    <div className="fixed inset-0 z-40 bg-[#ededf1] overflow-y-auto font-['Sora'] animate-in slide-in-from-right duration-300">
      <div className="relative min-h-screen px-[25px] pt-[23px] pb-[100px]">
        {/* Back Button */}
        <button onClick={onClose} className="absolute left-[17px] top-[23px] text-black z-10 w-[30px] h-[30px] flex items-center justify-center">
          <ChevronLeft className="w-8 h-8" strokeWidth={2} />
        </button>

        {/* Large Container Card */}
        <div className="w-full bg-[#d9d9d9]/30 min-h-[753px] rounded-[35px] mt-[60px] p-[25px] relative">
          
          {/* Title Input */}
          <input
            type="text"
            placeholder="Create a bill"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[24px] font-semibold text-[#1a1a1a] mb-[25px] bg-transparent border-none outline-none w-full placeholder-neutral-400"
          />

          {/* Details / Category */}
          <div className="flex gap-[10px] mb-[40px]">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`h-[23px] rounded-[30px] flex items-center justify-center px-[10px] ${category === cat ? 'bg-[#f6d6da] border border-black/20' : 'bg-transparent border border-black/20'}`}
              >
                <span className="text-[15px] font-normal text-black leading-none pb-[2px]">{cat}</span>
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="absolute right-[25px] top-[400px] flex items-center justify-end">
            <span className="text-[24px] font-semibold text-[#1a1a1a] mr-[5px]">LKR</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[24px] font-semibold text-[#1a1a1a] bg-transparent border-none outline-none w-[100px] text-right placeholder-neutral-400"
            />
          </div>

          {/* Mock Friends List (matching Figma) */}
          <div className="mt-[60px] space-y-[8px]">
            {['Agam Munbo', 'Senu Diya', 'Adhan Dilva'].map((name, idx) => (
              <div key={idx} className="bg-[#d9d9d9] h-[59px] rounded-[30px] flex items-center px-[15px] relative cursor-pointer active:scale-[0.99] transition-transform border border-transparent hover:border-black/10">
                <span className="text-[14px] font-normal text-black ml-[10px]">{name}</span>
                <div className="absolute right-[10px] w-[39px] h-[39px] rounded-full bg-neutral-300 flex items-center justify-center">
                  <span className="text-[14px] font-bold text-black">{name[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-[30px] left-0 w-full px-[25px]">
            <div className="flex justify-between items-center mb-[15px]">
              <span className="text-[20px] font-semibold text-[#1a1a1a]">Your Share</span>
              <span className="text-[20px] font-semibold text-[#ededf1] bg-[#1a1a1a] px-[15px] py-[5px] rounded-full">
                Pay LKR {amount ? Math.round(parseFloat(amount) / 4) : 0}
              </span>
            </div>

            {/* Slide to create */}
            <div 
              ref={sliderRef}
              className="w-full h-[74px] rounded-[37px] bg-[#d9d9d9] border border-black/10 relative flex items-center overflow-hidden"
            >
              <p className="absolute w-full text-center text-[18px] font-bold text-black pointer-events-none">
                Slide to create
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
          </div>
        </div>
      </div>
    </div>
  );
};
