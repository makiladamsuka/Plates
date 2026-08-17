import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { BillsList } from './views/BillsList';
import { BillDetail } from './views/BillDetail';
import { BottomNav } from './components/BottomNav';
import { IncomingBillModal } from './components/IncomingBillModal';
import { Login } from './views/Login';
import { Profile } from './views/Profile';
import { Friends } from './views/Friends';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [currentTab, setCurrentTab] = useState('home');
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail' within Bills tab
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

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
    return <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center"><div className="text-white">Loading...</div></div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div id="root-container" className="max-w-[480px] mx-auto w-full min-h-screen bg-gray-100 relative shadow-sm">
      {/* Views */}
      {currentTab === 'home' && <Home />}
      
      {currentTab === 'bills' && (
        currentView === 'list' ? (
          <BillsList onBillClick={(id) => { setSelectedBillId(id); setCurrentView('detail'); }} />
        ) : (
          <BillDetail billId={selectedBillId} onBack={() => { setSelectedBillId(null); setCurrentView('list'); }} />
        )
      )}

      {currentTab === 'friends' && <Friends session={session} />}

      {currentTab === 'profile' && <Profile session={session} />}

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

