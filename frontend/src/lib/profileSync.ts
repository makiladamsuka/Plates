import { supabase } from './supabase';

// In-flight promise map to prevent parallel duplicate calls
const inFlightSyncs = new Map<string, Promise<any>>();

/**
 * Fetches the active user's profile and checks if they need to set a username.
 * Profile creation is handled automatically on the database by the Supabase PostgreSQL trigger.
 */
export async function syncUserProfile(user: any) {
  if (!user?.id) return null;

  if (inFlightSyncs.has(user.id)) {
    return inFlightSyncs.get(user.id);
  }

  const syncPromise = (async () => {
    try {
      // 1. Ensure authentication session is initialized
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        session = (await supabase.auth.getSession()).data.session;
      }

      // 2. Fetch profile from database (created automatically by SQL trigger)
      let { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email')
        .eq('id', user.id)
        .maybeSingle();

      // If not yet available due to trigger completion timing, wait briefly and retry once
      if (!data && !error) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const retry = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, email')
          .eq('id', user.id)
          .maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('syncUserProfile notice:', error.message || error);
      }

      const hasUsername = Boolean(data?.username && data.username.trim() !== '');

      return {
        ...(data || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          username: null,
        }),
        requiresUsername: !hasUsername,
      };
    } catch (err: any) {
      console.warn('syncUserProfile exception:', err?.message || err);
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        username: null,
        requiresUsername: true,
      };
    } finally {
      inFlightSyncs.delete(user.id);
    }
  })();

  inFlightSyncs.set(user.id, syncPromise);
  return syncPromise;
}
