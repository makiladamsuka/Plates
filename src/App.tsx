import React, { useState } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { BottomNav } from './components/BottomNav';
import { IncomingBillModal } from './components/IncomingBillModal';
import { MOCK_BILLS } from './data/mockData';
import type { Bill } from './data/mockData';

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail' within Bills tab
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const handleAddBill = (newBill: Bill) => {
    setBills([newBill, ...bills]);
  };

  const selectedBill = bills.find(b => b.id === selectedBillId) || bills[0];

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-gray-100 relative shadow-sm">
      {/* Views */}
      {currentTab === 'home' && <Home />}
      
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
          />
        )
      )}

      {/* Shared Bottom Navigation */}
      <BottomNav 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'bills') setCurrentView('list');
        }} 
      />
      
      {/* <IncomingBillModal /> */}
    </div>
  );
}

export default App;

