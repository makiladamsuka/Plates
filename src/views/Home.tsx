import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, UserPlus, ChevronRight, Check } from 'lucide-react';
import { NewBillModal } from '../components/NewBillModal';
import { IncomingBillModal } from '../components/IncomingBillModal';
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
  onApproveFriend?: (id: string) => void;
}

export function Home({ 
  session,
  bills: initialBills, 
  friends = [], 
  onAddBill, 
  onBillClick, 
  onSearchClick,
  onApproveFriend 
}: HomeProps) {
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [selectedIncomingBill, setSelectedIncomingBill] = useState<any>(null);
  const [bills, setBills] = useState<any[]>(initialBills || []);
  const [userId, setUserId] = useState<string>(session?.user?.id || '');

  const fetchBills = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id;
      if (uid) {
        setUserId(uid);
        api.getBills(uid).then(setBills).catch(console.error);
      } else {
        api.getBills().then(setBills).catch(console.error);
      }
    });
  };

  useEffect(() => {
    if (!initialBills) {
      fetchBills();
    }
  }, [initialBills]);

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

  // Pending items requiring attention
  const pendingBills = bills.filter(b => b.status === 'Pending');
  const pendingFriendRequests = friends.filter(f => f.isPendingRequest);

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-36 pt-0">
      
      {/* Top Header Container */}
      <div className="px-6 pt-10 pb-4 h-[88px] flex justify-between items-center max-w-[480px] mx-auto">
        <h1 className="text-black text-5xl font-bold font-display tracking-tight leading-none">Plates</h1>
        <div className="w-10 h-10 rounded-full bg-[#D9D9D9] flex items-center justify-center font-bold text-black text-sm shadow-sm">
          ME
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-5 flex flex-col gap-6">

        {/* 1. Net Balance Overview Card */}
        <div className="w-full bg-[#D9D9D9] rounded-[30px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-black/60 text-xs font-medium uppercase tracking-wider">Overall Balance</span>
              <span className="text-[#1A1A1A] text-3xl font-bold mt-1">
                LKR {Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              netBalance >= 0 ? 'bg-[#4C8C3C] text-white' : 'bg-[#F6D6DA] text-black'
            }`}>
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/10">
            {/* You are owed */}
            <div className="bg-[#EDEDF1]/70 rounded-[20px] p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#4C8C3C]">
                <ArrowDownLeft size={16} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70">Owed to you</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">LKR {totalYouAreOwed.toLocaleString()}</span>
            </div>

            {/* You owe */}
            <div className="bg-[#EDEDF1]/70 rounded-[20px] p-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-black">
                <ArrowUpRight size={16} strokeWidth={2.5} />
                <span className="text-xs font-medium text-black/70">You owe</span>
              </div>
              <span className="text-lg font-bold text-[#1A1A1A]">LKR {totalYouOwe.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 2. Quick Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => setIsNewBillModalOpen(true)}
            className="flex-1 bg-[#1A1A1A] text-[#EDEDF1] h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Split a Plate</span>
          </button>
          
          <button 
            onClick={onSearchClick}
            className="flex-1 bg-[#D9D9D9] text-[#1A1A1A] h-12 rounded-[25px] flex items-center justify-center gap-2 font-semibold text-sm shadow-sm active:scale-95 transition-transform cursor-pointer hover:bg-zinc-300"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span>Add Friend</span>
          </button>
        </div>

        {/* 3. Waiting on You Section */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[#1A1A1A] text-2xl font-bold font-display tracking-tight px-1">
            Waiting on You
          </h2>

          <div className="flex flex-col gap-3">
            {/* Bills needing settlement */}
            {bills.filter(b => {
              const myPart = (b.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
              const isCreator = b.creator_id === userId;
              const isPaid = isCreator || myPart?.paid === true;
              return !isPaid && b.status !== 'Settled';
            }).map(bill => (
              <div 
                key={`unsettled-${bill.id}`}
                onClick={() => setSelectedIncomingBill(bill)}
                className="w-full bg-[#D9D9D9] rounded-[25px] p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-zinc-300/80 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                  <span className="text-[#1A1A1A] text-base font-semibold truncate">{bill.title}</span>
                  <span className="text-black/60 text-xs font-normal">Pending split · LKR {bill.total}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#F5C744] text-black text-xs font-semibold px-4 py-1.5 rounded-full">
                    Settle
                  </span>
                  <ChevronRight size={18} className="text-black/40" />
                </div>
              </div>
            ))}

            {/* Pending Friend Requests */}
            {pendingFriendRequests.map(friend => (
              <div 
                key={friend.id}
                className="w-full bg-[#F6D6DA]/80 rounded-[25px] p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full opacity-60 shrink-0" 
                    style={{ backgroundColor: friend.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[#1A1A1A] text-sm font-semibold leading-tight">{friend.name}</span>
                    <span className="text-black/60 text-xs font-normal">Wants to follow you</span>
                  </div>
                </div>

                <button 
                  onClick={() => onApproveFriend?.(friend.id)}
                  className="bg-[#1A1A1A] text-[#EDEDF1] px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Accept</span>
                </button>
              </div>
            ))}

            {pendingFriendRequests.length === 0 && bills.filter(b => {
              const myPart = (b.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
              const isCreator = b.creator_id === userId;
              const isPaid = isCreator || myPart?.paid === true;
              return !isPaid && b.status !== 'Settled';
            }).length === 0 && (
              <div className="bg-[#D9D9D9]/50 rounded-[25px] p-6 text-center text-black/50 text-sm">
                All caught up! No pending bills or requests.
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Plates Horizontal Carousel */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <h2 className="text-[#1A1A1A] text-2xl font-bold font-display tracking-tight">
              Recent Plates
            </h2>
            <span className="text-xs font-medium text-black/40">Swipe →</span>
          </div>

          <div
            className="-mx-5 flex gap-3.5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory"
            style={{ paddingLeft: '20px' }}
          >
            {bills.map((bill) => {
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
                  className="w-[200px] h-[205px] shrink-0 bg-[#D9D9D9] rounded-[28px] flex flex-col justify-between shadow-sm snap-start cursor-pointer active:scale-[0.98] hover:bg-zinc-300/80 transition-all"
                  style={{ padding: '16px' }}
                >
                  <h3 className="text-[#1A1A1A] text-base font-bold leading-snug line-clamp-2">
                    {bill.title}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-black/50 text-xs font-normal">
                      {new Date(bill.createdAt || bill.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}
                    >
                      {bill.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-end border-t border-black/10 pt-2.5">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit ${
                          displayStatus === 'Settled' ? 'bg-[#4C8C3C] text-white' : 'bg-[#F5C744] text-black'
                        }`}
                      >
                        {displayStatus}
                      </span>
                      <span className="text-[#1A1A1A] text-base font-extrabold tracking-tight">
                        LKR {bill.total}
                      </span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {(bill.participants || []).slice(0, 3).map((p: any, i: number) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-[#EDEDF1] bg-black/20 flex items-center justify-center text-[9px] font-bold text-black shrink-0"
                        >
                          {(p.friend_id === userId || p.friendId === userId) ? 'Y' : 'P'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="shrink-0" style={{ width: '20px' }} />
          </div>
        </div>

      </div>

      {/* New Bill Modal */}
      <NewBillModal 
        isOpen={isNewBillModalOpen}
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
    </div>
  );
}
