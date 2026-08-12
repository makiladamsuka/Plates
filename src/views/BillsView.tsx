import React from 'react';
import type { Bill, SortOption } from '../types';
import { BillCard } from '../components/BillCard';
import { Plus } from 'lucide-react';

interface BillsViewProps {
  bills: Bill[];
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSelectBill: (bill: Bill) => void;
  onOpenNewBill: () => void;
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
    <div className="px-4 pb-24 pt-2">
      {/* Sort Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3">
        {sortOptions.map((opt) => {
          const isActive = activeSort === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSortChange(opt.id)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-150 shrink-0 font-['Sora'] ${
                isActive
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#16171e] text-neutral-400 hover:text-white border border-white/[0.08]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bill List */}
      {bills.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <p className="text-xs font-medium">No bills match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={onOpenNewBill}
        className="fixed bottom-20 right-5 sm:right-[calc(50%-180px)] w-12 h-12 rounded-full bg-[#f5c744] hover:bg-yellow-400 active:scale-95 transition-all shadow-xl flex items-center justify-center text-black z-30 border border-black/20"
        aria-label="Add Bill"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};

