import React, { useState, useEffect } from 'react';
import { ConfirmTransferModal } from '../components/ConfirmTransferModal';
import { ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import type { Bill } from '../data/mockData';

interface BillDetailProps {
  onBack: () => void;
  billId: string | null;
}

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return 'bg-[#F6D6DA]';
    case 'Grocery': return 'bg-[#D7ECD1]';
    case 'Entertainment': return 'bg-[#CDE1FF]';
    default: return 'bg-zinc-200';
  }
};

const formatTime = (ts: number) => {
  const date = new Date(ts);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `Today     ${hours}${ampm}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function BillDetail({ onBack, billId }: BillDetailProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const fetchBill = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      const data = await api.getBill(billId);
      setBill(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
    fetchBill();
  }, [billId]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center">Loading...</div>;
  if (!bill) return null;

  // Find user's share for the pay button
  const myShare = (bill.participants?.find((p: any) => p.friendId === userId)?.share || bill.participants?.find((p: any) => p.friendId === 'me')?.share) ?? 0;
  const tag = getTagColor(bill.category);

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-40 font-['Sora'] relative overflow-hidden">
      
      {/* Header Section */}
      <div className="pt-6 pb-2 relative">
        <div className="flex justify-between items-start w-full px-6">
          {/* Back Button */}
          <button onClick={onBack} className="absolute left-6 top-6 w-8 h-8 flex items-center justify-center cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A1A1A]">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          
          {/* Title styled with display font */}
          <h1 className="text-[#1A1A1A] text-[28px] font-bold font-display leading-tight break-words ml-[43px]">{bill.title}</h1>
          
          {/* Status Pill */}
          <div className={`rounded-[30px] px-4 py-1.5 flex items-center justify-center shrink-0 ${bill.status === 'Pending' ? 'bg-[#F5C744]' : 'bg-[#4C8C3C]'}`}>
            <span className={`text-[13px] font-semibold ${bill.status === 'Pending' ? 'text-black' : 'text-white'}`}>{bill.status}</span>
          </div>
        </div>
        
        {/* Tags and Meta */}
        <div className="mt-5 px-6 flex flex-col gap-2">
          <div className={`${getTagColor(bill.category)} rounded-[30px] px-4 py-1.5 w-fit flex items-center justify-center -ml-1`}>
            <span className="text-black text-[15px] font-normal">{bill.category}</span>
          </div>
          <div className="text-black text-[15px] font-normal ml-1 mt-1">{formatTime(bill.createdAt)}</div>
          <div className="text-black text-[15px] font-normal ml-1">Created by @username</div>
        </div>
      </div>

      {/* Friends List Section */}
      <div className="px-6 mt-6 flex flex-col gap-3 relative">
        {bill.participants.map((participant, i) => (
          <div key={i} className="w-full h-[59px] bg-[#D9D9D9] rounded-[30px] px-3 flex items-center shadow-sm relative">
             <div className="w-[35px] h-[35px] opacity-30 bg-[#F6D6DA] rounded-full absolute left-3" />
             <div className="flex justify-between w-full pl-12 pr-4 z-10 items-center">
               <span className="text-black text-[14px] font-normal">
                 {(participant.friendId === 'me' || participant.friend_id === userId) ? 'You' : `Friend ${(participant.friendId || participant.friend_id || '').substring(0, 4)}`}
               </span>
               <span className="text-[#1A1A1A] text-[20px] font-semibold">LKR {participant.share.toFixed(0)}</span>
             </div>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="px-8 mt-10 flex justify-end">
         <div className="text-[#1A1A1A] text-[28px] font-bold font-display">LKR {bill.total}</div>
      </div>

      {/* Floating Action Bar - Only show if Pending */}
      {bill.status === 'Pending' && (
        <div className="fixed bottom-[130px] left-0 w-full z-[55] flex justify-center px-4 pointer-events-none">
          <button 
            onClick={() => setIsConfirmModalOpen(true)}
            className="w-full max-w-[365px] h-[74px] bg-[#1A1A1A] rounded-[50px] flex items-center justify-center pointer-events-auto shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span className="text-[#EDEDF1] text-[20px] font-semibold">Pay  LKR {myShare.toFixed(0)}</span>
          </button>
        </div>
      )}

      <ConfirmTransferModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={async () => {
          setIsConfirmModalOpen(false);
          if (billId) {
            await api.payBill(billId, userId);
            fetchBill();
          }
        }}
        amount={myShare}
        username="@senup"
      />

    </div>
  );
}
