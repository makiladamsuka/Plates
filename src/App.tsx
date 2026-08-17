import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
import { IncomingBillModal } from './components/IncomingBillModal';
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

  // Removed handleAddBill, handleApproveFriend, etc. since data is fetched from DB

  // removed selectedBill and selectedFriend lookups

  if (isInitializing) {
    return <div className="min-h-screen bg-[#EDEDF1] flex items-center justify-center"><div className="text-black">Loading...</div></div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-[#EDEDF1] relative shadow-sm">
      {/* Views */}
      {currentTab === 'home' && (
        <Home 
          bills={bills}
          friends={friends}
          onAddBill={handleAddBill}
          onBillClick={(id) => {
            setSelectedBillId(id);
            setCurrentView('detail');
            setCurrentTab('bills');
          }}
          onSearchClick={() => {
            setFriendsView('search');
            setCurrentTab('friends');
          }}
          onApproveFriend={handleApproveFriend}
        />
      )}
      
      {currentTab === 'friends' && (
        friendsView === 'search' ? (
          <SearchFriends 
            session={session}
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
            session={session}
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

      {currentTab === 'profile' && <Profile session={session} />}

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

