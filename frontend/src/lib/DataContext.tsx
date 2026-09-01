import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import { api } from '../services/api';

interface DataContextType {
  bills: any[];
  setBills: React.Dispatch<React.SetStateAction<any[]>>;
  pendingFriendRequests: any[];
  setPendingFriendRequests: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingInitialData: boolean;
  fetchBills: (uid?: string) => Promise<void>;
  fetchPendingFriends: (uid?: string) => Promise<void>;
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
  const [bills, setBills] = useState<any[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [userId, setUserId] = useState<string>('');

  const getActiveUserId = async (): Promise<string> => {
    if (userId) return userId;
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id || '';
    if (uid && uid !== userId) {
      setUserId(uid);
    }
    return uid;
  };

  const fetchBills = async (currentUid?: string) => {
    const uid = currentUid || await getActiveUserId();
    if (!uid) return;
    
    try {
      const data = await api.getBills(uid);
      if (data && Array.isArray(data) && data.length > 0) {
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

  useEffect(() => {
    let isMounted = true;

    const initFetch = async () => {
      const uid = await getActiveUserId();
      if (uid) {
        await Promise.all([
          fetchBills(uid),
          fetchPendingFriends(uid)
        ]);
        if (isMounted) setIsLoadingInitialData(false);
      } else {
        if (isMounted) setIsLoadingInitialData(false);
      }
    };

    initFetch();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setIsLoadingInitialData(true);
        await Promise.all([
          fetchBills(session.user.id),
          fetchPendingFriends(session.user.id)
        ]);
        if (isMounted) setIsLoadingInitialData(false);
      } else if (event === 'SIGNED_OUT') {
        setUserId('');
        setBills([]);
        setPendingFriendRequests([]);
        setIsLoadingInitialData(false);
      }
    });

    const channel = supabase
      .channel('realtime-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchBills())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => fetchPendingFriends())
      .subscribe();

    const interval = setInterval(() => {
      fetchBills();
      fetchPendingFriends();
    }, 3000);

    const handleFocus = () => {
      fetchBills();
      fetchPendingFriends();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      bills, 
      setBills,
      pendingFriendRequests, 
      setPendingFriendRequests,
      isLoadingInitialData, 
      fetchBills, 
      fetchPendingFriends 
    }}>
      {children}
    </DataContext.Provider>
  );
}
