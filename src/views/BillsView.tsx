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
    <div className="px-4 pb-28 pt-2">
      {/* Sort Filter Buttons (Figma Group 1 / Node 53:84) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-4">
        {sortOptions.map((opt) => {
          const isActive = activeSort === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSortChange(opt.id)}
              className={`px-5 py-1.5 rounded-full text-base font-semibold transition-all duration-200 shrink-0 font-['Sora'] ${
                isActive
                  ? 'bg-[#1a1a1a] text-[#ededf1] shadow-sm'
                  : 'bg-[#d9d9d9] text-black hover:bg-[#cfcfd4]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bill List */}
      {bills.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No bills match your query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB - Figma Ellipse 3 node 64:76) */}
      <button
        onClick={onOpenNewBill}
        className="fixed bottom-24 right-5 sm:right-[calc(50%-180px)] w-16 h-16 rounded-full bg-[#ffd0db] hover:bg-[#ffb6c7] active:scale-90 transition-all shadow-xl flex items-center justify-center text-black z-30 border border-black/10"
        aria-label="Add Bill"
      >
        <Plus className="w-8 h-8 stroke-[2.5]" />
      </button>
    </div>
  );
};
