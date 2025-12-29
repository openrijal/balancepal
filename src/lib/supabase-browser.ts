/**
 * Browser-side Supabase client for Vue components
 * Uses @supabase/ssr to properly handle cookies for SSR authentication
 */
import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Get or create a Supabase browser client
 * This client automatically handles cookie storage for authentication
 */
export function getSupabaseBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
