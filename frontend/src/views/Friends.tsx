import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FriendsProps {
  session: any;
}

export function Friends({ session }: FriendsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, [session]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles:friend_id (
            id,
            full_name,
            avatar_url,
            username
          )
        `)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      setFriends(data.map(d => d.profiles) || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const cleanQ = query.replace(/^@/, '').trim();
      // Search profiles where name or username matches, excluding the current user
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .or(`full_name.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%`)
        .limit(10);
      
      if (error) {
        console.error('Supabase Search Error:', error);
        setSearchError(error.message);
        throw error;
      }
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching profiles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: session.user.id,
          friend_id: friendId
        });
      
      if (error) throw error;
      fetchFriends();
    } catch (err) {
      console.error('Error adding friend:', err);
      alert('Failed to add friend');
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(f => f?.id === userId);
  };

  return (
    <div className="p-6 max-w-lg mx-auto pb-24">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or @username..." 
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-white rounded-[25px] pl-12 pr-4 py-3 text-sm font-['Sora'] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C8C3C]"
        />
      </div>

      {searchError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-[20px] mb-6 text-sm font-['Sora']">
          {searchError}
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-8">
          <h2 className="text-gray-500 text-sm font-semibold font-['Sora'] mb-4 uppercase tracking-wider">Search Results</h2>
          <div className="bg-white rounded-[25px] shadow-sm overflow-hidden">
            {isSearching ? (
              <div className="p-6 text-center text-gray-400 font-['Sora']">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {searchResults.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-[16px] object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-[16px] flex items-center justify-center shrink-0">
                          <span className="text-black font-semibold text-lg">{user.full_name?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-black font-semibold font-['Sora'] truncate">{user.full_name}</p>
                        <p className="text-gray-400 text-xs font-['Sora'] truncate">{user.username ? `@${user.username}` : ''}</p>
                      </div>
                    </div>
                    {isAlreadyFriend(user.id) ? (
                      <button disabled className="ml-3 p-2 rounded-full bg-gray-100 text-gray-400 shrink-0">
                        <Check size={20} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddFriend(user.id)}
                        className="ml-3 p-2 rounded-full bg-[#4C8C3C]/10 text-[#4C8C3C] hover:bg-[#4C8C3C] hover:text-white transition-colors shrink-0"
                      >
                        <UserPlus size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 font-['Sora']">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* My Friends List */}
      <div>
        <h2 className="text-gray-500 text-sm font-semibold font-['Sora'] mb-4 uppercase tracking-wider">My Friends</h2>
        {isLoading ? (
          <div className="text-center text-gray-400 font-['Sora'] py-8">Loading friends...</div>
        ) : friends.length > 0 ? (
          <div className="flex flex-col gap-3">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-[25px] p-4 flex items-center gap-4 shadow-sm">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt="" className="w-14 h-14 rounded-[18px] object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-[18px] flex items-center justify-center">
                    <span className="text-gray-500 font-semibold text-xl">{friend.full_name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div>
                  <p className="text-black font-semibold font-['Sora'] text-lg">{friend.full_name}</p>
                  <p className="text-gray-400 text-sm font-['Sora']">{friend.username ? `@${friend.username}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[25px] p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-['Sora']">You haven't added any friends yet.</p>
            <p className="text-gray-400 text-sm font-['Sora'] mt-1">Search above to get started.</p>
          </div>
        )}
      </div>

    </div>
  );
}
