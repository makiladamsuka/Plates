import React, { useState } from 'react';
import { Search, X, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  searchQuery,
  onSearchChange,
  isDark = true,
  onToggleTheme,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className={`px-4 pt-5 pb-2.5 flex items-center justify-between sticky top-0 backdrop-blur-md z-20 transition-colors duration-200 border-b ${
      isDark
        ? 'bg-[#090a0f]/90 text-white border-white/[0.06]'
        : 'bg-[#ededf1]/90 text-[#0f1015] border-black/[0.06]'
    }`}>
      {isSearchOpen ? (
        <div className={`flex-1 flex items-center rounded-full px-3.5 py-1.5 border transition-all duration-200 ${
          isDark
            ? 'bg-[#16171e] border-white/10'
            : 'bg-white border-black/10 shadow-sm'
        }`}>
          <Search className={`w-4 h-4 mr-2 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bills, people..."
            autoFocus
            className={`w-full bg-transparent text-xs focus:outline-none ${
              isDark ? 'text-white placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400'
            }`}
          />
          <button
            onClick={() => {
              setIsSearchOpen(false);
              onSearchChange('');
            }}
            className={`p-1 rounded-full ${
              isDark ? 'hover:bg-white/10 text-neutral-400 hover:text-white' : 'hover:bg-black/5 text-neutral-500 hover:text-black'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <h1 className={`text-2xl font-bold tracking-tight font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            {title}
          </h1>
          <div className="flex items-center gap-1">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-full active:scale-95 transition-all ${
                  isDark ? 'hover:bg-white/10 text-[#f5c744]' : 'hover:bg-black/5 text-amber-600'
                }`}
                aria-label="Toggle Theme"
                title="Switch Theme"
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`p-2 rounded-full active:scale-95 transition-all ${
                isDark ? 'hover:bg-white/10 text-neutral-300 hover:text-white' : 'hover:bg-black/5 text-neutral-700 hover:text-black'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </>
      )}
    </header>
  );
};



