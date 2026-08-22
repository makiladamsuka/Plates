import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ConfirmTransferModal } from '../components/ConfirmTransferModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { MOCK_BILLS, MOCK_FRIENDS } from '../data/mockData';

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

const formatTime = (ts: any) => {
  if (!ts) return 'Recent';
  const date = new Date(typeof ts === 'string' && !isNaN(Number(ts)) ? Number(ts) : ts);
  if (isNaN(date.getTime())) return 'Recent';
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `Today ${hours}${ampm}`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function BillDetail({ onBack, billId }: BillDetailProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const fetchBill = async () => {
    if (!billId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getBill(billId);
      if (data && data.id) {
        setBill(data);
        if (data?.creator_id) {
          const { data: creator } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', data.creator_id)
            .single();
          if (creator) {
            setCreatorName(creator.full_name || creator.email || '');
          }
        }
      } else {
        // Fallback to mock data if API returns empty
        const mock = MOCK_BILLS.find(b => b.id === billId);
        if (mock) setBill(mock);
      }
    } catch (e) {
      console.warn('API bill fetch failed, checking mock data:', e);
      const mock = MOCK_BILLS.find(b => b.id === billId);
      if (mock) {
        setBill(mock);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
    fetchBill();

    if (billId) {
      const channel = supabase
        .channel(`realtime-bill-${billId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `id=eq.${billId}` }, fetchBill)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `bill_id=eq.${billId}` }, fetchBill)
        .subscribe();

      const handleFocus = () => fetchBill();
      window.addEventListener('focus', handleFocus);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [billId]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center font-['Sora']">Loading...</div>;

  if (!bill) {
    return (
      <div className="min-h-screen bg-[#EDEDF1] flex flex-col items-center justify-center p-6 text-center font-['Sora']">
        <p className="text-gray-700 text-lg font-semibold mb-2">Bill Not Found</p>
        <p className="text-gray-500 text-sm mb-6">The requested bill could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-full text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isCreator = bill.creator_id === userId;
  const myParticipant = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
  const myShare = myParticipant ? Number(myParticipant.share || 0) : 0;
  const isMySharePaid = isCreator || myParticipant?.paid === true;
  const isFullySettled = bill.status === 'Settled';

  const handlePay = async () => {
    try {
      try {
        await api.payBill(bill.id, userId);
      } catch (e) {
        await supabase
          .from('participants')
          .update({ paid: true, accepted: true })
          .eq('bill_id', bill.id)
          .eq('friend_id', userId);

        const { data: parts } = await supabase
          .from('participants')
          .select('paid')
          .eq('bill_id', bill.id);

        const allPaid = parts && parts.length > 0 && parts.every((p: any) => p.paid === true);
        if (allPaid) {
          await supabase
            .from('bills')
            .update({ status: 'Settled' })
            .eq('id', bill.id);
        }
      }
      setIsConfirmModalOpen(false);
      fetchBill();
    } catch (err) {
      console.error('Error paying bill:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-40 font-['Sora'] relative overflow-hidden">
      
      {/* Header Section */}
      <div className="pt-6 pb-2 relative">
        <div className="flex justify-between items-start w-full px-6">
          {/* Back Button */}
          <button onClick={onBack} className="absolute left-6 top-6 w-8 h-8 flex items-center justify-center cursor-pointer">
            <ChevronLeft size={28} strokeWidth={2.5} className="text-[#1A1A1A]" />
          </button>
          
          {/* Title styled with display font */}
          <h1 className="text-[#1A1A1A] text-[28px] font-bold font-display leading-tight break-words ml-[43px] max-w-[240px] truncate">{bill.title}</h1>
          
          {/* Status Pill */}
          <div className={`rounded-[30px] px-4 py-1.5 flex items-center justify-center shrink-0 ${
            isFullySettled ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
          }`}>
            <span className="text-[13px] font-semibold">{isFullySettled ? 'Settled' : 'Pending'}</span>
          </div>
        </div>
        
        {/* Tags and Meta */}
        <div className="mt-5 px-6 flex flex-col gap-2">
          <div className={`${getTagColor(bill.category)} rounded-[30px] px-4 py-1.5 w-fit flex items-center justify-center -ml-1`}>
            <span className="text-black text-[15px] font-normal">{bill.category}</span>
          </div>
          <div className="text-black text-[15px] font-normal ml-1 mt-1">{formatTime(bill.created_at || bill.createdAt)}</div>
          {creatorName && (
            <div className="text-black/70 text-[15px] font-normal ml-1">Created by {creatorName}</div>
          )}
        </div>
      </div>

      {/* Friends List Section */}
      <div className="px-6 mt-6 flex flex-col gap-3 relative">
        {(bill.participants || []).map((participant: any, i: number) => {
          const isPMe = participant.friendId === 'me' || participant.friend_id === userId || participant.friendId === userId;
          const mockFriend = MOCK_FRIENDS.find(f => f.id === (participant.friendId || participant.friend_id));
          const pName = isPMe ? 'You' : (participant.full_name || participant.profile?.full_name || mockFriend?.name || `Friend ${(participant.friendId || participant.friend_id || '').substring(0, 4)}`);
          const pAvatar = participant.avatar_url || participant.profile?.avatar_url;
          const isPCreator = bill.creator_id === (participant.friend_id || participant.friendId);
          const isPPaid = isPCreator || participant.paid;

          return (
            <div key={i} className="w-full h-[59px] bg-[#D9D9D9] rounded-[30px] px-4 flex items-center justify-between shadow-sm relative">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {pAvatar ? (
                  <img src={pAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 bg-zinc-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(pName || 'P')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-black text-[14px] font-medium truncate">
                    {pName}
                  </span>
                  {isPCreator && <span className="text-black/50 text-[10px]">Creator (Paid upfront)</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#1A1A1A] text-[18px] font-semibold">LKR {Number(participant.share || 0).toFixed(0)}</span>
                {isPPaid ? (
                  <span className="text-[10px] bg-[#4C8C3C] text-white px-2 py-0.5 rounded-full font-bold">Paid</span>
                ) : (
                  <span className="text-[10px] bg-[#F5C744] text-black px-2 py-0.5 rounded-full font-bold">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Amount */}
      <div className="px-8 mt-10 flex justify-end">
         <div className="text-[#1A1A1A] text-[28px] font-bold font-display">LKR {bill.total}</div>
      </div>

      {/* Floating Action Bar - Only show if not paid and not settled */}
      {!isMySharePaid && !isFullySettled && (
        <div className="fixed bottom-[130px] left-0 w-full z-[55] flex justify-center px-4 pointer-events-none">
          <button 
            onClick={() => setIsConfirmModalOpen(true)}
            className="w-full max-w-[365px] h-[74px] bg-[#1A1A1A] rounded-[50px] flex items-center justify-center pointer-events-auto shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <span className="text-[#EDEDF1] text-[20px] font-semibold">Pay LKR {myShare.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Slide to Confirm Transfer Modal */}
      <ConfirmTransferModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handlePay}
        amount={myShare}
        username={creatorName || "Creator"}
      />

    </div>
  );
}
