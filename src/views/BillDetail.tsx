import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface BillDetailProps {
  billId: string | null;
  onBack: () => void;
}

export function BillDetail({ billId, onBack }: BillDetailProps) {
  const [bill, setBill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (billId) {
      api.getBill(billId)
        .then(setBill)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [billId]);

  if (isLoading || !bill) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Assuming 'me' is the current user for demo purposes
  const myParticipant = bill.participants?.find((p: any) => p.friend_id === 'me');

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
          <h1 className="text-zinc-900 text-3xl font-semibold font-['Sora'] leading-tight w-2/3">{bill.title}</h1>
          {/* Pending Pill */}
          <div className={`rounded-[30px] px-3 py-1 mt-1 ${bill.status === 'Pending' ? 'bg-amber-300' : 'bg-lime-700'}`}>
            <span className={`text-xs font-semibold font-['Sora'] ${bill.status === 'Pending' ? 'text-black' : 'text-white'}`}>{bill.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {/* Tag */}
          <div className={`rounded-[30px] px-3 py-1 flex items-center justify-center ${bill.category === 'Restaurant' ? 'bg-rose-200' : bill.category === 'Grocery' ? 'bg-neutral-300' : 'bg-blue-200'}`}>
            <span className="text-black text-base font-normal font-['Sora']">{bill.category}</span>
          </div>
        </div>

        <div className="text-black text-base font-normal font-['Sora'] mt-3">{new Date(bill.created_at || Date.now()).toLocaleDateString()}</div>
        <div className="text-black text-base font-normal font-['Sora'] mt-1">Created by @username</div>
      </div>

      {/* Friends List Section */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        {bill.participants?.map((participant: any) => (
          <div key={participant.id} className="w-full bg-zinc-300 rounded-[30px] p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 opacity-30 bg-rose-200 rounded-full flex items-center justify-center">
                {participant.paid ? '✓' : ''}
              </div>
              <span className="text-black text-sm font-normal font-['Sora']">{participant.friend_id}</span>
            </div>
            <div className="text-zinc-900 text-xl font-semibold font-['Sora']">LKR {participant.share}</div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-8 flex justify-end">
         <div className="text-zinc-900 text-3xl font-semibold font-['Sora']">Total: LKR {bill.total}</div>
      </div>

      {/* Floating Pay Button */}
      {myParticipant && !myParticipant.paid && (
        <div className="fixed bottom-[140px] left-0 w-full px-6 z-40 pointer-events-none flex justify-center">
          <div className="w-full max-w-[432px] h-20 bg-zinc-900 rounded-[50px] flex items-center justify-between px-8 shadow-xl pointer-events-auto">
            <span className="text-gray-100 text-xl font-semibold font-['Sora']">Your Share</span>
            <button 
              onClick={async () => {
                await api.payBill(bill.id, 'me');
                // Refresh
                const updated = await api.getBill(bill.id);
                setBill(updated);
              }}
              className="text-gray-100 text-xl font-semibold font-['Sora'] hover:text-amber-300 transition-colors"
            >
              Pay LKR {myParticipant.share}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
