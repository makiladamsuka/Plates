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
    // Listen for the auth state change that fires when Supabase
    // processes the tokens in the URL hash fragment.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // SIGNED_IN fires once the tokens have been exchanged for a session
      if (event === 'SIGNED_IN' && session) {
        // Navigate to the home/dashboard page, replacing the callback URL
        // in history so the user can't "back" into it.
        navigate('/', { replace: true });
      }
    });

    // Safety net: if onAuthStateChange doesn't fire within 5 seconds,
    // check if we already have a session (e.g. from a page refresh).
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      } else {
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
