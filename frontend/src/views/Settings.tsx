import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronRight, User as UserIcon, Moon, ChevronLeft, Edit3, Image as ImageIcon, Trash2 } from 'lucide-react';

interface SettingsProps {
  session: any;
  initialView?: 'main' | 'account';
  isDarkTheme?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export function Settings({ session, initialView = 'main', isDarkTheme = false, onThemeChange }: SettingsProps) {
  const [view, setView] = useState<'main' | 'account'>(initialView);

  // Sync internal state when initialView prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const user = session?.user;
  const fullName = user?.user_metadata?.full_name || user?.email || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error during signOut:', e);
    }
    window.history.replaceState({}, document.title, '/');
    window.location.href = '/';
  };

  if (view === 'account') {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-0 md:pt-6 transition-colors">
        
        {/* Top Header Container */}
        <div className="px-6 pt-10 pb-4 h-[88px] flex items-center gap-2 max-w-[480px] md:max-w-2xl mx-auto md:px-0 md:hidden">
          <button onClick={() => setView('main')} className="flex items-center justify-center w-8 h-8 -ml-2 shrink-0 cursor-pointer text-[#1A1A1A] dark:text-zinc-100 hover:text-black dark:hover:text-white transition-colors">
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>
          <h1 className="text-black dark:text-zinc-100 text-4xl md:text-5xl font-bold font-display tracking-tight leading-none">Your Account</h1>
        </div>

        <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 md:px-10 flex flex-col gap-3 mt-2 md:pt-10">
          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 flex flex-col items-center shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full mb-4 object-cover" />
            ) : (
              <div className="w-24 h-24 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4 flex items-center justify-center">
                <span className="text-gray-500 dark:text-zinc-400 text-3xl">{fullName.charAt(0)}</span>
              </div>
            )}
            
            <h2 className="text-zinc-900 dark:text-zinc-100 text-2xl font-bold font-display mb-1 text-center">{fullName}</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">{user?.email}</p>
          </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-4 mb-6 flex flex-col gap-2">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Edit3 size={18} className="text-gray-700 dark:text-zinc-300" />
              </div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Change Name</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <ImageIcon size={18} className="text-gray-700 dark:text-zinc-300" />
              </div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Change DP</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[24px] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors flex items-center justify-center">
                <Trash2 size={18} className="text-red-500 dark:text-red-400" />
              </div>
              <span className="text-base font-semibold text-red-500 dark:text-red-400">Delete Account</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors py-4 rounded-[35px]"
        >
          <LogOut size={18} />
          <span className="text-base font-semibold">Log Out</span>
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-0 md:pt-6 transition-colors">
      
      {/* Top Header Container */}
      <div className="px-6 pt-10 pb-4 h-[88px] flex justify-between items-center max-w-[480px] md:max-w-2xl mx-auto md:px-0 md:hidden">
        <h1 className="text-black dark:text-zinc-100 text-5xl font-bold font-display tracking-tight leading-none">Settings</h1>
      </div>
      
      <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 md:px-10 md:pt-10">
        <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-4 flex flex-col gap-2 mt-2 shadow-sm">
        <button 
          onClick={() => setView('account')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <UserIcon size={18} className="text-gray-700 dark:text-zinc-300" />
            </div>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your Account</span>
          </div>
          <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
        </button>
        
        <div className="w-full flex items-center justify-between p-4 bg-transparent rounded-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <Moon size={18} className="text-gray-700 dark:text-zinc-300" />
            </div>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Dark Mode</span>
          </div>
          <button 
            onClick={() => onThemeChange?.(!isDarkTheme)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${isDarkTheme ? 'bg-[#1A1A1A] dark:bg-zinc-600' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 ease-in-out ${isDarkTheme ? 'translate-x-[20px]' : 'translate-x-0'}`} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
