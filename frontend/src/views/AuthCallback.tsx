import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * AuthCallback – handles the OAuth redirect from Supabase/Google.
 *
 * When the user is redirected back to /auth/callback#access_token=...,
 * the Supabase client automatically picks up the tokens from the URL hash.
 * This component listens for that event and navigates to the app once
 * the session is established.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthCallback] Component mounted');
    console.log('[AuthCallback] Current URL:', window.location.href);
    console.log('[AuthCallback] URL Hash:', window.location.hash);
    console.log('[AuthCallback] URL Search:', window.location.search);

    // Listen for the auth state change that fires when Supabase
    // processes the tokens in the URL hash fragment.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthCallback] Auth event fired: ${event}`);
      console.log(`[AuthCallback] Session present:`, !!session);
      
      // SIGNED_IN fires once the tokens have been exchanged for a session
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthCallback] Successfully signed in, navigating to /');
        // Navigate to the home/dashboard page, replacing the callback URL
        // in history so the user can't "back" into it.
        navigate('/', { replace: true });
      }
    });

    // Safety net: if onAuthStateChange doesn't fire within 5 seconds,
    // check if we already have a session (e.g. from a page refresh).
    const timeout = setTimeout(async () => {
      console.log('[AuthCallback] 5-second timeout reached, checking manual session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('[AuthCallback] Manual session check result:', { hasSession: !!session, error });
      
      if (session) {
        console.log('[AuthCallback] Found session manually, navigating to /');
        navigate('/', { replace: true });
      } else {
        console.error('[AuthCallback] Timeout reached and no session found. Error:', error);
        setError('Authentication timed out. Please try logging in again.');
      }
    }, 5000);

    // Cleanup: unsubscribe listener and clear timeout to prevent memory leaks
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-red-500 font-semibold font-['Sora'] text-center">{error}</div>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 underline font-['Sora'] cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDF1] dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
      {/* Spinner */}
      <div className="w-8 h-8 border-3 border-gray-300 dark:border-zinc-600 border-t-[#F5C744] rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-zinc-400 text-sm font-['Sora']">
        Signing you in...
      </p>
    </div>
  );
}
