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
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1A1A1A] flex items-center justify-center p-4 sm:p-6 md:p-10 selection:bg-[#F5C744]/30">
      {/* Main Container - 50/50 Split on Desktop, Single Screen Card on Mobile */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Form Panel: Brand, Slogan, Description & Google Sign In */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-14 flex flex-col justify-between">
          <div>
            {/* Top Brand Logo & Mobile Mascot Avatar */}
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#F5C744] rounded-2xl flex items-center justify-center shadow-md shadow-[#F5C744]/30 rotate-[-4deg] transition-transform hover:rotate-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-2xl font-bold font-display tracking-tight text-[#1A1A1A]">Plates</span>
              </div>

              {/* Compact 3D mascot preview visible on Mobile only */}
              <div className="md:hidden w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-emerald-100 bg-[#E9F3EE] p-0.5">
                <img
                  src="/welcome-hero.jpg"
                  alt="Plates Mascot"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Slogan & Headline - Primary Display Font (Playfair Display) */}
            <h1 className="text-2xl sm:text-3xl md:text-[40px] font-extrabold font-display tracking-tight text-[#1A1A1A] leading-[1.2] mb-3 md:mb-4">
              Split dining bills effortlessly with friends.
            </h1>

            {/* Brief Description - Secondary Body Font (Plus Jakarta Sans) */}
            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-sans-app leading-relaxed mb-6 md:mb-8">
              The easiest way to track shared meals, split food tabs in real-time, and settle balances without the math headaches.
            </p>
          </div>

          {/* Action / Login Section */}
          <div className="space-y-3 pt-2 md:pt-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-13 sm:h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer group font-sans-app"
            >
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-base font-semibold font-sans-app">
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            {/* Instant Demo / Guest Mode Button (No Backend Required) */}
            {onGuestLogin && (
              <button
                onClick={onGuestLogin}
                className="w-full h-11 sm:h-12 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold font-sans-app border border-gray-200/80 transition-all cursor-pointer"
              >
                <span>Explore Demo Mode (No Login)</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}

            {error && (
              <p className="text-red-500 text-xs font-medium font-sans-app mt-2 text-center">{error}</p>
            )}

            <p className="text-gray-400 text-xs font-sans-app text-center pt-1">
              Free to use • No credit card required
            </p>
          </div>
        </div>

        {/* Right Side: Custom 3D Illustration Scene (Only on Tablet & Desktop) */}
        <div className="hidden md:flex w-1/2 bg-[#E9F3EE] p-8 md:p-12 items-center justify-center relative overflow-hidden">
          {/* Ambient decorative background blurs */}
          <div className="absolute top-[-20%] right-[-20%] w-60 h-60 bg-[#F5C744]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-20%] w-60 h-60 bg-[#4C8C3C]/20 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Image Artwork */}
          <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-white/60">
            <img
              src="/welcome-hero.jpg"
              alt="Plates 3D Dining Mascot"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

