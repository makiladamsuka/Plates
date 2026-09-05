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
import { SetUsernameModal } from './components/SetUsernameModal';
import { supabase } from './lib/supabase';
import { api } from './services/api';

import { syncUserProfile } from './lib/profileSync';

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
  const [isSetUsernameOpen, setIsSetUsernameOpen] = useState(false);

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
    const color = isDarkTheme ? '#09090b' : '#EDEDF1';
    const metaThemeTags = document.querySelectorAll('meta[name="theme-color"]');
    if (metaThemeTags.length > 0) {
      metaThemeTags.forEach(tag => tag.setAttribute('content', color));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }

    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  // Sync internal navigation state with browser history for hardware back button support
  useEffect(() => {
    if (!session) return; // Don't track history while logged out
    
    const stateObj = { 
      currentTab, 
      currentView, 
      selectedBillId, 
      friendsView, 
      selectedFriendId, 
      settingsView 
    };
    
    const currentHistoryState = window.history.state;
    
    if (!currentHistoryState) {
      window.history.replaceState(stateObj, '');
    } else if (JSON.stringify(currentHistoryState) !== JSON.stringify(stateObj)) {
      window.history.pushState(stateObj, '');
    }
  }, [currentTab, currentView, selectedBillId, friendsView, selectedFriendId, settingsView, session]);

  // Handle system back button (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setCurrentTab(event.state.currentTab);
        setCurrentView(event.state.currentView);
        setSelectedBillId(event.state.selectedBillId);
        setFriendsView(event.state.friendsView);
        setSelectedFriendId(event.state.selectedFriendId);
        setSettingsView(event.state.settingsView);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.provider_token) {
        sessionStorage.setItem('google_provider_token', session.provider_token);
      }
      if (session?.user) {
        const profile = await syncUserProfile(session.user);
        if (profile?.requiresUsername) {
          setIsSetUsernameOpen(true);
        }
      }
      setIsInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.provider_token) {
        sessionStorage.setItem('google_provider_token', session.provider_token);
      }
      if (session?.user) {
        const profile = await syncUserProfile(session.user);
        if (profile?.requiresUsername) {
          setIsSetUsernameOpen(true);
        }
      }
      if (event === 'SIGNED_OUT' || !session) {
        sessionStorage.removeItem('google_provider_token');
        setCurrentTab('home');
        setCurrentView('list');
        setSelectedBillId(null);
        setSelectedFriendId(null);
        setReviewingBill(null);
        setReviewingFriend(null);
        setActiveLiveAlert(null);
        setIsSetUsernameOpen(false);
      }
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
                  .select('id, full_name, avatar_url, username')
                  .eq('id', f.user_id)
                  .maybeSingle();

                const friendData = {
                  id: prof?.id || f.user_id,
                  name: prof?.full_name || 'Friend',
                  username: prof?.username ? `@${prof.username}` : `@${prof?.full_name ? prof.full_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user'}`,
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
          .select('*, participants(*)')
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

    return () => {
      supabase.removeChannel(channel);
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
        <div style={{ display: currentTab === 'home' ? undefined : 'none' }}>
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
        </div>
        
        <div style={{ display: currentTab === 'friends' ? undefined : 'none' }}>
          {friendsView === 'search' ? (
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
          )}
        </div>
        
        <div style={{ display: currentTab === 'bills' ? undefined : 'none' }}>
          {currentView === 'list' ? (
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
          )}
        </div>

        <div style={{ display: currentTab === 'settings' ? undefined : 'none' }}>
          <Settings session={activeSession} initialView={settingsView} isDarkTheme={isDarkTheme} onThemeChange={setIsDarkTheme} />
        </div>

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

      {/* Choose Username Modal on First Login / Missing Username */}
      <SetUsernameModal
        isOpen={isSetUsernameOpen}
        session={activeSession}
        onUsernameSet={() => {
          setIsSetUsernameOpen(false);
        }}
      />
      </main>
    </div>
  );
}

export default App;

