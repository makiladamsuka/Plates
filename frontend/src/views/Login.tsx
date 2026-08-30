import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resetLoading = () => {
      setIsLoading(false);
    };

    // Any touch, click, focus change, blur, or app switch resets the connecting state
    window.addEventListener('focus', resetLoading);
    window.addEventListener('blur', resetLoading);
    window.addEventListener('pageshow', resetLoading);
    document.addEventListener('visibilitychange', resetLoading);
    window.addEventListener('pointerdown', resetLoading, { passive: true });
    window.addEventListener('touchstart', resetLoading, { passive: true });
    window.addEventListener('click', resetLoading, { passive: true });

    return () => {
      window.removeEventListener('focus', resetLoading);
      window.removeEventListener('blur', resetLoading);
      window.removeEventListener('pageshow', resetLoading);
      document.removeEventListener('visibilitychange', resetLoading);
      window.removeEventListener('pointerdown', resetLoading);
      window.removeEventListener('touchstart', resetLoading);
      window.removeEventListener('click', resetLoading);
    };
  }, []);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsLoading(true);
      setError(null);

      // Auto-revert back to "Continue with Google" after 1.8s so mobile popup cancellation never leaves it stuck
      setTimeout(() => {
        setIsLoading(false);
      }, 1800);

      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error('[auth] Google OAuth error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-8 lg:p-12 selection:bg-[#F5C744]/30 bg-gradient-to-br from-[#F5C744]/30 via-[#f0f4ea] to-[#1A1A1A]/90 relative overflow-hidden bg-[#F0F0F4]">
      
      {/* Decorative ambient blurred blobs behind the card */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#F5C744]/30 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 -translate-y-1/4 hidden md:block" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#4C8C3C]/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4 hidden md:block" />

      {/* Main Card Container */}
      <div className="relative w-full max-w-[1200px] bg-[#FDF6E6] md:bg-white rounded-none sm:rounded-3xl md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-screen sm:min-h-0 md:h-[720px] z-10">
        
        {/* ── Left Panel: Desktop Only (Logo & Illustration) ── */}
        <div className="hidden md:flex w-full md:w-[50%] p-6 pt-10 md:p-16 flex-col bg-[#FDF6E6]">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8 justify-center md:justify-start">
            <img src="/logo.svg" alt="Plates logo" className="w-10 h-10 md:w-14 md:h-14 rounded-[22.5%] shrink-0 shadow-sm" />
            <span className="text-3xl md:text-4xl font-bold font-display tracking-tight text-[#1A1A1A]">Plates</span>
          </div>
          
          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center p-2 md:p-4 mt-4 md:mt-0">
            <img
              src="/welcom-hero.jpeg"
              alt="Plates Welcome Graphic"
              className="w-full max-w-[260px] sm:max-w-[320px] md:max-w-[520px] h-auto object-contain"
              loading="eager"
            />
          </div>
        </div>

        {/* ── Right Panel: Form + Mobile Full Layout ── */}
        <div className="w-full md:w-[50%] px-6 py-10 md:p-16 flex flex-col items-center justify-center md:items-start bg-transparent md:bg-gray-50/80 relative flex-1">
          
          {/* Mobile Only: Top Logo */}
          <div className="md:hidden flex items-center gap-3 mb-10 w-full justify-center">
            <img src="/logo.svg" alt="Plates logo" className="w-16 h-16 rounded-[22.5%] shadow-md" />
            <span className="text-[56px] leading-none font-extrabold font-display tracking-tight text-[#1A1A1A]">Plates</span>
          </div>

          <div className="max-w-md mx-auto md:mx-0 w-full flex flex-col items-center md:items-start">
            
            {/* Desktop Only: "Login" Title */}
            <h2 className="hidden md:block text-3xl md:text-[44px] font-bold text-gray-900 mb-6 md:mb-8 font-display text-center md:text-left">Login</h2>
            
            {/* Slogan (Mobile Headline) */}
            <h3 className="text-[28px] sm:text-3xl md:text-4xl font-bold font-display tracking-tight text-[#1A1A1A] leading-[1.25] mb-3 md:mb-5 text-center md:text-left">
              Eat together.<br className="hidden md:block"/> Settle later.
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-[15px] sm:text-base md:text-lg font-sans-app leading-relaxed mb-6 md:mb-12 max-w-[420px] text-center md:text-left mx-auto md:mx-0">
              The easiest way to track shared meals, split food tabs in real-time, and settle balances without the math headaches.
            </p>

            {/* Mobile Only: Illustration */}
            <div className="md:hidden w-full flex items-center justify-center p-2 mb-8 mt-2">
              <img
                src="/welcom-hero.jpeg"
                alt="Plates Welcome Graphic"
                className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain"
                loading="eager"
              />
            </div>

            {/* Google Sign In Button */}
            <div className="w-full max-w-[400px] mx-auto md:mx-0">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-[56px] md:h-[64px] bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-full flex items-center gap-3 md:gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/10 active:scale-[0.99] cursor-pointer font-sans-app px-2 md:px-2.5"
              >
                <div className="w-[40px] h-[40px] md:w-[46px] md:h-[46px] bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <svg width="22" height="22" className="md:w-6 md:h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <span className="text-[16px] md:text-[18px] font-semibold tracking-wide flex-1 text-center pr-[48px] md:pr-[56px]">
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </button>
              
              {error && (
                <p className="text-red-500 text-sm font-medium font-sans-app mt-3 text-center">{error}</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
