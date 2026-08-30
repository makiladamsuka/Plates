import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvxyaepqrvtmprfjhtld.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9h1vRM946kBiK5gBKZTUBQ_8DeObQYA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
