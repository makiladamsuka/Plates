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
    <div className="bg-[#ededf1] min-h-screen relative font-['Sora'] pb-32 pt-[36px] px-[22px]">
      <h1 className="text-[48px] font-bold text-black leading-tight mb-[25px]">
        Home
      </h1>

      {/* Overview Balance Cards */}
      <div className="grid grid-cols-2 gap-[15px] mb-[25px]">
        <div className="bg-[#d9d9d9] rounded-[25px] p-[20px] shadow-sm">
          <div className="flex items-center gap-[5px] text-[14px] text-[#4c8c3c] font-semibold mb-[5px]">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Owed to You</span>
          </div>
          <p className="text-[24px] font-bold text-[#1a1a1a]">
            LKR {owedToYouTotal.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#d9d9d9] rounded-[25px] p-[20px] shadow-sm">
          <div className="flex items-center gap-[5px] text-[14px] text-[#1a1a1a] font-semibold mb-[5px]">
            <ArrowUpRight className="w-4 h-4" />
            <span>You Owe</span>
          </div>
          <p className="text-[24px] font-bold text-[#1a1a1a]">
            LKR {youOweTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Needed Highlight Banner */}
      {needsApproval && (
        <div
          onClick={() => onSelectBill(needsApproval)}
          className="bg-[#f5c744] text-black rounded-[25px] p-[20px] cursor-pointer active:scale-[0.99] transition-transform shadow-sm mb-[25px]"
        >
          <div className="flex items-center gap-[5px] mb-[10px]">
            <ShieldAlert className="w-5 h-5 text-black" />
            <span className="text-[14px] font-bold tracking-wider uppercase">Action Needed</span>
          </div>
          <h3 className="text-[20px] font-semibold leading-snug mb-[5px]">{needsApproval.title}</h3>
          <p className="text-[15px] font-normal text-black/80">
            {needsApproval.creator} requested LKR{' '}
            {needsApproval.participants.find((p) => p.name.includes('You'))?.share || 1200}
          </p>
        </div>
      )}

      {/* Recent Activity Section */}
      <div>
        <div className="flex justify-between items-center mb-[15px]">
          <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Recent Activity</h2>
          <button onClick={onNavigateToBills} className="text-[15px] font-normal text-black underline">
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
