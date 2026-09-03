import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import { api } from '../services/api';
import { queryClient } from './queryClient';

export interface DataContextType {
  bills: any[];
  setBills: React.Dispatch<React.SetStateAction<any[]>>;
  friends: any[];
  setFriends: React.Dispatch<React.SetStateAction<any[]>>;
  pendingFriendRequests: any[];
  setPendingFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingBills: boolean;
  isFetchingBills: boolean;
  isLoadingFriends: boolean;
  isLoadingPendingFriends: boolean;
  isInitialLoading: boolean;
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

// Data fetcher helpers
async function fetchBillsFromSource(uid: string): Promise<any[]> {
  if (!uid) return [];

  // Try API first
  try {
    const data = await api.getBills(uid);
    if (data && Array.isArray(data)) {
      return data;
    }
  } catch (e) {
    console.warn('API getBills failed, falling back to direct Supabase:', e);
  }

  // Fallback to direct Supabase query
  try {
    const { data: rawBills, error } = await supabase
      .from('bills')
      .select('*, participants(*)');

    if (error || !rawBills) return [];

    const myBills = rawBills.filter((b: any) => {
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

    return myBills.map((b: any) => ({
      ...b,
      participants: (b.participants || []).map((p: any) => ({
        ...p,
        profile: profilesMap[p.friend_id] || null,
        full_name: profilesMap[p.friend_id]?.full_name || null,
        avatar_url: profilesMap[p.friend_id]?.avatar_url || null,
        username: profilesMap[p.friend_id]?.username || null
      }))
    }));
  } catch (err) {
    console.error('Error fetching bills via Supabase:', err);
    return [];
  }
}

async function fetchFriendsFromSource(uid: string): Promise<any[]> {
  if (!uid) return [];

  try {
    const { data: rawAccepted, error } = await supabase
      .from('friends')
      .select('friend_id, status')
      .eq('user_id', uid)
      .or('status.eq.accepted,status.is.null');

    if (error || !rawAccepted || rawAccepted.length === 0) return [];

    const friendIds = rawAccepted.map((f: any) => f.friend_id);
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', friendIds);

    return (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Friend',
      username: p.username ? `@${p.username}` : '',
      avatar_url: p.avatar_url,
      balance: 0,
      isPendingRequest: false,
    }));
  } catch (err) {
    console.error('Error fetching friends:', err);
    return [];
  }
}

async function fetchPendingFriendsFromSource(uid: string): Promise<any[]> {
  if (!uid) return [];

  try {
    const { data: rawPending, error } = await supabase
      .from('friends')
      .select('user_id, status')
      .eq('friend_id', uid)
      .eq('status', 'pending');

    if (error || !rawPending || rawPending.length === 0) return [];

    const requesterIds = rawPending.map((f: any) => f.user_id);
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', requesterIds);

    return (profs || []).filter((p: any) => p && p.id).map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Friend',
      username: p.username ? `@${p.username}` : '',
      avatar_url: p.avatar_url,
      color: '#4C8C3C',
      isPendingRequest: true,
    }));
  } catch (err) {
    console.error('Error loading friend requests:', err);
    return [];
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('plates_cached_uid') || '';
    } catch {
      return '';
    }
  });

  // Track user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || '';
      if (uid && uid !== userId) {
        setUserId(uid);
        try {
          localStorage.setItem('plates_cached_uid', uid);
        } catch {}
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
        setUserId(session.user.id);
        try {
          localStorage.setItem('plates_cached_uid', session.user.id);
        } catch {}
      } else if (event === 'SIGNED_OUT' && !session) {
        setUserId('');
        try {
          localStorage.removeItem('plates_cached_uid');
          localStorage.removeItem('plates_cached_bills');
          localStorage.removeItem('plates_cached_friends');
          localStorage.removeItem('plates_cached_pending_friends');
        } catch {}
        queryClient.clear();
      }
    });

    // Real-time Postgres subscriptions to invalidate TanStack query cache automatically
    const channel = supabase
      .channel('realtime-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
        queryClient.invalidateQueries({ queryKey: ['bills'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        queryClient.invalidateQueries({ queryKey: ['bills'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        queryClient.invalidateQueries({ queryKey: ['pendingFriends'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 1. TanStack Query for Bills with Synchronous Cache Hydration
  const billsQuery = useQuery({
    queryKey: ['bills', userId],
    queryFn: () => fetchBillsFromSource(userId),
    enabled: !!userId,
    initialData: () => {
      try {
        const saved = localStorage.getItem('plates_cached_bills');
        return saved ? JSON.parse(saved) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  // Sync bills to localStorage whenever updated
  useEffect(() => {
    if (billsQuery.data && Array.isArray(billsQuery.data) && billsQuery.data.length > 0) {
      try {
        localStorage.setItem('plates_cached_bills', JSON.stringify(billsQuery.data));
      } catch {}
    }
  }, [billsQuery.data]);

  // 2. TanStack Query for Friends
  const friendsQuery = useQuery({
    queryKey: ['friends', userId],
    queryFn: () => fetchFriendsFromSource(userId),
    enabled: !!userId,
    initialData: () => {
      try {
        const saved = localStorage.getItem('plates_cached_friends');
        return saved ? JSON.parse(saved) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (friendsQuery.data && Array.isArray(friendsQuery.data)) {
      try {
        localStorage.setItem('plates_cached_friends', JSON.stringify(friendsQuery.data));
      } catch {}
    }
  }, [friendsQuery.data]);

  // 3. TanStack Query for Pending Friends
  const pendingFriendsQuery = useQuery({
    queryKey: ['pendingFriends', userId],
    queryFn: () => fetchPendingFriendsFromSource(userId),
    enabled: !!userId,
    initialData: () => {
      try {
        const saved = localStorage.getItem('plates_cached_pending_friends');
        return saved ? JSON.parse(saved) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (pendingFriendsQuery.data && Array.isArray(pendingFriendsQuery.data)) {
      try {
        localStorage.setItem('plates_cached_pending_friends', JSON.stringify(pendingFriendsQuery.data));
      } catch {}
    }
  }, [pendingFriendsQuery.data]);

  // Optimistic/Manual state setters updating TanStack Query cache directly
  const setBills: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    queryClient.setQueryData(['bills', userId], (prev: any[] = []) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_bills', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setFriends: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    queryClient.setQueryData(['friends', userId], (prev: any[] = []) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_friends', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setPendingFriendRequests: React.Dispatch<React.SetStateAction<any[]>> = (updater) => {
    queryClient.setQueryData(['pendingFriends', userId], (prev: any[] = []) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('plates_cached_pending_friends', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Revalidation methods using query invalidation
  const fetchBills = async (currentUid?: string) => {
    const uid = currentUid || userId;
    await queryClient.invalidateQueries({ queryKey: ['bills', uid] });
  };

  const fetchFriends = async (currentUid?: string) => {
    const uid = currentUid || userId;
    await queryClient.invalidateQueries({ queryKey: ['friends', uid] });
  };

  const fetchPendingFriends = async (currentUid?: string) => {
    const uid = currentUid || userId;
    await queryClient.invalidateQueries({ queryKey: ['pendingFriends', uid] });
  };

  const refreshAll = async (currentUid?: string) => {
    const uid = currentUid || userId;
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['bills', uid] }),
      queryClient.invalidateQueries({ queryKey: ['friends', uid] }),
      queryClient.invalidateQueries({ queryKey: ['pendingFriends', uid] }),
    ]);
  };

  const bills = billsQuery.data || [];
  const friends = friendsQuery.data || [];
  const pendingFriendRequests = pendingFriendsQuery.data || [];

  const isLoadingBills = billsQuery.isLoading;
  const isFetchingBills = billsQuery.isFetching;
  const isLoadingFriends = friendsQuery.isLoading;
  const isLoadingPendingFriends = pendingFriendsQuery.isLoading;
  const isInitialLoading = (billsQuery.isLoading && bills.length === 0) || (friendsQuery.isLoading && friends.length === 0);

  return (
    <DataContext.Provider value={{ 
      bills, 
      setBills,
      friends,
      setFriends,
      pendingFriendRequests, 
      setPendingFriendRequests,
      isLoadingBills,
      isFetchingBills,
      isLoadingFriends,
      isLoadingPendingFriends,
      isInitialLoading,
      fetchBills, 
      fetchFriends,
      fetchPendingFriends,
      refreshAll
    }}>
      {children}
    </DataContext.Provider>
  );
}
