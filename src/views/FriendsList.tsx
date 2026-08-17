import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Check, X, UserPlus } from 'lucide-react';
import { IncomingFriendRequestModal } from '../components/IncomingFriendRequestModal';
import type { Friend } from '../data/mockData';

interface FriendsListProps {
  friendsList: Friend[];
  onApproveRequest: (friendId: string) => void;
  onDeclineRequest: (friendId: string) => void;
  onFriendClick?: (friendId: string) => void;
  onSearchClick?: () => void;
}

export function FriendsList({
  friendsList,
  onApproveRequest,
  onDeclineRequest,
  onFriendClick,
  onSearchClick,
}: FriendsListProps) {
  const [showHeader, setShowHeader] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [incomingFriend, setIncomingFriend] = useState<Friend | null>(null);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 40) setShowHeader(false);
      else if (y < lastScrollY.current) setShowHeader(true);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const friends = friendsList
    .filter(f => f.id !== 'me')
    .filter(f => activeTab === 'pending' ? f.isPendingRequest : !f.isPendingRequest);

  const pendingCount = friendsList.filter(f => f.id !== 'me' && f.isPendingRequest).length;

  const handleApprove = (id: string) => { onApproveRequest(id); setIncomingFriend(null); };
  const handleDecline = (id: string) => { onDeclineRequest(id); setIncomingFriend(null); };

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-40 pt-[128px] font-['Sora']">

      {/* ── Sticky Header ── */}
      <div
        className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30
                    bg-[#EDEDF1] transition-transform duration-300 ease-out
                    ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="px-5 pt-8 pb-3">
          <h1 className="text-[28px] font-bold tracking-tight text-[#1A1A1A] leading-none">
            Friends
          </h1>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3 flex gap-2">
          {[
            { key: 'all' as const, label: 'All' },
            { key: 'pending' as const, label: `Pending${pendingCount > 0 ? ` · ${pendingCount}` : ''}` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`h-7 px-4 rounded-full text-[13px] font-semibold
                          transition-all duration-200 cursor-pointer
                          ${activeTab === t.key
                            ? 'bg-[#1A1A1A] text-[#EDEDF1]'
                            : 'bg-[#D9D9D9] text-[#1A1A1A]/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="h-px bg-[#1A1A1A]/5 mx-5" />
      </div>

      {/* ── Friend rows ── */}
      <div className="max-w-[480px] mx-auto px-4">
        {friends.length === 0 ? (
          <div className="text-center mt-16 text-[13px] text-[#1A1A1A]/40">
            {activeTab === 'pending' ? 'No pending requests.' : 'No friends yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-[22px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.07)]">
            {friends.map((friend, i) => {
              const isLast = i === friends.length - 1;
              return (
                <div key={friend.id}>
                  <div
                    onClick={() => {
                      if (activeTab === 'pending') setIncomingFriend(friend);
                      else onFriendClick?.(friend.id);
                    }}
                    className="flex items-center px-4 py-3.5 gap-3 cursor-pointer
                               active:bg-[#1A1A1A]/[0.03] transition-colors duration-100"
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full shrink-0 opacity-60"
                      style={{ backgroundColor: friend.color }}
                    />

                    {/* Name + username */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[15px] font-semibold text-[#1A1A1A] leading-tight truncate">
                        {friend.name}
                      </span>
                      <span className="text-[12px] text-[#1A1A1A]/45 mt-0.5 truncate">
                        {friend.username}
                      </span>
                    </div>

                    {/* Right side */}
                    {activeTab === 'pending' ? (
                      <div
                        className="flex items-center gap-2.5 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setIncomingFriend(friend)}
                          className="w-8 h-8 rounded-full bg-[#4C8C3C]/10 flex items-center
                                     justify-center active:scale-95 transition-transform cursor-pointer"
                        >
                          <Check size={15} strokeWidth={2.5} className="text-[#2D6A4F]" />
                        </button>
                        <button
                          onClick={() => handleDecline(friend.id)}
                          className="w-8 h-8 rounded-full bg-[#F6D6DA]/60 flex items-center
                                     justify-center active:scale-95 transition-transform cursor-pointer"
                        >
                          <X size={14} strokeWidth={2.5} className="text-[#7C3040]" />
                        </button>
                      </div>
                    ) : friend.balance !== 0 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {friend.balance > 0 ? (
                          <ArrowDownLeft size={16} strokeWidth={2.5} className="text-[#2D6A4F]" />
                        ) : (
                          <ArrowUpRight size={16} strokeWidth={2.5} className="text-[#7C3040]" />
                        )}
                        <span
                          className={`text-[14px] font-semibold tabular-nums
                                      ${friend.balance > 0 ? 'text-[#2D6A4F]' : 'text-[#7C3040]'}`}
                        >
                          {Math.abs(friend.balance).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#1A1A1A]/25 italic">settled</span>
                    )}
                  </div>
                  {!isLast && <div className="h-px bg-[#1A1A1A]/5 ml-[68px] mr-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-[108px] right-0 w-full z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-[480px] relative h-0">
          <button
            onClick={onSearchClick}
            className="absolute right-5 -top-14 w-14 h-14 bg-[#1A1A1A] rounded-full
                       flex items-center justify-center shadow-xl pointer-events-auto
                       active:scale-95 transition-transform duration-150 cursor-pointer"
          >
            <UserPlus size={20} strokeWidth={2} className="text-[#EDEDF1]" />
          </button>
        </div>
      </div>

      <IncomingFriendRequestModal
        isOpen={!!incomingFriend}
        onClose={() => setIncomingFriend(null)}
        onApprove={() => incomingFriend && handleApprove(incomingFriend.id)}
        friend={incomingFriend || undefined}
      />
    </div>
  );
}
