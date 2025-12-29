import type { App } from 'vue';
import { createPinia } from 'pinia';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { supabaseKey } from '@/types/injection-keys';

/**
 * Vue app configuration for Astro integration
 * This file is loaded by @astrojs/vue for each island
 */
export default (app: App) => {
  const pinia = createPinia();
  app.use(pinia);

  // Initialize Supabase Client
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = getSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
    app.provide(supabaseKey, supabase);
  }
};
