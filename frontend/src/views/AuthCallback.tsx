import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { syncUserProfile } from '../lib/profileSync';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

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

      // If no OAuth code, token, or credential in URL, instantly redirect to home
      if (!code && !hasAccessToken && !credential) {
        if (isMounted) {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
        return;
      }

      const handleAuthSuccess = async (user?: any) => {
        if (user) {
          try {
            await syncUserProfile(user);
          } catch (e) {
            console.warn('[AuthCallback] profile sync notice:', e);
          }
        }
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
          } catch (e) {}
          setTimeout(() => {
            window.close();
          }, 200);
          return;
        }
        if (isMounted) {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
      };

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

      // Check for session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthSuccess(session.user);
        return;
      }
    };

    processAuth();

    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (session.user) {
          try {
            await syncUserProfile(session.user);
          } catch (e) {}
        }
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
          } catch (e) {}
          setTimeout(() => {
            window.close();
          }, 200);
          return;
        }
        if (isMounted) {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
      }
    });

    // Safety timeout: after 4 seconds, if no session, send to login cleanly
    const timeout = setTimeout(async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hasAuthParams = searchParams.has('code') || hashParams.has('access_token');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isMounted) {
          window.history.replaceState({}, document.title, '/');
          navigate('/', { replace: true });
        }
      } else if (isMounted) {
        if (hasAuthParams) {
          setError('Authentication timed out. Please try logging in again.');
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
            onClick={() => navigate('/', { replace: true })}
            className="w-full bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-full font-semibold text-sm cursor-pointer active:scale-95 transition-transform"
          >
            Back to Login
          </button>
        </div>
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
