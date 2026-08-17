import React, { useState, useEffect } from 'react';
import { NewBillModal } from '../components/NewBillModal';
import type { Bill } from '../data/mockData';

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return 'bg-[#F6D6DA]';
    case 'Grocery': return 'bg-[#D7ECD1]';
    case 'Entertainment': return 'bg-[#CDE1FF]';
    default: return 'bg-zinc-200';
  }
};

const formatTime = (ts: number) => {
  const date = new Date(ts);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `Today ${hours}${ampm}`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

type SortKey = 'all' | 'highest' | 'lowest' | 'oldest';

export function BillsList({ bills, onAddBill, onBillClick }: { bills: Bill[], onAddBill: (bill: Bill) => void, onBillClick?: (id: string) => void }) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('all');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sortedBills = [...bills].sort((a, b) => {
    if (sortKey === 'highest') return b.total - a.total;
    if (sortKey === 'lowest') return a.total - b.total;
    if (sortKey === 'oldest') return a.createdAt - b.createdAt;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 pt-[160px]">
      
      {/* Fixed Header Container */}
      <div 
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#EDEDF1] transition-transform duration-300 ease-in-out ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[480px] mx-auto">
          <div className="px-6 pt-10 pb-4 flex justify-between items-center">
            {/* Title styled with elegant serif display font matching the user's inspiration image */}
            <h1 className="text-black text-5xl font-bold font-display tracking-tight">Bills</h1>
            {/* Search Icon */}
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All' },
              { key: 'highest', label: 'Highest' },
              { key: 'lowest', label: 'Lowest' },
              { key: 'oldest', label: 'Oldest' },
            ].map(t => (
              <button 
                key={t.key}
                onClick={() => setSortKey(t.key as SortKey)}
                className={`h-8 px-5 rounded-[35px] text-lg font-semibold whitespace-nowrap flex items-center justify-center transition-colors ${
                  sortKey === t.key ? 'bg-[#1A1A1A] text-[#EDEDF1]' : 'bg-[#D9D9D9] text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] mx-auto">
        
        {/* Bills Cards - Balanced, spacious card layout with comfortable padding */}
        <div className="px-5 mt-2 flex flex-col gap-3.5">
          {sortedBills.map(bill => (
            <div 
              key={bill.id}
              onClick={() => onBillClick?.(bill.id)}
              className="w-full bg-[#D9D9D9] rounded-[30px] px-6 py-4.5 flex flex-col gap-3 shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
            >
              {/* Top Row: Title + Status Pill */}
              <div className="flex justify-between items-center gap-3">
                <h2 className="text-[#1A1A1A] text-xl font-semibold leading-tight truncate">{bill.title}</h2>
                <div className={`rounded-full px-3.5 py-1 flex items-center justify-center shrink-0 ${bill.status === 'Pending' ? 'bg-[#F5C744] text-black' : 'bg-[#4C8C3C] text-white'}`}>
                  <span className="text-[12px] font-semibold">{bill.status}</span>
                </div>
              </div>

              {/* Bottom Row: Category Tag, Date & Amount */}
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2.5">
                  <span className={`${getTagColor(bill.category)} text-black px-3 py-1 rounded-full font-medium text-xs`}>
                    {bill.category}
                  </span>
                  <span className="text-black/60 font-normal text-xs">{formatTime(bill.createdAt)}</span>
                </div>
                <span className="text-[#1A1A1A] text-2xl font-semibold">LKR {bill.total}</span>
              </div>
            </div>
          ))}
          {bills.length === 0 && (
            <div className="text-center mt-10 text-black/50">No bills found. Create one!</div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1]">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen} 
        onClose={() => setIsNewBillModalOpen(false)} 
        onAddBill={onAddBill}
      />
    </div>
  );
}
