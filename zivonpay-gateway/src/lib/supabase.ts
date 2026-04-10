import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'exists' : 'missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
