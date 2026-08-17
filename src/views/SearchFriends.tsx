import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, UserPlus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchFriendsProps {
  session: any;
  onBack: () => void;
}

export function SearchFriends({ session, onBack }: SearchFriendsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) {
          setAddedIds(data.map(d => d.friend_id));
        }
      });
  }, [session]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .neq('id', session.user.id)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching profiles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: session.user.id,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) {
        if (error.code === '23505') {
          alert('Request already sent!');
        } else {
          throw error;
        }
      }
      setAddedIds(prev => [...prev, friendId]);
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Failed to send request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] pb-36 relative">
      
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-4 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft size={30} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </button>

        {/* Search Bar matching Figma */}
        <div className="w-full flex items-center bg-[#D9D9D9]/80 rounded-[30px] px-4 py-2.5 shadow-sm">
          <Search size={20} strokeWidth={2.5} className="text-black/60 mr-3 shrink-0" />
          <input 
            type="text"
            placeholder="Search People"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="bg-transparent text-[#1A1A1A] placeholder:text-black/50 text-[15px] font-light outline-none w-full"
          />
        </div>
      </div>

      {/* User Results List */}
      <div className="px-6 mt-4 flex flex-col gap-3">
        {isSearching ? (
          <div className="text-center py-12 text-black/40 text-sm font-light">Searching...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => {
            const isSent = addedIds.includes(user.id);
            return (
              <div 
                key={user.id}
                className="w-full h-[54px] px-2 flex items-center justify-between transition-colors"
              >
                {/* User Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-[39px] h-[39px] rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-[39px] h-[39px] rounded-full bg-[#D9D9D9] opacity-40 shrink-0" />
                  )}
                  <div className="flex flex-col truncate">
                    <span className="text-[#1A1A1A] text-[13px] font-semibold leading-tight truncate">
                      {user.full_name}
                    </span>
                    <span className="text-black text-[11px] font-light leading-tight mt-0.5 truncate">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => !isSent && handleSendRequest(user.id)}
                  title={isSent ? "Request Sent" : "Send Friend Request"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    isSent 
                      ? 'bg-[#4C8C3C] text-white cursor-default' 
                      : 'bg-[#1A1A1A] text-[#EDEDF1] active:scale-95'
                  }`}
                >
                  {isSent ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    <UserPlus size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            );
          })
        ) : searchQuery.length >= 1 ? (
          <div className="text-center py-12 text-black/40 text-sm font-light">
            No people found matching "{searchQuery}"
          </div>
        ) : (
          <div className="text-center py-12 text-black/40 text-sm font-light">
            Type a name or email to search
          </div>
        )}
      </div>

    </div>
  );
}
