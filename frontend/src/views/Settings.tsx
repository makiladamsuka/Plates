import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronRight, User as UserIcon, Moon, ChevronLeft, Edit3, Image as ImageIcon, Trash2, AtSign, MoreVertical } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ChangeDPModal } from '../components/ChangeDPModal';
import { ChangeNameModal } from '../components/ChangeNameModal';
import { SetUsernameModal } from '../components/SetUsernameModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { api } from '../services/api';

interface SettingsProps {
  session: any;
  initialView?: 'main' | 'account';
  isDarkTheme?: boolean;
  onThemeChange?: (isDark: boolean) => void;
}

export function Settings({ session, initialView = 'main', isDarkTheme = false, onThemeChange }: SettingsProps) {
  const [view, setView] = useState<'main' | 'account'>(initialView);
  const [isChangeDPOpen, setIsChangeDPOpen] = useState(false);
  const [isChangeNameOpen, setIsChangeNameOpen] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unsettledBillsCount, setUnsettledBillsCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const [fullName, setFullName] = useState<string>(() => user?.user_metadata?.full_name || user?.email || 'User');
  const [username, setUsername] = useState<string>(() => user?.user_metadata?.username || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => user?.user_metadata?.avatar_url || null);

  // Sync internal state when initialView prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Click outside listener for 3-dots dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Fetch latest profile info from profiles table
  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.username) setUsername(data.username);
          if (data.avatar_url !== undefined) setAvatarUrl(data.avatar_url);
        }
      } catch (e) {
        console.warn('Error fetching settings profile:', e);
      }
    };
    fetchProfile();
  }, [user?.id]);


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error during signOut:', e);
    }
    window.history.replaceState({}, document.title, '/');
    window.location.href = '/';
  };

  const handleOpenDeleteModal = async () => {
    if (!user?.id) return;
    try {
      // Check for any unsettled bills or unpaid shares
      const { data: bills } = await supabase
        .from('bills')
        .select('id, status, creator_id, participants(*)');

      const userBills = (bills || []).filter((b: any) => {
        const parts = b.participants || [];
        return b.creator_id === user.id || parts.some((p: any) => p.friend_id === user.id);
      });

      const unsettled = userBills.filter((b: any) => {
        if (b.status === 'Settled') return false;
        const isCreator = b.creator_id === user.id;
        const parts = b.participants || [];
        if (isCreator) {
          return parts.some((p: any) => !p.paid);
        } else {
          const userPart = parts.find((p: any) => p.friend_id === user.id);
          return userPart && !userPart.paid;
        }
      });

      setUnsettledBillsCount(unsettled.length);
    } catch (err) {
      console.warn('Error checking balance before account deletion:', err);
      setUnsettledBillsCount(0);
    } finally {
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    try {
      const userId = user.id;
      // 1. Try Supabase RPC function first
      const { error: rpcErr } = await supabase.rpc('delete_user_account', { p_user_id: userId });

      if (rpcErr) {
        // Fallback: direct client-authenticated cleanup (where auth.uid() == userId satisfies Supabase RLS)
        // A. Delete friend records in both directions
        await supabase.from('friends').delete().eq('user_id', userId);
        await supabase.from('friends').delete().eq('friend_id', userId);

        // B. Delete participant entries where user is a participant
        await supabase.from('participants').delete().eq('friend_id', userId);

        // C. Delete bills created by user and their participant records
        const { data: userBills } = await supabase.from('bills').select('id').eq('creator_id', userId);
        if (userBills && userBills.length > 0) {
          const billIds = userBills.map(b => b.id);
          await supabase.from('participants').delete().in('bill_id', billIds);
          await supabase.from('bills').delete().eq('creator_id', userId);
        }

        // D. Delete profile from public.profiles
        await supabase.from('profiles').delete().eq('id', userId);
      }

      // 2. Call backend for server-side auth deletion and secondary cleanup
      try {
        await api.deleteAccount(userId);
      } catch (backendErr) {
        console.warn('Backend deleteAccount notice:', backendErr);
      }

      // 3. Sign out and redirect cleanly to home/login
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout after delete:', e);
      }
      window.history.replaceState({}, document.title, '/');
      window.location.href = '/';
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      alert(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (view === 'account') {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-0 md:pt-6 transition-colors font-['Sora']">
        
        {/* Top Header Container with Back Button & 3-Dots Menu */}
        <div className="max-w-[480px] md:max-w-2xl mx-auto px-6 md:px-10 pt-6 pb-2">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('main')} 
                className="w-8 h-8 flex items-center justify-center -ml-2 cursor-pointer text-[#1A1A1A] dark:text-zinc-100 hover:text-black dark:hover:text-white transition-colors"
                title="Go back"
              >
                <ChevronLeft size={32} strokeWidth={2.5} />
              </button>
              <h1 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl md:text-3xl font-bold font-display tracking-tight leading-none">Your Account</h1>
            </div>

            {/* 3-Dots Options Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                title="Options"
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                  isMenuOpen 
                    ? 'bg-black/15 dark:bg-white/20 text-black dark:text-white' 
                    : 'bg-black/5 dark:bg-zinc-800 text-black/70 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-zinc-700'
                }`}
              >
                <MoreVertical size={18} strokeWidth={2.3} />
              </button>

              {/* Animated Dropdown Menu Popup */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-1.5 z-50 origin-top-right transition-all animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleOpenDeleteModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-[0.98] transition-all cursor-pointer text-left"
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    <span>Delete Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 md:px-10 flex flex-col gap-3 mt-1">
          {/* Profile Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 flex flex-col items-center shadow-sm relative border border-black/5 dark:border-white/5">
            <div className="relative mb-4">
              <Avatar 
                src={avatarUrl} 
                name={fullName} 
                className="w-24 h-24 text-3xl font-bold" 
              />
              <button
                onClick={() => setIsChangeDPOpen(true)}
                title="Change Photo"
                className="absolute bottom-0 right-0 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-950 p-2 rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-white dark:border-zinc-900"
              >
                <ImageIcon size={14} />
              </button>
            </div>
            
            <h2 className="text-[#1A1A1A] dark:text-zinc-100 text-2xl font-bold mb-1 text-center font-['Sora']">{fullName}</h2>
            {username && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10 text-black/60 dark:text-zinc-400 mb-1.5">
                @{username.replace(/^@/, '')}
              </span>
            )}
            <p className="text-black/50 dark:text-zinc-400 text-xs sm:text-sm font-normal">{user?.email}</p>
          </div>

          {/* Options Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-4 mb-3 flex flex-col gap-1 border border-black/5 dark:border-white/5 shadow-sm">
            <button 
              onClick={() => setIsChangeNameOpen(true)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-black/5 dark:hover:bg-zinc-800/60 rounded-[24px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center text-[#1A1A1A] dark:text-zinc-300">
                  <Edit3 size={18} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-[#1A1A1A] dark:text-zinc-100">Change Name</span>
              </div>
              <ChevronRight size={18} className="text-black/30 dark:text-zinc-600" />
            </button>

            <button 
              onClick={() => setIsChangeUsernameOpen(true)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-black/5 dark:hover:bg-zinc-800/60 rounded-[24px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center text-[#1A1A1A] dark:text-zinc-300">
                  <AtSign size={18} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-[#1A1A1A] dark:text-zinc-100">Change Username</span>
              </div>
              <ChevronRight size={18} className="text-black/30 dark:text-zinc-600" />
            </button>
            
            <button 
              onClick={() => setIsChangeDPOpen(true)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-black/5 dark:hover:bg-zinc-800/60 rounded-[24px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center text-[#1A1A1A] dark:text-zinc-300">
                  <ImageIcon size={18} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-[#1A1A1A] dark:text-zinc-100">Change DP</span>
              </div>
              <ChevronRight size={18} className="text-black/30 dark:text-zinc-600" />
            </button>
          </div>

          {/* Log Out Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 hover:bg-red-50/50 dark:hover:bg-zinc-800/60 transition-colors py-4 rounded-[35px] cursor-pointer border border-black/5 dark:border-white/5 shadow-sm active:scale-[0.99]"
          >
            <LogOut size={18} />
            <span className="text-sm sm:text-base font-semibold">Log Out</span>
          </button>
        </div>

        {/* Change DP Modal */}
        <ChangeDPModal
          isOpen={isChangeDPOpen}
          onClose={() => setIsChangeDPOpen(false)}
          session={session}
          currentAvatarUrl={avatarUrl}
          onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
        />

        {/* Change Name Modal */}
        <ChangeNameModal
          isOpen={isChangeNameOpen}
          onClose={() => setIsChangeNameOpen(false)}
          session={session}
          currentName={fullName}
          onNameUpdated={(newName) => setFullName(newName)}
        />

        {/* Change Username Modal */}
        <SetUsernameModal
          isOpen={isChangeUsernameOpen}
          onClose={() => setIsChangeUsernameOpen(false)}
          canClose={true}
          session={session}
          onUsernameSet={(newUsername) => {
            setUsername(newUsername);
            setIsChangeUsernameOpen(false);
          }}
        />

        {/* Delete Account Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDeleteAccount}
          title={unsettledBillsCount > 0 ? "Cannot Delete Account" : "Delete Account"}
          description={
            unsettledBillsCount > 0
              ? `You have ${unsettledBillsCount} unsettled bill${unsettledBillsCount === 1 ? '' : 's'}. Settle all balances before deleting your account.`
              : 'Are you sure you want to permanently delete your account? All your bills, friend connections, and profile data will be removed.'
          }
          confirmText="Delete Account"
          isBlocked={unsettledBillsCount > 0}
          isLoading={isDeleting}
          itemType="friend"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-0 md:pt-6 transition-colors font-['Sora']">
      
      {/* Top Header Container */}
      <div className="px-6 pt-10 pb-4 h-[88px] flex justify-between items-center max-w-[480px] md:max-w-2xl mx-auto md:px-0">
        <h1 className="text-black dark:text-zinc-100 text-4xl md:text-5xl font-bold font-display tracking-tight leading-none">Settings</h1>
      </div>
      
      <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 md:px-10">
        <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-4 flex flex-col gap-2 mt-2 shadow-sm border border-black/5 dark:border-white/5">
        <button 
          onClick={() => setView('account')}
          className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-zinc-800/60 rounded-[24px] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center">
              <UserIcon size={18} className="text-black/80 dark:text-zinc-300" />
            </div>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your Account</span>
          </div>
          <ChevronRight size={18} className="text-black/30 dark:text-zinc-600" />
        </button>
        
        <div className="w-full flex items-center justify-between p-4 bg-transparent rounded-[24px]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-zinc-800 flex items-center justify-center">
              <Moon size={18} className="text-black/80 dark:text-zinc-300" />
            </div>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Dark Mode</span>
          </div>
          <button 
            onClick={() => onThemeChange?.(!isDarkTheme)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center cursor-pointer ${isDarkTheme ? 'bg-[#1A1A1A] dark:bg-zinc-600' : 'bg-zinc-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 ease-in-out ${isDarkTheme ? 'translate-x-[20px]' : 'translate-x-0'}`} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
