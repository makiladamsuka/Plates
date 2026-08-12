import React, { useState } from 'react';
import type { Friend } from '../types';
import { UserPlus, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FriendsViewProps {
  friends: Friend[];
  onAddFriend: (name: string, username: string) => void;
  onAcceptRequest: (friendId: string) => void;
  isDark?: boolean;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  onAddFriend,
  onAcceptRequest,
  isDark = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendHandle, setNewFriendHandle] = useState('');

  const activeFriends = friends.filter((f) => !f.isPendingRequest);
  const pendingRequests = friends.filter((f) => f.isPendingRequest);

  const displayedFriends = activeFilter === 'all' ? activeFriends : pendingRequests;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName) return;
    onAddFriend(newFriendName, newFriendHandle || `@${newFriendName.toLowerCase().replace(/\s+/g, '')}`);
    setNewFriendName('');
    setNewFriendHandle('');
    setShowAddModal(false);
  };

  return (
    <div className="px-4 pb-24 pt-2">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all font-['Sora'] ${
            activeFilter === 'all'
              ? isDark
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-[#0f1015] text-white font-bold shadow-sm'
              : isDark
                ? 'bg-[#16171e] text-neutral-400 hover:text-white border border-white/[0.08]'
                : 'bg-white text-neutral-700 hover:text-black border border-black/[0.08] shadow-sm'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 font-['Sora'] ${
            activeFilter === 'pending'
              ? isDark
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-[#0f1015] text-white font-bold shadow-sm'
              : isDark
                ? 'bg-[#16171e] text-neutral-400 hover:text-white border border-white/[0.08]'
                : 'bg-white text-neutral-700 hover:text-black border border-black/[0.08] shadow-sm'
          }`}
        >
          <span>Pending</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#f5c744] text-black text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Friends List */}
      <div className="space-y-2">
        {displayedFriends.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <p className="text-xs">No friends found in this section.</p>
          </div>
        ) : (
          displayedFriends.map((friend) => (
            <div
              key={friend.id}
              className={`rounded-2xl p-3 flex items-center justify-between shadow-sm border transition-all ${
                isDark
                  ? 'bg-[#14151b] border-white/[0.07] hover:bg-[#191b23]'
                  : 'bg-white border-black/[0.08] hover:bg-[#f9f9fc]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/20"
                />
                <div>
                  <h4 className={`font-semibold text-xs font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
                    {friend.name}
                  </h4>
                  <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{friend.username}</p>
                </div>
              </div>

              {friend.isPendingRequest ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAcceptRequest(friend.id)}
                    className="p-1.5 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-full hover:bg-emerald-500/30 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button className={`p-1.5 rounded-full transition-colors ${
                    isDark ? 'bg-white/10 text-neutral-400 hover:bg-white/20' : 'bg-black/5 text-neutral-500 hover:bg-black/10'
                  }`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-right">
                  {friend.balance === 0 ? (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isDark ? 'text-neutral-400 bg-white/5 border-white/5' : 'text-neutral-500 bg-neutral-100 border-black/5'
                    }`}>
                      Settled
                    </span>
                  ) : friend.balance > 0 ? (
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-0.5 font-['Sora']">
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>+LKR {friend.balance.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-0.5 font-['Sora']">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>-LKR {Math.abs(friend.balance).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Friend Floating Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className={`fixed bottom-20 right-5 sm:right-[calc(50%-180px)] w-12 h-12 rounded-full active:scale-95 transition-all shadow-xl flex items-center justify-center z-30 border ${
          isDark
            ? 'bg-[#14151b] hover:bg-[#1a1c24] text-white border-white/20'
            : 'bg-black hover:bg-neutral-800 text-white border-black/20'
        }`}
        aria-label="Add Friend"
      >
        <UserPlus className="w-5 h-5" />
      </button>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className={`w-full max-w-[360px] rounded-2xl p-5 shadow-2xl relative border ${
            isDark ? 'bg-[#14151b] text-white border-white/10' : 'bg-white text-black border-black/10'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold font-['Sora']">Add New Friend</h3>
              <button onClick={() => setShowAddModal(false)} className={isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="e.g. Ruwan Wickrama"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f5c744] ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-neutral-100 border-black/10 text-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Username / Handle</label>
                <input
                  type="text"
                  value={newFriendHandle}
                  onChange={(e) => setNewFriendHandle(e.target.value)}
                  placeholder="@ruwan_w"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#f5c744] ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-neutral-100 border-black/10 text-black'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-1 bg-[#f5c744] text-black py-2.5 rounded-full font-bold text-xs hover:bg-yellow-400 transition-colors"
              >
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


