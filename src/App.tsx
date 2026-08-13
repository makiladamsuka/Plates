import { useState, useMemo } from 'react';
import type { TabType, Bill, SortOption, Friend } from './types';
import { INITIAL_BILLS, INITIAL_FRIENDS } from './data/mockData';
import { Dock } from './components/Dock';
import { WelcomeView } from './views/WelcomeView';
import { HomeView } from './views/HomeView';
import { BillsView } from './views/BillsView';
import { FriendsView } from './views/FriendsView';
import { SettingsView } from './views/SettingsView';
import { BillInfoView } from './views/BillInfoView';
import { BillPaymentPopup } from './components/BillPaymentPopup';
import { CreateBillView } from './views/CreateBillView';
import { FriendDetailModal } from './components/FriendDetailModal';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [activeSort, setActiveSort] = useState<SortOption>('all');
  const [searchQuery, _setSearchQuery] = useState('');
  
  // Modals & Popups state
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
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
  const handleApprovePayment = () => {
    if (selectedBill) {
      setBills((prev) =>
        prev.map((b) => (b.id === selectedBill.id ? { ...b, status: 'Settled' } : b))
      );
      showToast('Bill Paid & Settled successfully!');
    }
    setIsPaymentPopupOpen(false);
    setSelectedBill(null);
  };

  // Removed _handleDeclineBill to fix TS error

  const handleCreateBill = (newBillData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...newBillData,
      id: `b-${Date.now()}`,
      createdAt: Date.now(),
    };
    setBills((prev) => [newBill, ...prev]);
    setIsNewBillOpen(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 font-['Sora'] selection:bg-[#f5c744] selection:text-black bg-[#e2e2e8]">
      {/* Phone App Container */}
      <div className="w-full max-w-[412px] min-h-screen sm:min-h-[874px] sm:max-h-[900px] sm:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden bg-[#ededf1] border border-black/10">
        
        {showWelcome ? (
          <WelcomeView onEnter={() => setShowWelcome(false)} />
        ) : (
          <>
            {/* View Switcher */}
            <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeView
              bills={bills}
              onSelectBill={setSelectedBill}
              onOpenNewBill={() => setIsNewBillOpen(true)}
              onNavigateToBills={() => setActiveTab('bills')}
            />
          )}

          {activeTab === 'bills' && (
            <BillsView
              bills={filteredBills}
              activeSort={activeSort}
              onSortChange={setActiveSort}
              onSelectBill={setSelectedBill}
              onOpenNewBill={() => setIsNewBillOpen(true)}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsView
              friends={friends}
              onAddFriend={handleAddFriend}
              onAcceptRequest={handleAcceptRequest}
              onSelectFriend={setSelectedFriend}
              isDark={false} // Force false to prevent old dark mode logic if any
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isDark={false}
              onToggleTheme={() => {}}
            />
          )}
        </main>

        {/* Floating Bottom Navigation Dock */}
        <Dock activeTab={activeTab} onTabChange={setActiveTab} isDark={false} />

        {/* Figma 79:83 Bill Info Full-Screen View */}
        {selectedBill && !isPaymentPopupOpen && (
          <BillInfoView
            bill={selectedBill}
            onClose={() => setSelectedBill(null)}
            onPay={() => setIsPaymentPopupOpen(true)}
          />
        )}

        {/* Figma 82:295 Bill Payment Confirm Popup */}
        {isPaymentPopupOpen && (
          <BillPaymentPopup
            bill={selectedBill}
            amount={
              selectedBill?.participants.find(p => p.name.includes('You'))?.share || 
              (selectedBill ? Math.round(selectedBill.amount / selectedBill.peopleCount) : 0)
            }
            onClose={() => setIsPaymentPopupOpen(false)}
            onApprove={handleApprovePayment}
          />
        )}

        {/* Figma 70:131 Friend Detail Full-Screen View */}
        <FriendDetailModal
          friend={selectedFriend}
          bills={bills}
          onClose={() => setSelectedFriend(null)}
          onSelectBill={(b) => {
            setSelectedFriend(null);
            setSelectedBill(b);
          }}
          isDark={false}
        />

        {/* Figma 82:469 Create Bill View */}
        {isNewBillOpen && (
          <CreateBillView
            onClose={() => setIsNewBillOpen(false)}
            onCreate={handleCreateBill}
          />
        )}

        {/* Notification Toast */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 text-[15px] font-semibold px-[20px] py-[12px] rounded-full shadow-2xl z-50 flex items-center gap-2 border bg-[#1a1a1a] text-white border-white/20 animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default App;
