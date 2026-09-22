import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../lib/DataContext';
import { NewBillModal } from '../components/NewBillModal';


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
  session?: any;
}

export function BillsList({ onBillClick, session }: BillsListProps) {
  const { bills, fetchBills, isLoadingBills } = useData();
  const userId = session?.user?.id || '';
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedBills = [...bills].sort((a, b) => {
    const timeA = new Date(a.created_at || a.createdAt || Date.now()).getTime();
    const timeB = new Date(b.created_at || b.createdAt || Date.now()).getTime();
    if (sortKey === 'highest') return Number(b.total) - Number(a.total);
    if (sortKey === 'lowest') return Number(a.total) - Number(b.total);
    if (sortKey === 'oldest') return timeA - timeB;
    return timeB - timeA;
  });

  const filteredBills = sortedBills.filter(bill => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const matchTitle = (bill.title || '').toLowerCase().includes(query);
    const matchCategory = (bill.category || '').toLowerCase().includes(query);
    const matchTotal = bill.total?.toString().includes(query);
    const matchStatus = (bill.status || '').toLowerCase().includes(query);
    const matchParticipants = (bill.participants || []).some((p: any) => {
      const name = (p.full_name || p.profile?.full_name || p.name || '').toLowerCase();
      return name.includes(query);
    });
    return matchTitle || matchCategory || matchTotal || matchStatus || matchParticipants;
  });

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 font-['Sora'] transition-colors">
      
      {/* Header Container */}
      <div className="sticky top-0 z-30 bg-[#EDEDF1] dark:bg-zinc-950 transition-colors">
        <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 md:px-10 pt-10 pb-3">
          <div className="flex justify-between items-center h-10 mb-3">
            <h1 className="text-black dark:text-zinc-100 text-4xl sm:text-5xl font-extrabold font-display tracking-tight leading-none">Bills</h1>
            <button 
              onClick={() => {
                setIsSearchOpen(prev => !prev);
                if (isSearchOpen) setSearchQuery('');
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-black dark:text-zinc-100 active:scale-95"
              title={isSearchOpen ? "Close search" : "Search bills"}
            >
              {isSearchOpen ? (
                <X size={22} strokeWidth={2.5} />
              ) : (
                <Search size={22} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Search Input Bar */}
          {isSearchOpen && (
            <div className="w-full flex items-center bg-[#D9D9D9]/80 dark:bg-zinc-900/80 rounded-[30px] px-4 py-2.5 mb-3 shadow-sm border border-transparent dark:border-white/5 transition-all">
              <Search size={18} strokeWidth={2.5} className="text-black/60 dark:text-zinc-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search by title, category, friend..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent text-[#1A1A1A] dark:text-zinc-100 placeholder:text-black/50 dark:placeholder:text-zinc-500 text-sm font-medium outline-none w-full"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-black/40 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
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
      <div className="max-w-[480px] md:max-w-6xl mx-auto px-5 md:px-10">
        
        {/* Bills Cards */}
        <div className="mt-3 flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-5">
          {filteredBills.map(bill => {
            const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';

            return (
              <div 
                key={bill.id}
                onClick={() => onBillClick?.(bill.id)}
                className="w-full min-h-[142px] sm:min-h-[152px] bg-[#D9D9D9] dark:bg-zinc-900 rounded-[28px] py-6 px-5.5 sm:py-6.5 sm:px-6 flex flex-col justify-between gap-5 shadow-sm cursor-pointer hover:bg-zinc-300/80 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-white/5"
              >
                {/* Top Row: Title + Status Pill */}
                <div className="flex justify-between items-center gap-3">
                  <h2 className="text-[#1A1A1A] dark:text-zinc-100 text-lg sm:text-xl font-bold leading-snug break-words line-clamp-1 flex-1 min-w-0">{bill.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`rounded-full px-3.5 py-1 flex items-center justify-center shrink-0 ${
                      displayStatus === 'Settled' ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
                    }`}>
                      <span className="text-xs font-semibold">{displayStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Category Tag, Date & Amount + Avatars */}
                <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className={`${getTagColor(bill.category)} text-black dark:text-zinc-100 px-3 py-1 rounded-full font-medium text-xs shrink-0`}>
                      {bill.category}
                    </span>
                    <span className="text-black/50 dark:text-zinc-400 font-normal text-xs shrink-0">{formatTime(bill.created_at || bill.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex -space-x-1.5 shrink-0">
                      {(bill.participants || []).slice(0, 4).map((p: any, i: number) => {
                        const isMe = p.friend_id === userId || p.friendId === userId || p.friendId === 'me';
                        const pAvatar = isMe 
                          ? (session?.user?.user_metadata?.avatar_url || p.avatar_url || p.profile?.avatar_url) 
                          : (p.avatar_url || p.profile?.avatar_url);
                        const pName = isMe ? 'You' : (p.full_name || p.profile?.full_name || p.name || 'Friend');
                        const initial = (pName || 'F').trim()[0]?.toUpperCase() || 'U';

                        return pAvatar ? (
                          <img
                            key={i}
                            src={pAvatar}
                            alt={pName}
                            title={pName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#EDEDF1] dark:border-zinc-900 object-cover shrink-0"
                          />
                        ) : (
                          <div
                            key={i}
                            title={pName}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#EDEDF1] dark:border-zinc-900 bg-zinc-400 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[#1A1A1A] dark:text-zinc-100 text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">LKR&nbsp;{bill.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {/* Loading Skeletons */}
          {isLoadingBills && sortedBills.length === 0 && (
            <div className="flex flex-col gap-4 w-full">
              {[1, 2, 3].map((i) => (
                <div 
                  key={`skeleton-${i}`} 
                  className="w-full bg-zinc-300/40 dark:bg-zinc-900/60 rounded-[30px] p-6 h-[110px] animate-pulse flex flex-col justify-between border border-transparent dark:border-white/5"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-36 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                    <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                    <div className="h-6 w-20 bg-zinc-300 dark:bg-zinc-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Empty State */}
          {!isLoadingBills && bills.length > 0 && filteredBills.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-zinc-500">
                <Search size={22} />
              </div>
              <p className="text-sm font-medium text-black/60 dark:text-zinc-400">
                No bills found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-black dark:text-zinc-100 underline cursor-pointer hover:opacity-80"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Genuine Empty State */}
          {!isLoadingBills && bills.length === 0 && (
            <div className="text-center mt-10 text-black/50 dark:text-zinc-500 text-sm">No bills found. Create one!</div>
          )}
        </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[115px] md:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[480px] md:w-auto md:left-auto md:right-10 md:translate-x-0 z-40 pointer-events-none">
        <div className="w-full relative">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="absolute bottom-0 right-6 md:static w-16 h-16 md:w-16 md:h-16 bg-[#1A1A1A] dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-95 transition-transform cursor-pointer hover:bg-black/80 dark:hover:bg-zinc-300"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EDEDF1] dark:text-zinc-950">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen} 
        session={session}
        onClose={() => setIsNewBillModalOpen(false)} 
        onSuccess={() => {
          setIsNewBillModalOpen(false);
          fetchBills();
        }}
      />

    </div>
  );
}
