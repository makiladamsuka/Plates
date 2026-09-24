import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncUserProfile } from '../lib/profileSync';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const isPopup = Boolean(
      (window.opener && window.opener !== window) ||
      window.name === 'google_oauth_popup' ||
      window.name.includes('popup')
    );

    const notifyAndClose = () => {
      // 1. Post message to window.opener if available
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
        } catch (e) {}
      }

      // 2. Broadcast across tabs via BroadcastChannel
      try {
        const authChannel = new BroadcastChannel('plates_auth_channel');
        authChannel.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' });
        authChannel.close();
      } catch (e) {}

      // 3. Set localStorage trigger for cross-tab sync
      try {
        localStorage.setItem('plates_auth_timestamp', Date.now().toString());
      } catch (e) {}

      // 4. If this is a popup, close it immediately
      if (isPopup) {
        window.close();
        // Additional ticks in case the browser delayed
        setTimeout(() => {
          window.close();
        }, 150);
        setTimeout(() => {
          window.close();
        }, 500);
        return;
      }

      // 5. If main window, navigate to root
      if (isMounted) {
        window.history.replaceState({}, document.title, '/');
        navigate('/', { replace: true });
      }
    };

    const handleAuthSuccess = async (user?: any) => {
      if (user) {
        try {
          await syncUserProfile(user);
        } catch (e) {
          console.warn('[AuthCallback] profile sync notice:', e);
        }
      }

      if (isMounted) {
        setIsDone(true);
      }

      notifyAndClose();
    };

    const processAuth = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      
      const errorMsg = searchParams.get('error_description') || searchParams.get('error') || hashParams.get('error_description') || hashParams.get('error');
      if (errorMsg) {
        if (isMounted) setError(errorMsg);
        return;
      }

      const code = searchParams.get('code');
      const hasAccessToken = hashParams.has('access_token');
      const credential = searchParams.get('credential') || searchParams.get('id_token') || hashParams.get('credential') || hashParams.get('id_token');

      // Check for Google Identity Services redirected ID token credential
      if (credential) {
        try {
          const rawNonce = sessionStorage.getItem('raw_nonce') || undefined;
          const { data, error: idTokenError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
            nonce: rawNonce,
          });
          if (!idTokenError && data.session) {
            await handleAuthSuccess(data.session.user);
            return;
          }
        } catch (e) {
          console.warn('[AuthCallback] signInWithIdToken notice:', e);
        }
      }

      // Check for PKCE authorization code in query params
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && data.session) {
            await handleAuthSuccess(data.session.user);
            return;
          }
        } catch (e) {
          console.warn('[AuthCallback] exchangeCodeForSession notice:', e);
        }
      }

      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthSuccess(session.user);
        return;
      }

      // If no code/tokens and no session
      if (!code && !hasAccessToken && !credential) {
        if (isPopup) {
          window.close();
          return;
        }
        if (isMounted) {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
      }
    };

    processAuth();

    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        await handleAuthSuccess(session.user);
      }
    });

    // Safety fallback timeout
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthSuccess(session.user);
      } else if (isMounted) {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hasAuthParams = searchParams.has('code') || hashParams.has('access_token');

        if (hasAuthParams) {
          setError('Authentication timed out. Please try logging in again.');
        } else if (isPopup) {
          window.close();
        } else {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
      }
    }, 4000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6 font-['Sora']">
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 max-w-sm w-full text-center shadow-lg border border-black/5 dark:border-white/5">
          <div className="text-red-500 font-semibold mb-2 text-base">Sign In Failed</div>
          <div className="text-black/60 dark:text-zinc-400 text-xs mb-6">{error}</div>
          <button
            onClick={() => {
              if (window.opener || window.name === 'google_oauth_popup') {
                window.close();
              } else {
                navigate('/', { replace: true });
              }
            }}
            className="w-full bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-full font-semibold text-sm cursor-pointer active:scale-95 transition-transform"
          >
            {window.opener || window.name === 'google_oauth_popup' ? 'Close Window' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-6 font-['Sora']">
        <div className="w-10 h-10 border-3 border-black/10 dark:border-white/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-black/80 dark:text-zinc-200 text-sm font-medium">
          Sign-in successful. Closing window...
        </p>
        <button
          onClick={() => window.close()}
          className="text-xs text-black/50 dark:text-zinc-400 underline hover:text-black dark:hover:text-white cursor-pointer mt-2"
        >
          Click here if window does not close automatically
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 font-['Sora']">
      <div className="w-10 h-10 border-3 border-black/10 dark:border-white/10 border-t-[#F5C744] rounded-full animate-spin" />
      <p className="text-black/60 dark:text-zinc-400 text-sm font-medium">
        Connecting to Plates...
      </p>
    </div>
  );
}

