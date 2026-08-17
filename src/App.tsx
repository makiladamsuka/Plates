import React, { useState } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { FriendsList } from './views/FriendsList';
import { FriendDetail } from './views/FriendDetail';
import { SearchFriends } from './views/SearchFriends';
import { BottomNav } from './components/BottomNav';
import { IncomingBillModal } from './components/IncomingBillModal';
import { MOCK_BILLS, MOCK_FRIENDS } from './data/mockData';
import type { Bill } from './data/mockData';

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail' within Bills tab
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  
  // Friends tab state
  const [friendsView, setFriendsView] = useState<'list' | 'detail' | 'search'>('list');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const handleAddBill = (newBill: Bill) => {
    setBills([newBill, ...bills]);
  };

  const selectedBill = bills.find(b => b.id === selectedBillId) || bills[0];
  const selectedFriend = MOCK_FRIENDS.find(f => f.id === selectedFriendId);

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-[#EDEDF1] relative shadow-sm">
      {/* Views */}
      {currentTab === 'home' && <Home />}
      
      {currentTab === 'friends' && (
        friendsView === 'search' ? (
          <SearchFriends onBack={() => setFriendsView('list')} />
        ) : friendsView === 'detail' && selectedFriend ? (
          <FriendDetail 
            friend={selectedFriend}
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
            bills={bills} 
            onAddBill={handleAddBill} 
            onBillClick={(id) => {
              setSelectedBillId(id);
              setCurrentView('detail');
            }} 
          />
        ) : (
          <BillDetail 
            bill={selectedBill}
            onBack={() => {
              setCurrentView('list');
              setSelectedBillId(null);
            }} 
            onSettle={() => {
              setBills(bills.map(b => b.id === selectedBill?.id ? { ...b, status: 'Settled' } : b));
              setCurrentView('list');
              setSelectedBillId(null);
            }}
          />
        )
      )}

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

