import React, { useState, useEffect } from 'react';
import { NewBillModal } from '../components/NewBillModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return 'bg-[#F6D6DA]';
    case 'Grocery': return 'bg-[#D7ECD1]';
    case 'Entertainment': return 'bg-[#CDE1FF]';
    default: return 'bg-zinc-200';
  }
};

const formatTime = (ts: any) => {
  if (!ts) return 'Recent';
  const date = new Date(typeof ts === 'string' && !isNaN(Number(ts)) ? Number(ts) : ts);
  if (isNaN(date.getTime())) return 'Recent';
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

interface BillsListProps {
  onBillClick?: (id: string) => void;
}

export function BillsList({ onBillClick }: BillsListProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('all');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = React.useRef(0);

  const fetchBills = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id;
      if (uid) {
        api.getBills(uid).then(setBills).catch(console.error);
      } else {
        api.getBills().then(setBills).catch(console.error);
      }
    });
  };

  useEffect(() => {
    fetchBills();
  }, []);

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
    const timeA = new Date(a.created_at || a.createdAt || Date.now()).getTime();
    const timeB = new Date(b.created_at || b.createdAt || Date.now()).getTime();
    if (sortKey === 'highest') return Number(b.total) - Number(a.total);
    if (sortKey === 'lowest') return Number(a.total) - Number(b.total);
    if (sortKey === 'oldest') return timeA - timeB;
    return timeB - timeA;
  });

  return (
    <div className="w-full pb-24 md:pb-8 font-sans-app">
      
      {/* Header Container */}
      <div className="px-5 pt-6 pb-4 md:px-0 md:pt-0 md:pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-[#1A1A1A]">
            Bills & Splits
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-sans-app mt-1">
            All shared meals, dining tabs, and settled expenses.
          </p>
        </div>

        {/* Desktop Create Bill Button */}
        <button
          onClick={() => setIsNewBillModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Split a Plate</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 md:px-0 pb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'All Bills' },
          { key: 'highest', label: 'Highest Amount' },
          { key: 'lowest', label: 'Lowest Amount' },
          { key: 'oldest', label: 'Oldest' },
        ].map(t => (
          <button 
            key={t.key}
            onClick={() => setSortKey(t.key as SortKey)}
            className={`h-8 px-4 rounded-full text-xs font-semibold whitespace-nowrap flex items-center justify-center transition-all cursor-pointer border ${
              sortKey === t.key 
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs' 
                : 'bg-white text-gray-600 border-black/8 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content: Responsive Grid / List */}
      <div className="px-5 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBills.map(bill => {
          const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';

          return (
            <div 
              key={bill.id}
              onClick={() => onBillClick?.(bill.id)}
              className="w-full bg-white border border-black/8 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs cursor-pointer hover:border-black/20 hover:shadow-xs transition-all"
            >
              {/* Top Row: Title + Status Pill */}
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-[#1A1A1A] text-base sm:text-lg font-bold leading-snug line-clamp-1">{bill.title}</h2>
                  <span className="text-gray-400 font-normal text-xs">{formatTime(bill.created_at || bill.createdAt)}</span>
                </div>
                <div className={`rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0 border text-[11px] font-bold ${
                  displayStatus === 'Settled' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                    : 'bg-amber-50 text-amber-800 border-amber-200/60'
                }`}>
                  <span>{displayStatus}</span>
                </div>
              </div>

              {/* Bottom Row: Category Tag & Amount */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-black/5">
                  {bill.category || 'General'}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-gray-400 text-[10px] uppercase font-semibold">Total</span>
                  <span className="text-[#1A1A1A] text-xl font-extrabold tracking-tight">LKR {bill.total}</span>
                </div>
              </div>
            </div>
          );
        })}

        {sortedBills.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-black/10 rounded-2xl p-12 text-center text-gray-400 text-sm">
            ✨ No bills found yet. Click "Split a Plate" to create your first tab!
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-5 z-40">
        <button 
          onClick={() => setIsNewBillModalOpen(true)}
          className="w-14 h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen} 
        onClose={() => setIsNewBillModalOpen(false)} 
        onSuccess={() => {
          setIsNewBillModalOpen(false);
          fetchBills();
        }}
      />
    </div>
  );
}
