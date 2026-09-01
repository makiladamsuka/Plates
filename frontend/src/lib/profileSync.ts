import { supabase } from './supabase';

// Track in-flight sync promises to prevent concurrent race conditions
const inFlightSyncs = new Map<string, Promise<any>>();

export async function syncUserProfile(user: any) {
  if (!user?.id) return null;

  // Deduplicate if already syncing this user
  if (inFlightSyncs.has(user.id)) {
    return inFlightSyncs.get(user.id);
  }

  const syncPromise = (async () => {
    try {
      // 1. Ensure Supabase auth session is established with a valid token
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        // Wait 250ms for OAuth hash parsing if needed
        await new Promise(resolve => setTimeout(resolve, 250));
        session = (await supabase.auth.getSession()).data.session;
      }

      // 2. Query existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, email')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // If 401 or network issue, retry once after session refresh
        if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('401')) {
          await supabase.auth.refreshSession();
        }
        console.warn('syncUserProfile select notice:', error.message || error);
      }

      if (!data) {
        // Profile does not exist in profiles table (e.g. after deletion and re-login) -> insert it!
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        
        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            username: null,
          }, { onConflict: 'id' })
          .select('id, username, full_name, avatar_url, email')
          .maybeSingle();

        if (upsertError) {
          console.warn('syncUserProfile upsert notice:', upsertError.message || upsertError);
        }

        return {
          ...(newProfile || { id: user.id, email: user.email, full_name: fullName, avatar_url: avatarUrl, username: null }),
          requiresUsername: true,
        };
      }

      return {
        ...data,
        requiresUsername: !data.username || data.username.trim() === '',
      };
    } catch (err: any) {
      console.warn('syncUserProfile exception:', err?.message || err);
      return null;
    } finally {
      inFlightSyncs.delete(user.id);
    }
  })();

  inFlightSyncs.set(user.id, syncPromise);
  return syncPromise;
}

