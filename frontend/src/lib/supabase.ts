import { createClient } from '@supabase/supabase-js';

function getCleanSupabaseUrl(): string {
  const raw = import.meta.env.VITE_SUPABASE_URL || 'https://rvxyaepqrvtmprfjhtld.supabase.co';
  let cleaned = String(raw).trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

function getCleanSupabaseKey(): string {
  const raw = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9h1vRM946kBiK5gBKZTUBQ_8DeObQYA';
  return String(raw).trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = getCleanSupabaseUrl();
const supabaseAnonKey = getCleanSupabaseKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

