import React from 'react';
import type { Bill } from '../types';
import { ChevronLeft } from 'lucide-react';

interface BillInfoViewProps {
  bill: Bill | null;
  onClose: () => void;
  onPay: () => void;
}

export const BillInfoView: React.FC<BillInfoViewProps> = ({
  bill,
  onClose,
  onPay,
}) => {
  if (!bill) return null;

  const userShare = bill.participants.find((p) => p.name.includes('You'))?.share || Math.round(bill.amount / bill.peopleCount);
  const isPending = bill.status === 'Pending';

  let tagColor = 'bg-[#f6d6da]';
  if (bill.category.toLowerCase().includes('grocery')) tagColor = 'bg-[#d7ecd1]';
  else if (bill.category.toLowerCase().includes('travel')) tagColor = 'bg-[#e2d1f0]';

  return (
    <div className="absolute inset-0 z-40 bg-[#ededf1] overflow-y-auto font-['Sora'] pb-32 animate-in slide-in-from-right duration-300">
      <div className="relative min-h-full px-[24px] pt-[24px]">
        {/* Back Button */}
        <button onClick={onClose} className="absolute left-[20px] top-[24px] text-[#1a1a1a] z-10 w-[40px] h-[40px] rounded-full bg-white/50 border border-black/[0.04] flex items-center justify-center hover:bg-white shadow-sm transition-colors">
          <ChevronLeft className="w-[20px] h-[20px]" />
        </button>

        {/* Status Pending Pill */}
        {isPending && (
          <div className="absolute top-[28px] right-[24px] z-10">
            <div className="bg-[#f5c744] h-[32px] rounded-full flex items-center justify-center px-[16px] shadow-sm">
              <span className="text-[12px] font-bold text-[#1a1a1a] leading-none pb-[1px] uppercase tracking-wider">Pending</span>
            </div>
          </div>
        )}

        {/* Large Container Card */}
        <div className="w-full bg-white/80 border border-black/[0.04] min-h-[753px] rounded-[32px] mt-[72px] p-[24px] relative shadow-sm">
          
          {/* Title */}
          <h1 className="text-[32px] font-bold text-[#1a1a1a] mb-[20px] tracking-tight leading-tight pr-[60px]">
            {bill.title}
          </h1>

          {/* Details */}
          <div className="flex flex-col gap-[8px] mb-[40px]">
            <div className={`${tagColor} h-[24px] rounded-full flex items-center justify-center px-[12px] w-fit`}>
              <span className="text-[13px] font-bold text-[#1a1a1a] leading-none pb-[2px]">{bill.category}</span>
            </div>
            <p className="text-[14px] font-medium text-[#1a1a1a]/60">{bill.date}</p>
            <p className="text-[14px] font-medium text-[#1a1a1a]/60">Created by <span className="font-bold text-[#1a1a1a]">@username</span></p>
          </div>

          {/* Total Amount */}
          <div className="absolute right-[24px] top-[320px]">
            <span className="text-[40px] font-bold text-[#1a1a1a] tracking-tight">LKR {bill.amount.toLocaleString()}</span>
          </div>

          {/* Friends List section */}
          <div className="mt-[120px] space-y-[12px]">
            {bill.participants.map((p, idx) => (
              <div key={idx} className="bg-[#ededf1] border border-black/[0.04] h-[64px] rounded-[32px] flex items-center px-[16px] relative">
                <span className="text-[15px] font-semibold text-[#1a1a1a] ml-[8px]">{p.name}</span>
                <span className="absolute right-[70px] text-[18px] font-bold text-[#1a1a1a] tracking-tight">LKR {p.share.toLocaleString()}</span>
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="absolute right-[12px] w-[40px] h-[40px] rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="absolute right-[12px] w-[40px] h-[40px] rounded-full bg-white border border-black/10 flex items-center justify-center shadow-sm">
                    <span className="text-[15px] font-bold text-[#1a1a1a]">{p.name[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-[32px] left-0 w-full px-[24px]">
            <div className="flex justify-between items-center">
              <span className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">Your Share</span>
              {isPending ? (
                <button
                  onClick={onPay}
                  className="text-[18px] font-bold text-white bg-[#1a1a1a] px-[20px] py-[10px] rounded-full active:scale-95 transition-transform shadow-lg"
                >
                  Pay LKR {userShare.toLocaleString()}
                </button>
              ) : (
                <span className="text-[18px] font-bold text-white bg-[#1a1a1a] px-[20px] py-[10px] rounded-full opacity-50 cursor-not-allowed">
                  Paid LKR {userShare.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
