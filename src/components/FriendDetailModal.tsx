import React from 'react';
import type { Friend, Bill } from '../types';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';

interface FriendDetailModalProps {
  friend: Friend | null;
  bills: Bill[];
  onClose: () => void;
  onSelectBill: (bill: Bill) => void;
  isDark?: boolean;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
  friend,
  bills,
  onClose,
  onSelectBill,
  isDark = true,
}) => {
  if (!friend) return null;

  // Filter bills where this friend is a participant or creator
  const friendBills = bills.filter(
    (b) =>
      b.creator === friend.name ||
      b.participants.some((p) => p.name.toLowerCase().includes(friend.name.toLowerCase()))
  );

  const displayBills = friendBills.length > 0 ? friendBills : bills.slice(0, 4);
  const isOwed = friend.balance >= 0;

  return (
    <div className={`absolute inset-0 z-40 flex flex-col font-['Sora'] transition-colors duration-200 ${
      isDark ? 'bg-[#090a0f] text-white' : 'bg-[#ededf1] text-[#1a1a1a]'
    }`}>
      {/* Header Area */}
      <div className="relative pt-6 px-4 mb-6">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-6 p-1 z-10"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Friend Info */}
        <div className="mt-10 ml-[5px] flex items-start justify-between">
          <div className="flex items-center gap-[7px]">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-[50px] h-[50px] rounded-full object-cover"
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-[24px] font-semibold leading-tight">
                {friend.name}
              </h1>
              <p className={`text-[15px] ${isDark ? 'text-neutral-400' : 'text-black'}`}>
                {friend.username}
              </p>
            </div>
          </div>
          
          <div className="mt-[42px] flex items-center gap-1 font-semibold text-[20px]">
            {isOwed ? (
              <ArrowUpRight className="w-6 h-6 stroke-[2]" />
            ) : (
              <ArrowDownLeft className="w-6 h-6 stroke-[2]" />
            )}
            <span>LKR {Math.abs(friend.balance).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="flex-1 overflow-y-auto px-[9px] pb-32 space-y-[10px]">
        {displayBills.map((bill, idx) => (
          <div
            key={bill.id || idx}
            onClick={() => onSelectBill(bill)}
            className={`w-full h-[56.6px] rounded-[35px] flex items-center justify-between px-5 cursor-pointer ${
              isDark ? 'bg-[#2a2a2a]' : 'bg-[#d9d9d9]'
            }`}
          >
            <span className="text-[16px] font-semibold">
              {bill.title}
            </span>
            <div className="flex items-center gap-1">
              {isOwed ? (
                <ArrowUpRight className="w-[20px] h-[20px] stroke-[2]" />
              ) : (
                <ArrowDownLeft className="w-[20px] h-[20px] stroke-[2]" />
              )}
              <span className="text-[14px] font-semibold">
                LKR {bill.amount.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button (Exact match from Figma) */}
      <div className="absolute right-[15px] bottom-[110px] w-[80px] h-[80px] bg-[#1a1a1a] dark:bg-white rounded-[24px] shadow-lg flex items-center justify-center cursor-pointer">
        <Plus className={`w-8 h-8 ${isDark ? 'text-black' : 'text-white'}`} />
      </div>
    </div>
  );
};

