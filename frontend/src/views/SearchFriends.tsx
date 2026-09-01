import { useState, useEffect } from 'react';
import { Search, ChevronLeft, UserPlus, Check, Smartphone, Share2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getDevicePhoneContacts, isDeviceContactsSupported, type CleanContact } from '../services/deviceContacts';

interface SearchFriendsProps {
  session: any;
  onBack: () => void;
}

interface MatchedContact extends CleanContact {
  plateProfile?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  } | null;
}

export function SearchFriends({ session, onBack }: SearchFriendsProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'phone'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Phone Contacts State
  const [phoneContacts, setPhoneContacts] = useState<MatchedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  const isPickerSupported = isDeviceContactsSupported();

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

  const handlePickPhoneContacts = async () => {
    setIsLoadingContacts(true);
    setContactsError(null);

    try {
      const contacts = await getDevicePhoneContacts();
      if (contacts.length === 0) {
        setIsLoadingContacts(false);
        return;
      }

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

      setPhoneContacts(prev => {
        const existingIds = new Set(prev.map(p => `${p.name}-${p.phoneNumber || p.email}`));
        const newUnique = matched.filter(m => !existingIds.has(`${m.name}-${m.phoneNumber || m.email}`));
        return [...newUnique, ...prev];
      });
    } catch (err: any) {
      console.error('Error picking phone contacts:', err);
      setContactsError(err.message || 'Failed to select contacts from device.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleInviteContact = async (contact: CleanContact) => {
    const inviteUrl = window.location.origin;
    const inviteText = `Hey ${contact.name.split(' ')[0]}! Join me on Plates to split and settle bills easily: ${inviteUrl}`;

    // 1. Try SMS if phone number exists
    if (contact.phoneNumber) {
      const cleanPhone = contact.phoneNumber.replace(/[^\d+]/g, '');
      const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(inviteText)}`;
      window.open(smsUrl, '_blank');
      return;
    }

    // 2. Try Web Share API
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

    // 3. Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopiedInvite(contact.phoneNumber || contact.email || contact.name);
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

        {/* Tab Toggle: Username Search vs Phone Contacts */}
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
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-1.5 rounded-[20px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-[#1A1A1A] text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'text-black/60 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Phone Contacts</span>
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

      {/* Mode 2: Phone / Device Contacts Results */}
      {activeTab === 'phone' && (
        <div className="px-6 mt-2 flex flex-col gap-3">
          {isLoadingContacts ? (
            <div className="flex flex-col items-center justify-center py-16 text-black/50 dark:text-zinc-400 text-sm gap-3">
              <RefreshCw size={24} className="animate-spin text-[#F5C744]" />
              <span>Opening contacts picker...</span>
            </div>
          ) : contactsError ? (
            <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-[25px] p-5 flex flex-col items-center text-center gap-3 mt-4">
              <AlertCircle size={28} className="text-amber-500" />
              <p className="text-black/80 dark:text-zinc-200 text-xs font-normal max-w-[280px]">
                {contactsError}
              </p>
              {isPickerSupported && (
                <button
                  onClick={handlePickPhoneContacts}
                  className="px-5 py-2 rounded-full bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer active:scale-95 transition-transform shadow-sm"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : phoneContacts.length > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-black/50 dark:text-zinc-400 text-xs font-semibold">
                  {phoneContacts.length} Contacts Selected
                </span>
                <button
                  onClick={handlePickPhoneContacts}
                  className="text-xs text-[#4C8C3C] dark:text-[#5FAD4B] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <UserPlus size={12} />
                  <span>Pick More</span>
                </button>
              </div>

              {phoneContacts.map((contact) => {
                const isRegistered = !!contact.plateProfile;
                const registeredId = contact.plateProfile?.id;
                const isSent = registeredId ? addedIds.includes(registeredId) : false;

                return (
                  <div 
                    key={contact.id}
                    className="w-full bg-[#D9D9D9]/70 dark:bg-zinc-900/70 rounded-[20px] p-3 flex items-center justify-between border border-transparent dark:border-white/5 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {contact.avatarUrl || contact.plateProfile?.avatar_url ? (
                        <img 
                          src={contact.plateProfile?.avatar_url || contact.avatarUrl || ''} 
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
                            : contact.phoneNumber || contact.email || 'Contact'}
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
                        <span>{copiedInvite === (contact.phoneNumber || contact.email || contact.name) ? 'Copied!' : 'Invite'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#D9D9D9]/50 dark:bg-zinc-900/50 rounded-[25px] p-6 text-center flex flex-col items-center gap-3 mt-4">
              <Smartphone size={32} className="text-black/40 dark:text-zinc-600" />
              <div className="text-black/80 dark:text-zinc-200 text-sm font-semibold">
                Access Phone Contacts
              </div>
              <p className="text-black/50 dark:text-zinc-400 text-xs max-w-[260px]">
                {isPickerSupported 
                  ? 'Pick contacts directly from your device to find friends or invite them to split bills.'
                  : 'Device Contacts Picker is supported on mobile browsers (Chrome / Edge on Android). You can also search by @username directly!'}
              </p>
              
              {isPickerSupported ? (
                <button
                  onClick={handlePickPhoneContacts}
                  className="px-5 py-2.5 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-transform mt-2 shadow-sm"
                >
                  Pick Contacts from Device
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-5 py-2.5 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition-transform mt-2 shadow-sm"
                >
                  Search by @Username
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
