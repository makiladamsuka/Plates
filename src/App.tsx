import React, { useState } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { BottomNav } from './components/BottomNav';
import { IncomingBillModal } from './components/IncomingBillModal';

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail' within Bills tab

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-gray-100 relative shadow-sm">
      {/* Views */}
      {currentTab === 'home' && <Home />}
      
      {currentTab === 'bills' && (
        currentView === 'list' ? (
          <BillsList onBillClick={() => setCurrentView('detail')} />
        ) : (
          <BillDetail onBack={() => setCurrentView('list')} />
        )
      )}

      {/* Shared Bottom Navigation */}
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'bills') setCurrentView('list'); // Reset to list when clicking Bills tab
        }} 
      />
      
      {/* <IncomingBillModal /> */}
    </div>
  );
}

export default App;

