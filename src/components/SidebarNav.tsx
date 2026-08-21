import { Home, Receipt, Users, User, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SidebarNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  session?: any;
}

export function SidebarNav({ currentTab, onTabChange, session }: SidebarNavProps) {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'bills', label: 'Bills & Splits', icon: Receipt },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-black/8 min-h-screen p-6 sticky top-0 h-screen justify-between z-30 flex-shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#F5C744] rounded-2xl flex items-center justify-center shadow-xs border border-black/5 rotate-[-3deg] transition-transform hover:rotate-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold font-display tracking-tight text-[#1A1A1A]">Plates</span>
            <span className="text-[11px] text-gray-400 font-sans-app">Social Dining Tabs</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 font-sans-app">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FBF8EE] text-[#1A1A1A] border border-[#F5C744]/40 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1A1A1A]'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[#D99A00]' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="pt-6 border-t border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#EDEDF1] border border-black/5 text-[#1A1A1A] font-bold text-sm flex items-center justify-center flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#1A1A1A] truncate font-sans-app">{userName}</span>
            <span className="text-xs text-gray-400 truncate font-sans-app">{session?.user?.email || 'Logged in'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={17} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
