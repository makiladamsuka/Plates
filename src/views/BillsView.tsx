import React from 'react';
import type { Bill, SortOption } from '../types';
import { BillCard } from '../components/BillCard';
import { Plus, Search } from 'lucide-react';

interface BillsViewProps {
  bills: Bill[];
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSelectBill: (bill: Bill) => void;
  onOpenNewBill: () => void;
  isDark?: boolean; // We might ignore this if forcing Figma colors
}

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  activeSort,
  onSortChange,
  onSelectBill,
  onOpenNewBill,
}) => {
  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'highest', label: 'Highest' },
    { id: 'lowest', label: 'Lowest' },
    { id: 'oldest', label: 'Oldest' },
  ];

  return (
    <div className="bg-[#ededf1] absolute inset-0 z-10 h-full w-full font-['Sora'] overflow-y-auto pb-32">
      {/* Header */}
      <div className="pt-[48px] px-[24px] pb-[16px] flex justify-between items-start">
        <h1 className="text-[40px] font-bold text-[#1a1a1a] tracking-tight leading-tight">
          Bills
        </h1>
        <button className="w-[40px] h-[40px] rounded-full bg-white/50 border border-black/[0.04] flex items-center justify-center text-[#1a1a1a] shadow-sm hover:bg-white/80 transition-colors">
          <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Sort Filter Pills */}
      <div className="flex items-center gap-[12px] overflow-x-auto no-scrollbar px-[24px] pb-[8px]">
        {sortOptions.map((opt) => {
          const isActive = activeSort === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSortChange(opt.id)}
              className={`h-[36px] px-[20px] rounded-full text-[14px] font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1a1a1a] text-white shadow-md'
                  : 'bg-white/80 text-[#1a1a1a] hover:bg-white border border-black/[0.04] shadow-sm'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bill List */}
      <div className="mt-[16px] px-[24px] space-y-[16px]">
        {bills.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <p className="text-[15px] font-medium">No bills match your search.</p>
          </div>
        ) : (
          bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} />
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={onOpenNewBill}
        className="fixed bottom-[115px] right-[15px] sm:right-[calc(50%-180px)] w-[80px] h-[80px] z-30"
        aria-label="Add Bill"
      >
        <div className="relative w-full h-full">
          {/* We'll use a pink button for Create Bill to match the "Add Button" image in Figma, but since I can't load the exact localhost SVG, I'll build it with CSS */}
          <div className="absolute inset-0 bg-[#f6d6da] rounded-[24px] shadow-xl border border-black/5" style={{ borderRadius: '25px' }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-black">
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </div>
        </div>
      </button>
    </div>
  );
};
