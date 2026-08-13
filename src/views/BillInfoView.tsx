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
      <div className="relative min-h-full px-[25px] pt-[23px]">
        {/* Back Button */}
        <button onClick={onClose} className="absolute left-[17px] top-[23px] text-black z-10 w-[30px] h-[30px] flex items-center justify-center">
          <ChevronLeft className="w-8 h-8" strokeWidth={2} />
        </button>

        {/* Status Pending Pill */}
        {isPending && (
          <div className="absolute top-[23px] right-[25px] z-10">
            <div className="bg-[#f5c744] h-[30px] rounded-[30px] flex items-center justify-center px-[16px]">
              <span className="text-[13px] font-semibold text-black leading-none pb-[1px]">Pending</span>
            </div>
          </div>
        )}

        {/* Large Container Card (Assuming white/grey background based on Figma bounds) */}
        <div className="w-full bg-[#d9d9d9]/30 min-h-[753px] rounded-[35px] mt-[60px] p-[25px] relative">
          
          {/* Title */}
          <h1 className="text-[24px] font-semibold text-[#1a1a1a] mb-[25px]">
            {bill.title}
          </h1>

          {/* Details */}
          <div className="flex flex-col gap-[7px] mb-[40px]">
            <div className={`${tagColor} h-[23px] rounded-[30px] flex items-center justify-center px-[10px] w-fit`}>
              <span className="text-[15px] font-normal text-black leading-none pb-[2px]">{bill.category}</span>
            </div>
            <p className="text-[15px] font-normal text-black">{bill.date}</p>
            <p className="text-[15px] font-normal text-black">Created by @username</p>
          </div>

          {/* Total Amount */}
          <div className="absolute right-[25px] top-[400px]">
            <span className="text-[24px] font-semibold text-[#1a1a1a]">LKR {bill.amount}</span>
          </div>

          {/* Friends List section */}
          <div className="mt-[60px] space-y-[8px]">
            {bill.participants.map((p, idx) => (
              <div key={idx} className="bg-[#d9d9d9] h-[59px] rounded-[30px] flex items-center px-[15px] relative">
                <span className="text-[14px] font-normal text-black ml-[10px]">{p.name}</span>
                <span className="absolute right-[65px] text-[20px] font-semibold text-[#1a1a1a]">LKR {p.share}</span>
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="absolute right-[10px] w-[39px] h-[39px] rounded-full object-cover" />
                ) : (
                  <div className="absolute right-[10px] w-[39px] h-[39px] rounded-full bg-neutral-300 flex items-center justify-center">
                    <span className="text-[14px] font-bold text-black">{p.name[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-[30px] left-0 w-full px-[25px]">
            <div className="flex justify-between items-center">
              <span className="text-[20px] font-semibold text-[#1a1a1a]">Your Share</span>
              {isPending ? (
                <button
                  onClick={onPay}
                  className="text-[20px] font-semibold text-[#ededf1] bg-[#1a1a1a] px-[15px] py-[5px] rounded-full active:scale-95 transition-transform"
                >
                  Pay LKR {userShare}
                </button>
              ) : (
                <span className="text-[20px] font-semibold text-[#ededf1] bg-[#1a1a1a] px-[15px] py-[5px] rounded-full">
                  Paid LKR {userShare}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
