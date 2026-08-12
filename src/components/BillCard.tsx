import React from 'react';
import type { Bill } from '../types';

interface BillCardProps {
  bill: Bill;
  onClick: (bill: Bill) => void;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onClick }) => {
  const userShare = bill.participants.find((p) => p.name.includes('You'))?.share || Math.round(bill.amount / bill.peopleCount);

  return (
    <div
      onClick={() => onClick(bill)}
      className="bg-[#14151b] hover:bg-[#191b23] active:scale-[0.99] transition-all duration-150 rounded-2xl p-3.5 shadow-sm cursor-pointer mb-2.5 border border-white/[0.07] relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-3">
          <h3 className="text-sm font-semibold text-white leading-snug font-['Sora']">
            {bill.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-neutral-300 bg-white/10">
              {bill.category}
            </span>
            <span className="text-[11px] text-neutral-400 font-normal">
              {bill.date} • {bill.peopleCount} people
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-white font-['Sora'] block tracking-tight">
            {bill.currency} {bill.amount.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">
            Your share: <span className="font-semibold text-neutral-200">{bill.currency} {userShare.toLocaleString()}</span>
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex -space-x-1.5 overflow-hidden">
          {bill.participants.slice(0, 3).map((p) => (
            p.avatar ? (
              <img
                key={p.id}
                src={p.avatar}
                alt={p.name}
                className="inline-block h-5 w-5 rounded-full ring-1 ring-[#14151b] object-cover"
              />
            ) : (
              <div
                key={p.id}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 ring-1 ring-[#14151b] text-[9px] font-bold text-white"
              >
                {p.name.substring(0, 1)}
              </div>
            )
          ))}
          {bill.participants.length > 3 && (
            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 ring-1 ring-[#14151b] text-[9px] font-bold text-neutral-400">
              +{bill.participants.length - 3}
            </div>
          )}
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
            bill.status === 'Pending'
              ? 'bg-[#f5c744]/15 text-[#f5c744] border border-[#f5c744]/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {bill.status}
        </span>
      </div>
    </div>
  );
};

