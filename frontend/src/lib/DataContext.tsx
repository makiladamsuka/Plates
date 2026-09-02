import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { api } from '../services/api';

interface DataContextType {
  bills: any[];
  setBills: React.Dispatch<React.SetStateAction<any[]>>;
  friends: any[];
  setFriends: React.Dispatch<React.SetStateAction<any[]>>;
  pendingFriendRequests: any[];
  setPendingFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  fetchBills: (uid?: string) => Promise<void>;
  fetchFriends: (uid?: string) => Promise<void>;
  fetchPendingFriends: (uid?: string) => Promise<void>;
  refreshAll: (uid?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: ReactNode }) {
  // 1. Initial State hydrated synchronously from localStorage cache
  const [bills, setBillsState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('plates_cached_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [friends, setFriendsState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('plates_cached_friends');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pendingFriendRequests, setPendingFriendRequestsState] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('plates_cached_pending_friends');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userId, setUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('plates_cached_uid');
      return saved || '';
    } catch {
      return '';
    }
  });

  // State setters that automatically update localStorage cache
  const setBills: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    setBillsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_bills', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setFriends: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    setFriendsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_friends', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setPendingFriendRequests: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    setPendingFriendRequestsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_pending_friends', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const getActiveUserId = async (): Promise<string> => {
    if (userId) return userId;
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id || '';
    if (uid && uid !== userId) {
      setUserId(uid);
      try {
        localStorage.setItem('plates_cached_uid', uid);
      } catch {}
    }
    return uid;
  };

  const fetchBills = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;
    
    try {
      const data = await api.getBills(uid);
      if (data && Array.isArray(data)) {
        setBills(data);
        return;
      }
    } catch (e) {
      console.warn('API getBills failed, falling back to direct Supabase:', e);
    }

    try {
      const { data: rawBills } = await supabase
        .from('bills')
        .select('*, participants(*)');

      if (rawBills) {
        const myBills = rawBills.filter((b: any) => {
          if (!uid) return true;
          const isCreator = b.creator_id === uid;
          const isParticipant = (b.participants || []).some((p: any) => p.friend_id === uid || p.friendId === uid);
          return isCreator || isParticipant;
        });

        const allFriendIds = new Set<string>();
        myBills.forEach((b: any) => {
          if (b.creator_id) allFriendIds.add(b.creator_id);
          (b.participants || []).forEach((p: any) => {
            if (p.friend_id) allFriendIds.add(p.friend_id);
          });
        });

        let profilesMap: Record<string, any> = {};
        if (allFriendIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', Array.from(allFriendIds));

          (profiles || []).forEach((prof: any) => {
            profilesMap[prof.id] = prof;
          });
        }

        const enriched = myBills.map((b: any) => ({
          ...b,
          participants: (b.participants || []).map((p: any) => ({
            ...p,
            profile: profilesMap[p.friend_id] || null,
            full_name: profilesMap[p.friend_id]?.full_name || null,
            avatar_url: profilesMap[p.friend_id]?.avatar_url || null,
            username: profilesMap[p.friend_id]?.username || null
          }))
        }));

        setBills(enriched);
      }
    } catch (err) {
      console.error('Error fetching bills via Supabase:', err);
    }
  };

  const fetchFriends = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;

    try {
      const { data: rawAccepted } = await supabase
        .from('friends')
        .select('friend_id, status')
        .eq('user_id', uid)
        .or('status.eq.accepted,status.is.null');

      if (rawAccepted && rawAccepted.length > 0) {
        const friendIds = rawAccepted.map((f: any) => f.friend_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', friendIds);

        const accepted = (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Friend',
          username: p.username ? `@${p.username}` : '',
          avatar_url: p.avatar_url,
          balance: 0,
          isPendingRequest: false,
        }));
        setFriends(accepted);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchPendingFriends = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;

    try {
      const { data: rawPending, error } = await supabase
        .from('friends')
        .select('user_id, status')
        .eq('friend_id', uid)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending friend requests:', error);
        return;
      }

      if (rawPending && rawPending.length > 0) {
        const requesterIds = rawPending.map((f: any) => f.user_id);
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', requesterIds);

        const pending = (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Friend',
          username: p.username ? `@${p.username}` : '',
          avatar_url: p.avatar_url,
          color: '#4C8C3C',
          isPendingRequest: true,
        }));
        setPendingFriendRequests(pending);
      } else {
        setPendingFriendRequests([]);
      }
    } catch (err) {
      console.error('Error loading friend requests:', err);
    }
  };

  const refreshAll = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;
    await Promise.allSettled([
      fetchBills(uid),
      fetchFriends(uid),
      fetchPendingFriends(uid)
    ]);
  };

  useEffect(() => {
    const initFetch = async () => {
      const uid = await getActiveUserId();
      if (uid) {
        refreshAll(uid);
      }
    };

    initFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        refreshAll(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setBills([]);
        setFriends([]);
        setPendingFriendRequests([]);
        try {
          localStorage.removeItem('plates_cached_bills');
          localStorage.removeItem('plates_cached_friends');
          localStorage.removeItem('plates_cached_pending_friends');
          localStorage.removeItem('plates_cached_uid');
        } catch {}
      }
    });

    // Real-time Postgres subscriptions for live updates
    const channel = supabase
      .channel('realtime-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
        fetchFriends();
        fetchPendingFriends();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      bills, 
      setBills,
      friends,
      setFriends,
      pendingFriendRequests, 
      setPendingFriendRequests,
      fetchBills, 
      fetchFriends,
      fetchPendingFriends,
      refreshAll
    }}>
      {children}
    </DataContext.Provider>
  );
}
