import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { NewBillModal } from '../components/NewBillModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';

const getTagColor = (category: string) => {
  switch (category) {
    case 'Restaurant': return 'bg-[#F6D6DA] dark:bg-red-900/40';
    case 'Grocery': return 'bg-[#D7ECD1] dark:bg-green-900/40';
    case 'Entertainment': return 'bg-[#CDE1FF] dark:bg-blue-900/40';
    default: return 'bg-zinc-200 dark:bg-zinc-800';
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

type SortKey = 'all' | 'highest' | 'lowest' | 'oldest';

interface BillsListProps {
  onBillClick?: (id: string) => void;
}

export function BillsList({ onBillClick }: BillsListProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('all');
  const [userId, setUserId] = useState<string>('');

  // Delete Bill Modal State
  const [selectedDeleteBill, setSelectedDeleteBill] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingBill, setIsDeletingBill] = useState(false);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  const fetchBills = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (uid) setUserId(uid);
    try {
      if (uid) {
        const data = await api.getBills(uid);
        if (data && Array.isArray(data) && data.length > 0) {
          setBills(data);
          return;
        }
      }
    } catch (e) {
      console.warn('API getBills failed in BillsList, falling back to direct Supabase:', e);
    }

    try {
      const { data: rawBills } = await supabase
        .from('bills')
        .select('*, participants(*)');

      if (rawBills) {
        const allFriendIds = new Set<string>();
        rawBills.forEach((b: any) => {
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

        const enriched = rawBills.map((b: any) => ({
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

  const handleInitiateDeleteBill = (bill: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDeleteBill(bill);
    setIsDeleteModalOpen(true);
    setDeleteBlockedReason(null);

    const isCreator = bill.creator_id === userId;
    const isSettled = bill.status === 'Settled';

    if (!isCreator && !isSettled) {
      setDeleteBlockedReason(
        'Only the bill creator can delete this unsettled bill. You can only remove it once all shares are settled.'
      );
    }
  };

  const handleConfirmDeleteBill = async () => {
    if (!selectedDeleteBill || !userId) return;
    setIsDeletingBill(true);
    try {
      await api.deleteBill(selectedDeleteBill.id, userId);
      const isCreator = selectedDeleteBill.creator_id === userId;
      if (isCreator) {
        await Promise.allSettled([
          supabase.from('participants').delete().eq('bill_id', selectedDeleteBill.id),
          supabase.from('bills').delete().eq('id', selectedDeleteBill.id)
        ]);
      } else {
        await supabase.from('participants').delete().eq('bill_id', selectedDeleteBill.id).eq('friend_id', userId);
      }
      setIsDeleteModalOpen(false);
      setSelectedDeleteBill(null);
      fetchBills();
    } catch (err: any) {
      setDeleteBlockedReason(err.message || 'Failed to delete bill.');
    } finally {
      setIsDeletingBill(false);
    }
  };

  useEffect(() => {
    fetchBills();

    // Realtime subscription for instant bill/participant status sync
    const channel = supabase
      .channel('realtime-bills-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchBills)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, fetchBills)
      .subscribe();

    const interval = setInterval(() => {
      fetchBills();
    }, 3000);

    const handleFocus = () => fetchBills();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const sortedBills = [...bills].sort((a, b) => {
    const timeA = new Date(a.created_at || a.createdAt || Date.now()).getTime();
    const timeB = new Date(b.created_at || b.createdAt || Date.now()).getTime();
    if (sortKey === 'highest') return Number(b.total) - Number(a.total);
    if (sortKey === 'lowest') return Number(a.total) - Number(b.total);
    if (sortKey === 'oldest') return timeA - timeB;
    return timeB - timeA;
  });

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-[160px] md:pt-0 font-['Sora'] relative transition-colors">
      
      {/* Header Container */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-[#EDEDF1] dark:bg-zinc-950 md:sticky md:left-0 md:translate-x-0 md:max-w-full md:px-10 md:pt-4 transition-colors">
        <div className="max-w-[480px] md:max-w-6xl mx-auto">
          <div className="px-6 md:px-0 pt-10 pb-4 flex justify-between items-center h-[88px] md:hidden">
            <h1 className="text-black dark:text-zinc-100 text-5xl font-bold font-display tracking-tight leading-none">Bills</h1>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-zinc-100">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 md:px-0 pb-4 md:pt-12 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All' },
              { key: 'highest', label: 'Highest' },
              { key: 'lowest', label: 'Lowest' },
              { key: 'oldest', label: 'Oldest' },
            ].map(t => (
              <button 
                key={t.key}
                onClick={() => setSortKey(t.key as SortKey)}
                className={`h-8 px-4 md:px-5 rounded-[35px] text-sm md:text-base font-semibold whitespace-nowrap shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  sortKey === t.key ? 'bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950' : 'bg-[#D9D9D9] dark:bg-zinc-900 text-black dark:text-zinc-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[480px] md:max-w-6xl mx-auto md:px-10">
        
        {/* Bills Cards */}
        <div className="px-5 md:px-0 mt-2 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBills.map(bill => {
            const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';
            const isCreator = bill.creator_id === userId;

            return (
              <div 
                key={bill.id}
                onClick={() => onBillClick?.(bill.id)}
                className="w-full bg-[#D9D9D9] dark:bg-zinc-900 rounded-[30px] px-6 py-4.5 flex flex-col gap-3 shadow-sm cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
              >
                {/* Top Row: Title + Status Pill + Quick Delete */}
                <div className="flex justify-between items-center gap-3">
                  <h2 className="text-[#1A1A1A] dark:text-zinc-100 text-xl font-semibold leading-tight truncate">{bill.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`rounded-full px-3.5 py-1 flex items-center justify-center shrink-0 ${
                      displayStatus === 'Settled' ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
                    }`}>
                      <span className="text-[12px] font-semibold">{displayStatus}</span>
                    </div>

                    {/* Quick Delete Button on Card - Only show if creator or settled */}
                    {(isCreator || displayStatus === 'Settled') && (
                      <button
                        onClick={(e) => handleInitiateDeleteBill(bill, e)}
                        title={isCreator ? "Delete Bill" : "Remove Bill"}
                        className="w-7 h-7 rounded-full bg-[#EDEDF1] dark:bg-zinc-800 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 transition-all shadow-xs cursor-pointer"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Category Tag, Date & Amount */}
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`${getTagColor(bill.category)} text-black dark:text-zinc-100 px-3 py-1 rounded-full font-medium text-xs`}>
                      {bill.category}
                    </span>
                    <span className="text-black/60 dark:text-zinc-400 font-normal text-xs">{formatTime(bill.created_at || bill.createdAt)}</span>
                  </div>
                  <span className="text-[#1A1A1A] dark:text-zinc-100 text-2xl font-semibold">LKR {bill.total}</span>
                </div>
              </div>
            );
          })}

          {sortedBills.length === 0 && (
            <div className="text-center mt-10 text-black/50 dark:text-zinc-500 text-sm">No bills found. Create one!</div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[140px] md:bottom-10 left-0 md:left-auto md:right-10 w-full md:w-auto z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] md:w-auto relative">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="absolute bottom-0 right-6 md:static w-20 h-20 md:w-16 md:h-16 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer hover:bg-black/80 dark:hover:bg-zinc-300"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1] dark:text-zinc-950">
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
        onSuccess={() => {
          setIsNewBillModalOpen(false);
          fetchBills();
        }}
      />

      {/* Delete Bill Confirmation / Blocked Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeleteBill(null);
          setDeleteBlockedReason(null);
        }}
        onConfirm={handleConfirmDeleteBill}
        title={
          deleteBlockedReason
            ? 'Cannot Delete Bill'
            : selectedDeleteBill?.creator_id === userId
            ? 'Delete Bill'
            : 'Remove Bill'
        }
        description={
          deleteBlockedReason
            ? deleteBlockedReason
            : selectedDeleteBill?.creator_id === userId
            ? `Are you sure you want to permanently delete "${selectedDeleteBill?.title}"? This will remove it for all participants.`
            : `Are you sure you want to remove "${selectedDeleteBill?.title}" from your history?`
        }
        confirmText={selectedDeleteBill?.creator_id === userId ? 'Delete Bill' : 'Remove from List'}
        isBlocked={!!deleteBlockedReason}
        blockedReason={deleteBlockedReason || undefined}
        isLoading={isDeletingBill}
        itemType="bill"
      />

    </div>
  );
}
