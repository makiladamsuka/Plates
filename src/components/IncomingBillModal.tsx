import React from 'react';

export function IncomingBillModal() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-gray-100 sm:bg-black/50">
      
      {/* Background Page Header (Visible behind the modal) */}
      <div className="absolute top-0 left-0 w-full p-8 hidden sm:block">
        <div className="text-black text-5xl font-bold font-['Sora']">Bills</div>
      </div>

      {/* The Bottom Sheet Modal */}
      <div className="w-full max-w-[480px] mx-auto bg-zinc-900 rounded-t-[35px] h-[85vh] relative flex flex-col px-6 pb-8 pt-4">
        
        {/* Drag Handle */}
        <div className="w-16 h-1 bg-zinc-600 rounded-[50px] mx-auto mb-8" />

        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          
          {/* Header Info */}
          <div className="mb-6">
            <h2 className="text-white text-3xl font-normal font-['Sora'] mb-1">Dinner at Senu</h2>
            <div className="text-white text-base font-normal font-['Sora'] mb-4 opacity-80">Asgan added you</div>
            <div className="text-white text-base font-normal font-['Sora']">4 People</div>
          </div>

          {/* Friends List Card */}
          <div className="bg-neutral-800 rounded-[30px] p-4 flex flex-col gap-3 mb-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="w-full bg-zinc-300/10 rounded-[30px] p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 opacity-30 bg-zinc-300 rounded-full" />
                  <span className="text-white text-sm font-normal font-['Sora']">Name</span>
                </div>
                <div className="text-white text-xl font-semibold font-['Sora']">LKR 1200</div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="flex justify-between items-end mb-8 mt-auto">
            <div className="flex flex-col gap-2">
              <div className="text-white/70 text-base font-normal font-['Sora']">Bill Total</div>
              <div className="text-white/70 text-2xl font-normal font-['Sora']">Your Share</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-white/70 text-base font-normal font-['Sora']">LKR 4800</div>
              <div className="text-amber-300 text-4xl font-semibold font-['Sora']">LKR 1200</div>
            </div>
          </div>

          {/* Slider & Actions */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Slide to approve pill */}
            <div className="w-full h-20 bg-zinc-300 rounded-[50px] relative flex items-center px-2 shadow-inner overflow-hidden">
              {/* Slider Knob */}
              <div className="w-16 h-16 bg-amber-300 rounded-full flex items-center justify-center z-10 shadow-md">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              {/* Text */}
              <div className="absolute inset-0 flex items-center justify-center text-black text-lg font-bold font-['Sora'] pointer-events-none">
                Slide to approve
              </div>
            </div>

            <button className="text-white/60 text-base font-normal font-['Sora'] py-2">
              Decline
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
