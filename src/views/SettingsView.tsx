import React from 'react';
import { User, Bell, Shield, CreditCard, HelpCircle, LogOut, Sun, Moon } from 'lucide-react';

interface SettingsViewProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDark = true, onToggleTheme }) => {
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Profile Card */}
      <div className={`rounded-2xl p-4 flex items-center gap-3.5 shadow-sm border transition-colors ${
        isDark
          ? 'bg-[#14151b] text-white border-white/[0.08]'
          : 'bg-white text-[#0f1015] border-black/[0.08]'
      }`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f5c744] to-amber-500 flex items-center justify-center text-black font-bold text-base font-['Sora'] shadow-md">
          MA
        </div>
        <div>
          <h3 className={`text-base font-bold font-['Sora'] ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
            Makil Adamsuka
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>+94 77 123 4567</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#f5c744]/20 text-[#b3890f] dark:text-[#f5c744] rounded-full text-[9px] font-bold">
            Default: LKR
          </span>
        </div>
      </div>

      {/* Theme Switcher Setting Row */}
      <div className={`rounded-2xl p-3.5 flex items-center justify-between shadow-sm border transition-colors ${
        isDark
          ? 'bg-[#14151b] border-white/[0.08]'
          : 'bg-white border-black/[0.08]'
      }`}>
        <div className="flex items-center gap-2.5">
          {isDark ? <Moon className="w-4 h-4 text-[#f5c744]" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <div>
            <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-[#0f1015]'}`}>
              Appearance
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Switch between Light & Dark Mode
            </span>
          </div>
        </div>

        {/* Theme Toggle Pill */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center p-1 rounded-full border transition-all ${
            isDark
              ? 'bg-[#16171e] border-white/10 text-white'
              : 'bg-neutral-100 border-black/10 text-neutral-800'
          }`}
        >
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
            !isDark ? 'bg-white text-black shadow-sm' : 'text-neutral-400'
          }`}>
            <Sun className="w-3 h-3 text-amber-500" />
            Light
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
            isDark ? 'bg-[#f5c744] text-black shadow-sm' : 'text-neutral-500'
          }`}>
            <Moon className="w-3 h-3" />
            Dark
          </span>
        </button>
      </div>

      {/* Settings Options */}
      <div className={`rounded-2xl p-1.5 space-y-0.5 shadow-sm border transition-colors ${
        isDark
          ? 'bg-[#14151b] border-white/[0.07]'
          : 'bg-white border-black/[0.08]'
      }`}>
        <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <User className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-800'}`}>Account Info</span>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <Bell className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-800'}`}>Notifications</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <CreditCard className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-800'}`}>Payment Methods</span>
          </div>
          <span className={`text-[10px] font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Bank Transfer</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <Shield className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-800'}`}>Privacy & Security</span>
          </div>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
        }`}>
          <div className="flex items-center gap-2.5">
            <HelpCircle className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-neutral-800'}`}>Support & FAQ</span>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <button className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors border border-rose-500/20">
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};


