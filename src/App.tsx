import { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
import { SidebarNav } from './components/SidebarNav';
import { Login } from './views/Login';
import { Profile } from './views/Profile';
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
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center font-sans-app">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F5C744] flex items-center justify-center font-bold text-sm animate-pulse">
            P
          </div>
          <span className="text-gray-500 text-sm font-medium">Loading Plates...</span>
        </div>
      </div>
    );
  }

  // Active session or mock guest session for testing without backend
  const activeSession = session || (isGuestMode ? {
    user: {
      id: 'demo-user-me',
      email: 'alex.demo@plates.app',
      user_metadata: { full_name: 'Alex Rivera' }
    }
  } : null);

  if (!activeSession) {
    return <Login onGuestLogin={() => setIsGuestMode(true)} />;
  }

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'bills') setCurrentView('list');
    if (tab === 'friends') {
      setFriendsView('list');
      setSelectedFriendId(null);
    }
  };

  return (
    <div id="root-container" className="w-full min-h-screen bg-[#FBFBFA] flex flex-col md:flex-row text-[#1A1A1A]">
      {/* Desktop Left Sidebar Navigation */}
      <SidebarNav 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
        session={activeSession} 
      />

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto p-0 md:p-8 lg:p-10 pb-24 md:pb-12">
        {/* Views */}
        {currentTab === 'home' && (
          <Home 
            onBillClick={(id) => {
              setSelectedBillId(id);
              setCurrentView('detail');
              setCurrentTab('bills');
            }}
            onSearchClick={() => {
              setFriendsView('search');
              setCurrentTab('friends');
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

        {currentTab === 'profile' && <Profile session={activeSession} />}
      </main>

      {/* Shared Mobile Bottom Navigation */}
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
}

export default App;

