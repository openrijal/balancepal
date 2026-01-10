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
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(key) {
          if (typeof document === 'undefined') return '';
          const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
          return match ? match[2] : '';
        },
        set(key, value, options) {
          if (typeof document === 'undefined') return;
          let cookieStr = `${key}=${value}`;
          // Add default options if they are simple props,
          // but @supabase/ssr passes options object that maps to cookie attributes
          if (options) {
            if (options.path) cookieStr += `; path=${options.path}`;
            if (options.domain) cookieStr += `; domain=${options.domain}`;
            if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
            if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
            if (options.secure) cookieStr += `; secure`;
          }
          // Force path=/ if not set, to ensure it's available everywhere
          if (!options?.path) cookieStr += '; path=/';

          document.cookie = cookieStr;
        },
        remove(key, options) {
          if (typeof document === 'undefined') return;
          document.cookie = `${key}=; max-age=0${options?.path ? `; path=${options.path}` : '; path=/'}`;
        },
      },
    });
  }
  return browserClient;
}
