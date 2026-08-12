import React from 'react';
import type { Friend, Bill } from '../types';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2, DollarSign } from 'lucide-react';

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

  const displayBills = friendBills.length > 0 ? friendBills : bills.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4">
      <div
        className={`w-full max-w-[412px] min-h-[520px] max-h-[90vh] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl relative flex flex-col border overflow-hidden animate-in slide-in-from-bottom duration-250 ${
          isDark
            ? 'bg-[#14151b] text-white border-white/10'
            : 'bg-[#ededf1] text-[#0f1015] border-black/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle / Header Bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-neutral-300' : 'hover:bg-black/5 text-neutral-700'
            }`}
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className={`text-xs font-bold font-['Sora'] tracking-wide ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Friend Details
          </span>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Friend Profile Header (Figma 70:163) */}
        <div className={`p-4 rounded-2xl border mb-4 flex items-center justify-between transition-colors ${
          isDark ? 'bg-white/5 border-white/[0.08]' : 'bg-white border-black/[0.08] shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-sm"
            />
            <div>
              <h3 className={`text-base font-bold font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
                {friend.name}
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{friend.username}</p>
            </div>
          </div>

          <div className="text-right">
            {friend.balance === 0 ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settled</span>
              </div>
            ) : friend.balance > 0 ? (
              <div>
                <div className="text-emerald-500 font-bold text-sm flex items-center justify-end gap-0.5 font-['Sora']">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>LKR {friend.balance.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Owes you</span>
              </div>
            ) : (
              <div>
                <div className="text-rose-500 font-bold text-sm flex items-center justify-end gap-0.5 font-['Sora']">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>LKR {Math.abs(friend.balance).toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">You owe</span>
              </div>
            )}
          </div>
        </div>

        {/* Shared Activity Section Title */}
        <div className="flex justify-between items-center mb-2.5 px-1">
          <h4 className={`text-xs font-bold uppercase tracking-wider font-['Sora'] ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            Shared Bills & Contributions
          </h4>
          <span className={`text-[11px] font-semibold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {displayBills.length} items
          </span>
        </div>

        {/* Shared Bills List (Figma 71:181 / 73:258 / 73:263) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {displayBills.map((bill) => {
            const isOwed = friend.balance >= 0;
            return (
              <div
                key={bill.id}
                onClick={() => onSelectBill(bill)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#181a22] hover:bg-[#1f212b] border-white/[0.07]'
                    : 'bg-white hover:bg-[#f9f9fc] border-black/[0.08] shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-black'
                  }`}>
                    {isOwed ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownLeft className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <h5 className={`text-xs font-semibold font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
                      {bill.title}
                    </h5>
                    <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {bill.category} • {bill.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold font-['Sora'] block ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
                    LKR {bill.amount.toLocaleString()}
                  </span>
                  <span className={`text-[9px] font-medium block mt-0.5 ${
                    bill.status === 'Settled' ? 'text-emerald-500' : 'text-[#f5c744]'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button at bottom */}
        <div className="pt-3 border-t border-white/10 mt-2">
          <button
            onClick={() => alert(`Settle up payment request recorded with ${friend.name}!`)}
            className="w-full bg-[#f5c744] hover:bg-yellow-400 text-black py-2.5 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
            <span>Settle Up with {friend.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
