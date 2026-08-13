import React from 'react';
import { Home, BookmarkMinus, UserSearch, Settings } from 'lucide-react';
import type { TabType } from '../types';

interface DockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDark?: boolean;
}

export const Dock: React.FC<DockProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: TabType; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', icon: Home },
    { id: 'settings', icon: Settings },
    { id: 'friends', icon: UserSearch },
    { id: 'bills', icon: BookmarkMinus },
  ];

  return (
    <div className="absolute bottom-[-5px] left-0 right-0 w-[402px] h-[93px] mx-auto z-40 bg-[#1a1a1a] rounded-[20px] flex items-center justify-around px-[15px]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center justify-center p-[10px] transition-all duration-200 active:scale-95 ${
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-400'
            }`}
            aria-label={item.id}
          >
            <Icon className={`w-[26px] h-[26px] ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          </button>
        );
      })}
    </div>
  );
};
