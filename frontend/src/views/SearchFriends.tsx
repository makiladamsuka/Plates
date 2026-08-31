import { useState, useEffect } from 'react';
import { Search, ChevronLeft, UserPlus, Check, Users, Share2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchGoogleContacts, type GoogleContact } from '../services/googleContacts';

interface SearchFriendsProps {
  session: any;
  onBack: () => void;
}

interface MatchedContact extends GoogleContact {
  plateProfile?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
}

export function SearchFriends({ session, onBack }: SearchFriendsProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'google'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Google Contacts State
  const [googleContacts, setGoogleContacts] = useState<MatchedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

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
      const cleanQ = query.replace(/^@/, '').trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .or(`full_name.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%`)
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

  const handleImportGoogleContacts = async () => {
    setIsLoadingContacts(true);
    setContactsError(null);

    const token = sessionStorage.getItem('google_provider_token');

    if (!token) {
      setIsLoadingContacts(false);
      setContactsError('Google access token not found. Please connect your Google account to grant contacts access.');
      return;
    }

    try {
      const contacts = await fetchGoogleContacts(token);

      // Extract all non-empty emails to match with existing Plates profiles
      const emails = contacts
        .map(c => c.email)
        .filter((e): e is string => !!e);

      let profilesMap: Record<string, any> = {};

      if (emails.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, email')
          .in('email', emails)
          .neq('id', session.user.id);

        (profiles || []).forEach(p => {
          if (p.email) {
            profilesMap[p.email.toLowerCase()] = p;
          }
        });
      }

      const matched: MatchedContact[] = contacts.map(c => ({
        ...c,
        plateProfile: c.email ? profilesMap[c.email.toLowerCase()] || null : null,
      }));

      // Sort so contacts already on Plates show first
      matched.sort((a, b) => (b.plateProfile ? 1 : 0) - (a.plateProfile ? 1 : 0));

      setGoogleContacts(matched);
    } catch (err: any) {
      console.error('Error importing Google contacts:', err);
      setContactsError(err.message || 'Failed to load Google Contacts.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleConnectGoogleOAuth = async () => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'https://www.googleapis.com/auth/contacts.readonly',
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      });
    } catch (err: any) {
      console.error('Error initiating Google OAuth:', err);
      alert('Failed to connect Google account.');
    }
  };

  const handleInviteContact = async (contact: GoogleContact) => {
    const inviteUrl = window.location.origin;
    const inviteText = `Hey ${contact.name.split(' ')[0]}! Join me on Plates to split and settle bills easily: ${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Plates',
          text: inviteText,
          url: inviteUrl,
        });
        return;
      } catch {}
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopiedInvite(contact.email || contact.name);
      setTimeout(() => setCopiedInvite(null), 2500);
    } catch {
      alert('Invite link: ' + inviteUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-36 relative transition-colors font-['Sora']">
      
      {/* Top Header */}
      <div className="px-6 pt-6 pb-2">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center -ml-2 mb-3 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft size={30} strokeWidth={2.5} className="text-[#1A1A1A] dark:text-zinc-100" />
        </button>

        {/* Tab Toggle: Username Search vs Google Contacts */}
        <div className="flex bg-[#D9D9D9]/70 dark:bg-zinc-900/70 p-1 rounded-[25px] mb-3 border border-transparent dark:border-white/5">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 rounded-[20px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#1A1A1A] text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Search size={14} />
            <span>Search Plates</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('google');
              if (googleContacts.length === 0 && !isLoadingContacts) {
                handleImportGoogleContacts();
              }
            }}
            className={`flex-1 py-1.5 rounded-[20px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'google'
                ? 'bg-[#1A1A1A] text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Users size={14} />
            <span>Google Contacts</span>
          </button>
        </div>

        {/* Search Bar (Search Mode) */}
        {activeTab === 'search' && (
          <div className="w-full flex items-center bg-[#D9D9D9]/80 dark:bg-zinc-900/80 rounded-[30px] px-4 py-2.5 shadow-sm border border-transparent dark:border-white/5">
            <Search size={20} strokeWidth={2.5} className="text-black/60 dark:text-zinc-400 mr-3 shrink-0" />
            <input 
              type="text"
              placeholder="Search by name or @username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="bg-transparent text-[#1A1A1A] dark:text-zinc-100 placeholder:text-black/50 dark:placeholder:text-zinc-500 text-[15px] font-light outline-none w-full"
            />
          </div>
        )}
      </div>

      {/* Mode 1: Plates User Search Results */}
      {activeTab === 'search' && (
        <div className="px-6 mt-4 flex flex-col gap-3">
          {isSearching ? (
            <div className="text-center py-12 text-black/40 dark:text-zinc-500 text-sm font-light">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => {
              const isSent = addedIds.includes(user.id);
              return (
                <div 
                  key={user.id}
                  className="w-full h-[54px] px-2 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-[39px] h-[39px] rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-[39px] h-[39px] rounded-full bg-[#D9D9D9] dark:bg-zinc-800 opacity-40 shrink-0" />
                    )}
                    <div className="flex flex-col truncate">
                      <span className="text-[#1A1A1A] dark:text-zinc-100 text-[13px] font-semibold leading-tight truncate">
                        {user.full_name}
                      </span>
                      <span className="text-black/60 dark:text-zinc-400 text-[11px] font-light leading-tight mt-0.5 truncate">
                        {user.username ? `@${user.username}` : ''}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => !isSent && handleSendRequest(user.id)}
                    title={isSent ? "Request Sent" : "Send Friend Request"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isSent 
                        ? 'bg-[#4C8C3C] text-white cursor-default' 
                        : 'bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950 active:scale-95'
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
            <div className="text-center py-12 text-black/40 dark:text-zinc-500 text-sm font-light">
              No people found matching "{searchQuery}"
            </div>
          ) : (
            <div className="text-center py-12 text-black/40 dark:text-zinc-500 text-sm font-light">
              Type a name or @username to search
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Google Contacts Results */}
      {activeTab === 'google' && (
        <div className="px-6 mt-2 flex flex-col gap-3">
          {isLoadingContacts ? (
            <div className="flex flex-col items-center justify-center py-16 text-black/50 dark:text-zinc-400 text-sm gap-3">
              <RefreshCw size={24} className="animate-spin text-[#F5C744]" />
              <span>Fetching your Google Contacts...</span>
            </div>
          ) : contactsError ? (
            <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-[25px] p-5 flex flex-col items-center text-center gap-3 mt-4">
              <AlertCircle size={28} className="text-amber-500" />
              <p className="text-black/80 dark:text-zinc-200 text-xs font-normal max-w-[280px]">
                {contactsError}
              </p>
              <button
                onClick={handleConnectGoogleOAuth}
                className="px-5 py-2 rounded-full bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer active:scale-95 transition-transform shadow-sm"
              >
                Connect Google Account
              </button>
            </div>
          ) : googleContacts.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-black/50 dark:text-zinc-400 text-xs font-semibold">
                  {googleContacts.length} Contacts Found
                </span>
                <button
                  onClick={handleImportGoogleContacts}
                  className="text-xs text-[#4C8C3C] dark:text-[#5FAD4B] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <RefreshCw size={11} />
                  <span>Refresh</span>
                </button>
              </div>

              {googleContacts.map((contact, idx) => {
                const isRegistered = !!contact.plateProfile;
                const registeredId = contact.plateProfile?.id;
                const isSent = registeredId ? addedIds.includes(registeredId) : false;

                return (
                  <div 
                    key={contact.resourceName || idx}
                    className="w-full bg-[#D9D9D9]/70 dark:bg-zinc-900/70 rounded-[20px] p-3 flex items-center justify-between border border-transparent dark:border-white/5 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {contact.photoUrl || contact.plateProfile?.avatar_url ? (
                        <img 
                          src={contact.plateProfile?.avatar_url || contact.photoUrl || ''} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/10 dark:bg-white/10 flex items-center justify-center font-bold text-xs text-black dark:text-white shrink-0">
                          {(contact.name || 'C')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#1A1A1A] dark:text-zinc-100 text-xs font-semibold leading-tight truncate">
                            {contact.name}
                          </span>
                          {isRegistered && (
                            <span className="bg-[#4C8C3C]/15 text-[#4C8C3C] dark:text-[#5FAD4B] text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                              On Plates
                            </span>
                          )}
                        </div>
                        <span className="text-black/60 dark:text-zinc-400 text-[10px] font-light truncate mt-0.5">
                          {contact.plateProfile?.username 
                            ? `@${contact.plateProfile.username}` 
                            : contact.email || contact.phoneNumber || 'Contact'}
                        </span>
                      </div>
                    </div>

                    {isRegistered && registeredId ? (
                      <button 
                        onClick={() => !isSent && handleSendRequest(registeredId)}
                        title={isSent ? "Request Sent" : "Add Friend"}
                        className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                          isSent 
                            ? 'bg-[#4C8C3C] text-white cursor-default' 
                            : 'bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 active:scale-95 shadow-xs'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check size={13} strokeWidth={2.5} />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={13} strokeWidth={2.2} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleInviteContact(contact)}
                        title="Invite to Plates"
                        className="h-8 px-3 rounded-full border border-black/20 dark:border-white/20 text-[#1A1A1A] dark:text-zinc-100 text-xs font-medium flex items-center gap-1 shrink-0 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Share2 size={12} />
                        <span>{copiedInvite === (contact.email || contact.name) ? 'Copied!' : 'Invite'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#D9D9D9]/50 dark:bg-zinc-900/50 rounded-[25px] p-6 text-center flex flex-col items-center gap-3 mt-4">
              <Users size={32} className="text-black/40 dark:text-zinc-600" />
              <div className="text-black/80 dark:text-zinc-200 text-sm font-semibold">
                Import from Google Contacts
              </div>
              <p className="text-black/50 dark:text-zinc-400 text-xs max-w-[260px]">
                Find friends who are already on Plates or invite your Google Contacts to split plates.
              </p>
              <button
                onClick={handleImportGoogleContacts}
                className="px-5 py-2.5 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-transform mt-2 shadow-sm"
              >
                Import Contacts
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

