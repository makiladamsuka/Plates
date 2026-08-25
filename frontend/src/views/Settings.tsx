import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronRight, User as UserIcon, Moon, ChevronLeft, Edit3, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ChangeDPModal } from '../components/ChangeDPModal';
import { ChangeNameModal } from '../components/ChangeNameModal';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unsettledBillsCount, setUnsettledBillsCount] = useState(0);

  const user = session?.user;
  const [fullName, setFullName] = useState<string>(() => user?.user_metadata?.full_name || user?.email || 'User');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => user?.user_metadata?.avatar_url || null);

  // Sync internal state when initialView prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  // Fetch latest profile info from profiles table
  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          if (data.full_name) setFullName(data.full_name);
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

      // 1. Direct client-authenticated cleanup (where auth.uid() == userId satisfies Supabase RLS)
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

  const initial = (fullName || 'U').trim()[0]?.toUpperCase() || 'U';

  if (view === 'account') {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 pb-32 pt-0 md:pt-6 transition-colors font-['Sora']">
        
        {/* Top Header Container */}
        <div className="px-6 pt-10 pb-4 h-[88px] flex items-center gap-2 max-w-[480px] md:max-w-2xl mx-auto md:px-0 md:hidden">
          <button onClick={() => setView('main')} className="flex items-center justify-center w-8 h-8 -ml-2 shrink-0 cursor-pointer text-[#1A1A1A] dark:text-zinc-100 hover:text-black dark:hover:text-white transition-colors">
            <ChevronLeft size={32} strokeWidth={2.5} />
          </button>
          <h1 className="text-black dark:text-zinc-100 text-4xl md:text-5xl font-bold font-display tracking-tight leading-none">Your Account</h1>
        </div>

        <div className="max-w-[480px] md:max-w-2xl mx-auto px-5 md:px-10 flex flex-col gap-3 mt-2 md:pt-10">
          <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-8 flex flex-col items-center shadow-sm relative">
            <div className="relative mb-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/10" />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-3xl font-bold">{initial}</span>
                </div>
              )}
              <button
                onClick={() => setIsChangeDPOpen(true)}
                title="Change Photo"
                className="absolute bottom-0 right-0 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 p-2 rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <ImageIcon size={14} />
              </button>
            </div>
            
            <h2 className="text-zinc-900 dark:text-zinc-100 text-2xl font-bold font-display mb-1 text-center">{fullName}</h2>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">{user?.email}</p>
          </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[35px] p-4 mb-6 flex flex-col gap-2">
          <button 
            onClick={() => setIsChangeNameOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <Edit3 size={18} className="text-gray-700 dark:text-zinc-300" />
              </div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Change Name</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
          </button>
          
          <button 
            onClick={() => setIsChangeDPOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-[24px] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <ImageIcon size={18} className="text-gray-700 dark:text-zinc-300" />
              </div>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Change DP</span>
            </div>
            <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600" />
          </button>
          
          <button 
            onClick={handleOpenDeleteModal}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[24px] transition-colors group cursor-pointer"
          >
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
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors py-4 rounded-[35px] cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-base font-semibold">Log Out</span>
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

        {/* Delete Account Modal */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDeleteAccount}
          title="Delete Account"
          description={
            unsettledBillsCount > 0
              ? "You cannot delete your account while you have active, unsettled bills or balances with friends. Please settle all bills first."
              : "Are you sure you want to permanently delete your Plates account? All your profile data, friendships, and bill records will be permanently removed."
          }
          confirmText="Delete Account"
          isBlocked={unsettledBillsCount > 0}
          blockedReason={`You have ${unsettledBillsCount} unsettled bill(s). All payments and debts with every friend must be 0 before deleting your account.`}
          isLoading={isDeleting}
          itemType="friend"
        />
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
