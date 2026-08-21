import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onGuestLogin?: () => void;
}

export function Login({ onGuestLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center">

      {/* ── Mobile Layout (< md): Full-screen stacked hero + bottom sheet ── */}
      <div className="md:hidden w-full min-h-screen flex flex-col relative overflow-hidden">

        {/* Hero Section: vivid image fills top 58% */}
        <div className="relative flex-shrink-0" style={{ height: '58vh' }}>
          <img
            src="/welcome-hero.jpg"
            alt="Plates Nano Banana Mascot"
            className="w-full h-full object-cover"
          />
          {/* Gradient fade into bottom card */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />

          {/* Floating Feature Preview Cards */}
          <div className="absolute top-8 left-4 right-4 flex flex-col gap-2 pointer-events-none">
            {/* Card 1 */}
            <div className="self-start bg-white/90 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5 border border-white/60">
              <div className="w-7 h-7 bg-[#F5C744] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#1A1A1A] font-sans-app leading-none">Split Instantly</p>
                <p className="text-[9px] text-gray-500 font-sans-app mt-0.5">Divide bills with any group</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="self-end bg-white/90 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5 border border-white/60">
              <div className="w-7 h-7 bg-[#4C8C3C] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#1A1A1A] font-sans-app leading-none">Track Balances</p>
                <p className="text-[9px] text-gray-500 font-sans-app mt-0.5">See who owes what, live</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="self-start bg-white/90 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5 border border-white/60">
              <div className="w-7 h-7 bg-[#1A1A1A] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#1A1A1A] font-sans-app leading-none">Settle Up Fast</p>
                <p className="text-[9px] text-gray-500 font-sans-app mt-0.5">One tap to clear debts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom White Card Sheet */}
        <div className="flex-1 bg-white rounded-t-[32px] -mt-6 px-6 pt-7 pb-8 flex flex-col gap-5 relative z-10">
          {/* App Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#F5C744] rounded-xl flex items-center justify-center shadow-sm rotate-[-3deg]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-xl font-bold font-display text-[#1A1A1A] tracking-tight">Plates</span>
          </div>

          {/* Headline & Description */}
          <div>
            <h1 className="text-[26px] font-extrabold font-display text-[#1A1A1A] leading-[1.2] mb-2">
              Welcome to Plates
            </h1>
            <p className="text-gray-500 text-sm font-sans-app leading-relaxed">
              Split dining bills effortlessly with friends. Track who owes what and settle up in seconds.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 mt-auto">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-[52px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer font-sans-app shadow-lg shadow-black/20"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-base font-semibold">
                {isLoading ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>

            {onGuestLogin && (
              <button
                onClick={onGuestLogin}
                className="w-full h-11 text-gray-500 hover:text-[#1A1A1A] text-sm font-semibold font-sans-app transition-colors cursor-pointer"
              >
                Explore Demo Mode →
              </button>
            )}

            {error && <p className="text-red-500 text-xs font-sans-app text-center">{error}</p>}
          </div>
        </div>
      </div>

      {/* ── Desktop Layout (≥ md): Classic 50/50 split screen ── */}
      <div className="hidden md:flex w-full max-w-5xl bg-white rounded-[36px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden min-h-[640px]">

        {/* Left: Form Panel */}
        <div className="w-1/2 p-12 lg:p-16 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 bg-[#F5C744] rounded-2xl flex items-center justify-center shadow-md shadow-[#F5C744]/30 rotate-[-4deg]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <span className="text-2xl font-bold font-display text-[#1A1A1A]">Plates</span>
            </div>

            <h1 className="text-[40px] lg:text-[46px] font-extrabold font-display text-[#1A1A1A] leading-[1.15] mb-4">
              Welcome to Plates
            </h1>
            <p className="text-gray-500 text-lg font-sans-app leading-relaxed">
              Split dining bills effortlessly with friends. Track who owes what and settle up in seconds.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 hover:shadow-xl hover:shadow-black/15 active:scale-[0.99] disabled:opacity-70 cursor-pointer font-sans-app"
            >
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-base font-semibold">
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            {onGuestLogin && (
              <button
                onClick={onGuestLogin}
                className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold font-sans-app border border-gray-200 transition-all cursor-pointer"
              >
                Explore Demo Mode
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}

            {error && <p className="text-red-500 text-xs font-sans-app text-center">{error}</p>}

            <p className="text-gray-400 text-xs font-sans-app text-center pt-1">
              Free to use • No credit card required
            </p>
          </div>
        </div>

        {/* Right: Hero Image Panel */}
        <div className="w-1/2 bg-[#F5C744]/10 relative overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5C744]/20 via-amber-50 to-[#4C8C3C]/10" />
          <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
            <img
              src="/welcome-hero.jpg"
              alt="Plates Nano Banana Mascot"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
