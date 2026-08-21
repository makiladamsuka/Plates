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

  // Friend avatars decorative row
  const avatars = [
    { color: '#FCD3D3', initials: 'A' },
    { color: '#FDD356', initials: 'S' },
    { color: '#D9E8D3', initials: 'T' },
    { color: '#C8D8F0', initials: 'N' },
    { color: '#E5D0F5', initials: 'K' },
  ];

  return (
    /* ── Full-screen wrapper ── */
    <div className="min-h-screen w-full flex flex-col bg-[#F0F6F2]">

      {/* ── TOP: Illustration area (fills ~60% of screen on mobile) ── */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#E8F5EE] via-[#EEF7F2] to-[#F0F6F2]">
        {/* Soft ambient blobs */}
        <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-[#F5C744]/25 rounded-full blur-3xl" />
        <div className="absolute top-[10%] right-[-10%] w-56 h-56 bg-[#4C8C3C]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[20%] w-48 h-48 bg-[#F5C744]/10 rounded-full blur-2xl" />

        {/* Main illustration */}
        <img
          src="/welcome-hero.jpg"
          alt="Plates mascot"
          className="relative z-10 w-full max-w-[340px] md:max-w-[420px] object-contain drop-shadow-xl"
        />
      </div>

      {/* ── BOTTOM: Info + buttons panel ── */}
      <div className="w-full bg-white rounded-t-[36px] px-7 pt-8 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.06)] flex flex-col gap-5">

        {/* Friend avatar row */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2.5">
            {avatars.map((av, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-[#1A1A1A] shadow-sm"
                style={{ backgroundColor: av.color }}
              >
                {av.initials}
              </div>
            ))}
          </div>
          <span className="text-xs font-sans-app text-gray-500 ml-1">
            Join 1,000+ friends splitting bills
          </span>
        </div>

        {/* Title & Slogan */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold font-display text-[#1A1A1A] leading-tight">
            Welcome to Plates
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-sans-app leading-relaxed">
            Split dining bills effortlessly with friends. Track expenses, settle up in seconds.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-medium font-sans-app text-center -mb-2">{error}</p>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-[52px] bg-[#1A1A1A] hover:bg-[#2d2d2d] text-white rounded-2xl flex items-center justify-center gap-3 font-sans-app font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-lg shadow-black/10"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        {/* Guest / Demo mode */}
        {onGuestLogin && (
          <button
            onClick={onGuestLogin}
            className="w-full h-11 text-sm font-semibold font-sans-app text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Explore Demo Mode (No Login)
          </button>
        )}

        <p className="text-gray-400 text-[11px] font-sans-app text-center -mt-2">
          Free to use · No credit card required
        </p>
      </div>

      {/* ── DESKTOP: wrap everything in a centered phone-like container ── */}
      {/* The above layout is mobile-first; on desktop it auto-centers via max-w */}
    </div>
  );
}

