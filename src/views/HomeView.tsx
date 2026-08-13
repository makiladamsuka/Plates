import React from 'react';
import type { Bill } from '../types';
import { ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';
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
    <div className="bg-[#ededf1] absolute inset-0 z-10 h-full w-full font-['Sora'] overflow-y-auto pb-32 pt-[48px] px-[24px]">
      <h1 className="text-[40px] font-bold text-[#1a1a1a] tracking-tight leading-tight mb-[32px]">
        Home
      </h1>

      {/* Overview Balance Cards */}
      <div className="grid grid-cols-2 gap-[16px] mb-[32px]">
        <div className="bg-white/80 rounded-[24px] p-[20px] shadow-sm border border-black/[0.04]">
          <div className="flex items-center gap-[6px] text-[13px] text-[#4c8c3c] font-semibold mb-[8px]">
            <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} />
            <span className="tracking-wide uppercase text-[11px] font-bold">Owed to You</span>
          </div>
          <p className="text-[24px] font-bold text-[#1a1a1a] tracking-tight">
            LKR {owedToYouTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/80 rounded-[24px] p-[20px] shadow-sm border border-black/[0.04]">
          <div className="flex items-center gap-[6px] text-[13px] text-[#1a1a1a] font-semibold mb-[8px]">
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            <span className="tracking-wide uppercase text-[11px] font-bold">You Owe</span>
          </div>
          <p className="text-[24px] font-bold text-[#1a1a1a] tracking-tight">
            LKR {youOweTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Needed Highlight Banner */}
      {needsApproval && (
        <div
          onClick={() => onSelectBill(needsApproval)}
          className="bg-[#f5c744] text-[#1a1a1a] rounded-[24px] p-[24px] cursor-pointer active:scale-[0.99] transition-transform shadow-sm mb-[32px]"
        >
          <div className="flex items-center justify-between mb-[12px]">
            <div className="flex items-center gap-[6px]">
              <ShieldAlert className="w-5 h-5 text-[#1a1a1a]" strokeWidth={2.5} />
              <span className="text-[12px] font-bold tracking-widest uppercase">Action Needed</span>
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-[22px] font-bold leading-tight mb-[4px] tracking-tight">{needsApproval.title}</h3>
          <p className="text-[15px] font-medium text-[#1a1a1a]/80">
            {needsApproval.creator} requested LKR {needsApproval.participants.find((p) => p.name.includes('You'))?.share || 1200}
          </p>
        </div>
      )}

      {/* Recent Activity Section */}
      <div>
        <div className="flex justify-between items-end mb-[20px]">
          <h2 className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">Recent Activity</h2>
          <button onClick={onNavigateToBills} className="text-[14px] font-semibold text-[#1a1a1a] underline decoration-2 underline-offset-4 opacity-70 hover:opacity-100 transition-opacity pb-[2px]">
            See all
          </button>
        </div>

        <div className="space-y-[15px]">
          {bills.slice(0, 3).map((bill) => (
            <BillCard key={bill.id} bill={bill} onClick={onSelectBill} />
          ))}
        </div>
      </div>
    </div>
  );
};
