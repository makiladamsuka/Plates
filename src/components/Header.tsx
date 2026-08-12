import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, searchQuery, onSearchChange }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="px-4 pt-5 pb-2.5 flex items-center justify-between sticky top-0 bg-[#090a0f]/90 backdrop-blur-md z-20 border-b border-white/[0.06]">
      {isSearchOpen ? (
        <div className="flex-1 flex items-center bg-[#16171e] rounded-full px-3.5 py-1.5 border border-white/10 transition-all duration-200">
          <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bills, people..."
            autoFocus
            className="w-full bg-transparent text-white text-xs focus:outline-none placeholder-neutral-500"
          />
          <button
            onClick={() => {
              setIsSearchOpen(false);
              onSearchChange('');
            }}
            className="p-1 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-white tracking-tight font-['Sora']">
            {title}
          </h1>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-neutral-300 hover:text-white"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
        </>
      )}
    </header>
  );
};

