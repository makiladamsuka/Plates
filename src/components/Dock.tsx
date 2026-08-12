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
    <div className="fixed bottom-3 left-0 right-0 max-w-[412px] mx-auto px-4 z-40">
      <nav className="bg-[#121318]/95 h-[58px] rounded-full shadow-2xl flex items-center justify-around px-3 border border-white/[0.08] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300 active:scale-95'
              }`}
              aria-label={item.label}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2] text-white' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'text-white font-semibold' : 'text-neutral-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 bg-[#f5c744] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

