import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, UserPlus, ChevronRight, Check, MessageSquare } from 'lucide-react';
import { NewBillModal } from '../components/NewBillModal';
import type { Bill, Friend } from '../data/mockData';

interface HomeProps {
  bills: Bill[];
  friends: Friend[];
  onAddBill: (bill: Bill) => void;
  onBillClick?: (id: string) => void;
  onSearchClick?: () => void;
  onApproveFriend?: (id: string) => void;
}

export function Home({ 
  bills, 
  friends, 
  onAddBill, 
  onBillClick, 
  onSearchClick,
  onApproveFriend 
}: HomeProps) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);

  // Compute total balances
  const totalYouAreOwed = friends
    .filter(f => f.balance > 0)
    .reduce((sum, f) => sum + f.balance, 0);

  const totalYouOwe = friends
    .filter(f => f.balance < 0)
    .reduce((sum, f) => sum + Math.abs(f.balance), 0);

  const netBalance = totalYouAreOwed - totalYouOwe;

  // Pending items requiring attention
  const pendingBills = bills.filter(b => b.status === 'Pending');
  const pendingFriendRequests = friends.filter(f => f.isPendingRequest);

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-36 pt-0 font-sans-app">
      
      {/* Top Header Container (Matching 'Week 3' header from screenshot) */}
      <div className="px-6 pt-10 pb-4 h-[88px] flex justify-between items-center max-w-[480px] mx-auto">
        <h1 className="text-black text-5xl font-bold font-display tracking-tight leading-none">Week 3</h1>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-black cursor-pointer hover:bg-black/5 transition-colors">
          <MessageSquare size={24} strokeWidth={2} />
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-5 flex flex-col gap-6">

        {/* Top 4-Square Tile Row (Exact layout from top of reference screenshot) */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Tile 1: Mon */}
          <div 
            onClick={() => bills[0] && onBillClick?.(bills[0].id)}
            className="aspect-square bg-[#F6D6DA] rounded-[22px] p-2.5 flex flex-col justify-end relative cursor-pointer active:scale-95 transition-transform shadow-xs overflow-hidden"
          >
            <span className="text-[11px] font-bold text-[#1A1A1A]/80 bg-white/60 px-2 py-0.5 rounded-md w-fit backdrop-blur-xs">
              Mon
            </span>
          </div>

          {/* Tile 2: Tue */}
          <div 
            onClick={() => bills[1] && onBillClick?.(bills[1].id)}
            className="aspect-square bg-[#1A1A1A] text-white rounded-[22px] p-2.5 flex flex-col justify-end relative cursor-pointer active:scale-95 transition-transform shadow-xs overflow-hidden"
          >
            <span className="text-[11px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-md w-fit backdrop-blur-xs">
              Tue
            </span>
          </div>

          {/* Tile 3: Wed */}
          <div 
            onClick={() => bills[2] && onBillClick?.(bills[2].id)}
            className="aspect-square bg-[#CDE1FF] rounded-[22px] p-2.5 flex flex-col justify-end relative cursor-pointer active:scale-95 transition-transform shadow-xs overflow-hidden"
          >
            <span className="text-[11px] font-bold text-[#1A1A1A]/80 bg-white/60 px-2 py-0.5 rounded-md w-fit backdrop-blur-xs">
              Wed
            </span>
          </div>

          {/* Tile 4: + Square Container */}
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="aspect-square bg-[#D9D9D9] rounded-[22px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:bg-zinc-300 shadow-xs"
          >
            <Plus size={26} strokeWidth={2.5} className="text-[#1A1A1A]" />
          </button>
        </div>

        {/* 2-Column Friend Cards Feed (Exact layout from lower section of reference screenshot) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Column 1 Card */}
          <div 
            onClick={() => bills[0] && onBillClick?.(bills[0].id)}
            className="flex flex-col gap-2 cursor-pointer group"
          >
            {/* Header: Avatar + Username */}
            <div className="flex items-center gap-2 px-1">
              <div 
                className="w-6 h-6 rounded-full opacity-60" 
                style={{ backgroundColor: friends[0]?.color || '#F6D6DA' }}
              />
              <span className="text-xs font-semibold text-[#1A1A1A]">
                {friends[0]?.username?.replace('@', '') || 'adhenditha'}
              </span>
            </div>

            {/* Tall Card with 6 new badge */}
            <div className="w-full h-[260px] bg-[#1A1A1A] rounded-[28px] p-4 relative flex flex-col justify-between overflow-hidden shadow-sm transition-transform group-active:scale-[0.98]">
              <div className="flex justify-end">
                <span className="bg-[#EF4444] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  {pendingBills.length > 0 ? `${pendingBills.length} new` : 'New'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 text-white z-10">
                <span className="text-base font-bold truncate">{bills[0]?.title || 'Dinner at Senu'}</span>
                <span className="text-white/70 text-xs font-normal">LKR {bills[0]?.total || 4800}</span>
              </div>
            </div>
          </div>

          {/* Column 2 Card */}
          <div 
            onClick={() => bills[1] && onBillClick?.(bills[1].id)}
            className="flex flex-col gap-2 cursor-pointer group"
          >
            {/* Header: Avatar + Username */}
            <div className="flex items-center gap-2 px-1">
              <div 
                className="w-6 h-6 rounded-full opacity-60" 
                style={{ backgroundColor: friends[1]?.color || '#D7ECD1' }}
              />
              <span className="text-xs font-semibold text-[#1A1A1A]">
                {friends[1]?.username?.replace('@', '') || 'ayanmunoz'}
              </span>
            </div>

            {/* Tall Card */}
            <div className="w-full h-[260px] bg-[#D7ECD1] rounded-[28px] p-4 relative flex flex-col justify-between overflow-hidden shadow-sm transition-transform group-active:scale-[0.98]">
              <div className="flex flex-col gap-0.5 text-[#1A1A1A] mt-auto z-10">
                <span className="text-base font-bold truncate">{bills[1]?.title || 'Groceries'}</span>
                <span className="text-black/70 text-xs font-normal">LKR {bills[1]?.total || 3600}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Balance Overview Card */}
        <div className="w-full bg-[#D9D9D9] rounded-[30px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-black/60 text-xs font-medium uppercase tracking-wider">Overall Balance</span>
              <span className="text-[#1A1A1A] text-3xl font-bold mt-1">
                LKR {Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              netBalance >= 0 ? 'bg-[#4C8C3C] text-white' : 'bg-[#F6D6DA] text-black'
            }`}>
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/10">
            {/* You are owed */}
            <div className="bg-[#EDEDF1]/70 rounded-[20px] p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#4C8C3C]">
                <ArrowDownLeft size={16} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70">Owed to you</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">LKR {totalYouAreOwed.toLocaleString()}</span>
            </div>

            {/* You owe */}
            <div className="bg-[#EDEDF1]/70 rounded-[20px] p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-black">
                <ArrowUpRight size={16} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70">You owe</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">LKR {totalYouOwe.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="flex-1 bg-[#1A1A1A] text-[#EDEDF1] h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Split a Plate</span>
          </button>
          
          <button 
            onClick={onSearchClick}
            className="flex-1 bg-[#D9D9D9] text-[#1A1A1A] h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer hover:bg-zinc-300"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Waiting on You Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[#1A1A1A] text-2xl font-bold font-display tracking-tight px-1">
            Waiting on You
          </h2>

          <div className="flex flex-col gap-3">
            {/* Pending Friend Requests */}
            {pendingFriendRequests.map(friend => (
              <div 
                key={friend.id}
                className="w-full bg-[#F6D6DA]/80 rounded-[25px] p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full opacity-60 shrink-0" 
                    style={{ backgroundColor: friend.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[#1A1A1A] text-sm font-semibold leading-tight">{friend.name}</span>
                    <span className="text-black/60 text-xs font-normal">Wants to follow you</span>
                  </div>
                </div>

                <button 
                  onClick={() => onApproveFriend?.(friend.id)}
                  className="bg-[#1A1A1A] text-[#EDEDF1] px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Accept</span>
                </button>
              </div>
            ))}

            {/* Pending Bills */}
            {pendingBills.slice(0, 2).map(bill => (
              <div 
                key={bill.id}
                onClick={() => onBillClick?.(bill.id)}
                className="w-full bg-[#D9D9D9] rounded-[25px] p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                  <span className="text-[#1A1A1A] text-base font-semibold truncate">{bill.title}</span>
                  <span className="text-black/60 text-xs font-normal">Pending split · LKR {bill.total}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#F5C744] text-black text-xs font-semibold px-3 py-1.5 rounded-full">
                    Settle
                  </span>
                  <ChevronRight size={18} className="text-black/40" />
                </div>
              </div>
            ))}

            {pendingFriendRequests.length === 0 && pendingBills.length === 0 && (
              <div className="bg-[#D9D9D9]/50 rounded-[25px] p-6 text-center text-black/50 text-sm">
                All caught up! No pending bills or requests.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen}
        onClose={() => setIsNewBillModalOpen(false)}
        onAddBill={onAddBill}
      />
    </div>
  );
}
