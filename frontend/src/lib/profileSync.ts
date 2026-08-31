import { supabase } from './supabase';
import { generateUniqueUsername } from './usernameUtils';

export async function syncUserProfile(user: any) {
  if (!user?.id) return;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('syncUserProfile select error:', error);
    }

    if (!data) {
      // Profile does not exist in profiles table (e.g. after deletion and re-login) -> insert it!
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      
      // Generate a unique username for this new profile
      const uniqueUsername = await generateUniqueUsername(fullName, supabase);
      
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        username: uniqueUsername,
      }, { onConflict: 'id' });

      if (upsertError) {
        console.warn('syncUserProfile upsert notice:', upsertError);
      }
    }
  } catch (err) {
    console.warn('syncUserProfile notice:', err);
  }
}
