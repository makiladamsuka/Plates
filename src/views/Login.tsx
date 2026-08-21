import { useState } from 'react';
import { supabase } from '../lib/supabase';

// List of background / hero images located in public/welcome-heroes/
// You can add more image paths here as you paste new photos (.jpeg, .jpg, .png) into public/welcome-heroes/
const HERO_IMAGES = [
  '/welcome-heroes/hero-1.jpeg',
  '/welcome-heroes/hero-2.jpeg',
];

interface LoginProps {
  onGuestLogin?: () => void;
}

export function Login({ onGuestLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Randomly pick one hero image on each load / refresh
  const [heroImage, setHeroImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    return HERO_IMAGES[randomIndex];
  });

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
    <div className="min-h-screen w-full bg-[#FBFBFA] text-[#1A1A1A] flex flex-col md:flex-row selection:bg-[#F5C744]/30">

      {/* ── MOBILE ONLY: Full-width stretched image on top ── */}
      <div className="md:hidden w-full h-64 sm:h-80 relative overflow-hidden flex-shrink-0 border-b border-black/5 bg-gray-100">
        <img
          src={heroImage}
          alt="Plates Dining Friends"
          className="w-full h-full object-cover"
          loading="eager"
          onError={() => setHeroImage('/welcome-heroes/hero-1.jpeg')}
        />
      </div>

      {/* ── Left Half: Notion Dot-Grid + Brand, Slogan, Description & Buttons ── */}
      <div className="w-full md:w-1/2 min-h-[calc(100vh-16rem)] md:min-h-screen p-6 sm:p-10 md:p-12 lg:p-16 xl:p-20 flex flex-col justify-between relative bg-[#FDFDFD] [background-image:radial-gradient(#e5e7eb_1.3px,transparent_1.3px)] [background-size:24px_24px] overflow-hidden">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#F5C744]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#4C8C3C]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Logo & Status Pill */}
        <div className="relative z-10 flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F5C744] rounded-2xl flex items-center justify-center shadow-xs border border-black/5 rotate-[-3deg] transition-transform hover:rotate-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-[#1A1A1A]">Plates</span>
          </div>

          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold font-sans-app bg-white border border-black/5 text-gray-600 shadow-2xs">
            ✨ Social Bill Splitting
          </span>
        </div>

        {/* Center: Slogan & Action Area */}
        <div className="relative z-10 my-auto max-w-lg">
          {/* Slogan & Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold font-display tracking-tight text-[#1A1A1A] leading-[1.12] mb-4 md:mb-6">
            Eat together.<br />
            Settle later.
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-base sm:text-lg lg:text-xl font-sans-app leading-relaxed mb-8 md:mb-10">
            The easiest way to track shared meals, split food tabs in real-time, and settle balances without the math headaches.
          </p>

          {/* Buttons */}
          <div className="space-y-3.5 max-w-md">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 active:scale-[0.99] disabled:opacity-70 cursor-pointer font-sans-app"
            >
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-2xs">
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

            {/* Guest Mode */}
            {onGuestLogin && (
              <button
                onClick={onGuestLogin}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold font-sans-app border border-gray-200 shadow-2xs transition-all cursor-pointer"
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
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-8 mt-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 font-sans-app border-t border-black/5 gap-2">
          <span>© 2026 Plates • Free to use</span>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 transition">Privacy</span>
            <span>•</span>
            <span className="hover:text-gray-600 transition">Terms</span>
          </div>
        </div>

      </div>

      {/* ── Right Half: Desktop Full-Bleed 50% Photo Panel ── */}
      <div className="hidden md:block md:w-1/2 min-h-screen h-screen sticky top-0 relative overflow-hidden border-l border-black/10 bg-gray-100">
        <img
          src={heroImage}
          alt="Plates Dining Friends"
          className="w-full h-full object-cover"
          loading="eager"
          onError={() => setHeroImage('/welcome-heroes/hero-1.jpeg')}
        />
      </div>

    </div>
  );
}

