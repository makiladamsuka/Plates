import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Plus } from 'lucide-react';
import type { Friend, Bill } from '../data/mockData';
import { MOCK_BILLS } from '../data/mockData';

interface FriendDetailProps {
  friend: Friend;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
}

export function FriendDetail({ friend, onBack, onBillClick }: FriendDetailProps) {
  // Find bills where this friend is a participant
  const sharedBills = MOCK_BILLS.filter(bill => 
    bill.participants.some(p => p.friendId === friend.id)
  );

  // Helper to determine mock direction for each bill's balance
  // In a real app this would depend on who paid the bill
  const getBillDirection = (bill: Bill) => {
    return bill.total % 3 === 0 ? 'outgoing' : 'incoming';
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 font-['Sora'] relative overflow-hidden">
      
      {/* Header Area */}
      <div className="pt-6 px-6 relative">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-4"
        >
          <ChevronLeft size={32} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </button>

        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[#1A1A1A] text-2xl font-semibold">{friend.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div 
                className="w-[50px] h-[50px] rounded-full opacity-30 shrink-0"
                style={{ backgroundColor: friend.color }}
              />
              <span className="text-black text-[15px] font-normal">{friend.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {friend.balance !== 0 && (
              <>
                {friend.balance > 0 ? (
                  <ArrowDownLeft size={24} strokeWidth={2.5} className="text-black" />
                ) : (
                  <ArrowUpRight size={24} strokeWidth={2.5} className="text-black" />
                )}
                <span className="text-[#1A1A1A] text-xl font-semibold">
                  LKR {Math.abs(friend.balance)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shared Bills List */}
      <div className="px-5 mt-8 flex flex-col gap-3">
        {sharedBills.map(bill => {
          const participant = bill.participants.find(p => p.friendId === friend.id);
          const amount = participant ? participant.share : 0;
          const direction = getBillDirection(bill);

          return (
            <div 
              key={bill.id}
              onClick={() => onBillClick?.(bill.id)}
              className="w-full h-[56px] bg-[#D9D9D9] rounded-[35px] px-6 flex items-center justify-between cursor-pointer hover:bg-zinc-300 transition-colors"
            >
              <span className="text-[#1A1A1A] text-base font-semibold truncate mr-4">
                {bill.title}
              </span>
              
              <div className="flex items-center gap-2 shrink-0">
                {direction === 'incoming' ? (
                  <ArrowDownLeft size={20} strokeWidth={2.5} className="text-black" />
                ) : (
                  <ArrowUpRight size={20} strokeWidth={2.5} className="text-black" />
                )}
                <span className="text-[#1A1A1A] text-sm font-semibold whitespace-nowrap">
                  LKR {amount}
                </span>
              </div>
            </div>
          );
        })}

        {sharedBills.length === 0 && (
          <div className="text-center text-black/50 mt-10">
            No shared bills with {friend.name.split(' ')[0]}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform"
          >
            <Plus size={32} strokeWidth={2.5} className="text-[#EDEDF1]" />
          </button>
        </div>
      </div>

    </div>
  );
}
