import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { IncomingBillModal } from '../components/IncomingBillModal';

interface FriendDetailProps {
  session?: any;
  friendId: string;
  onBack: () => void;
  onBillClick?: (billId: string) => void;
}

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

  // Calculate net balance with this friend (positive = friend owes me, negative = I owe friend)
  let friendBalance = 0;
  sharedBills.forEach(bill => {
    if (bill.status === 'Settled') return;
    const isCreatorMe = bill.creator_id === userId;
    const friendPart = (bill.participants || []).find((p: any) => p.friend_id === friendId || p.friendId === friendId);
    const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);

    if (isCreatorMe && friendPart && !friendPart.paid) {
      friendBalance += Number(friendPart.share || 0);
    } else if (!isCreatorMe && myPart && !myPart.paid) {
      friendBalance -= Number(myPart.share || 0);
    }
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
                <div className="w-[50px] h-[50px] rounded-full bg-[#D9D9D9] flex items-center justify-center font-bold text-black text-xl shrink-0 opacity-80">
                  {(friend.full_name || friend.email || 'F')[0].toUpperCase()}
                </div>
              )}
              <span className="text-black text-[15px] font-normal">{friend.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {friendBalance !== 0 && (
              <>
                {friendBalance > 0 ? (
                  <ArrowDownLeft size={24} strokeWidth={2.5} className="text-black" />
                ) : (
                  <ArrowUpRight size={24} strokeWidth={2.5} className="text-black" />
                )}
                <span className="text-[#1A1A1A] text-xl font-semibold">
                  LKR {Math.abs(friendBalance).toLocaleString()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shared Bills List */}
      <div className="px-5 mt-8 flex flex-col gap-3">
        {sharedBills.map(bill => {
          const isCreatorMe = bill.creator_id === userId;
          const friendPart = (bill.participants || []).find((p: any) => p.friend_id === friendId || p.friendId === friendId);
          const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);

          const isIncoming = isCreatorMe;
          const amount = isCreatorMe ? (friendPart?.share || 0) : (myPart?.share || 0);

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
              className="w-full h-[56px] bg-[#D9D9D9] rounded-[35px] px-6 flex items-center justify-between cursor-pointer hover:bg-zinc-300 transition-colors"
            >
              <span className="text-[#1A1A1A] text-base font-semibold truncate mr-4">
                {bill.title}
              </span>
              
              <div className="flex items-center gap-2 shrink-0">
                {isIncoming ? (
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
            No shared bills with {friend.full_name?.split(' ')[0] || 'this friend'}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] left-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative">
          <button 
            className="absolute bottom-0 right-6 w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={32} strokeWidth={2.5} className="text-[#EDEDF1]" />
          </button>
        </div>
      </div>

      {/* Shared Bill Details Bottom Sheet Modal */}
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
