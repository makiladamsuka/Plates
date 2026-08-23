import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
// Prefer service role key (bypasses RLS) for backend operations; fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.SUPABASE_URL) {
  console.warn('⚠️ [Backend] Warning: SUPABASE_URL is missing in backend/.env. Using placeholder client.');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ [Backend] Warning: SUPABASE_SERVICE_ROLE_KEY is missing. Using anon key — RLS may block writes. Get the service role key from Supabase Dashboard → Settings → API.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

