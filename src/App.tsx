import { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
import { DesktopNav } from './components/DesktopNav';
import { Login } from './views/Login';
import { Settings } from './views/Settings';
import { supabase } from './lib/supabase';

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

  if (isInitializing) {
    return <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex items-center justify-center"><div className="text-black dark:text-zinc-100 font-['Sora']">Loading...</div></div>;
  }

  if (!session) {
    return <Login />;
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
      <main className="flex-1 w-full max-w-[480px] md:max-w-full mx-auto md:mx-0 relative">
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
            onBillClick={(id) => {
              setSelectedBillId(id);
              setCurrentView('detail');
            }}
          />
        ) : (
          <BillDetail 
            billId={selectedBillId}
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
      
      {/* <IncomingBillModal /> */}
      </main>
    </div>
  );
}

export default App;

