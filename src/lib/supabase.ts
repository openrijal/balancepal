import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from 'astro:env/server';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/client';

const supabaseUrl = SUPABASE_URL; // Server side default
const supabaseAnonKey = SUPABASE_ANON_KEY; // Server side default

// Only throw on server if missing and actually trying to use it?
// Or just let it fail later?
// Better: check if we are on server.
// For now, let's just NOT throw at top level if generic keys are missing,
// because browser will have PUBLIC keys (which we fallback to above).

/**
 * Supabase client for server-side operations
 * Used in Astro pages and API routes
 */
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Create a Supabase client for client-side operations
 * Used in Vue components (client:load, etc.)
 */
export function createBrowserClient() {
  const supabaseUrl = PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

  console.log('createBrowserClient env check:', {
    PUBLIC_URL: !!PUBLIC_SUPABASE_URL,
    PUBLIC_KEY: !!PUBLIC_SUPABASE_ANON_KEY,
    URL_VAL: supabaseUrl ? 'Set' : 'Unset',
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars:', { supabaseUrl, supabaseAnonKey });
    throw new Error('Missing Supabase environment variables for browser client.');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
}
