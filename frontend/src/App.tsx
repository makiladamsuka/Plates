import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
import { DesktopNav } from './components/DesktopNav';
import { Login } from './views/Login';
import { AuthCallback } from './views/AuthCallback';
import { Settings } from './views/Settings';
import { LiveNotificationPopup, type LiveAlert } from './components/LiveNotificationPopup';
import { IncomingBillModal } from './components/IncomingBillModal';
import { IncomingFriendRequestModal } from './components/IncomingFriendRequestModal';
import { supabase } from './lib/supabase';
import { api } from './services/api';

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail' within Bills tab
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  
  // Friends tab state
  const [friendsView, setFriendsView] = useState<'list' | 'detail' | 'search'>('list');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Auth state
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Live in-app alert state
  const [activeLiveAlert, setActiveLiveAlert] = useState<LiveAlert | null>(null);
  const [reviewingBill, setReviewingBill] = useState<any | null>(null);
  const [reviewingFriend, setReviewingFriend] = useState<any | null>(null);

  // Tracking baseline IDs so old pending items don't trigger popups on load
  const knownFriendRequestIdsRef = useRef<Set<string>>(new Set());
  const knownBillRequestIdsRef = useRef<Set<string>>(new Set());
  const knownPaymentConfirmationIdsRef = useRef<Set<string>>(new Set());
  const isInitializedBaselineRef = useRef<boolean>(false);

  // Settings view state
  const [settingsView, setSettingsView] = useState<'main' | 'account'>('main');

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subtle audio chime for live incoming requests
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Check for live incoming requests in real-time while actively in app
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;

    const checkLiveIncoming = async () => {
      try {
        // 1. Check incoming friend requests
        const { data: rawPendingFriends, error: friendErr } = await supabase
          .from('friends')
          .select('user_id, status')
          .eq('friend_id', uid)
          .eq('status', 'pending');

        if (!friendErr && rawPendingFriends) {
            for (const f of rawPendingFriends) {
              if (!knownFriendRequestIdsRef.current.has(f.user_id)) {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('id, full_name, avatar_url, email')
                  .eq('id', f.user_id)
                  .maybeSingle();

                const friendData = {
                  id: prof?.id || f.user_id,
                  name: prof?.full_name || 'Friend',
                  username: prof?.email || '',
                  avatar_url: prof?.avatar_url,
                  isPendingRequest: true,
                };

                knownFriendRequestIdsRef.current.add(f.user_id);
                playNotificationChime();

                // Instantly pop up the bottom sheet instead of the top toast
                setReviewingFriend(friendData);
                break; // Show one popup at a time
              }
            }
        }

        // 2. Check incoming bill requests
        const { data: rawPendingBills, error: billErr } = await supabase
          .from('participants')
          .select('bill_id, accepted, share')
          .eq('friend_id', uid)
          .or('accepted.eq.false,accepted.is.null');

        if (!billErr && rawPendingBills) {
            for (const p of rawPendingBills) {
              if (!knownBillRequestIdsRef.current.has(p.bill_id)) {
                try {
                  const { data: billData } = await supabase
                    .from('bills')
                    .select('*, participants(*)')
                    .eq('id', p.bill_id)
                    .maybeSingle();

                  if (billData && billData.id && billData.creator_id !== uid) {
                    knownBillRequestIdsRef.current.add(p.bill_id);
                    playNotificationChime();

                    setReviewingBill(billData);
                    break;
                  }
                } catch (e) {
                  console.warn('Error fetching new bill detail:', e);
                }
              }
            }
        }

        // 3. Check incoming payments sent to creator's bills
        const { data: creatorBills } = await supabase
          .from('bills')
          .select('id, title, creator_id, participants(*)')
          .eq('creator_id', uid)
          .neq('status', 'Settled');

        if (creatorBills) {
          for (const b of creatorBills) {
            for (const p of (b.participants || [])) {
              if (p.friend_id !== uid && p.payment_sent === true && !p.paid) {
                const key = `${b.id}-${p.friend_id}`;
                if (!knownPaymentConfirmationIdsRef.current.has(key)) {
                  knownPaymentConfirmationIdsRef.current.add(key);

                  playNotificationChime();
                  setReviewingBill(b);
                  break;
                }
              }
            }
          }
        }

        isInitializedBaselineRef.current = true;
      } catch (err) {
        console.error('Error checking live incoming requests:', err);
      }
    };

    // Initial baseline fetch
    checkLiveIncoming();

    // Real-time channel listener for instant broadcast
    const channel = supabase
      .channel('app-live-alerts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, checkLiveIncoming)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, checkLiveIncoming)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, checkLiveIncoming)
      .subscribe();

    // Fast 1.5s live polling loop when active in app
    const interval = setInterval(checkLiveIncoming, 1500);

    const handleVisibility = () => checkLiveIncoming();
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session]);

  const handleLiveAccept = async () => {
    if (!activeLiveAlert) return;
    const uid = session?.user?.id;
    if (!uid) return;

    if (activeLiveAlert.type === 'friend') {
      const requesterId = activeLiveAlert.rawData.requesterId;
      try {
        await api.acceptFriend(requesterId, uid);
      } catch (err) {
        console.error('Error accepting friend live:', err);
      }
    } else if (activeLiveAlert.type === 'bill') {
      const billId = activeLiveAlert.rawData.bill.id;
      try {
        await supabase
          .from('participants')
          .update({ accepted: true, paid: false })
          .eq('bill_id', billId)
          .eq('friend_id', uid);

        await supabase
          .from('bills')
          .update({ status: 'Pending' })
          .eq('id', billId);

        api.acceptBill(billId, uid).catch(console.warn);
      } catch (err) {
        console.error('Error accepting bill live:', err);
      }
    } else if (activeLiveAlert.type === 'payment_received') {
      const { billId, friendId } = activeLiveAlert.rawData;
      try {
        // Route through backend API (uses service role key, bypasses RLS)
        await api.confirmPayment(billId, friendId);
      } catch (err) {
        console.error('Error confirming payment receipt live:', err);
      }
    }

    setActiveLiveAlert(null);
  };

  const handleLiveReview = () => {
    if (!activeLiveAlert) return;
    if (activeLiveAlert.type === 'friend') {
      setReviewingFriend(activeLiveAlert.rawData.friend);
    } else if (activeLiveAlert.type === 'bill' || activeLiveAlert.type === 'payment_received') {
      setReviewingBill(activeLiveAlert.rawData.bill);
    }
    setActiveLiveAlert(null);
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex items-center justify-center"><div className="text-black dark:text-zinc-100 font-['Sora']">Loading...</div></div>;
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  const activeSession = session;

  return (
    <div id="root-container" className="w-full min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 relative md:flex">
      {/* Desktop Navigation */}
      <DesktopNav 
        currentTab={currentTab}
        session={activeSession}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'bills') setCurrentView('list');
          if (tab === 'friends') {
            setFriendsView('list');
            setSelectedFriendId(null);
          }
          if (tab === 'settings') {
            setSettingsView('main');
          }
        }} 
        onAvatarClick={() => {
          setSettingsView('account');
          setCurrentTab('settings');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[480px] md:max-w-full mx-auto md:mx-0 relative md:px-8 lg:px-16 xl:px-24">
        {/* Views */}
        {currentTab === 'home' && (
        <Home 
          session={activeSession}
          onBillClick={(id) => {
            setSelectedBillId(id);
            setCurrentView('detail');
            setCurrentTab('bills');
          }}
          onSearchClick={() => {
            setFriendsView('search');
            setCurrentTab('friends');
          }}
          onAvatarClick={() => {
            setSettingsView('account');
            setCurrentTab('settings');
          }}
        />
      )}
      
      {currentTab === 'friends' && (
        friendsView === 'search' ? (
          <SearchFriends 
            session={activeSession}
            onBack={() => setFriendsView('list')} 
          />
        ) : friendsView === 'detail' && selectedFriendId ? (
          <FriendDetail 
            friendId={selectedFriendId}
            onBack={() => {
              setFriendsView('list');
              setSelectedFriendId(null);
            }}
            onBillClick={(billId) => {
              setSelectedBillId(billId);
              setCurrentView('detail');
              setCurrentTab('bills');
            }}
          />
        ) : (
          <FriendsList 
            session={activeSession}
            onFriendClick={(id) => {
              setSelectedFriendId(id);
              setFriendsView('detail');
            }}
            onSearchClick={() => setFriendsView('search')}
          />
        )
      )}
      
      {currentTab === 'bills' && (
        currentView === 'list' ? (
          <BillsList 
            session={activeSession}
            onBillClick={(id) => {
              setSelectedBillId(id);
              setCurrentView('detail');
            }}
          />
        ) : (
          <BillDetail 
            billId={selectedBillId}
            session={activeSession}
            onBack={() => {
              setCurrentView('list');
              setSelectedBillId(null);
            }}
          />
        )
      )}

      {currentTab === 'settings' && <Settings session={activeSession} initialView={settingsView} isDarkTheme={isDarkTheme} onThemeChange={setIsDarkTheme} />}

      {/* Shared Bottom Navigation */}
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'bills') setCurrentView('list');
          if (tab === 'friends') {
            setFriendsView('list');
            setSelectedFriendId(null);
          }
          if (tab === 'settings') {
            setSettingsView('main');
          }
        }} 
      />
      
      {/* Live In-App Notification Pop-up */}
      <LiveNotificationPopup
        alert={activeLiveAlert}
        onAccept={handleLiveAccept}
        onReview={handleLiveReview}
        onDismiss={() => setActiveLiveAlert(null)}
      />

      {/* Review Modals triggered from Live Popup */}
      <IncomingBillModal 
        isOpen={!!reviewingBill}
        onClose={() => setReviewingBill(null)}
        bill={reviewingBill}
        userId={session?.user?.id || ''}
      />

      <IncomingFriendRequestModal 
        isOpen={!!reviewingFriend}
        onClose={() => setReviewingFriend(null)}
        onApprove={async () => {
          if (reviewingFriend && session?.user?.id) {
            try {
              await api.acceptFriend(reviewingFriend.id, session.user.id);
            } catch (e) {
              console.error(e);
            }
            setReviewingFriend(null);
          }
        }}
        onDecline={async () => {
          if (reviewingFriend && session?.user?.id) {
            try {
              await supabase
                .from('friends')
                .delete()
                .eq('user_id', reviewingFriend.id)
                .eq('friend_id', session.user.id);
            } catch (e) {
              console.error(e);
            }
            setReviewingFriend(null);
          }
        }}
        friend={reviewingFriend || undefined}
      />
      </main>
    </div>
  );
}

export default App;

