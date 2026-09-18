import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Zap, Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '201004734198-3r780q0v3irrd2cbijaj2onq06dqkpq6.apps.googleusercontent.com'
).trim();

/**
 * Generates a cryptographic nonce (raw + SHA-256 hex digest)
 * per Supabase Auth specification for Google Identity Services.
 */
async function generateNonce(): Promise<[string, string]> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [nonce, hashedNonce];
}

export function Login() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [error, setError] = useState<string | null>(null);
  const rawNonceRef = useRef<string>('');
  const plate1Ref = useRef<HTMLDivElement>(null);
  const plate2Ref = useRef<HTMLDivElement>(null);

  const initiateOAuthPopup = async (mode: 'signup' | 'signin' = 'signup') => {
    try {
      setAuthMode(mode);
      setIsSpinning(true);
      setError(null);

      const baseUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, '');
      const redirectUrl = `${baseUrl}/auth/callback`;

      // Center the popup window on the screen
      const width = 500;
      const height = 620;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      const popup = window.open(
        'about:blank',
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError || !data?.url) {
        if (popup && !popup.closed) popup.close();
        throw authError || new Error('Failed to get Google sign-in URL.');
      }

      if (popup) {
        popup.location.href = data.url;

        // Monitor popup close to cleanly reset loading spinner
        const timer = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(timer);
            setIsSpinning(false);
          }
        }, 500);
      } else {
        // If popup blocker intervened, fall back to top-level redirect
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('[auth] OAuth popup error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsSpinning(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Subtle parallax effect on macro-plate backgrounds
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      if (plate1Ref.current) {
        plate1Ref.current.style.transform = `translate(${x * -20}px, ${y * -20}px)`;
      }
      if (plate2Ref.current) {
        plate2Ref.current.style.transform = `translate(${x * 25}px, ${y * 25}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const setupGoogleIdentity = async () => {
      try {
        const [rawNonce, hashedNonce] = await generateNonce();
        rawNonceRef.current = rawNonce;
        try {
          sessionStorage.setItem('raw_nonce', rawNonce);
        } catch (e) {}

        const checkGsi = () => {
          if (!isMounted) return;

          if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
            const googleAccounts = (window as any).google.accounts.id;
            const baseUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, '');
            const loginUri = `${baseUrl}/auth/callback`;

            try {
              googleAccounts.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response: any) => {
                  try {
                    setIsSpinning(true);
                    setError(null);

                    if (!response?.credential) {
                      throw new Error('No credential received from Google.');
                    }

                    const { error: authError } = await supabase.auth.signInWithIdToken({
                      provider: 'google',
                      token: response.credential,
                      nonce: rawNonceRef.current,
                    });

                    if (authError) throw authError;
                  } catch (err: any) {
                    console.error('[auth] Google One Tap sign-in error:', err);
                    setError(err.message || 'Google sign-in failed. Please try again.');
                    setIsSpinning(false);
                  }
                },
                ux_mode: 'redirect',
                login_uri: loginUri,
                nonce: hashedNonce,
                use_fedcm_for_prompt: true,
                auto_select: false,
              });

              // Prompt One Tap / FedCM prompt
              try {
                googleAccounts.prompt();
              } catch (promptErr) {
                console.warn('[auth] GSI prompt notice:', promptErr);
              }
            } catch (initErr) {
              console.warn('[auth] GSI initialize notice:', initErr);
            }
          } else {
            setTimeout(checkGsi, 150);
          }
        };

        checkGsi();
      } catch (err: any) {
        console.warn('[auth] GSI setup notice:', err);
      }
    };

    setupGoogleIdentity();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        setIsSpinning(false);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      isMounted = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="h-[100dvh] max-h-screen bg-[#0F0F11] text-[#F3F4F6] flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] selection:bg-white selection:text-black relative overflow-hidden select-none">
      {/* Subtle Noise Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Macro Plate Glowing Background 1 (Top-Right) */}
      <div 
        ref={plate1Ref}
        className="fixed -top-[20vh] -right-[20vw] w-[80vw] h-[80vw] rounded-full pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)',
          border: '1px solid rgba(255,255,255,0.03)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
        }}
      />

      {/* Macro Plate Glowing Background 2 (Bottom-Left) */}
      <div 
        ref={plate2Ref}
        className="fixed -bottom-[30vh] -left-[10vw] w-[60vw] h-[60vw] rounded-full pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 70%)',
          border: '1px solid rgba(255,255,255,0.015)',
        }}
      />

      {/* Navigation Header */}
      <header className="w-full px-6 py-4 md:px-12 md:py-6 flex justify-between items-center z-10 relative max-w-7xl mx-auto shrink-0">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.svg" 
            alt="Plates logo" 
            className="w-9 h-9 rounded-[22.5%] shadow-sm"
          />
          <span className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">Plates</span>
        </div>
        
        <button 
          onClick={() => initiateOAuthPopup('signup')}
          disabled={isSpinning}
          className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
        >
          Sign Up
        </button>
      </header>

      {/* Main Content Area (Comfortably fits in one viewport without scroll) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-2 z-10 relative shrink min-h-0">
        <div className="max-w-2xl w-full text-center space-y-6 md:space-y-8">
          
          {/* Logo Mark */}
          <div className="flex justify-center">
            <img 
              src="/logo.svg" 
              alt="Plates" 
              className="w-28 h-28 md:w-36 md:h-36 rounded-[22.5%] shadow-2xl object-contain"
            />
          </div>

          {/* Typography & Copy */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.12]">
              Split the bill,<br/> 
              <span className="text-[#9CA3AF] italic font-normal">not the friendship.</span>
            </h1>
            <p className="text-sm md:text-base text-[#9CA3AF] max-w-md mx-auto font-medium leading-relaxed">
              The elegant way to divide dining tabs, track shared expenses, and settle up with zero friction.
            </p>
          </div>

          {/* Single Google Sign Up Button */}
          <div className="flex justify-center pt-2">
            <button 
              onClick={() => initiateOAuthPopup('signup')}
              disabled={isSpinning}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#F9F9F9] hover:bg-[#E5E7EB] text-[#0F0F11] font-semibold rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm md:text-base flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-80"
            >
              {isSpinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{authMode === 'signup' ? 'Signing Up...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium mt-2">{error}</p>
          )}

          {/* Social Proof / Mini Stats */}
          <div className="pt-4 flex items-center justify-center gap-6 text-xs font-medium text-[#9CA3AF]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2A2A2E]" />
              <span>Secure & Private</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#2A2A2E]" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2A2A2E]" />
              <span>Instant Settlements</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#9CA3AF] z-10 relative shrink-0">
        <p>&copy; {new Date().getFullYear()} Plates App. All rights reserved.</p>
      </footer>
    </div>
  );
}
