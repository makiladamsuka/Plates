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
    <header className="px-6 pt-8 pb-3 flex items-center justify-between sticky top-0 bg-[#ededf1]/90 backdrop-blur-md z-20">
      {isSearchOpen ? (
        <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 transition-all duration-300">
          <Search className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bills, people, categories..."
            autoFocus
            className="w-full bg-transparent text-gray-900 text-sm focus:outline-none placeholder-gray-400"
          />
          <button
            onClick={() => {
              setIsSearchOpen(false);
              onSearchChange('');
            }}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-extrabold text-black tracking-tight font-['Sora']">
            {title}
          </h1>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 rounded-full hover:bg-black/5 active:scale-95 transition-all text-black"
            aria-label="Search"
          >
            <Search className="w-6 h-6 stroke-[2.2]" />
          </button>
        </>
      )}
    </header>
  );
};
