import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { IncomingBillModal } from '../components/IncomingBillModal';

interface FriendDetailProps {
  session?: any;
  friendId: string;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
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

export function FriendDetail({ session, friendId, onBack, onBillClick }: FriendDetailProps) {
  const [friend, setFriend] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(session?.user?.id || '');
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Get current user ID
        const { data: { session: s } } = await supabase.auth.getSession();
        const currentUid = s?.user?.id || session?.user?.id || '';
        setUserId(currentUid);

        // 2. Fetch friend profile
        const { data: friendProfile, error: friendErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', friendId)
          .single();
        
        if (friendErr) throw friendErr;
        setFriend(friendProfile);

        // 3. Fetch bills for current user
        if (currentUid) {
          const userBills = await api.getBills(currentUid);
          setBills(userBills || []);
        }
      } catch (err) {
        console.error('Error in FriendDetail:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [friendId, session]);

  if (loading) return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center font-['Sora']">Loading...</div>;
  if (!friend) return null;

  // Filter bills shared between current user and this friend
  const sharedBills = bills.filter(bill => {
    const parts = bill.participants || [];
    const isMeInBill = bill.creator_id === userId || parts.some((p: any) => p.friend_id === userId || p.friendId === userId);
    const isFriendInBill = bill.creator_id === friendId || parts.some((p: any) => p.friend_id === friendId || p.friendId === friendId);
    return isMeInBill && isFriendInBill;
  });

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-32 relative overflow-hidden font-['Sora']">
      
      {/* Header Area */}
      <div className="pt-6 px-6 relative">
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-4 cursor-pointer"
        >
          <ChevronLeft size={32} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </button>

        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-[#1A1A1A] text-2xl font-bold font-display">{friend.full_name || friend.name || 'Friend'}</h1>
            <div className="flex items-center gap-4 mt-2">
              {friend.avatar_url ? (
                <img src={friend.avatar_url} alt="" className="w-[50px] h-[50px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-zinc-300 flex items-center justify-center font-bold text-black text-xl shrink-0">
                  {(friend.full_name || friend.email || 'F')[0].toUpperCase()}
                </div>
              )}
              <span className="text-black/70 text-[15px] font-normal">{friend.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Bills Section Header */}
      <div className="px-6 mt-8 flex justify-between items-center">
        <h2 className="text-[#1A1A1A] text-xl font-bold font-display">Shared Plates</h2>
        <span className="text-xs font-semibold text-black/50">{sharedBills.length} Plates</span>
      </div>

      {/* Shared Bills Cards */}
      <div className="px-5 mt-4 flex flex-col gap-3.5">
        {sharedBills.map(bill => {
          const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';

          return (
            <div 
              key={bill.id}
              onClick={() => {
                if (onBillClick) {
                  onBillClick(bill.id);
                } else {
                  setSelectedBill(bill);
                }
              }}
              className="w-full bg-[#D9D9D9] rounded-[30px] px-6 py-4.5 flex flex-col gap-3 shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
            >
              {/* Top Row: Title + Status Pill */}
              <div className="flex justify-between items-center gap-3">
                <h3 className="text-[#1A1A1A] text-xl font-semibold leading-tight truncate">{bill.title}</h3>
                <div className={`rounded-full px-3.5 py-1 flex items-center justify-center shrink-0 ${
                  displayStatus === 'Settled' ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
                }`}>
                  <span className="text-[12px] font-semibold">{displayStatus}</span>
                </div>
              </div>

              {/* Bottom Row: Category Tag, Date & Amount */}
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center gap-2.5">
                  <span className={`${getTagColor(bill.category)} text-black px-3 py-1 rounded-full font-medium text-xs`}>
                    {bill.category}
                  </span>
                  <span className="text-black/60 font-normal text-xs">{formatTime(bill.created_at || bill.createdAt)}</span>
                </div>
                <span className="text-[#1A1A1A] text-2xl font-semibold">LKR {bill.total}</span>
              </div>
            </div>
          );
        })}

        {sharedBills.length === 0 && (
          <div className="bg-[#D9D9D9]/50 rounded-[25px] p-8 text-center text-black/50 text-sm mt-4">
            No shared plates with {friend.full_name?.split(' ')[0] || 'this friend'} yet.
          </div>
        )}
      </div>

      {/* Shared Bill Details Modal */}
      <IncomingBillModal 
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        bill={selectedBill}
        userId={userId}
        readOnly={true}
      />
    </div>
  );
}
