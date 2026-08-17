import React, { useState, useEffect } from 'react';
import { NewBillModal } from '../components/NewBillModal';
import { Plus } from 'lucide-react';
import type { Bill } from '../data/mockData';

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return { bg: '#F6D6DA', text: '#7C3040' };
    case 'Grocery':    return { bg: '#D7ECD1', text: '#2D6A4F' };
    case 'Entertainment': return { bg: '#CDE1FF', text: '#1B4F8A' };
    default: return { bg: '#E5E5EA', text: '#555' };
  }
};

const formatTime = (ts: number) => {
  const date = new Date(ts);
  const now  = new Date();
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `Today · ${hours}${ampm}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

type SortKey = 'all' | 'highest' | 'lowest' | 'oldest';

export function BillsList({ bills, onAddBill, onBillClick }: {
  bills: Bill[];
  onAddBill: (bill: Bill) => void;
  onBillClick?: (id: string) => void;
}) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('all');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 40) setShowHeader(false);
      else if (y < lastScrollY.current) setShowHeader(true);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sortedBills = [...bills].sort((a, b) => {
    if (sortKey === 'highest') return b.total - a.total;
    if (sortKey === 'lowest')  return a.total - b.total;
    if (sortKey === 'oldest')  return a.createdAt - b.createdAt;
    return b.createdAt - a.createdAt; // newest first for 'all'
  });

  const tabs: { key: SortKey; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'highest', label: 'Highest' },
    { key: 'lowest',  label: 'Lowest' },
    { key: 'oldest',  label: 'Oldest' },
  ];

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-40 pt-[138px] font-['Sora']">

      {/* ── Sticky Header ── */}
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30
                    bg-[#EDEDF1] transition-transform duration-300 ease-out
                    ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
      >
        {/* Title row */}
        <div className="px-5 pt-8 pb-3 flex justify-between items-end">
          <h1 className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">
            Bills
          </h1>
          <span className="text-xs font-medium text-[#1A1A1A]/40 mb-0.5">
            {bills.length} total
          </span>
        </div>

        {/* Filter tabs */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setSortKey(t.key)}
              className={`h-7 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap
                          transition-all duration-200 cursor-pointer
                          ${sortKey === t.key
                            ? 'bg-[#1A1A1A] text-[#EDEDF1]'
                            : 'bg-[#D9D9D9] text-[#1A1A1A]/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Hairline separator */}
        <div className="h-px bg-[#1A1A1A]/5 mx-5" />
      </div>

      {/* ── Bill Cards ── */}
      <div className="max-w-[480px] mx-auto px-4 mt-2 flex flex-col gap-3">
        {sortedBills.map(bill => {
          const tag = getTagColor(bill.category);
          return (
            <div
              key={bill.id}
              onClick={() => onBillClick?.(bill.id)}
              className="w-full bg-white rounded-[22px] px-5 py-4 flex flex-col gap-0
                         shadow-[0_1px_6px_rgba(0,0,0,0.07)] cursor-pointer
                         active:scale-[0.985] transition-transform duration-150"
            >
              {/* Row 1: Title + Status */}
              <div className="flex justify-between items-start gap-3">
                <h2 className="text-[17px] font-semibold text-[#1A1A1A] leading-snug flex-1 min-w-0 truncate">
                  {bill.title}
                </h2>
                <span
                  className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mt-0.5
                              ${bill.status === 'Pending'
                                ? 'bg-[#F5C744]/20 text-[#7A5C00]'
                                : 'bg-[#4C8C3C]/15 text-[#2D5A26]'}`}
                >
                  {bill.status}
                </span>
              </div>

              {/* Row 2: Category tag + date */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: tag.bg, color: tag.text }}
                >
                  {bill.category}
                </span>
                <span className="text-[12px] text-[#1A1A1A]/40 font-normal">
                  {formatTime(bill.createdAt)}
                </span>
              </div>

              {/* Separator */}
              <div className="h-px bg-[#1A1A1A]/6 my-3" />

              {/* Row 3: Amount */}
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-[#1A1A1A]/40">Total</span>
                <span className="text-[22px] font-bold text-[#1A1A1A] tracking-tight">
                  LKR {bill.total.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {bills.length === 0 && (
          <div className="text-center mt-16 text-[#1A1A1A]/40 text-sm">
            No bills yet. Tap + to create one.
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-[108px] right-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative h-0">
          <button
            onClick={() => setIsNewBillModalOpen(true)}
            className="absolute right-5 -top-14 w-14 h-14 bg-[#1A1A1A] rounded-full
                       flex items-center justify-center shadow-xl pointer-events-auto
                       active:scale-95 transition-transform duration-150 cursor-pointer"
          >
            <Plus size={22} strokeWidth={2.5} className="text-[#EDEDF1]" />
          </button>
        </div>
      </div>

      <NewBillModal
        isOpen={isNewBillModalOpen}
        onClose={() => setIsNewBillModalOpen(false)}
        onAddBill={onAddBill}
      />
    </div>
  );
}
