import { Home, BookmarkMinus, UserSearch, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pointer-events-none md:hidden flex justify-center">
      <div className="w-full h-[93px] bg-[#1A1A1A] dark:bg-zinc-900 rounded-t-[20px] flex justify-around items-center px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:border-t dark:border-white/5 pointer-events-auto transition-colors">
        {/* Home Icon */}
        <button 
          onClick={() => onTabChange('home')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <Home size={24} strokeWidth={2.5} className={`transition-opacity ${currentTab === 'home' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`} />
        </button>
        {/* Bills Icon */}
        <button 
          onClick={() => onTabChange('bills')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <BookmarkMinus size={24} strokeWidth={2.5} className={`transition-opacity ${currentTab === 'bills' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`} />
        </button>
        {/* Friends Icon */}
        <button 
          onClick={() => onTabChange('friends')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <UserSearch size={24} strokeWidth={2.5} className={`transition-opacity ${currentTab === 'friends' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`} />
        </button>
        {/* Settings Icon */}
        <button 
          onClick={() => onTabChange('settings')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <Settings size={24} strokeWidth={2.5} className={`transition-opacity ${currentTab === 'settings' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`} />
        </button>
      </div>
    </div>
  );
}
