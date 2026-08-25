import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { syncUserProfile } from '../lib/profileSync';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '201004734198-3r780q0v3irrd2cbijaj2onq06dqkpq6.apps.googleusercontent.com';

// List of background / hero images located in public/welcome-heroes/
// You can add more image paths here as you paste new photos (.jpeg, .jpg, .png) into public/welcome-heroes/
const HERO_IMAGES = [
  '/welcome-heroes/hero-1.jpeg',
  '/welcome-heroes/hero-2.jpeg',
];

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Randomly pick one hero image on each load / refresh
  const [heroImage, setHeroImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    return HERO_IMAGES[randomIndex];
  });

  const handleIdTokenResponse = useCallback(async (response: any) => {
    if (!response?.credential) return;
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (error) throw error;
      if (data?.session?.user) {
        await syncUserProfile(data.session.user);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initGsi = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleIdTokenResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (err) {
          console.warn('Google Identity initialization notice:', err);
        }
      }
    };

    initGsi();
    const timer = setTimeout(initGsi, 500);
    return () => clearTimeout(timer);
  }, [handleIdTokenResponse]);

  const fallbackOAuth = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });
    if (error) throw error;
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            fallbackOAuth().catch((err: any) => {
              setError(err.message || 'An error occurred during login.');
              setIsLoading(false);
            });
          }
        });
        return;
      }

      await fallbackOAuth();
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    /* Full-screen background with dot-grid texture */
    <div
      className="min-h-screen bg-[#F0F0F4] text-[#1A1A1A] flex items-center justify-center p-4 md:p-8 lg:p-12 selection:bg-[#F5C744]/30"
      style={{
        backgroundImage: 'radial-gradient(#c9cad1 1.2px, transparent 1.2px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Ambient glows on the page background itself */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#F5C744]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#4C8C3C]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container — centered, NOT fullscreen on desktop */}
      <div className="relative w-full max-w-[1100px] bg-white rounded-[40px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.10)] border border-black/[0.06] overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-0 md:h-[680px]">

        {/* ── MOBILE ONLY: Full-width image on top ── */}
        <div className="md:hidden w-full h-60 sm:h-72 bg-[#F7F6F3] relative overflow-hidden flex-shrink-0 border-b border-black/5 flex items-center justify-center p-4">
          <div className="absolute top-[-30%] right-[-20%] w-56 h-56 bg-[#F5C744]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-30%] left-[-20%] w-56 h-56 bg-[#4C8C3C]/15 rounded-full blur-3xl pointer-events-none" />
          <img
            src={heroImage}
            alt="Plates Dining Friends"
            className="w-full h-full object-cover relative z-10"
            loading="eager"
            onError={() => setHeroImage('/welcome-heroes/hero-1.jpeg')}
          />
        </div>

        {/* ── Left Panel: Brand, Headline, Buttons ── */}
        <div className="w-full md:w-[46%] px-8 py-9 sm:px-10 sm:py-10 md:p-14 flex flex-col justify-between flex-1">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-8 md:mb-10">
              <img src="/logo.svg" alt="Plates logo" className="w-11 h-11 rounded-[22.5%] shrink-0" />
              <span className="text-2xl font-bold font-display tracking-tight text-[#1A1A1A]">Plates</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold font-display tracking-tight text-[#1A1A1A] leading-[1.15] mb-4 md:mb-5">
              Eat together.<br />
              Settle later.
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-sm sm:text-base md:text-[17px] font-sans-app leading-relaxed mb-8 md:mb-10 max-w-sm">
              The easiest way to track shared meals, split food tabs in real-time, and settle balances without the math headaches.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3 max-w-sm">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-2xl flex items-center justify-center gap-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 active:scale-[0.99] disabled:opacity-70 cursor-pointer font-sans-app"
            >
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-2xs">
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <span className="text-base font-semibold font-sans-app">
                {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            {error && (
              <p className="text-red-500 text-xs font-medium font-sans-app mt-2 text-center">{error}</p>
            )}

            <p className="text-gray-400 text-xs font-sans-app text-center pt-1">
              Free to use • No credit card required
            </p>
          </div>
        </div>

        {/* ── Right Panel: Desktop Photo in rounded frame ── */}
        <div className="hidden md:flex flex-1 bg-[#F2F2F5] p-6 items-center justify-center relative overflow-hidden border-l border-black/[0.05]"
          style={{
            backgroundImage: 'radial-gradient(#dddee4 1.2px, transparent 1.2px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Ambient glows inside the right panel */}
          <div className="absolute top-[-15%] right-[-15%] w-72 h-72 bg-[#F5C744]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-15%] left-[-15%] w-72 h-72 bg-[#4C8C3C]/12 rounded-full blur-3xl pointer-events-none" />

          {/* Photo Card */}
          <div className="relative w-full max-w-[480px] aspect-square rounded-3xl overflow-hidden shadow-md border border-black/[0.06] bg-white p-3 z-10">
            <img
              src={heroImage}
              alt="Plates Dining Friends"
              className="w-full h-full object-cover rounded-2xl"
              loading="eager"
              onError={() => setHeroImage('/welcome-heroes/hero-1.jpeg')}
            />
          </div>
        </div>

      </div>

      {/* Footer below card */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 text-xs text-gray-400 font-sans-app">
        <span>© 2026 Plates</span>
        <span>•</span>
        <span>Privacy</span>
        <span>•</span>
        <span>Terms</span>
      </div>

    </div>
  );
}
