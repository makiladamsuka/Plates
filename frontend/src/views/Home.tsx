import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, UserPlus, ChevronRight, Check } from 'lucide-react';
import { NewBillModal } from '../components/NewBillModal';
import { IncomingBillModal } from '../components/IncomingBillModal';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import type { Bill, Friend } from '../data/mockData';

interface HomeProps {
  session?: any;
  bills?: Bill[];
  friends?: Friend[];
  onAddBill?: (bill: Bill) => void;
  onBillClick?: (id: string) => void;
  onSearchClick?: () => void;
  onAvatarClick?: () => void;
  onApproveFriend?: (id: string) => void;
}

export function Home({ 
  session,
  bills: initialBills, 
  onBillClick, 
  onSearchClick,
  onAvatarClick,
  onApproveFriend 
}: HomeProps) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [selectedIncomingBill, setSelectedIncomingBill] = useState<any>(null);
  const [selectedIncomingFriend, setSelectedIncomingFriend] = useState<any>(null);
  const [bills, setBills] = useState<any[]>(initialBills || []);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>(session?.user?.id || '');

  const getActiveUserId = async (): Promise<string> => {
    if (session?.user?.id) return session.user.id;
    if (userId) return userId;
    const { data: { session: s } } = await supabase.auth.getSession();
    const uid = s?.user?.id || '';
    if (uid && uid !== userId) {
      setUserId(uid);
    }
    return uid;
  };

  const fetchBills = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    try {
      if (uid) {
        const data = await api.getBills(uid);
        if (data && Array.isArray(data) && data.length > 0) {
          setBills(data);
          return;
        }
      }
    } catch (e) {
      console.warn('API getBills failed, falling back to direct Supabase:', e);
    }

    try {
      const { data: rawBills } = await supabase
        .from('bills')
        .select('*, participants(*)');

      if (rawBills) {
        // Filter strictly to bills where current user is creator or participant
        const myBills = rawBills.filter((b: any) => {
          if (!uid) return true;
          const isCreator = b.creator_id === uid;
          const isParticipant = (b.participants || []).some((p: any) => p.friend_id === uid || p.friendId === uid);
          return isCreator || isParticipant;
        });

        const allFriendIds = new Set<string>();
        myBills.forEach((b: any) => {
          if (b.creator_id) allFriendIds.add(b.creator_id);
          (b.participants || []).forEach((p: any) => {
            if (p.friend_id) allFriendIds.add(p.friend_id);
          });
        });

        let profilesMap: Record<string, any> = {};
        if (allFriendIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .in('id', Array.from(allFriendIds));

          (profiles || []).forEach((prof: any) => {
            profilesMap[prof.id] = prof;
          });
        }

        const enriched = myBills.map((b: any) => ({
          ...b,
          participants: (b.participants || []).map((p: any) => ({
            ...p,
            profile: profilesMap[p.friend_id] || null,
            full_name: profilesMap[p.friend_id]?.full_name || null,
            avatar_url: profilesMap[p.friend_id]?.avatar_url || null
          }))
        }));

        setBills(enriched);
      }
    } catch (err) {
      console.error('Error fetching bills via Supabase:', err);
    }
  };

  const fetchPendingFriends = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;

    try {
      // Fetch Pending Friend Requests sent TO current user
      const { data: rawPending, error } = await supabase
        .from('friends')
        .select('user_id, status')
        .eq('friend_id', uid)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending friend requests:', error);
        return;
      }

      if (rawPending && rawPending.length > 0) {
        const requesterIds = rawPending.map((f: any) => f.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email')
          .in('id', requesterIds);

        const pending = (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Friend',
          username: p.email || '',
          avatar_url: p.avatar_url,
          color: '#4C8C3C',
          isPendingRequest: true,
        }));
        setPendingFriendRequests(pending);
      } else {
        setPendingFriendRequests([]);
      }
    } catch (err) {
      console.error('Error loading friend requests:', err);
    }
  };

  const handleApproveFriend = async (requesterId: string) => {
    const uid = await getActiveUserId();
    if (!uid) return;

    // Optimistic UI update: remove request immediately so it disappears with zero delay
    setPendingFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    setSelectedIncomingFriend(null);

    try {
      // 1. Try Supabase RPC first
      const { error: rpcErr } = await supabase.rpc('accept_friend_request', {
        p_requester_id: requesterId,
        p_friend_id: uid
      });

      if (rpcErr) {
        // Fallback: direct table updates
        await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', requesterId)
          .eq('friend_id', uid);

        await supabase
          .from('friends')
          .upsert({ user_id: uid, friend_id: requesterId, status: 'accepted' });
      }

      // Background API sync
      api.acceptFriend(requesterId, uid).catch(console.warn);

      fetchPendingFriends(uid);
      onApproveFriend?.(requesterId);
    } catch (err) {
      console.error('Error approving friend request:', err);
      fetchPendingFriends(uid);
    }
  };

  const handleDirectAcceptBill = async (bill: any) => {
    const uid = await getActiveUserId();
    if (!uid) return;

    // Optimistic UI update: immediately mark accepted so it disappears instantly
    setBills(prev => prev.map(b => {
      if (b.id !== bill.id) return b;
      return {
        ...b,
        participants: (b.participants || []).map((p: any) => 
          (p.friend_id === uid || p.friendId === uid) ? { ...p, accepted: true } : p
        )
      };
    }));

    try {
      // 1. Direct Supabase write
      await supabase
        .from('participants')
        .update({ accepted: true, paid: false })
        .eq('bill_id', bill.id)
        .eq('friend_id', uid);

      await supabase
        .from('bills')
        .update({ status: 'Pending' })
        .eq('id', bill.id);

      // 2. Background API call
      api.acceptBill(bill.id, uid).catch(console.warn);

      fetchBills(uid);
    } catch (err) {
      console.error('Error accepting bill directly:', err);
      fetchBills(uid);
    }
  };

  const handleConfirmPaymentReceipt = async (billId: string, friendId: string) => {
    const uid = await getActiveUserId();
    if (!uid) return;

    // Optimistic UI update: mark participant as paid
    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      const updatedParts = (b.participants || []).map((p: any) => 
        (p.friend_id === friendId || p.friendId === friendId) ? { ...p, paid: true, payment_sent: true } : p
      );
      const allPaid = updatedParts.every((p: any) => p.paid === true);
      return {
        ...b,
        status: allPaid ? 'Settled' : b.status,
        participants: updatedParts
      };
    }));

    try {
      // Route through backend API (uses service role key, bypasses RLS)
      await api.confirmPayment(billId, friendId);
      fetchBills(uid);
    } catch (err) {
      console.error('Error confirming payment receipt:', err);
      fetchBills(uid);
    }
  };

  const handleDeclinePaymentReceipt = async (billId: string, friendId: string) => {
    const uid = await getActiveUserId();
    if (!uid) return;

    setBills(prev => prev.map(b => {
      if (b.id !== billId) return b;
      return {
        ...b,
        participants: (b.participants || []).map((p: any) => 
          (p.friend_id === friendId || p.friendId === friendId) ? { ...p, payment_sent: false, paid: false } : p
        )
      };
    }));

    try {
      // Route through backend API (uses service role key, bypasses RLS)
      await api.declinePayment(billId, friendId);
      fetchBills(uid);
    } catch (err) {
      console.error('Error declining payment receipt:', err);
      fetchBills(uid);
    }
  };

  const handleDeclineFriend = async (requesterId: string) => {
    const uid = await getActiveUserId();
    if (!uid) return;

    try {
      await supabase
        .from('friends')
        .delete()
        .eq('user_id', requesterId)
        .eq('friend_id', uid);

      setSelectedIncomingFriend(null);
      fetchPendingFriends(uid);
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    getActiveUserId().then((uid) => {
      if (uid) {
        if (!initialBills) fetchBills(uid);
        fetchPendingFriends(uid);
      }
    });

    // Realtime subscription for instant sync on bills, participants, and friends
    const channel = supabase
      .channel('realtime-home-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => fetchPendingFriends())
      .subscribe();

    // Fast polling fallback (every 3 seconds) to ensure real-time appearance even if DB replication isn't configured
    const interval = setInterval(() => {
      fetchBills();
      fetchPendingFriends();
    }, 3000);

    const handleFocus = () => {
      fetchBills();
      fetchPendingFriends();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [initialBills, session]);

  // Compute dynamic balances from real bills data
  let totalYouAreOwed = 0;
  let totalYouOwe = 0;

  (bills || []).forEach(bill => {
    if (bill.status === 'Settled') return; // Settled bills don't contribute to balance

    const isCreator = bill.creator_id === userId;

    if (isCreator) {
      // Money other participants owe to current user for this bill
      (bill.participants || []).forEach((p: any) => {
        const isMe = p.friend_id === userId || p.friendId === userId;
        if (!isMe && !p.paid) {
          totalYouAreOwed += Number(p.share || 0);
        }
      });
    } else {
      // Money current user owes to creator for this bill
      const myPart = (bill.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
      if (myPart && !myPart.paid) {
        totalYouOwe += Number(myPart.share || 0);
      }
    }
  });

  const netBalance = totalYouAreOwed - totalYouOwe;

  // Find payments sent by participants awaiting current user's confirmation as creator
  const pendingPaymentConfirmations: Array<{ bill: any; participant: any }> = [];
  const currentUid = userId || session?.user?.id;
  if (currentUid) {
    (bills || []).forEach(b => {
      if (b.creator_id === currentUid) {
        (b.participants || []).forEach((p: any) => {
          const isMe = p.friend_id === currentUid || p.friendId === currentUid;
          if (!isMe && p.payment_sent === true && p.paid !== true) {
            pendingPaymentConfirmations.push({ bill: b, participant: p });
          }
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-36 pt-0 transition-colors">
      
      {/* Top Header Container */}
      <div className="px-6 pt-10 pb-4 h-[88px] flex justify-between items-center max-w-[480px] md:max-w-6xl md:px-10 mx-auto md:hidden">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Plates logo" className="w-11 h-11 rounded-[22.5%] shrink-0" />
          <h1 className="text-black dark:text-zinc-100 text-5xl font-extrabold font-display tracking-tight leading-none">Plates</h1>
        </div>
        <button 
          onClick={onAvatarClick}
          className="w-10 h-10 rounded-full bg-[#D9D9D9] dark:bg-zinc-800 flex items-center justify-center font-bold text-black dark:text-zinc-100 text-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden md:hidden"
        >
          {session?.user?.user_metadata?.avatar_url ? (
            <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            (session?.user?.user_metadata?.full_name || 'ME').substring(0, 2).toUpperCase()
          )}
        </button>
      </div>

      <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 md:px-10 flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-10 md:pt-12">
        
        {/* Left Column (Desktop) */}
        <div className="flex flex-col gap-6 w-full md:col-span-7 lg:col-span-8 shrink-0">

        {/* 1. Net Balance Overview Card */}
        <div className="w-full bg-[#D9D9D9] dark:bg-zinc-900 rounded-[26px] p-5 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-black/60 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider">Overall Balance</span>
              <span className="text-[#1A1A1A] dark:text-zinc-100 text-3xl font-bold mt-0.5">
                LKR {Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              netBalance >= 0 ? 'bg-[#4C8C3C] text-white' : 'bg-[#F6D6DA] dark:bg-red-900/50 text-black dark:text-red-200'
            }`}>
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
            {/* You are owed */}
            <div className="bg-[#EDEDF1]/70 dark:bg-zinc-950/50 rounded-2xl px-3.5 py-2.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[#4C8C3C] dark:text-[#5FAD4B]">
                <ArrowDownLeft size={15} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70 dark:text-zinc-400">Owed to you</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-zinc-100">LKR {totalYouAreOwed.toLocaleString()}</span>
            </div>

            {/* You owe */}
            <div className="bg-[#EDEDF1]/70 dark:bg-zinc-950/50 rounded-2xl px-3.5 py-2.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-black dark:text-zinc-300">
                <ArrowUpRight size={15} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70 dark:text-zinc-400">You owe</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-zinc-100">LKR {totalYouOwe.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 2. Quick Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="flex-1 bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950 h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Split a Plate</span>
          </button>
          
          <button 
            onClick={onSearchClick}
            className="flex-1 bg-[#D9D9D9] dark:bg-zinc-800 text-[#1A1A1A] dark:text-zinc-100 h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span>Add Friend</span>
          </button>
        </div>



        {/* 4. Recent Plates */}
        <div className="flex flex-col gap-3 md:mt-2">
          <div className="flex justify-between items-end">
            <h2 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl font-bold font-display tracking-tight">
              Recent Plates
            </h2>
            <span className="text-xs font-medium text-black/40 dark:text-zinc-500 md:hidden">Swipe →</span>
          </div>

          <div
            className="-mx-5 md:mx-0 flex gap-3.5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory md:snap-none md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:auto-rows-fr"
            style={{ paddingLeft: '20px' }}
          >
            {[...bills]
              .sort((a, b) => {
                const aIsPending = a.status !== 'Settled';
                const bIsPending = b.status !== 'Settled';
                if (aIsPending && !bIsPending) return -1;
                if (!aIsPending && bIsPending) return 1;
                const timeA = new Date(a.created_at || a.createdAt || Date.now()).getTime();
                const timeB = new Date(b.created_at || b.createdAt || Date.now()).getTime();
                return timeB - timeA;
              })
              .map((bill) => {
              const tagColors: Record<string, { bg: string, text: string }> = {
                'Restaurant': { bg: '#F6D6DA', text: '#1A1A1A' },
                'Grocery': { bg: '#D7ECD1', text: '#1A1A1A' },
                'Entertainment': { bg: '#CDE1FF', text: '#1A1A1A' },
              };
              const tagStyle = tagColors[bill.category] || { bg: '#E5E7EB', text: '#1A1A1A' };
              const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';

              return (
                <div
                  key={`carousel-${bill.id}`}
                  onClick={() => onBillClick?.(bill.id)}
                  className="w-[200px] md:w-full h-[205px] shrink-0 bg-[#D9D9D9] dark:bg-zinc-900 rounded-[28px] flex flex-col justify-between shadow-sm snap-start cursor-pointer active:scale-[0.98] hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-all border border-transparent dark:border-white/5"
                  style={{ padding: '16px' }}
                >
                  <h3 className="text-[#1A1A1A] dark:text-zinc-100 text-lg md:text-xl font-bold leading-snug line-clamp-2">
                    {bill.title}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-black/50 dark:text-zinc-400 text-xs font-normal">
                      {new Date(bill.createdAt || bill.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}
                    >
                      {bill.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-black/10 dark:border-white/10 pt-2.5">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit ${
                          displayStatus === 'Settled' ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
                        }`}
                      >
                        {displayStatus}
                      </span>
                      <span className="text-[#1A1A1A] dark:text-zinc-100 text-base font-extrabold tracking-tight">
                        LKR {bill.total}
                      </span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {(bill.participants || []).slice(0, 3).map((p: any, i: number) => {
                        const isMe = p.friend_id === userId || p.friendId === userId || p.friendId === 'me';
                        const pAvatar = p.avatar_url || p.profile?.avatar_url || (isMe ? session?.user?.user_metadata?.avatar_url : null);
                        const pName = isMe ? (session?.user?.user_metadata?.full_name || 'You') : (p.full_name || p.profile?.full_name || p.name || 'Friend');
                        const initial = (pName || 'F').trim()[0]?.toUpperCase() || 'U';

                        return pAvatar ? (
                          <img
                            key={i}
                            src={pAvatar}
                            alt={pName}
                            title={pName}
                            className="w-6 h-6 rounded-full border border-[#EDEDF1] dark:border-zinc-900 object-cover shrink-0"
                          />
                        ) : (
                          <div
                            key={i}
                            title={pName}
                            className="w-6 h-6 rounded-full border border-[#EDEDF1] dark:border-zinc-900 bg-zinc-400 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="shrink-0 md:hidden" style={{ width: '20px' }} />
          </div>
        </div>
        
        </div> {/* End of Left Column */}

        {/* Right Column (Desktop) */}
        <div className="flex flex-col gap-6 w-full md:col-span-5 lg:col-span-4 shrink-0">
          {/* 3. Waiting on You Section */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl font-bold font-display tracking-tight px-1">
              Waiting on You
            </h2>

            <div className="flex flex-col gap-3">
              {/* 1. Pending Payment Confirmations (for Creator) */}
              {pendingPaymentConfirmations.map(({ bill, participant }) => {
                const pFriendId = participant.friend_id || participant.friendId;
                const pName = participant.full_name || participant.profile?.full_name || 'A friend';
                const pAvatar = participant.avatar_url || participant.profile?.avatar_url;

                return (
                  <div
                    key={`payment-confirm-${bill.id}-${pFriendId}`}
                    onClick={() => setSelectedIncomingBill(bill)}
                    className="w-full bg-[#D7ECD1]/90 dark:bg-zinc-900 rounded-[25px] p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#D7ECD1] dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {pAvatar ? (
                        <img src={pAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#4C8C3C]/20 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#4C8C3C] dark:text-[#5FAD4B] shrink-0">
                          {(pName || 'F').substring(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm font-semibold leading-tight truncate">
                          {pName} sent payment
                        </span>
                        <span className="text-black/70 dark:text-zinc-400 text-xs font-normal truncate">
                          LKR {participant.share} · {bill.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmPaymentReceipt(bill.id, pFriendId);
                        }}
                        className="bg-[#4C8C3C] hover:bg-[#437d35] active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 transition-transform cursor-pointer shadow-xs"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeclinePaymentReceipt(bill.id, pFriendId);
                        }}
                        className="bg-black/10 dark:bg-zinc-800 hover:bg-black/20 text-black dark:text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center transition-transform cursor-pointer"
                        title="Not received"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 2. Bills pending acceptance (accepted === false) */}
              {(bills || []).filter(b => {
                const uid = userId || session?.user?.id;
                if (!uid) return false;
                const isCreator = b.creator_id === uid;
                if (isCreator) return false;
                const myPart = (b.participants || []).find((p: any) => p.friend_id === uid || p.friendId === uid);
                return myPart && (myPart.accepted === false || myPart.accepted === null || myPart.accepted === undefined);
              }).map(bill => {
                const uid = userId || session?.user?.id;
                const myPart = (bill.participants || []).find((p: any) => p.friend_id === uid || p.friendId === uid);
                const myShare = myPart ? myPart.share : bill.total;

                return (
                  <div 
                    key={`pending-accept-${bill.id}`}
                    onClick={() => setSelectedIncomingBill(bill)}
                    className="w-full bg-[#D9D9D9] dark:bg-zinc-900 rounded-[25px] p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                      <span className="text-[#1A1A1A] dark:text-zinc-100 text-base font-semibold truncate">{bill.title}</span>
                      <span className="text-black/60 dark:text-zinc-400 text-xs font-normal">
                        Your share: LKR {myShare} · Total: LKR {bill.total}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectAcceptBill(bill);
                        }}
                        className="bg-[#F5C744] hover:bg-[#ebd538] active:scale-95 text-black text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-transform cursor-pointer shadow-xs"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Accept</span>
                      </button>
                      <ChevronRight size={18} className="text-black/40 dark:text-zinc-600" />
                    </div>
                  </div>
                );
              })}

              {/* 3. Pending Friend Requests */}
              {pendingFriendRequests.map(friend => (
                <div 
                  key={friend.id}
                  onClick={() => setSelectedIncomingFriend(friend)}
                  className="w-full bg-[#F6D6DA]/80 dark:bg-zinc-900 rounded-[25px] p-4 flex items-center justify-between shadow-sm border border-transparent dark:border-white/5 cursor-pointer hover:bg-[#F6D6DA] dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {friend.avatar_url ? (
                      <img 
                        src={friend.avatar_url} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover shrink-0" 
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full bg-[#1A1A1A]/10 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-[#1A1A1A] dark:text-zinc-100 shrink-0"
                      >
                        {(friend.name || 'U').substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm font-semibold leading-tight truncate">{friend.name}</span>
                      <span className="text-black/60 dark:text-zinc-400 text-xs font-normal truncate">
                        {friend.username ? `${friend.username} · Wants to connect` : 'Wants to connect with you'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveFriend(friend.id);
                      }}
                      className="bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform cursor-pointer hover:bg-black/80 dark:hover:bg-zinc-300 shadow-xs"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Accept</span>
                    </button>
                    <ChevronRight size={18} className="text-black/40 dark:text-zinc-600" />
                  </div>
                </div>
              ))}

              {pendingPaymentConfirmations.length === 0 && pendingFriendRequests.length === 0 && (bills || []).filter(b => {
                const uid = userId || session?.user?.id;
                if (!uid) return false;
                const isCreator = b.creator_id === uid;
                if (isCreator) return false;
                const myPart = (b.participants || []).find((p: any) => p.friend_id === uid || p.friendId === uid);
                return myPart && (myPart.accepted === false || myPart.accepted === null || myPart.accepted === undefined);
              }).length === 0 && (
                <div className="bg-[#D9D9D9]/50 dark:bg-zinc-900/50 rounded-[25px] p-6 text-center text-black/50 dark:text-zinc-500 text-sm border border-transparent dark:border-white/5">
                  All caught up! No pending requests to accept.
                </div>
              )}
            </div>
          </div>
        </div> {/* End of Right Column */}
      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen}
        session={session}
        onClose={() => setIsNewBillModalOpen(false)}
        onSuccess={fetchBills}
      />

      {/* Incoming Bill Modal (Accept/Decline) */}
      <IncomingBillModal 
        isOpen={!!selectedIncomingBill}
        onClose={() => setSelectedIncomingBill(null)}
        bill={selectedIncomingBill}
        userId={userId}
        onSuccess={fetchBills}
      />

      {/* Incoming Friend Request Modal (Slide to Approve / Decline) */}
      <IncomingFriendRequestModal 
        isOpen={!!selectedIncomingFriend}
        onClose={() => setSelectedIncomingFriend(null)}
        onApprove={() => selectedIncomingFriend && handleApproveFriend(selectedIncomingFriend.id)}
        onDecline={() => selectedIncomingFriend && handleDeclineFriend(selectedIncomingFriend.id)}
        friend={selectedIncomingFriend || undefined}
      />
    </div>
  );
}
