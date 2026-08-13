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
    <div className="bg-[#ededf1] min-h-screen relative font-['Sora'] pb-32">
      {/* Header */}
      <div className="pt-[36px] px-[22px] pb-[10px] flex justify-between items-start relative">
        <h1 className="text-[48px] font-bold text-black leading-tight h-[78px] w-[296px]">
          Bills
        </h1>
        <button className="w-[24px] h-[24px] mt-[20px] mr-[10px] text-black">
          <Search className="w-full h-full" />
        </button>
      </div>

      {/* Sort Filter Pills */}
      <div className="flex items-center gap-[15px] overflow-x-auto no-scrollbar pl-[22px] pr-[22px] mt-[5px]">
        {sortOptions.map((opt) => {
          const isActive = activeSort === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSortChange(opt.id)}
              className={`h-[32px] px-[20px] rounded-[35px] text-[18px] font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1a1a1a] text-[#ededf1]'
                  : 'bg-[#d9d9d9] text-black hover:bg-[#d0d0d0]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bill List */}
      <div className="mt-[25px] px-[18px] space-y-[15px] relative z-10">
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
