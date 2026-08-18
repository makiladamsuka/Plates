import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ [Backend] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in backend/.env. Using placeholder client.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

