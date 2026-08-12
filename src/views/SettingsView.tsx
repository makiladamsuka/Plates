import React from 'react';
import { User, Bell, Shield, CreditCard, HelpCircle, LogOut } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="px-4 pb-28 pt-2 space-y-6">
      {/* Profile Card */}
      <div className="bg-[#1a1a1a] text-white rounded-[28px] p-5 flex items-center gap-4 shadow-sm border border-white/5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-black font-extrabold text-xl font-['Sora'] shadow-md">
          MA
        </div>
        <div>
          <h3 className="text-xl font-extrabold font-['Sora']">Makil Adamsuka</h3>
          <p className="text-xs text-gray-400">+94 77 123 4567</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full text-[10px] font-bold">
            Default: LKR
          </span>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-[#d9d9d9] rounded-[28px] p-2 space-y-1 shadow-sm border border-black/5">
        <div className="flex items-center justify-between p-3.5 hover:bg-black/5 rounded-2xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-semibold text-[#1a1a1a]">Account Info</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-black/5 rounded-2xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-semibold text-[#1a1a1a]">Notifications</span>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">Active</span>
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-black/5 rounded-2xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-semibold text-[#1a1a1a]">Payment Methods</span>
          </div>
          <span className="text-xs text-gray-600 font-medium">Bank Transfer</span>
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-black/5 rounded-2xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-semibold text-[#1a1a1a]">Privacy & Security</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 hover:bg-black/5 rounded-2xl cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-gray-800" />
            <span className="text-sm font-semibold text-[#1a1a1a]">Support & FAQ</span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold py-3.5 rounded-full flex items-center justify-center gap-2 text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
