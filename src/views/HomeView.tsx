import React from 'react';
import type { Bill } from '../types';
import { Plus, ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { BillCard } from '../components/BillCard';

interface HomeViewProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onOpenNewBill: () => void;
  onNavigateToBills: () => void;
  isDark?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  bills,
  onSelectBill,
  onOpenNewBill,
  onNavigateToBills,
  isDark = true,
}) => {
  const pendingBills = bills.filter((b) => b.status === 'Pending');
  const needsApproval = pendingBills.find((b) => b.creator !== 'You');

  const youOweTotal = bills
    .filter((b) => b.status === 'Pending' && b.creator !== 'You')
    .reduce((sum, b) => {
      const myShare = b.participants.find((p) => p.name.includes('You'))?.share || 0;
      return sum + myShare;
    }, 0);

  const owedToYouTotal = bills
    .filter((b) => b.status === 'Pending' && b.creator === 'You')
    .reduce((sum, b) => {
      const othersShare = b.participants
        .filter((p) => !p.name.includes('You'))
        .reduce((pSum, p) => pSum + p.share, 0);
      return sum + othersShare;
    }, 0);

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Overview Balance Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`rounded-2xl p-3.5 border transition-colors shadow-sm ${
          isDark
            ? 'bg-[#14151b] text-white border-white/[0.08]'
            : 'bg-white text-[#0f1015] border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Owed to You</span>
          </div>
          <p className={`text-xl font-bold font-['Sora'] tracking-tight ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            LKR {owedToYouTotal.toLocaleString()}
          </p>
        </div>

        <div className={`rounded-2xl p-3.5 border transition-colors shadow-sm ${
          isDark
            ? 'bg-[#14151b] text-white border-white/[0.08]'
            : 'bg-white text-[#0f1015] border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-1 text-[11px] text-rose-500 font-semibold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>You Owe</span>
          </div>
          <p className={`text-xl font-bold font-['Sora'] tracking-tight ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            LKR {youOweTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Needed Highlight Banner */}
      {needsApproval && (
        <div
          onClick={() => onSelectBill(needsApproval)}
          className="bg-[#f5c744] text-black rounded-2xl p-4 cursor-pointer hover:brightness-105 transition-all active:scale-[0.99] relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-black" />
              <span className="text-[10px] font-extrabold tracking-wider uppercase">Action Needed</span>
            </div>
            <Sparkles className="w-4 h-4 text-black/60" />
          </div>
          <h3 className="text-base font-bold font-['Sora'] leading-snug">{needsApproval.title}</h3>
          <p className="text-xs font-medium text-black/80 mt-0.5">
            {needsApproval.creator} requested LKR{' '}
            {needsApproval.participants.find((p) => p.name.includes('You'))?.share || 1200}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold bg-black text-white px-3 py-1 rounded-full">
            <span>Slide to Approve</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenNewBill}
          className={`rounded-xl p-3 flex items-center justify-center gap-2 border transition-colors ${
            isDark
              ? 'bg-[#16171e] text-white border-white/[0.08] hover:bg-[#1c1d26]'
              : 'bg-white text-black border-black/[0.08] hover:bg-neutral-50 shadow-sm'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-[#f5c744] text-black flex items-center justify-center font-bold">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold">New Bill</span>
        </button>

        <button
          onClick={onNavigateToBills}
          className={`rounded-xl p-3 flex items-center justify-center gap-2 border transition-colors ${
            isDark
              ? 'bg-[#16171e] text-white border-white/[0.08] hover:bg-[#1c1d26]'
              : 'bg-white text-black border-black/[0.08] hover:bg-neutral-50 shadow-sm'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
            isDark ? 'bg-white text-black' : 'bg-black text-white'
          }`}>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold">View All</span>
        </button>
      </div>

      {/* Recent Activity Section */}
      <div>
        <div className="flex justify-between items-center mb-2.5 pt-1">
          <h2 className={`text-xs font-bold uppercase tracking-wider font-['Sora'] ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>Recent Activity</h2>
          <button onClick={onNavigateToBills} className={`text-xs font-semibold hover:underline transition-colors ${
            isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'
          }`}>
            See all
          </button>
        </div>

        <div className="space-y-2">
          {bills.slice(0, 3).map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} isDark={isDark} />
          ))}
        </div>
      </div>
    </div>
  );
};


