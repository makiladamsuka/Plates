import { Home, BookmarkMinus, UserSearch, Settings } from 'lucide-react';

interface DesktopNavProps {
  currentTab: string;
  session?: any;
  onTabChange: (tab: string) => void;
  onAvatarClick: () => void;
}

export function DesktopNav({ currentTab, session, onTabChange, onAvatarClick }: DesktopNavProps) {
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const initial = (session?.user?.user_metadata?.full_name || 'ME').substring(0, 2).toUpperCase();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bills', icon: BookmarkMinus, label: 'Bills' },
    { id: 'friends', icon: UserSearch, label: 'Friends' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="hidden md:flex flex-col w-[280px] min-h-screen sticky top-0 bg-[#EDEDF1] dark:bg-zinc-950 border-r border-black/5 dark:border-white/5 z-50 py-10 px-6 font-['Sora'] shrink-0 transition-colors">
      <div className="flex items-center gap-3.5 mb-12 px-2">
        <img src="/logo.svg" alt="Plates logo" className="w-12 h-12 rounded-[22.5%] shrink-0" />
        <h1 className="text-black dark:text-zinc-100 text-4xl font-extrabold font-display tracking-tight leading-none">Plates</h1>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-4 px-4 py-4 rounded-[20px] transition-all cursor-pointer ${
                isActive ? 'bg-[#1A1A1A] dark:bg-zinc-100 text-[#EDEDF1] dark:text-zinc-950' : 'text-[#1A1A1A] dark:text-zinc-100 hover:bg-[#D9D9D9] dark:hover:bg-zinc-900'
              }`}
            >
              <Icon size={24} strokeWidth={2.5} className={isActive ? 'opacity-100' : 'opacity-60'} />
              <span className={`text-lg font-semibold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* User Profile at the bottom */}
      <button 
        onClick={onAvatarClick}
        className="mt-auto flex items-center gap-4 p-3 rounded-[20px] hover:bg-[#D9D9D9] dark:hover:bg-zinc-900 transition-colors cursor-pointer text-left"
      >
        <div className="w-12 h-12 rounded-full bg-[#D9D9D9] dark:bg-zinc-800 flex items-center justify-center font-bold text-black dark:text-zinc-100 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[#1A1A1A] dark:text-zinc-100 text-sm font-bold truncate w-full">
            {session?.user?.user_metadata?.full_name || 'My Account'}
          </span>
          <span className="text-black/50 dark:text-zinc-400 text-xs truncate w-full">
            View Settings
          </span>
        </div>
      </button>
    </div>
  );
}
