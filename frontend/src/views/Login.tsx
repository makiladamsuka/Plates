import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Cast, Disc3 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const rawNonceRef = useRef<string>('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const initiateOAuthPopup = async () => {
    try {
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

              if (googleBtnRef.current) {
                googleAccounts.renderButton(googleBtnRef.current, {
                  type: 'standard',
                  theme: 'outline',
                  size: 'large',
                  text: 'continue_with',
                  shape: 'pill',
                  logo_alignment: 'left',
                });
              }
              setIsGsiReady(true);

              // Trigger One Tap / FedCM prompt (Top-right on desktop, bottom-sheet on mobile)
              try {
                googleAccounts.prompt((notification: any) => {
                  if (notification?.isDisplayed?.()) {
                    console.log('[auth] Google One Tap prompt displayed.');
                  } else if (notification?.isNotDisplayed?.()) {
                    console.log(
                      '[auth] Google One Tap not displayed reason:',
                      notification.getNotDisplayedReason?.() || 'unknown'
                    );
                  } else if (notification?.isSkippedMoment?.()) {
                    console.log(
                      '[auth] Google One Tap skipped reason:',
                      notification.getSkippedReason?.() || 'unknown'
                    );
                  } else if (notification?.isDismissedMoment?.()) {
                    console.log(
                      '[auth] Google One Tap dismissed reason:',
                      notification.getDismissedReason?.() || 'unknown'
                    );
                  }
                });
              } catch (promptErr) {
                // Silently handle prompt errors so page never crashes
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
        // Defensive catch for subtle crypto / nonce generation issues
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
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleButtonClick = () => {
    initiateOAuthPopup();
  };

  return (
    <div className="h-[100dvh] bg-[#FFFDF8] flex flex-col font-sans-app relative overflow-hidden text-[#1A1A1A]">
      {/* Background radial gradient glow similar to the reference */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gray-200/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-yellow-200/20 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-6 md:px-12 md:py-8 z-20 relative max-w-[1440px] mx-auto shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Plates logo" className="w-12 h-12 rounded-[22.5%] shadow-sm" />
          <span className="text-3xl font-extrabold font-display tracking-tight text-[#1A1A1A]">Plates</span>
        </div>
        
        {/* Nav Links Removed per single-page focus */}
        
        <div className="flex items-center gap-6">
          <button onClick={handleButtonClick} className="hidden sm:block text-[13px] font-bold tracking-widest text-gray-500 hover:text-black uppercase transition-colors font-sans-app">
            Login
          </button>
          <button onClick={handleButtonClick} className="bg-[#1A1A1A] hover:bg-black text-white text-[13px] tracking-widest uppercase font-bold py-3 px-8 rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 font-sans-app">
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col md:flex-row relative z-10 px-6 md:px-12 lg:px-24">
        
        {/* SVG Decorative Lines (Absolute, behind content) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block" style={{ strokeDasharray: "5 7" }}>
          {/* Top curve */}
          <path d="M 400 120 Q 550 -20, 800 120 T 1100 100" fill="transparent" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" className="opacity-[0.15]" />
          <polygon points="1090,95 1105,100 1090,105" fill="#1A1A1A" className="opacity-70" />
          
          {/* Bottom curve */}
          <path d="M 300 520 Q 500 700, 750 480" fill="transparent" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" className="opacity-[0.15]" />
          <polygon points="305,510 295,520 310,525" fill="#1A1A1A" className="opacity-70" />
        </svg>

        {/* Left Column (Text & Input) */}
        <div className="w-full md:w-[45%] flex flex-col justify-center py-10 z-20 relative">
          <p className="text-[#1A1A1A] font-extrabold text-[13px] tracking-[0.2em] mb-6 uppercase">Settle up smoothly</p>
          
          <h1 className="text-[52px] lg:text-[80px] leading-[1.05] font-display font-extrabold text-[#1a202c] mb-8 tracking-tight">
            Eat together.<br/>
            Settle{' '}
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-[#1A1A1A]">later</span>
              {/* Hand-drawn ellipse effect */}
              <svg className="absolute -inset-2 w-[120%] h-[140%] z-0 text-[#f59e0b] opacity-60" viewBox="0 0 100 50" preserveAspectRatio="none">
                <ellipse cx="50" cy="25" rx="45" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="rotate-[-3deg] origin-center" />
              </svg>
            </span>.
          </h1>
          
          <p className="text-gray-500 font-sans-app font-medium text-lg lg:text-xl max-w-[420px] mb-12 leading-relaxed">
            The easiest way to track shared meals, split food tabs in real-time, and settle balances without the math headaches.
          </p>
          
          {/* Action Container (Mimics the email input + button in reference) */}
          <div className="bg-white rounded-full p-2.5 pl-8 shadow-2xl shadow-black/5 flex items-center justify-between w-full max-w-[540px] h-[88px] relative border border-white/60 backdrop-blur-xl">
             <div className="flex flex-col flex-1 h-full justify-center">
               <span className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-1">Your Account</span>
               <div className="flex items-center -ml-1">
                 <div ref={googleBtnRef} className="min-h-[40px] transform-gpu origin-left scale-[0.85]" />
                 {!isGsiReady && (
                   <span className="text-sm font-semibold text-gray-800 py-2">Loading Google Login...</span>
                 )}
               </div>
             </div>
             
             {/* Sign Up pill to match aesthetic */}
             <button onClick={handleButtonClick} className="hidden sm:flex items-center justify-center bg-[#1A1A1A] hover:bg-black text-white text-[15px] font-bold h-full px-10 rounded-full transition-all shadow-md active:scale-95 font-sans-app">
               Sign Up
             </button>
          </div>
          
          {isSpinning && (
            <p className="text-sm text-[#1A1A1A] mt-6 animate-pulse font-semibold">Signing in with Google...</p>
          )}
          {error && <p className="text-red-500 text-sm mt-6 font-medium">{error}</p>}
        </div>

        {/* Right Column (3D Graphic & Floaties) */}
        <div className="w-full md:w-[55%] flex items-center justify-center relative z-10 min-h-[500px] mt-12 md:mt-0">
          
          {/* The generated 3D image with a large circular background container */}
          <div className="relative w-full max-w-[650px] aspect-square flex items-center justify-center">
            
            {/* The actual image */}
            <img 
              src="/rock_on_hand.jpg" 
              alt="Rock on 3D hand"
              className="w-[110%] h-[110%] max-w-none object-contain mix-blend-multiply drop-shadow-2xl z-10" 
            />

            {/* Floatie 1: Yellow square with cast icon */}
            <div className="absolute top-[15%] left-[10%] w-[72px] h-[72px] bg-[#f2bc3a] rounded-[24px] shadow-2xl flex items-center justify-center z-20 animate-[bounce_4s_infinite]" style={{ boxShadow: '0 20px 40px -10px rgba(242, 188, 58, 0.5)' }}>
               <div className="w-4 h-4 rounded-full bg-white/40 ring-4 ring-white" />
            </div>

            {/* Floatie 2: Yellow square with cast icon on right */}
            <div className="absolute right-[5%] top-[45%] w-[72px] h-[72px] bg-[#f2bc3a] rounded-[24px] shadow-2xl flex items-center justify-center z-20 animate-[bounce_5s_infinite_1s]" style={{ boxShadow: '0 20px 40px -10px rgba(242, 188, 58, 0.5)' }}>
               <Cast className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>

            {/* Floatie 3: Purple circle with play icon */}
            <div className="absolute bottom-[8%] left-[25%] w-20 h-20 bg-[#1A1A1A] rounded-full shadow-2xl flex items-center justify-center z-20 animate-[bounce_6s_infinite_0.5s]" style={{ boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)' }}>
               <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>

            {/* Floatie 4: Mini Player Card */}
            <div className="absolute bottom-[10%] right-[0%] bg-white/90 backdrop-blur-xl rounded-[28px] p-4 pr-6 shadow-2xl flex items-center gap-5 z-30 min-w-[260px] border border-white">
              <div className="w-[52px] h-[52px] bg-gray-50 rounded-full flex items-center justify-center p-2 shadow-inner">
                <div className="w-full h-full bg-[#1A1A1A] rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-[#1a202c] text-[15px] mb-0.5">Top Spenders</p>
                <p className="text-gray-400 font-medium text-[13px]">Last 7 days</p>
              </div>
              <div className="w-12 h-12 bg-[#1A1A1A] rounded-[18px] flex items-center justify-center shadow-lg shadow-black/30">
                 <div className="flex gap-[3px] items-end h-[14px]">
                   <div className="w-1.5 h-[8px] bg-white rounded-full" />
                   <div className="w-1.5 h-[14px] bg-white rounded-full" />
                 </div>
              </div>
            </div>
            
          </div>
          
          {/* Floatie 5: Bottom left Profile/Album */}
          <div className="absolute bottom-[2%] left-[-5%] lg:left-[-15%] z-20 hidden md:block">
            <div className="flex flex-col items-center gap-6">
              <div className="w-[140px] h-[140px] rounded-full border-[8px] border-white shadow-2xl overflow-hidden relative bg-[#1A1A1A] group cursor-pointer hover:scale-105 transition-transform duration-300">
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Disc3 className="w-16 h-16 text-white/90 group-hover:rotate-180 transition-transform duration-1000 ease-out" strokeWidth={1.5} />
                   <div className="absolute w-8 h-8 bg-white rounded-full z-10 shadow-inner" />
                 </div>
              </div>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-xl border border-white text-center">
                 <p className="text-[10px] font-bold text-gray-400 tracking-[0.15em] uppercase mb-1.5">Featured</p>
                 <p className="font-extrabold text-gray-900 text-[15px] leading-snug">New groups<br/>for you</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
