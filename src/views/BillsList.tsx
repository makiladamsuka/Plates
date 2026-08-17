import React, { useState, useEffect } from 'react';
import { NewBillModal } from '../components/NewBillModal';
import { api } from '../services/api';

export function BillsList({ onBillClick }: { onBillClick?: (id: string) => void }) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = async () => {
    try {
      const data = await api.getBills();
      setBills(data || []);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

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
        {isLoading ? (
          <div className="text-center text-gray-500 mt-10">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No bills found</div>
        ) : (
          bills.map((bill) => (
            <div 
              key={bill.id}
              onClick={() => onBillClick && onBillClick(bill.id)}
              className="w-full bg-zinc-300 rounded-[35px] p-6 relative flex flex-col gap-2 shadow-sm cursor-pointer hover:bg-zinc-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-zinc-900 text-2xl font-semibold font-['Sora'] leading-tight">{bill.title}</h2>
                {/* Status Pill */}
                <div className={`rounded-[30px] px-3 py-1 flex items-center justify-center ${bill.status === 'Pending' ? 'bg-amber-300' : 'bg-lime-700'}`}>
                  <span className={`text-xs font-semibold font-['Sora'] ${bill.status === 'Pending' ? 'text-black' : 'text-white'}`}>
                    {bill.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-1">
                {/* Tag */}
                <div className={`rounded-[30px] px-3 py-1 flex items-center justify-center ${bill.category === 'Restaurant' ? 'bg-rose-200' : bill.category === 'Grocery' ? 'bg-neutral-300' : 'bg-blue-200'}`}>
                  <span className="text-black text-base font-normal font-['Sora']">{bill.category}</span>
                </div>
              </div>
              
              <div className="text-black text-base font-normal font-['Sora'] mt-1">
                {new Date(bill.created_at || Date.now()).toLocaleDateString()}
              </div>
              
              <div className="text-zinc-900 text-3xl font-semibold font-['Sora'] mt-2">LKR {bill.total}</div>
            </div>
          ))
        )}
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
        onClose={() => {
          setIsNewBillModalOpen(false);
          fetchBills(); // Refresh list after closing modal
        }} 
      />
    </div>
  );
}
