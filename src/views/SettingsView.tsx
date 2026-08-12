import React from 'react';
import { User, Bell, Shield, CreditCard, HelpCircle, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Profile Card */}
      <div className="bg-[#14151b] text-white rounded-2xl p-4 flex items-center gap-3.5 shadow-sm border border-white/[0.08]">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f5c744] to-amber-500 flex items-center justify-center text-black font-bold text-base font-['Sora'] shadow-md">
          MA
        </div>
        <div>
          <h3 className="text-base font-bold font-['Sora'] text-white">Makil Adamsuka</h3>
          <p className="text-[11px] text-neutral-400">+94 77 123 4567</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#f5c744]/20 text-[#f5c744] rounded-full text-[9px] font-bold">
            Default: LKR
          </span>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-[#14151b] rounded-2xl p-1.5 space-y-0.5 shadow-sm border border-white/[0.07]">
        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-white">Account Info</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-white">Notifications</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-white">Payment Methods</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">Bank Transfer</span>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-white">Privacy & Security</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-medium text-white">Support & FAQ</span>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <button className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors border border-rose-500/20">
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

