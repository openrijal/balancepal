import type { App } from 'vue';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/client';
// We also need server envs because the original code had fallback logic using non-public envs. 
// However, astro:env/server secrets CANNOT be imported in client code.
// The fallback `|| import.meta.env.SUPABASE_URL` in original code suggests it might be running in SSR context where server envs are available, OR it was just a fallback for local dev where everything is in .env.
// In Astro 5 astro:env, we cannot import `astro:env/server` in client files.
// So I will remove the fallback to `SUPABASE_URL` (secret) and only use public ones.
// This is correct for client-side code.
// Wait, `src/app.ts` is `appEntrypoint`, which runs in browser.
// So it MUST use public keys.
// I will check if I need to update my previous step (the replacement content).
import { pinia } from '@/stores';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { supabaseKey } from '@/types/injection-keys';

/**
 * Vue app configuration for Astro integration
 * This file is loaded by @astrojs/vue for each island
 */
export default (app: App) => {
  // Use the singleton Pinia instance
  app.use(pinia);

  // Initialize Supabase Client
  const supabaseUrl = PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = getSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    app.provide(supabaseKey, supabase);
  }
};
