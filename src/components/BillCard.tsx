import React from 'react';
import type { Bill } from '../types';

interface BillCardProps {
  bill: Bill;
  onClick: (bill: Bill) => void;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onClick }) => {
  const isRestaurant = bill.category === 'Restaurant';

  return (
    <div
      onClick={() => onClick(bill)}
      className="bg-[#d9d9d9] hover:bg-[#d0d0d5] active:scale-[0.98] transition-all duration-200 rounded-[32px] p-5 shadow-sm cursor-pointer mb-4 border border-black/5 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-[22px] font-semibold text-[#1a1a1a] leading-tight font-['Sora']">
            {bill.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-medium text-black ${
                isRestaurant ? 'bg-[#f6d6da]' : 'bg-[#d7ecd1]'
              }`}
            >
              {bill.category}
            </span>
            <span className="text-xs text-gray-600 font-normal">
              {bill.date}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-[#1a1a1a] font-['Sora'] block">
            {bill.currency} {bill.amount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div
          className={`w-[220px] py-1.5 rounded-full text-center font-semibold text-sm transition-all shadow-sm ${
            bill.status === 'Pending'
              ? 'bg-[#f5c744] text-black hover:brightness-105'
              : 'bg-[#4c8c3c] text-white hover:brightness-105'
          }`}
        >
          {bill.status}
        </div>
      </div>
    </div>
  );
};
