import React from 'react';

interface BillDetailProps {
  onBack: () => void;
}

export function BillDetail({ onBack }: BillDetailProps) {
  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      {/* Header / Top Section */}
      <div className="px-6 pt-10 pb-6 relative">
        {/* Back Button */}
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2 mb-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex justify-between items-start mt-4">
          <h1 className="text-zinc-900 text-3xl font-semibold font-['Sora'] leading-tight w-2/3">Dinner at Senu</h1>
          {/* Pending Pill */}
          <div className="bg-amber-300 rounded-[30px] px-3 py-1 mt-1">
            <span className="text-black text-xs font-semibold font-['Sora']">Pending</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {/* Tag */}
          <div className="bg-rose-200 rounded-[30px] px-3 py-1 flex items-center justify-center">
            <span className="text-black text-base font-normal font-['Sora']">Restaurant</span>
          </div>
        </div>

        <div className="text-black text-base font-normal font-['Sora'] mt-3">Today 11pm</div>
        <div className="text-black text-base font-normal font-['Sora'] mt-1">Created by @username</div>
      </div>

      {/* Friends List Section */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="w-full bg-zinc-300 rounded-[30px] p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 opacity-30 bg-rose-200 rounded-full" />
              <span className="text-black text-sm font-normal font-['Sora']">Agam Munbo</span>
            </div>
            <div className="text-zinc-900 text-xl font-semibold font-['Sora']">LKR 1200</div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-8 flex justify-end">
         <div className="text-zinc-900 text-3xl font-semibold font-['Sora']">LKR 4800</div>
      </div>

      {/* Floating Pay Button */}
      <div className="fixed bottom-[140px] left-0 w-full px-6 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[432px] h-20 bg-zinc-900 rounded-[50px] flex items-center justify-between px-8 shadow-xl pointer-events-auto">
          <span className="text-gray-100 text-xl font-semibold font-['Sora']">Your Share</span>
          <button className="text-gray-100 text-xl font-semibold font-['Sora'] hover:text-amber-300 transition-colors">
            Pay LKR 1200
          </button>
        </div>
      </div>

    </div>
  );
}
