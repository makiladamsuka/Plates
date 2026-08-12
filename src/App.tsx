import { useState, useMemo } from 'react';
import type { TabType, Bill, SortOption, Friend, ThemeMode } from './types';
import { INITIAL_BILLS, INITIAL_FRIENDS } from './data/mockData';
import { Header } from './components/Header';
import { Dock } from './components/Dock';
import { HomeView } from './views/HomeView';
import { BillsView } from './views/BillsView';
import { FriendsView } from './views/FriendsView';
import { SettingsView } from './views/SettingsView';
import { BillRequestModal } from './components/BillRequestModal';
import { NewBillModal } from './components/NewBillModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('bills');
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [activeSort, setActiveSort] = useState<SortOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('plates_theme') as ThemeMode) || 'dark';
  });

  const isDark = theme === 'dark';

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('plates_theme', next);
      return next;
    });
  };

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sort & Search logic
  const filteredBills = useMemo(() => {
    let result = [...bills];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.creator.toLowerCase().includes(q)
      );
    }

    switch (activeSort) {
      case 'highest':
        return result.sort((a, b) => b.amount - a.amount);
      case 'lowest':
        return result.sort((a, b) => a.amount - b.amount);
      case 'oldest':
        return result.sort((a, b) => a.createdAt - b.createdAt);
      case 'all':
      default:
        return result.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [bills, activeSort, searchQuery]);

  // Actions
  const handleApproveBill = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'Settled' } : b))
    );
    setSelectedBill(null);
    showToast('Bill Approved & Settled successfully!');
  };

  const handleDeclineBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    setSelectedBill(null);
    showToast('Bill request declined.');
  };

  const handleCreateBill = (newBillData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...newBillData,
      id: `b-${Date.now()}`,
      createdAt: Date.now(),
    };
    setBills((prev) => [newBill, ...prev]);
    showToast('New bill request created!');
  };

  const handleAddFriend = (name: string, username: string) => {
    const newFriend: Friend = {
      id: `f-${Date.now()}`,
      name,
      username,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      balance: 0,
      isPendingRequest: false,
    };
    setFriends((prev) => [newFriend, ...prev]);
    showToast(`Added ${name} to your friends list!`);
  };

  const handleAcceptRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, isPendingRequest: false } : f))
    );
    showToast('Friend request accepted!');
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Overview';
      case 'bills':
        return 'Bills';
      case 'friends':
        return 'Friends';
      case 'settings':
        return 'Settings';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-0 sm:p-4 font-['Sora'] selection:bg-[#f5c744] selection:text-black transition-colors duration-200 ${
      isDark ? 'bg-[#050508]' : 'bg-[#e2e2e8]'
    }`}>
      {/* Phone App Container */}
      <div className={`w-full max-w-[412px] min-h-screen sm:min-h-[874px] sm:max-h-[900px] sm:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden border transition-colors duration-200 ${
        isDark
          ? 'bg-[#090a0f] text-white border-white/10'
          : 'bg-[#ededf1] text-[#0f1015] border-black/10'
      }`}>
        
        {/* Dynamic Header */}
        <Header
          title={getHeaderTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDark={isDark}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView
              bills={bills}
              onSelectBill={setSelectedBill}
              onOpenNewBill={() => setIsNewBillOpen(true)}
              onNavigateToBills={() => setActiveTab('bills')}
              isDark={isDark}
            />
          )}

          {activeTab === 'bills' && (
            <BillsView
              bills={filteredBills}
              activeSort={activeSort}
              onSortChange={setActiveSort}
              onSelectBill={setSelectedBill}
              onOpenNewBill={() => setIsNewBillOpen(true)}
              isDark={isDark}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsView
              friends={friends}
              onAddFriend={handleAddFriend}
              onAcceptRequest={handleAcceptRequest}
              isDark={isDark}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isDark={isDark}
              onToggleTheme={handleToggleTheme}
            />
          )}
        </main>

        {/* Floating Bottom Navigation Dock */}
        <Dock activeTab={activeTab} onTabChange={setActiveTab} isDark={isDark} />

        {/* Interactive Bill Request Bottom Sheet Modal */}
        <BillRequestModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
          onApprove={handleApproveBill}
          onDecline={handleDeclineBill}
          isDark={isDark}
        />

        {/* New Bill Creation Modal */}
        <NewBillModal
          isOpen={isNewBillOpen}
          onClose={() => setIsNewBillOpen(false)}
          onCreate={handleCreateBill}
          isDark={isDark}
        />

        {/* Notification Toast */}
        {toastMessage && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 border animate-in fade-in slide-in-from-top duration-200 ${
            isDark
              ? 'bg-[#1a1a1a] text-white border-white/20'
              : 'bg-[#0f1015] text-white border-black/20'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

