import React, { useState } from 'react';
import type { Friend } from '../types';
import { UserPlus, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface FriendsViewProps {
  friends: Friend[];
  onAddFriend: (name: string, username: string) => void;
  onAcceptRequest: (friendId: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  onAddFriend,
  onAcceptRequest,
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
    <div className="px-4 pb-28 pt-2">
      {/* Filter Tabs (Figma Node 25:61) */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-1.5 rounded-full text-base font-semibold transition-all font-['Sora'] ${
            activeFilter === 'all'
              ? 'bg-[#1a1a1a] text-[#ededf1] shadow-sm'
              : 'bg-[#d9d9d9] text-black hover:bg-[#cfcfd4]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-5 py-1.5 rounded-full text-base font-semibold transition-all flex items-center gap-1.5 font-['Sora'] ${
            activeFilter === 'pending'
              ? 'bg-[#1a1a1a] text-[#ededf1] shadow-sm'
              : 'bg-[#d9d9d9] text-black hover:bg-[#cfcfd4]'
          }`}
        >
          <span>Pending</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {displayedFriends.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No friends found in this section.</p>
          </div>
        ) : (
          displayedFriends.map((friend) => (
            <div
              key={friend.id}
              className="bg-[#d9d9d9] rounded-[28px] p-4 flex items-center justify-between shadow-sm border border-black/5 hover:bg-[#d0d0d5] transition-all"
            >
              <div className="flex items-center gap-3">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/80 shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-base text-[#1a1a1a] font-['Sora']">{friend.name}</h4>
                  <p className="text-xs text-gray-600">{friend.username}</p>
                </div>
              </div>

              {friend.isPendingRequest ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAcceptRequest(friend.id)}
                    className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-right">
                  {friend.balance === 0 ? (
                    <span className="text-xs font-semibold text-gray-600 bg-black/5 px-3 py-1 rounded-full">
                      Settled
                    </span>
                  ) : friend.balance > 0 ? (
                    <div className="text-emerald-700 font-bold text-sm flex items-center gap-1 font-['Sora']">
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>+LKR {friend.balance}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 font-bold text-sm flex items-center gap-1 font-['Sora']">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>-LKR {Math.abs(friend.balance)}</span>
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
        className="fixed bottom-24 right-5 sm:right-[calc(50%-180px)] w-16 h-16 rounded-full bg-[#1a1a1a] hover:bg-black active:scale-90 transition-all shadow-xl flex items-center justify-center text-white z-30 border border-white/10"
        aria-label="Add Friend"
      >
        <UserPlus className="w-7 h-7" />
      </button>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[360px] bg-[#1a1a1a] text-white rounded-[28px] p-6 shadow-2xl relative border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold font-['Sora']">Add New Friend</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="e.g. Ruwan Wickrama"
                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Username / Handle</label>
                <input
                  type="text"
                  value={newFriendHandle}
                  onChange={(e) => setNewFriendHandle(e.target.value)}
                  placeholder="@ruwan_w"
                  className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#f5c744] text-black py-3 rounded-full font-bold text-sm hover:bg-yellow-400 transition-colors"
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
