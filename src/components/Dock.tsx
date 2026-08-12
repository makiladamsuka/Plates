import React from 'react';
import { Home, Bookmark, UserCheck, Settings } from 'lucide-react';
import type { TabType } from '../types';

interface DockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Dock: React.FC<DockProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bills', label: 'Bills', icon: Bookmark },
    { id: 'friends', label: 'Friends', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 max-w-[412px] mx-auto px-4 z-40">
      <nav className="bg-[#1a1a1a] h-[72px] rounded-[24px] shadow-2xl flex items-center justify-around px-4 border border-white/10 backdrop-blur-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-white scale-110'
                  : 'text-gray-400 hover:text-gray-200 active:scale-95'
              }`}
              aria-label={item.label}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
