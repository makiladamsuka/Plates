import React from 'react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center">
      <div className="w-full max-w-[480px] h-[93px] bg-[#1A1A1A] rounded-t-[20px] flex justify-around items-center px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        {/* Home Icon */}
        <button 
          onClick={() => onTabChange('home')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-opacity ${currentTab === 'home' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        {/* Bills Icon */}
        <button 
          onClick={() => onTabChange('bills')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-opacity ${currentTab === 'bills' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </button>
        {/* Friends Icon */}
        <button 
          onClick={() => onTabChange('friends')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-opacity ${currentTab === 'friends' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
        {/* Profile Icon */}
        <button 
          onClick={() => onTabChange('profile')}
          className="w-12 h-12 flex items-center justify-center cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-opacity ${currentTab === 'profile' ? 'text-[#EDEDF1] opacity-100' : 'text-[#EDEDF1] opacity-40'}`}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </div>
    </div>
  );
}
