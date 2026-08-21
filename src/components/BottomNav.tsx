import { Home, Receipt, Users, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bills', label: 'Bills', icon: Receipt },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-black/8 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] pb-safe">
      <div className="max-w-lg mx-auto h-16 flex justify-around items-center px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-[#1A1A1A] font-bold' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#FBF8EE] text-[#D99A00]' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-sans-app mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

