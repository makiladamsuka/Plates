import React from 'react';
import type { Bill } from '../types';

interface BillCardProps {
  bill: Bill;
  onClick: (bill: Bill) => void;
  isDark?: boolean; // Ignoring isDark since Figma has strict gray backgrounds for these cards
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onClick }) => {
  const isPending = bill.status === 'Pending';
  
  // Choose tag color based on category, matching Figma variations
  let tagColor = 'bg-[#f6d6da]'; // Pink for Restaurant
  if (bill.category.toLowerCase().includes('grocery')) tagColor = 'bg-[#d7ecd1]'; // Green for Grocery
  else if (bill.category.toLowerCase().includes('travel') || bill.category.toLowerCase().includes('transport')) tagColor = 'bg-[#e2d1f0]'; // Purple

  return (
    <div
      onClick={() => onClick(bill)}
      className="bg-white/80 h-[126px] w-full rounded-[24px] relative cursor-pointer active:scale-[0.99] transition-transform shadow-sm font-['Sora'] overflow-hidden border border-black/[0.04]"
    >
      {/* Title */}
      <div className="absolute top-[20px] left-[20px] max-w-[200px]">
        <h3 className="text-[20px] font-bold text-[#1a1a1a] leading-tight truncate tracking-tight">
          {bill.title}
        </h3>
      </div>

      {/* Amount */}
      <div className="absolute bottom-[20px] right-[20px]">
        <span className="text-[28px] font-bold text-[#1a1a1a] tracking-tight">
          {bill.currency} {bill.amount}
        </span>
      </div>

      {/* Category Tag & Date */}
      <div className="absolute bottom-[20px] left-[20px] flex flex-col gap-[5px]">
        <div className={`${tagColor} h-[23px] rounded-[30px] flex items-center justify-center px-[10px] w-fit`}>
          <span className="text-[15px] font-normal text-black leading-none pb-[2px]">
            {bill.category}
          </span>
        </div>
        <span className="text-[15px] font-normal text-black">
          {bill.date}
        </span>
      </div>

      {/* Status Button */}
      <div className="absolute top-[20px] right-[20px]">
        <div className={`h-[28px] rounded-[30px] flex items-center justify-center px-[16px] ${
          isPending ? 'bg-[#f5c744]' : 'bg-[#4c8c3c]'
        }`}>
          <span className="text-[12px] font-bold text-black leading-none pb-[1px]">
            {bill.status}
          </span>
        </div>
      </div>
    </div>
  );
};
