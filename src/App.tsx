import { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
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
    return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center"><div className="text-black">Loading...</div></div>;
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

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-[#EDEDF1] relative shadow-sm">
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
        }} 
      />
      
      {/* <IncomingBillModal /> */}
    </div>
  );
}

export default App;

