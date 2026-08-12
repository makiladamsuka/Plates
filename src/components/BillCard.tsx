import React from 'react';
import type { Bill } from '../types';

interface BillCardProps {
  bill: Bill;
  onClick: (bill: Bill) => void;
  isDark?: boolean;
}

export const BillCard: React.FC<BillCardProps> = ({ bill, onClick, isDark = true }) => {
  const userShare = bill.participants.find((p) => p.name.includes('You'))?.share || Math.round(bill.amount / bill.peopleCount);

  return (
    <div
      onClick={() => onClick(bill)}
      className={`active:scale-[0.99] transition-all duration-150 rounded-2xl p-3.5 cursor-pointer mb-2.5 relative overflow-hidden border ${
        isDark
          ? 'bg-[#14151b] hover:bg-[#191b23] border-white/[0.07] text-white shadow-sm'
          : 'bg-white hover:bg-[#f9f9fc] border-black/[0.08] text-[#0f1015] shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-3">
          <h3 className={`text-sm font-semibold leading-snug font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            {bill.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
              isDark ? 'text-neutral-300 bg-white/10' : 'text-neutral-700 bg-neutral-100'
            }`}>
              {bill.category}
            </span>
            <span className={`text-[11px] font-normal ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {bill.date} • {bill.peopleCount} people
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-sm font-bold font-['Sora'] block tracking-tight ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            {bill.currency} {bill.amount.toLocaleString()}
          </span>
          <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Your share: <span className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>{bill.currency} {userShare.toLocaleString()}</span>
          </span>
        </div>
      </div>

      <div className={`mt-3 pt-2.5 flex items-center justify-between border-t ${
        isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
      }`}>
        <div className="flex -space-x-1.5 overflow-hidden">
          {bill.participants.slice(0, 3).map((p) => (
            p.avatar ? (
              <img
                key={p.id}
                src={p.avatar}
                alt={p.name}
                className={`inline-block h-5 w-5 rounded-full object-cover ring-1 ${isDark ? 'ring-[#14151b]' : 'ring-white'}`}
              />
            ) : (
              <div
                key={p.id}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ring-1 ${
                  isDark ? 'bg-neutral-700 ring-[#14151b] text-white' : 'bg-neutral-200 ring-white text-neutral-800'
                }`}
              >
                {p.name.substring(0, 1)}
              </div>
            )
          ))}
          {bill.participants.length > 3 && (
            <div className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ring-1 ${
              isDark ? 'bg-neutral-800 ring-[#14151b] text-neutral-400' : 'bg-neutral-100 ring-white text-neutral-600'
            }`}>
              +{bill.participants.length - 3}
            </div>
          )}
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
            bill.status === 'Pending'
              ? 'bg-[#f5c744]/15 text-[#b3890f] dark:text-[#f5c744] border border-[#f5c744]/30'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {bill.status}
        </span>
      </div>
    </div>
  );
};


