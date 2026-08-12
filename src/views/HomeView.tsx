import React from 'react';
import type { Bill } from '../types';
import { Plus, ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { BillCard } from '../components/BillCard';

interface HomeViewProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onOpenNewBill: () => void;
  onNavigateToBills: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  bills,
  onSelectBill,
  onOpenNewBill,
  onNavigateToBills,
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
    <div className="px-4 pb-28 pt-2 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1a1a] text-white rounded-[28px] p-5 shadow-sm border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Owed to You</span>
          </div>
          <p className="text-2xl font-extrabold font-['Sora']">
            LKR {owedToYouTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#1a1a1a] text-white rounded-[28px] p-5 shadow-sm border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <span>You Owe</span>
          </div>
          <p className="text-2xl font-extrabold font-['Sora']">
            LKR {youOweTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Needed Highlight Card */}
      {needsApproval && (
        <div
          onClick={() => onSelectBill(needsApproval)}
          className="bg-gradient-to-r from-[#f5c744] to-[#f8d468] text-black rounded-[28px] p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-black" />
              <span className="text-xs font-extrabold tracking-wider uppercase">Action Needed</span>
            </div>
            <Sparkles className="w-5 h-5 text-black/60" />
          </div>
          <h3 className="text-xl font-extrabold font-['Sora'] mt-1">{needsApproval.title}</h3>
          <p className="text-xs font-semibold text-black/80 mt-1">
            {needsApproval.creator} requested your share of LKR{' '}
            {needsApproval.participants.find((p) => p.name.includes('You'))?.share || 1200}
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold bg-black text-white px-4 py-1.5 rounded-full">
            <span>Slide to Approve</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        <button
          onClick={onOpenNewBill}
          className="flex-1 min-w-[120px] bg-[#1a1a1a] text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-black transition-colors border border-white/5"
        >
          <div className="w-10 h-10 rounded-full bg-[#f5c744] text-black flex items-center justify-center font-bold">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-semibold">New Bill</span>
        </button>

        <button
          onClick={onNavigateToBills}
          className="flex-1 min-w-[120px] bg-[#d9d9d9] text-black rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">View All</span>
        </button>
      </div>

      {/* Recent Bills Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-black font-['Sora']">Recent Bills</h2>
          <button onClick={onNavigateToBills} className="text-xs font-semibold text-gray-600 hover:text-black">
            See all
          </button>
        </div>

        <div className="space-y-4">
          {bills.slice(0, 2).map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} />
          ))}
        </div>
      </div>
    </div>
  );
};
