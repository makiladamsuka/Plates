import React, { useState } from 'react';
import { NewBillModal } from '../components/NewBillModal';

export function BillsList({ onBillClick }: { onBillClick?: () => void }) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      {/* Header */}
      <div className="px-6 pt-10 flex justify-between items-center">
        <h1 className="text-black text-5xl font-bold font-['Sora']">Bills</h1>
        {/* Search Icon */}
        <div className="w-6 h-6 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 mt-8 flex gap-2 overflow-x-auto no-scrollbar">
        <button className="h-8 px-5 bg-zinc-900 rounded-[35px] text-gray-100 text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center">
          All
        </button>
        <button className="h-8 px-5 bg-zinc-300 rounded-[35px] text-black text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center">
          Highest
        </button>
        <button className="h-8 px-5 bg-zinc-300 rounded-[35px] text-black text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center">
          Lowest
        </button>
        <button className="h-8 px-5 bg-zinc-300 rounded-[35px] text-black text-lg font-semibold font-['Sora'] whitespace-nowrap flex items-center justify-center">
          Oldest
        </button>
      </div>

      {/* Bills Cards */}
      <div className="px-5 mt-6 flex flex-col gap-4">
        
        {/* Card 1: Dinner at Senu */}
        <div 
          onClick={onBillClick}
          className="w-full bg-zinc-300 rounded-[35px] p-6 relative flex flex-col gap-2 shadow-sm cursor-pointer hover:bg-zinc-200 transition-colors"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-zinc-900 text-2xl font-semibold font-['Sora'] leading-tight">Dinner at Senu</h2>
            {/* Pending Pill */}
            <div className="bg-amber-300 rounded-[30px] px-3 py-1 flex items-center justify-center">
              <span className="text-black text-xs font-semibold font-['Sora']">Pending</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            {/* Tag */}
            <div className="bg-rose-200 rounded-[30px] px-3 py-1 flex items-center justify-center">
              <span className="text-black text-base font-normal font-['Sora']">Restaurant</span>
            </div>
          </div>
          
          <div className="text-black text-base font-normal font-['Sora'] mt-1">Today 11pm</div>
          
          <div className="text-zinc-900 text-3xl font-semibold font-['Sora'] mt-2">LKR 4800</div>
        </div>

        {/* Card 2: Late Keells */}
        <div className="w-full bg-zinc-300 rounded-[35px] p-6 relative flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <h2 className="text-zinc-900 text-2xl font-semibold font-['Sora'] leading-tight">Late Keells</h2>
            {/* Settled Pill */}
            <div className="bg-lime-700 rounded-[30px] px-3 py-1 flex items-center justify-center">
              <span className="text-black text-xs font-semibold font-['Sora'] text-white">Settled</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            {/* Tag */}
            <div className="bg-neutral-300 rounded-[30px] px-3 py-1 flex items-center justify-center">
              <span className="text-black text-base font-normal font-['Sora']">Grocery</span>
            </div>
          </div>
          
          <div className="text-black text-base font-normal font-['Sora'] mt-1">Today 11pm</div>
          
          <div className="text-zinc-900 text-3xl font-semibold font-['Sora'] mt-2">LKR 2100</div>
        </div>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="absolute bottom-0 right-6 w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg pointer-events-auto hover:bg-zinc-800 transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-100">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen} 
        onClose={() => setIsNewBillModalOpen(false)} 
      />
    </div>
  );
}
