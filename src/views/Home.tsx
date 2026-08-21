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
    <div className="w-full pb-20 md:pb-6 font-sans-app">
      
      {/* Top Header Container */}
      <div className="px-5 pt-6 pb-4 md:px-0 md:pt-0 md:pb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-[#1A1A1A]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-sans-app mt-1">
            Track your dining balances and split requests.
          </p>
        </div>

        {/* Mobile-only avatar */}
        <div className="md:hidden w-10 h-10 rounded-full bg-white border border-black/8 flex items-center justify-center font-bold text-[#1A1A1A] text-sm shadow-2xs">
          ME
        </div>
      </div>

      <div className="px-5 md:px-0 flex flex-col gap-6 md:gap-8">

        {/* Top Section Grid (Balance & Actions on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* 1. Net Balance Overview Card */}
          <div className="lg:col-span-2 w-full bg-white rounded-3xl p-6 shadow-2xs border border-black/8 flex flex-col justify-between gap-5">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Overall Balance</span>
                <span className="text-[#1A1A1A] text-3xl sm:text-4xl font-extrabold font-display mt-1">
                  LKR {Math.abs(netBalance).toLocaleString()}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                netBalance >= 0 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                  : 'bg-rose-50 text-rose-800 border-rose-200/60'
              }`}>
                {netBalance >= 0 ? 'You are owed' : 'You owe'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/5">
              {/* You are owed */}
              <div className="bg-[#FBFBFA] rounded-2xl p-3.5 sm:p-4 border border-black/5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <ArrowDownLeft size={16} strokeWidth={2.5} />
                  <span className="text-xs font-medium text-gray-600">Owed to you</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-[#1A1A1A]">LKR {totalYouAreOwed.toLocaleString()}</span>
              </div>

              {/* You owe */}
              <div className="bg-[#FBFBFA] rounded-2xl p-3.5 sm:p-4 border border-black/5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                  <span className="text-xs font-medium text-gray-600">You owe</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-[#1A1A1A]">LKR {totalYouOwe.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 2. Quick Actions Panel */}
          <div className="w-full bg-white rounded-3xl p-6 shadow-2xs border border-black/8 flex flex-col justify-between gap-4 h-full">
            <div>
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Quick Actions</span>
              <h3 className="text-lg font-bold font-display text-[#1A1A1A] mt-1">Split or Add</h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => setIsNewBillModalOpen(true)}
                className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Split a Plate</span>
              </button>
              
              <button 
                onClick={onSearchClick}
                className="w-full bg-white hover:bg-gray-50 text-[#1A1A1A] h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm border border-black/10 shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
              >
                <UserPlus size={18} strokeWidth={2.5} />
                <span>Add Friend</span>
              </button>
            </div>
          </div>

        </div>

        {/* 3. Waiting on You Section */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[#1A1A1A] text-xl sm:text-2xl font-bold font-display tracking-tight">
              Waiting on You
            </h2>
            <span className="text-xs text-gray-400 font-medium">Pending approvals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Bills pending acceptance (accepted === false) */}
            {bills.filter(b => {
              const isCreator = b.creator_id === userId;
              if (isCreator) return false;
              const myPart = (b.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
              return myPart && myPart.accepted === false;
            }).map(bill => (
              <div 
                key={`pending-accept-${bill.id}`}
                onClick={() => setSelectedIncomingBill(bill)}
                className="w-full bg-white border border-black/8 rounded-2xl p-4 flex items-center justify-between shadow-2xs cursor-pointer hover:border-amber-400/50 hover:bg-[#FDFDFB] transition-all"
              >
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                  <span className="text-[#1A1A1A] text-sm font-semibold truncate">{bill.title}</span>
                  <span className="text-gray-500 text-xs font-normal">Incoming split request · LKR {bill.total}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold px-3 py-1 rounded-full">
                    Review
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}

            {/* Pending Friend Requests */}
            {pendingFriendRequests.map(friend => (
              <div 
                key={friend.id}
                className="w-full bg-white border border-black/8 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs text-black border border-black/5" 
                    style={{ backgroundColor: friend.color }}
                  >
                    {friend.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#1A1A1A] text-sm font-semibold leading-tight">{friend.name}</span>
                    <span className="text-gray-400 text-xs font-normal">Friend request</span>
                  </div>
                </div>

                <button 
                  onClick={() => onApproveFriend?.(friend.id)}
                  className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Accept</span>
                </button>
              </div>
            ))}

            {pendingFriendRequests.length === 0 && bills.filter(b => {
              const isCreator = b.creator_id === userId;
              if (isCreator) return false;
              const myPart = (b.participants || []).find((p: any) => p.friend_id === userId || p.friendId === userId);
              return myPart && myPart.accepted === false;
            }).length === 0 && (
              <div className="md:col-span-2 bg-white border border-dashed border-black/10 rounded-2xl p-6 text-center text-gray-400 text-sm">
                ✨ All caught up! No pending requests.
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Plates Grid */}
        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between items-end">
            <h2 className="text-[#1A1A1A] text-xl sm:text-2xl font-bold font-display tracking-tight">
              Recent Plates
            </h2>
            <span className="text-xs font-medium text-gray-400">All activity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              const displayStatus = bill.status === 'Settled' ? 'Settled' : 'Pending';

              return (
                <div
                  key={`card-${bill.id}`}
                  onClick={() => onBillClick?.(bill.id)}
                  className="bg-white rounded-2xl p-4.5 border border-black/8 flex flex-col justify-between gap-4 shadow-2xs cursor-pointer hover:border-black/20 hover:shadow-xs transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-black/5">
                        {bill.category || 'General'}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {new Date(bill.createdAt || bill.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-[#1A1A1A] text-base font-bold leading-snug line-clamp-2">
                      {bill.title}
                    </h3>
                  </div>

                  <div className="flex justify-between items-end border-t border-black/5 pt-3">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-[10px] uppercase font-semibold">Total</span>
                      <span className="text-[#1A1A1A] text-base font-extrabold tracking-tight">
                        LKR {bill.total}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        displayStatus === 'Settled' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                          : 'bg-amber-50 text-amber-800 border-amber-200/60'
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                </div>
              );
            })}
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
